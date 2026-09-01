import { useEffect, useState } from "react";

/**
 * 临时中心：普通 state。欧阳修行成默认中心，用户可“以此人为临时中心”切换，
 * 并通过“返回欧阳修中心”回到默认。
 */
export function useTemporaryCenter(initial: string): [string, (id: string) => void] {
  const [centerId, setCenterId] = useState<string>(initial);
  return [centerId, setCenterId];
}

/**
 * 减少动画偏好：若用户显式切换则优先；否则跟随系统 prefers-reduced-motion。
 */
export function useReducedMotion(): [boolean, (b: boolean) => void] {
  const [explicit, setExplicit] = useState<boolean | null>(null);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setSystem(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const reduced = explicit !== null ? explicit : system;
  const setReduced = (b: boolean) => setExplicit(b);
  return [reduced, setReduced];
}
