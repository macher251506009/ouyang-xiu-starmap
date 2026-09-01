import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3-zoom";
import { select } from "d3-selection";
import { useForceLayout } from "../hooks/useForceLayout";
import { distanceToCenter } from "../lib/graph";
import { personName, CENTER_PERSON_ID } from "../dataset";
import type { Relationship, RelationCategory } from "../types";
import { CATEGORY_COLORS } from "../types";

interface StarMapProps {
  centerId: string;
  visibleIds: Set<string>;
  edges: Relationship[];
  selA: string | null;
  selB: string | null;
  pathNodeSet: Set<string>;
  pathEdgeSet: Set<string>;
  flashId: string | null;
  focusId: string | null;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
  onPersonClick: (id: string) => void;
}

interface Transform {
  k: number;
  tx: number;
  ty: number;
}

function nodeVisual(id: string, centerId: string) {
  const isCenter = id === centerId;
  const d = isCenter ? 0 : distanceToCenter(id);
  if (isCenter) return { r: 13, bright: 1, labelSize: 18, layer: 0 };
  if (d === 1) return { r: 7, bright: 0.9, labelSize: 16, layer: 1 };
  if (d === 2) return { r: 5.5, bright: 0.72, labelSize: 15, layer: 2 };
  if (d <= 4) return { r: 4.6, bright: 0.52, labelSize: 14.5, layer: 3 };
  return { r: 4, bright: 0.34, labelSize: 14, layer: 4 };
}

export default function StarMap(props: StarMapProps) {
  const {
    centerId,
    visibleIds,
    edges,
    selA,
    selB,
    pathNodeSet,
    pathEdgeSet,
    flashId,
    focusId,
    reducedMotion,
    onSelect,
    onPersonClick,
  } = props;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const worldRef = useRef<SVGGElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [tr, setTr] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const [dragging, setDragging] = useState(false);
  // 启用拖动的节点 id（触摸/鼠标当前正在拖的）
  const dragState = useRef<{ id: string | null; moved: boolean }>({ id: null, moved: false });
  // 供自动适配 / 聚焦复位使用的 zoom 实例与“已适配”标记
  const zoomInstRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitKeyRef = useRef<string>("");

  // 容器尺寸（用 SVG 自身真实渲染尺寸，移动端 vh 更可靠）
  useEffect(() => {
    const update = () => {
      const r = svgRef.current?.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        setSize({ w: r.width, h: r.height });
      }
    };
    update();
    window.addEventListener("resize", update);
    // 等一帧，确保 SVG 已按 CSS 铺满
    const t = window.setTimeout(update, 60);
    return () => {
      window.removeEventListener("resize", update);
      window.clearTimeout(t);
    };
  }, []);

  const nodeIds = useMemo(() => [...visibleIds], [visibleIds]);

  const layout = useForceLayout({
    width: size.w,
    height: size.h,
    centerId,
    nodeIds,
    edges: edges.map((e) => ({ source: e.source, target: e.target, category: e.category })),
    radiusOf: (id) => nodeVisual(id, centerId).r,
    reducedMotion,
    animate: !reducedMotion,
    originX: size.w / 2,
    originY: size.h / 2,
  });
  const { positions, dragNode } = layout;
  // 供 doFit 读到最新的布局位置（定时器里闭包用的最新值）
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  // d3-zoom：平移与缩放
  useEffect(() => {
    const svg = svgRef.current;
    const world = worldRef.current;
    if (!svg) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .filter((event: any) => {
        // 点击在节点上时禁用平移/缩放拖动（节点自有拖动）
        const t = event.target as HTMLElement | null;
        if (t && t.closest("g[data-node]")) return false;
        return true;
      })
      .on("start", () => setDragging(true))
      .on("end", () => setDragging(false))
      .on("zoom", (evt: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        const t = evt.transform;
        setTr({ k: t.k, tx: t.x, ty: t.y });
        if (world) world.setAttribute("transform", `translate(${t.x},${t.y}) scale(${t.k})`);
      });
    select(svg).call(zoom);
    zoomInstRef.current = zoom;
    // 初始以原点为基准（自动适配会在布局稳定后把图居中放满）
    select(svg).call(zoom.transform, d3.zoomIdentity);
    return () => {
      select(svg).on(".zoom", null);
      zoomInstRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  // 聚焦到某人物（focus/flash）
  useEffect(() => {
    const id = flashId || focusId;
    if (!id || !svgRef.current) return;
    const p = positions.get(id);
    if (!p) return;
    const svg = svgRef.current;
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    const k = 1.6;
    const tx = size.w / 2 - p.x * k;
    const ty = size.h / 2 - p.y * k;
    select(svg)
      .transition()
      .duration(reducedMotion ? 0 : 650)
      .call((sel: any) => sel.call((zoom as any).transform, d3.zoomIdentity.translate(tx, ty).scale(k)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashId, focusId]);

  // 自动适配后默认缩放已被拉大到适宜观看，始终显示所有姓名以保障可读性
  const labelAll = true;

  // 自动适配：等力导向布局基本铺开后，把整张星图居中并放满画布。
  // 用定时触发（而非每个 tick），避免在节点还没铺开时过早固定缩放导致溢出。
  const fitKey = useMemo(
    () => nodeIds.slice().sort().join(",") + "|" + size.w + "x" + size.h + "|" + centerId,
    [nodeIds, size.w, size.h, centerId],
  );
  const fitTimerRef = useRef<number | null>(null);
  const doFit = useCallback(() => {
    const pos = positionsRef.current;
    if (!worldRef.current || size.w < 10 || size.h < 10) return;
    if (pos.size < nodeIds.length) return;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const id of nodeIds) {
      const p = pos.get(id);
      if (!p) continue;
      if (p.x < x0) x0 = p.x;
      if (p.x > x1) x1 = p.x;
      if (p.y < y0) y0 = p.y;
      if (p.y > y1) y1 = p.y;
    }
    const w = Math.max(x1 - x0, 1);
    const h = Math.max(y1 - y0, 1);
    const padX = 80;
    const padTop = 60;
    const padBottom = 80;
    const scale = Math.max(
      0.2,
      Math.min((size.w - padX) / w, (size.h - padTop - padBottom) / h, 1.6),
    );
    // 以节点包围盒中心 cx,cy 为基准，把整张星图居中（水平正中），
    // 垂直方向略偏下(55%)，避开左上控制面板与标题区
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = size.w / 2 - cx * scale;
    const ty = size.h * 0.55 - cy * scale;
    fitKeyRef.current = fitKey;
    // 直接改写世界 g 的 transform + 同步 zoom 状态（d3-zoom 的手势仍可用）
    worldRef.current.setAttribute("transform", `translate(${tx},${ty}) scale(${scale})`);
    setTr({ k: scale, tx, ty });
    if (zoomInstRef.current && svgRef.current) {
      select(svgRef.current).call(zoomInstRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeIds, size.w, size.h, centerId]);

  useEffect(() => {
    // fitKey 变化（新布局/新尺寸/换中心）时，等布局铺开后再适配一次
    if (fitTimerRef.current) window.clearTimeout(fitTimerRef.current);
    if (!worldRef.current || size.w < 10 || size.h < 10) return;
    fitTimerRef.current = window.setTimeout(doFit, 2000);
    return () => {
      if (fitTimerRef.current) window.clearTimeout(fitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);


  // 容器级还原（点到世界坐标）
  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      const ox = rect ? rect.left : 0;
      const oy = rect ? rect.top : 0;
      return { x: (clientX - ox - tr.tx) / tr.k, y: (clientY - oy - tr.ty) / tr.k };
    },
    [tr],
  );

  // 节点指针拖动（原生事件，避免 d3-drag 与 React 重渲染冲突）
  const onNodePointerDown = useCallback(
    (e: React.PointerEvent, id: string, nodeX: number, nodeY: number) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current = { id, moved: false };
      setDragging(true);
    },
    [],
  );
  const onNodePointerMove = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (dragState.current.id !== id) return;
      const w = toWorld(e.clientX, e.clientY);
      dragState.current.moved = true;
      dragNode(id, w.x, w.y, true);
    },
    [dragNode, toWorld],
  );
  const onNodePointerUp = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (dragState.current.id !== id) return;
      const w = toWorld(e.clientX, e.clientY);
      dragState.current.id = null;
      if (dragState.current.moved) {
        dragNode(id, w.x, w.y, false);
      }
      setDragging(false);
      window.setTimeout(() => (dragState.current.moved = false), 0);
    },
    [dragNode, toWorld],
  );

  // 边
  const edgeEls = useMemo(() => {
    return edges.map((e) => {
      const a = positions.get(e.source);
      const b = positions.get(e.target);
      if (!a || !b) return null;
      const onPath = pathEdgeSet.has(`${e.source}|${e.target}`);
      const dimmed = pathNodeSet.size > 0 && !onPath;
      const color = CATEGORY_COLORS[e.category];
      return (
        <line
          key={[e.source, e.target].sort().join("|")}
          className={"edge " + edgeClass(e.category) + (onPath ? " highlight" : "")}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          opacity={dimmed ? 0.05 : onPath ? 0.95 : 0.4}
          stroke={color}
          strokeWidth={onPath ? 2.4 : undefined}
        />
      );
    });
  }, [edges, positions, pathEdgeSet, pathNodeSet]);

  // 节点
  const nodeEls = useMemo(() => {
    const out: Array<React.ReactNode> = [];
    for (const id of nodeIds) {
      const p = positions.get(id);
      if (!p) continue;
      out.push(
        nodeEl(id, p, {
          centerId,
          selA,
          selB,
          pathNodeSet,
          flashId,
          onSelect,
          onPersonClick,
          labelAll,
          onNodePointerDown,
          onNodePointerMove,
          onNodePointerUp,
          isCenter: id === CENTER_PERSON_ID,
        }),
      );
    }
    return out;
  }, [nodeIds, positions, selA, selB, pathNodeSet, flashId, labelAll, onSelect, onPersonClick, onNodePointerDown, onNodePointerMove, onNodePointerUp, centerId]);

  return (
    <svg
      ref={svgRef}
      className={`starmap ${dragging ? "dragging" : ""}`}
      width="100%"
      height="100%"
      role="application"
      aria-label="北宋文人关系星图：欧阳修位于中央，其他人物如星辰般分布四周。"
      onPointerMove={(e) => {
        // 空白处拖动即平移（d3-zoom 已处理），这里仅用于结束节点拖
      }}
    >
      <g ref={worldRef}>
        <g>{edgeEls}</g>
        <g>{nodeEls}</g>
      </g>
    </svg>
  );
}

interface NodeCtx {
  centerId: string;
  selA: string | null;
  selB: string | null;
  pathNodeSet: Set<string>;
  flashId: string | null;
  onSelect: (id: string) => void;
  onPersonClick: (id: string) => void;
  labelAll: boolean;
  onNodePointerDown: (e: React.PointerEvent, id: string, x: number, y: number) => void;
  onNodePointerMove: (e: React.PointerEvent, id: string) => void;
  onNodePointerUp: (e: React.PointerEvent, id: string) => void;
  isCenter: boolean;
}

function nodeEl(id: string, p: { x: number; y: number }, ctx: NodeCtx) {
  const v = nodeVisual(id, ctx.centerId);
  const isSelA = ctx.selA === id;
  const isSelB = ctx.selB === id;
  const isFlash = ctx.flashId === id;
  const onPath = ctx.pathNodeSet.size > 0 && ctx.pathNodeSet.has(id) && id !== ctx.centerId;
  const dimmed = ctx.pathNodeSet.size > 0 && !onPath && id !== ctx.centerId;
  const showLabel = ctx.labelAll || v.layer <= 2;
  const color = selColor(v.bright, isSelB);
  const ring = isSelA ? "#f3c96b" : isSelB ? "#4fc3de" : null;

  return (
    <g
      key={id}
      data-node
      data-id={id}
      className={"star-node" + (isFlash ? " flash" : "") + (onPath ? " onpath" : "")}
      opacity={dimmed ? 0.16 : 1}
      transform={`translate(${p.x},${p.y})`}
      tabIndex={0}
      role="button"
      aria-label={`人物 ${personName(id)}${onPath ? "，位于关系路径上" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onSelect(id);
        ctx.onPersonClick(id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          ctx.onSelect(id);
          ctx.onPersonClick(id);
        }
      }}
      onPointerDown={(e) => ctx.onNodePointerDown(e, id, p.x, p.y)}
      onPointerMove={(e) => ctx.onNodePointerMove(e, id)}
      onPointerUp={(e) => ctx.onNodePointerUp(e, id)}
    >
      <circle className="halo" r={v.r * 2.3} fill={color} opacity={0.16} pointerEvents="none" />
      {ring && <circle r={v.r + 4.5} fill="none" stroke={ring} strokeWidth={2} pointerEvents="none" />}
      <path
        d={starShape(v.r)}
        fill={color}
        stroke={isFlash ? "#ffffff" : "rgba(7,12,24,0.55)"}
        strokeWidth={v.layer === 0 ? 1.6 : 0.8}
        pointerEvents="none"
      />
      {showLabel && (
        <text
          className={"label" + (v.bright < 0.5 ? " dim-label" : "")}
          y={v.layer === 0 ? v.r + 17 : v.r + 14}
          textAnchor="middle"
          fontSize={v.labelSize}
        >
          {personName(id)}
        </text>
      )}
    </g>
  );
}

/** 五角星 path（原点为中心，外径 r，内径 r/2.2） */
function starShape(r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r / 2.2;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function selColor(bright: number, isSelB: boolean): string {
  if (isSelB) return "#4fc3de";
  return `rgba(243, 201, 107, ${(bright * 0.92 + 0.08).toFixed(2)})`;
}

function edgeClass(cat: RelationCategory): string {
  return "ed-" + cat;
}
