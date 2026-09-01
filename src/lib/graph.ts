import type { Relationship, RelationCategory } from "../types";
import { dataset, personName, getPerson, allRelationships } from "../dataset";

// ── 邻接表构建 ─────────────────────────────────────────────

export interface EdgeRef {
  rel: Relationship;
  /** 沿 source→target 为正向 */
  reverse: boolean; // true 表示行进方向为 target→source（反向）
}

export interface Graph {
  /** personId -> 邻接 personId -> 使用到的边 */
  adj: Map<string, Map<string, EdgeRef[]>>;
  peopleIds: Set<string>;
}

function buildGraph(rels: Relationship[]): Graph {
  const adj = new Map<string, Map<string, EdgeRef[]>>();
  const peopleIds = new Set<string>();
  for (const rel of rels) {
    peopleIds.add(rel.source);
    peopleIds.add(rel.target);
    if (!adj.has(rel.source)) adj.set(rel.source, new Map());
    if (!adj.has(rel.target)) adj.set(rel.target, new Map());
    for (const [a, b] of [
      [rel.source, rel.target],
      [rel.target, rel.source],
    ] as const) {
      if (!adj.get(a)!.has(b)) adj.get(a)!.set(b, []);
    }
    adj.get(rel.source)!.get(rel.target)!.push({ rel, reverse: false });
    adj.get(rel.target)!.get(rel.source)!.push({ rel, reverse: true });
  }
  return { adj, peopleIds };
}

export const graph: Graph = buildGraph(allRelationships);

// ── 单段行程的自然语言称谓 ──────────────────────────────────
// 沿图中从 prev 走到 cur，返回 cur 是 prev 的什么（称谓）
export function stepLabel(prevId: string, curId: string): string {
  const fromId = edgeFrom(prevId, curId);
  if (!fromId) return "";
  const r = graph.adj.get(fromId)!.get(curId)![0];
  if (r.reverse) return r.rel.reverseRelation ?? r.rel.relation;
  return r.rel.relation;
}

// 找一条连接 prev-cur 的边（返回真正作为 source 的一端）
function edgeFrom(a: string, b: string): string | null {
  const ma = graph.adj.get(a)?.get(b);
  if (ma && ma.length) return a;
  const mb = graph.adj.get(b)?.get(a);
  if (mb && mb.length) return b;
  return null;
}

// ── 距离（到中心 / 任意点）─────────────────────────────────

export interface DistanceMap {
  map: Map<string, number>;
  order: string[];
}

/** BFS 计算某个起点到所有可达节点的最短距离 */
export function bfsDistances(startId: string): DistanceMap {
  const dist = new Map<string, number>();
  const visited = new Set<string>([startId]);
  const queue: string[] = [startId];
  const order: string[] = [];
  dist.set(startId, 0);
  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    const d = dist.get(cur)!;
    for (const nb of graph.adj.get(cur)?.keys() ?? []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        dist.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return { map: dist, order };
}

/** 到欧阳修的距离（未连通则为 Infinity） */
export function distanceToCenter(id: string): number {
  const d = distancesToCenter.map.get(id);
  return d === undefined ? Infinity : d;
}

/** 以欧阳修为起点的距离表（惰性初始化一次） */
export const distancesToCenter: DistanceMap = bfsDistances("ousyangxiu");

// ── 最短路径查找（无权图 BFS + 反向回溯，求全部最短路径）──

export interface PathResult {
  /** 依次人物 id（含首尾） */
  nodes: string[];
  /** 相邻两节点的自然语言说明 */
  stepTexts: string[];
  /** 首尾直接相连（一步） */
  isDirect: boolean;
}

/**
 * 求 a 到 b 的全部最短路径。
 * 图形为无权、无向。返回多条同长路径供切换。
 */
export function allShortestPaths(
  a: string,
  b: string,
  maxReturn: number = 40,
): PathResult[] {
  if (!graph.adj.has(a) || !graph.adj.has(b)) return [];
  if (a === b) {
    return [
      { nodes: [a], stepTexts: [], isDirect: false },
    ];
  }
  // 1. BFS 求 a 到各点距离
  const dist = new Map<string, number>();
  const visited = new Set<string>([a]);
  const queue: string[] = [a];
  dist.set(a, 0);
  while (queue.length) {
    const cur = queue.shift()!;
    const d = dist.get(cur)!;
    for (const nb of graph.adj.get(cur)?.keys() ?? []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        dist.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  if (!dist.has(b)) return [];

  // 2. 反向回溯所有最短路径
  const paths: string[][] = [];
  const total = dist.get(b)!;
  function backtrack(cur: string, acc: string[]) {
    if (cur === a) {
      paths.push([...acc].reverse());
      return;
    }
    if (acc.length > total) return;
    if (paths.length >= maxReturn) return;
    const dCur = dist.get(cur)!;
    for (const nb of graph.adj.get(cur)?.keys() ?? []) {
      if (dCur > 0 && (dist.get(nb) ?? -1) === dCur - 1) {
        acc.push(nb);
        backtrack(nb, acc);
        acc.pop();
        if (paths.length >= maxReturn) return;
      }
    }
  }
  backtrack(b, [b]);

  return paths.map((nodes) => {
    const stepTexts: string[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const cur = nodes[i];
      const nxt = nodes[i + 1];
      stepTexts.push(stepLabel(cur, nxt));
    }
    return {
      nodes,
      stepTexts,
      isDirect: nodes.length === 2,
    };
  });
}

/** 生成一句："<B>是<A>的<称谓>" */
export function stepSentence(prevId: string, curId: string): string {
  const label = stepLabel(prevId, curId);
  if (!label) return `${personName(curId)}与${personName(prevId)}有关系。`;
  return `${personName(curId)}是${personName(prevId)}的${label}。`;
}

/** 生成一段完整的路径中文总结 */
export function pathSummary(
  nodes: string[],
  stepTexts: string[],
): { sentences: string[]; summary: string } {
  const sentences = nodes.slice(0, -1).map((_, i) =>
    stepSentence(nodes[i], nodes[i + 1]),
  );
  const first = personName(nodes[0]);
  const last = personName(nodes[nodes.length - 1]);
  const layers = Math.max(0, nodes.length - 1);
  const summary = `${first}可以通过${nodes
    .slice(1, -1)
    .map(personName)
    .join("、")}与${last}建立关系，最短路径共包含 ${layers} 层关系。`;
  return { sentences, summary };
}

// ── 某人的全部直接关系 ────────────────────────────────────

export interface DirectRelView {
  rel: Relationship;
  other: string; // 对方人物 id
  otherName: string;
  label: string; // 对方是“我”的什么
  category: RelationCategory;
  description: string;
}

/** 返回 某人物（作为 ego）的全部直接关系视图 */
export function directRelationsOf(egoId: string): DirectRelView[] {
  const out: DirectRelView[] = [];
  for (const rel of allRelationships) {
    if (rel.source === egoId) {
      out.push({
        rel,
        other: rel.target,
        otherName: personName(rel.target),
        label: rel.relation,
        category: rel.category,
        description: rel.description,
      });
    } else if (rel.target === egoId) {
      out.push({
        rel,
        other: rel.source,
        otherName: personName(rel.source),
        label: rel.reverseRelation ?? rel.relation,
        category: rel.category,
        description: rel.description,
      });
    }
  }
  return out.sort((x, y) => x.otherName.localeCompare(y.otherName, "zh"));
}

// ── 距离计算（供“以此人为临时中心”和“仅欧阳修两层”) ──
export { getPerson };
