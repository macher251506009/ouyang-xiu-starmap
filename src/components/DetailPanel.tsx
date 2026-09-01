import { useMemo } from "react";
import { getPerson, personName, groups, personTagsOf } from "../dataset";
import { distanceToCenter, directRelationsOf } from "../lib/graph";
import { CATEGORY_LABEL, CATEGORY_COLORS } from "../types";

interface DetailPanelProps {
  personId: string | null;
  onSetAsA: (id: string) => void;
  onSetAsB: (id: string) => void;
  onSetCenter: (id: string) => void;
  onReturnToCenter: () => void;
  onFocusPerson: (id: string) => void;
}

export default function DetailPanel(props: DetailPanelProps) {
  const { personId, onSetAsA, onSetAsB, onSetCenter, onReturnToCenter, onFocusPerson } = props;

  const person = personId ? getPerson(personId) : undefined;

  const rels = useMemo(() => (personId ? directRelationsOf(personId) : []), [personId]);
  const memberGroups = useMemo(
    () => (personId ? groups.filter((g) => g.members.includes(personId)) : []),
    [personId],
  );
  const tags = useMemo(() => (personId ? personTagsOf(personId) : []), [personId]);

  if (!person || !personId) {
    return (
      <section className="panel" aria-label="人物详情">
        <div className="panel-title">人物详情</div>
        <p className="path-none">点击星图上的一颗星，查看其与欧阳修的关系及全部直接关系。</p>
      </section>
    );
  }

  const dist = distanceToCenter(personId);
  const isCenter = personId === "ousyangxiu";
  const uncertain = person.confidence === "uncertain";

  return (
    <section className="panel" aria-label={`人物详情：${person.name}`}>
      <div className="panel-title">
        人物详情
        <button
          className="icon-btn"
          onClick={onReturnToCenter}
          aria-label="返回欧阳修中心"
          title="返回欧阳修中心"
        >
          返回中心
        </button>
      </div>

      <div className="person-head">
        <h2>{person.name}</h2>
        {person.courtesyName && <span className="sub-name">字 {person.courtesyName}</span>}
      </div>

      <div style={{ marginTop: 6 }}>
        {uncertain && <span className="badge uncertain">待复核</span>}
        {person.title?.map((t, i) => (
          <span key={i} className="badge tag">{t}</span>
        ))}
        {tags.map((t, i) => (
          <span key={"tg" + i} className="badge tag">{t}</span>
        ))}
        {memberGroups.map((g) => (
          <span key={g.id} className="badge tag">并称「{g.name}」</span>
        ))}
      </div>

      <div className="metric">
        <span>与欧阳修的距离</span>
        <b>{isCenter ? "—（中心）" : dist === Infinity ? "未连通" : `${dist} 层`}</b>
        <span>与欧阳修的关系</span>
        <b>{overviewFor(personId)}</b>
      </div>

      <div className="action-row">
        <button className="btn primary" onClick={() => onSetAsA(personId)} aria-label={`将 ${person.name} 设为人物 A`}>
          设为人物 A
        </button>
        <button className="btn primary" onClick={() => onSetAsB(personId)} aria-label={`将 ${person.name} 设为人物 B`}>
          设为人物 B
        </button>
        <button
          className="btn ghost"
          onClick={() => onSetCenter(personId)}
          aria-label={`以 ${person.name} 为临时中心`}
        >
          以此人为中心
        </button>
        <button className="btn ghost" onClick={() => onFocusPerson(personId)} aria-label={`定位到 ${person.name}`}>
          定位
        </button>
      </div>

      {person.introduction && (
        <p style={{ fontSize: 13, color: "var(--ink-dim)", marginTop: 8, lineHeight: 1.6 }}>
          {person.introduction}
        </p>
      )}

      <div className="panel-title" style={{ marginTop: 10 }}>直接关系（{rels.length}）</div>
      <div className="rel-list">
        {rels.map((r) => (
          <div
            key={r.rel.id}
            className={`rel-item${r.rel.confidence === "uncertain" ? " warn" : ""}`}
            style={{ borderLeftColor: CATEGORY_COLORS[r.category] }}
          >
            <span className="rel-label" style={{ color: CATEGORY_COLORS[r.category] }}>
              {r.label}
            </span>
            <span className="rel-detail">
              {r.otherName} · {CATEGORY_LABEL[r.category]}
              {(r.rel.confidence === "uncertain" || r.rel.sourceNote) && (
                <span style={{ color: "var(--gray)" }}>（待复核）</span>
              )}
              <div style={{ fontSize: 12, marginTop: 2, color: "var(--ink-dim)" }}>{r.description}</div>
            </span>
          </div>
        ))}
      </div>

      {person.note && (
        <p className="path-none" style={{ marginTop: 8 }}>
          备注：{person.note}
        </p>
      )}
    </section>
  );
}

function overviewFor(id: string): string {
  if (id === "ousyangxiu") return "——（核心）";
  const d = distanceToCenter(id);
  if (d === Infinity) return "暂未与欧阳修建立连通关系";
  if (d === 1) return "欧阳修的（被欧阳修称谓的）直接关系人";
  return `通过 ${d} 层关系与欧阳修相连`;
}
