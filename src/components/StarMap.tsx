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
  if (isCenter) return { r: 13, bright: 1, labelSize: 14, layer: 0 };
  if (d === 1) return { r: 7, bright: 0.9, labelSize: 12.5, layer: 1 };
  if (d === 2) return { r: 5.5, bright: 0.72, labelSize: 12, layer: 2 };
  if (d <= 4) return { r: 4.6, bright: 0.52, labelSize: 11.5, layer: 3 };
  return { r: 4, bright: 0.34, labelSize: 11, layer: 4 };
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

  // 容器尺寸
  useEffect(() => {
    const el = svgRef.current?.parentElement as HTMLElement | null;
    const update = () => el && setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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
  });
  const { positions, dragNode } = layout;

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
    select(svg).call(zoom.transform, d3.zoomIdentity.translate(size.w / 2, size.h / 2));
    return () => {
      select(svg).on(".zoom", null);
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

  const labelAll = tr.k >= 1.12 || visibleIds.size < 40;

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
