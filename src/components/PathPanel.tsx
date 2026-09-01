import { useMemo } from "react";
import type { PathResult } from "../lib/graph";
import { pathSummary } from "../lib/graph";
import { personName } from "../dataset";

interface PathPanelProps {
  paths: PathResult[];
  pathIndex: number;
  onPathIndex: (i: number) => void;
  selA: string | null;
  selB: string | null;
}

export default function PathPanel(props: PathPanelProps) {
  const { paths, pathIndex, onPathIndex, selA, selB } = props;

  const hasSelection = !!selA && !!selB;
  const current = paths.length > 0 ? paths[Math.min(pathIndex, paths.length - 1)] : null;

  const summary = useMemo(() => {
    if (!current) return null;
    return pathSummary(current.nodes, current.stepTexts);
  }, [current]);

  if (!hasSelection) {
    return (
      <section className="panel" aria-label="关系路径">
        <div className="panel-title">关系路径</div>
        <p className="path-none">
          在星图中依次点击两位人物，或在左侧搜索框中各选一人，即可计算并展示他们之间的关系路径。首次点击为角色A（金色圆环），再次点击为角色B（青蓝圆环）。
        </p>
      </section>
    );
  }

  if (!current || paths.length === 0) {
    return (
      <section className="panel" aria-label="关系路径">
        <div className="panel-title">关系路径</div>
        <p className="path-none">
          <strong>{personName(selA)}</strong> 与 <strong>{personName(selB)}</strong>：当前资料中暂未发现两人的关系路径，本图不擅自补写或编造。
        </p>
      </section>
    );
  }

  const chain = current.nodes.map((id, i) => (
    <span key={id + i} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {i > 0 && <span className="path-arrow">→</span>}
      <span className={`path-node${id === "ousyangxiu" ? " center" : ""}`}>{personName(id)}</span>
    </span>
  ));

  return (
    <section className="panel" aria-label="关系路径">
      <div className="panel-title">
        关系路径
        {paths.length > 1 && (
          <span style={{ fontSize: 11, color: "var(--ink-dim)", fontWeight: 400 }}>
            {Math.min(pathIndex, paths.length - 1) + 1}/{paths.length} 条
          </span>
        )}
      </div>

      <div className="path-chain">{chain}</div>

      {paths.length > 1 && (
        <div className="path-multi">
          {paths.map((_, i) => (
            <button
              key={i}
              className={`path-idx${i === Math.min(pathIndex, paths.length - 1) ? " on" : ""}`}
              onClick={() => onPathIndex(i)}
              aria-pressed={i === Math.min(pathIndex, paths.length - 1)}
              aria-label={`同长度最短路径第 ${i + 1} 条`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="path-sentence">
        {summary?.sentences.map((s, i) => (
          <div key={i}>· {s}</div>
        ))}
      </div>

      {summary && <div className="path-summary">{summary.summary}</div>}
      {current.isDirect && (
        <div className="path-summary" style={{ marginTop: 6 }}>
          两人存在直接关系，可查看右侧人物详情中的完整关系说明。
        </div>
      )}
    </section>
  );
}
