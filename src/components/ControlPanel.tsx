import { useMemo, useRef, useState } from "react";
import { personName, CENTER_PERSON_ID } from "../dataset";
import { searchPeople } from "../lib/search";
import type { RelationCategory } from "../types";
import { CATEGORY_LABEL, CATEGORY_COLORS } from "../types";

interface ControlPanelProps {
  selA: string | null;
  selB: string | null;
  activeCategories: Set<RelationCategory>;
  centerOnlyTwo: boolean;
  onSetCenterOnlyTwo: (b: boolean) => void;
  onToggleCategory: (cat: RelationCategory) => void;
  onSwap: () => void;
  onReset: () => void;
  onFocusPerson: (id: string) => void;
  onReturnToCenter: () => void;
  onSetSlot: (slot: "A" | "B", id: string) => void;
}

const ALL_CATS = Object.keys(CATEGORY_LABEL) as RelationCategory[];

export default function ControlPanel(props: ControlPanelProps) {
  const {
    selA, selB, activeCategories, centerOnlyTwo, onSetCenterOnlyTwo,
    onToggleCategory, onSwap, onReset, onFocusPerson, onReturnToCenter, onSetSlot,
  } = props;

  const [qA, setQA] = useState("");
  const [qB, setQB] = useState("");
  const [openBox, setOpenBox] = useState<"A" | "B" | null>(null);
  const blurTimer = useRef<number | null>(null);

  const resultsA = useMemo(() => (openBox === "A" ? searchPeople(qA) : []), [qA, openBox]);
  const resultsB = useMemo(() => (openBox === "B" ? searchPeople(qB) : []), [qB, openBox]);

  const showResult = (slot: "A" | "B", id: string) => {
    onSetSlot(slot, id);
    onFocusPerson(id);
    setOpenBox(null);
  };

  return (
    <>
      {/* 选择器：人物A / 人物B */}
      <div className="panel">
        <div className="pick-row">
          <button className="pick-btn a" aria-label="人物 A，金色圆环" title="人物 A（金）">
            A
          </button>
          <div className="searchbox">
            <input
              aria-label="搜索人物 A"
              placeholder="搜索人物 A…"
              value={qA}
              onFocus={() => {
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setOpenBox("A");
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setOpenBox(null), 120);
              }}
              onChange={(e) => setQA(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resultsA[0]) showResult("A", resultsA[0].person.id);
                if (e.key === "Escape") setOpenBox(null);
              }}
            />
            {openBox === "A" && resultsA.length > 0 && (
              <div className="search-results">
                {resultsA.map((h) => (
                  <button key={h.person.id} onMouseDown={(e) => e.preventDefault()} onClick={() => showResult("A", h.person.id)}>
                    {h.person.name}
                    {h.person.courtesyName ? <small>字 {h.person.courtesyName}</small> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="sel-tag">{selA ? personName(selA) : "（未选）"}</span>
        </div>

        <div className="pick-row" style={{ marginTop: 8 }}>
          <button className="pick-btn b" aria-label="人物 B，青蓝圆环" title="人物 B（青蓝）">
            B
          </button>
          <div className="searchbox">
            <input
              aria-label="搜索人物 B"
              placeholder="搜索人物 B…"
              value={qB}
              onFocus={() => {
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setOpenBox("B");
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setOpenBox(null), 120);
              }}
              onChange={(e) => setQB(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && resultsB[0]) showResult("B", resultsB[0].person.id);
                if (e.key === "Escape") setOpenBox(null);
              }}
            />
            {openBox === "B" && resultsB.length > 0 && (
              <div className="search-results">
                {resultsB.map((h) => (
                  <button key={h.person.id} onMouseDown={(e) => e.preventDefault()} onClick={() => showResult("B", h.person.id)}>
                    {h.person.name}
                    {h.person.courtesyName ? <small>字 {h.person.courtesyName}</small> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="sel-tag">{selB ? personName(selB) : "（未选）"}</span>
        </div>

        <div className="action-row" style={{ marginTop: 8 }}>
          <button className="btn" onClick={onSwap} aria-label="交换人物 A 与 B">
            ⇄ 交换 A/B
          </button>
          <button className="btn ghost" onClick={onReset} aria-label="重置选择">
            重置选择
          </button>
          <button
            className="btn ghost"
            onClick={onReturnToCenter}
            aria-label="返回欧阳修中心"
            title="返回欧阳修中心"
          >
            返回中心
          </button>
        </div>
      </div>

      {/* 快捷开关 */}
      <div className="panel">
        <div className="quick-toggle">
          <button
            className={`chip ${centerOnlyTwo ? "on" : ""}`}
            aria-pressed={centerOnlyTwo}
            onClick={() => onSetCenterOnlyTwo(!centerOnlyTwo)}
          >
            仅欧阳修两层
          </button>
          <button
            className="chip"
            aria-label="欧阳修位于中心，金色最亮"
            onClick={() => {
              onFocusPerson(CENTER_PERSON_ID);
              onReturnToCenter();
            }}
          >
            定位欧阳修
          </button>
        </div>
      </div>

      {/* 关系类别筛选 + 图例 */}
      <div className="panel filter-panel" aria-label="按关系类别筛选">
        {ALL_CATS.map((cat) => {
          const on = activeCategories.has(cat);
          const swatch =
            cat === "group" ? (
              <span className="filter-swatch dashed-w" style={{ background: "var(--lime)" }} />
            ) : cat === "other" ? (
              <span className="filter-swatch dashed-g" style={{ background: "var(--gray)" }} />
            ) : (
              <span className="filter-swatch" style={{ background: CATEGORY_COLORS[cat] }} />
            );
          return (
            <div key={cat} className={`filter-row ${on ? "" : "off"}`} onClick={() => onToggleCategory(cat)}>
              {swatch}
              <label aria-label={CATEGORY_LABEL[cat]}>{CATEGORY_LABEL[cat]}</label>
              <input
                type="checkbox"
                checked={on}
                readOnly
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
