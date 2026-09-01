import { useMemo, useState, useCallback } from "react";
import { people, relationships, CENTER_PERSON_ID } from "./dataset";
import { allShortestPaths, distancesToCenter } from "./lib/graph";
import type { Relationship, RelationCategory } from "./types";
import { CATEGORY_LABEL } from "./types";
import StarMap from "./components/StarMap";
import ControlPanel from "./components/ControlPanel";
import DetailPanel from "./components/DetailPanel";
import PathPanel from "./components/PathPanel";
import InfoModal from "./components/InfoModal";
import Background from "./components/Background";
import { useReducedMotion, useTemporaryCenter } from "./hooks/useMisc";

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as RelationCategory[];

export default function App() {
  const [centerId, setCenterId] = useTemporaryCenter(CENTER_PERSON_ID);
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [pathIndex, setPathIndex] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [reducedMotion, setReducedMotion] = useReducedMotion();
  const [activeCategories, setActiveCategories] = useState<Set<RelationCategory>>(
    new Set(ALL_CATEGORIES),
  );
  const [centerOnlyTwo, setCenterOnlyTwo] = useState(false);

  const doFlash = useCallback((id: string) => {
    setFlashId(id);
    window.setTimeout(() => setFlashId((cur) => (cur === id ? null : cur)), 1600);
  }, []);

  const focusPerson = useCallback(
    (id: string) => {
      setFocusId(id);
      doFlash(id);
    },
    [doFlash],
  );

  // 可见节点集合（“仅欧阳修两层”时收缩）
  const visibleIds = useMemo(() => {
    if (centerOnlyTwo) {
      const d = distancesToCenter.map;
      return new Set(
        people.map((p) => p.id).filter((id) => {
          const dd = d.get(id);
          return id === CENTER_PERSON_ID || (dd !== undefined && dd <= 2);
        }),
      );
    }
    return new Set(people.map((p) => p.id));
  }, [centerOnlyTwo]);

  // 全部最短路径（A→B）
  const paths = useMemo(() => {
    if (!selA || !selB) return [];
    return allShortestPaths(selA, selB, 40);
  }, [selA, selB]);

  const currentPath =
    paths.length > 0 ? paths[Math.min(pathIndex, paths.length - 1)] ?? null : null;

  const pathNodeSet = useMemo(() => {
    const s = new Set<string>();
    if (currentPath) currentPath.nodes.forEach((n) => s.add(n));
    return s;
  }, [currentPath]);

  const pathEdgeSet = useMemo(() => {
    const s = new Set<string>();
    if (currentPath) {
      for (let i = 0; i < currentPath.nodes.length - 1; i++) {
        s.add(`${currentPath.nodes[i]}|${currentPath.nodes[i + 1]}`);
        s.add(`${currentPath.nodes[i + 1]}|${currentPath.nodes[i]}`);
      }
    }
    return s;
  }, [currentPath]);

  // 可见边：类别过滤 + 端点可见，按无向对去重
  const visibleEdges = useMemo(() => {
    const seen = new Set<string>();
    const out: Relationship[] = [];
    for (const r of relationships) {
      if (!activeCategories.has(r.category)) continue;
      if (!visibleIds.has(r.source) || !visibleIds.has(r.target)) continue;
      const key = [r.source, r.target].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
    return out;
  }, [activeCategories, visibleIds]);

  const clickPerson = useCallback(
    (id: string) => {
      if (!selA || selA === id) {
        setSelA(id);
        setSelB((b) => (b === id ? null : b));
        setPathIndex(0);
      } else {
        setSelB(id);
        setPathIndex(0);
      }
    },
    [selA],
  );

  const setAsA = useCallback(
    (id: string) => {
      setSelA(id);
      if (selB === id) setSelB(null);
      setPathIndex(0);
    },
    [selB],
  );
  const setAsB = useCallback(
    (id: string) => {
      setSelB(id);
      if (selA === id) setSelA(null);
      setPathIndex(0);
    },
    [selA],
  );
  const swapAB = useCallback(() => {
    const a = selA;
    const b = selB;
    setSelA(b);
    setSelB(a);
    setPathIndex(0);
  }, [selA, selB]);
  const setSlot = useCallback((slot: "A" | "B", id: string) => {
    setPathIndex(0);
    if (slot === "A") {
      setSelA(id);
      setSelB((b) => (b === id ? null : b));
    } else {
      setSelB(id);
      setSelA((a) => (a === id ? null : a));
    }
  }, []);
  const resetSel = useCallback(() => {
    setSelA(null);
    setSelB(null);
    setPathIndex(0);
  }, []);

  const returnToCenter = useCallback(() => {
    setCenterId(CENTER_PERSON_ID);
    setCenterOnlyTwo(false);
    focusPerson(CENTER_PERSON_ID);
  }, [focusPerson, setCenterId]);

  const toggleCategory = useCallback((cat: RelationCategory) => {
    setActiveCategories((cur) => {
      const next = new Set(cur);
      if (next.has(cat)) {
        next.delete(cat);
        if (next.size === 0) return cur; // 不允许全关
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  return (
    <div className="app">
      <Background />
      <div className="titlebar">
        <h1>欧阳修星图</h1>
        <div className="sub">北宋文人关系宇宙</div>
        <div className="hint">“从一颗星出发，看见一个时代的文学群像。”</div>
        <div className="hint" style={{ fontSize: 11, opacity: 0.6 }}>
          选择任意两位人物，探索他们在北宋文坛中的关系路径。
        </div>
      </div>

      <div className="top-bar-actions">
        <button className="btn ghost" onClick={() => setShowInfo(true)} aria-label="查看资料说明">
          资料说明
        </button>
        <button
          className={`chip ${reducedMotion ? "on" : ""}`}
          onClick={() => setReducedMotion(!reducedMotion)}
          aria-pressed={reducedMotion}
        >
          减少动画
        </button>
      </div>

      <ControlPanel
        selA={selA}
        selB={selB}
        activeCategories={activeCategories}
        centerOnlyTwo={centerOnlyTwo}
        onSetCenterOnlyTwo={setCenterOnlyTwo}
        onToggleCategory={toggleCategory}
        onSwap={swapAB}
        onReset={resetSel}
        onFocusPerson={focusPerson}
        onReturnToCenter={returnToCenter}
        onSetSlot={setSlot}
      />

      <StarMap
        centerId={centerId}
        visibleIds={visibleIds}
        edges={visibleEdges}
        selA={selA}
        selB={selB}
        pathNodeSet={pathNodeSet}
        pathEdgeSet={pathEdgeSet}
        flashId={flashId}
        focusId={focusId}
        reducedMotion={reducedMotion}
        onSelect={clickPerson}
        onPersonClick={setDetailId}
      />

      <div className="side" aria-live="polite">
        <PathPanel
          paths={paths}
          pathIndex={pathIndex}
          onPathIndex={setPathIndex}
          selA={selA}
          selB={selB}
        />
        <DetailPanel
          personId={detailId}
          onSetAsA={setAsA}
          onSetAsB={setAsB}
          onSetCenter={(id: string) => {
            setCenterId(id);
            setCenterOnlyTwo(false);
          }}
          onReturnToCenter={() => setCenterId(CENTER_PERSON_ID)}
          onFocusPerson={focusPerson}
        />
      </div>

      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
