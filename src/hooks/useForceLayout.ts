import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3force from "d3-force";
import { distanceToCenter } from "../lib/graph";
import type { Simulation, SimulationNodeDatum } from "d3-force";

export interface Pos {
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkD3 {
  source: string;
  target: string;
  category: string;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
}

export interface ForceLayoutConfig {
  width: number;
  height: number;
  centerId: string;
  nodeIds: string[];
  edges: LinkD3[];
  radiusOf: (id: string) => number;
  reducedMotion: boolean;
  animate: boolean;
  /** 布局基准中心（通常为视口中心，使坐标=屏幕像素坐标） */
  originX?: number;
  originY?: number;
}

/** 按到欧阳修的距离给节点做同心圆种子位置（以 origin 为圆心） */
function seedPositions(
  nodeIds: string[],
  centerId: string,
  ox: number,
  oy: number,
): Map<string, { x: number; y: number }> {
  const centers = new Map<string, { x: number; y: number }>();
  for (const id of nodeIds) {
    const d = id === centerId ? 0 : distanceToCenter(id);
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const angle = ((h % 3600) / 3600) * Math.PI * 2;
    // 孤立节点(距中心 Infinity)归入最外环，避免被推到上万像素
    const dd = d === Infinity ? 9 : Math.round(d);
    const radius = dd === 0 ? 0 : 10 + dd * 70 + (h % 5) * 22;
    centers.set(id, {
      x: ox + Math.cos(angle) * radius,
      y: oy + Math.sin(angle) * radius,
    });
  }
  return centers;
}

/**
 * 力导向 + 同心轨道的混合布局。
 * nodeIds/edges/centerId 变化时重建模拟；结果写入 state 供 SVG 渲染。
 */
export function useForceLayout(cfg: ForceLayoutConfig) {
  const { centerId, nodeIds, edges, radiusOf, animate, originX = 0, originY = 0 } = cfg;

  const sig = useMemo(
    () =>
      nodeIds.slice().sort().join(",") +
      "|" +
      edges.map((e) => (e.source < e.target ? e.source + "-" + e.target : e.target + "-" + e.source)).sort().join(",") +
      "|" +
      centerId,
    [nodeIds, edges, centerId],
  );

  const [positions, setPositions] = useState<Map<string, Pos>>(new Map());
  const simRef = useRef<Simulation<SimNode, LinkD3> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const radiusRef = useRef(radiusOf);
  radiusRef.current = radiusOf;

  useEffect(() => {
    simRef.current?.stop();
    const seeds = seedPositions(nodeIds, centerId, originX, originY);
    const nodes: SimNode[] = nodeIds.map((id) => {
      const s = seeds.get(id) ?? { x: originX, y: originY };
      return {
        id,
        x: s.x + (Math.random() - 0.5) * 6,
        y: s.y + (Math.random() - 0.5) * 6,
      };
    });
    nodesRef.current = nodes;
    const links: LinkD3[] = edges.filter(
      (e) => nodeIds.includes(e.source) && nodeIds.includes(e.target),
    );

    const sim = d3force
      .forceSimulation<SimNode, LinkD3>(nodes)
      .force(
        "link",
        d3force
          .forceLink<SimNode, LinkD3>(links)
          .id((d: SimNode) => d.id)
          .distance(70)
          .strength(0.35),
      )
      .force("charge", d3force.forceManyBody<SimNode>().strength(-60).distanceMax(340))
      .force(
        "collide",
        d3force.forceCollide<SimNode>().radius((d) => radiusRef.current(d.id) + 4).iterations(2),
      )
      .force(
        "x",
        d3force.forceX<SimNode>((d) => seeds.get(d.id)?.x ?? originX).strength(0.05),
      )
      .force(
        "y",
        d3force.forceY<SimNode>((d) => seeds.get(d.id)?.y ?? originY).strength(0.05),
      )
      .force("center", d3force.forceCenter<SimNode>(originX, originY).strength(0.03))
      .alphaDecay(0.022)
      .alphaMin(0.01);

    const centerNode = nodes.find((n) => n.id === centerId);
    if (centerNode) {
      centerNode.fx = originX;
      centerNode.fy = originY;
    }

    sim.on("tick", () => {
      const next = new Map<string, Pos>();
      nodesRef.current.forEach((n) =>
        next.set(n.id, { x: n.x ?? 0, y: n.y ?? 0, fx: n.fx, fy: n.fy }),
      );
      setPositions(next);
    });

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  // 动画开关：关闭即停，开启则轻微重启
  useEffect(() => {
    if (!animate) simRef.current?.stop();
    else if (simRef.current) simRef.current.alpha(0.15).restart();
  }, [animate]);

  const dragNode = useCallback((id: string, x: number, y: number, active: boolean) => {
    const n = nodesRef.current.find((k) => k.id === id);
    if (!n) return;
    if (active) {
      n.fx = x;
      n.fy = y;
    } else {
      delete n.fx;
      delete n.fy;
      n.x = x;
      n.y = y;
    }
    simRef.current?.alpha(0.2).restart();
    setPositions((prev) => {
      const mp = new Map(prev);
      mp.set(id, { x: n.x ?? x, y: n.y ?? y, fx: n.fx, fy: n.fy });
      return mp;
    });
  }, []);

  return { positions, simRef, dragNode };
}
