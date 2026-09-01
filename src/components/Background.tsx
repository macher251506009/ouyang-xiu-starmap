import { useEffect, useMemo } from "react";

/** 夜空背景：星尘 + 宣纸/水墨云气的轻量氛围（用 CSS 渐变避免外依赖） */
export default function Background() {
  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; s: number; d: number; o: number; dur: number }> = [];
    const n = 46;
    for (let i = 0; i < n; i++) {
      const x = (i * 137.508) % 100;
      const y = ((i * 53) % 97);
      arr.push({
        x,
        y,
        s: 1 + ((i * 7) % 3),
        d: ((i * 3) % 6) + 1,
        o: 0.25 + ((i * 11) % 40) / 100,
        dur: 8 + ((i * 5) % 14),
      });
    }
    return arr;
  }, []);

  return (
    <div className="sky" aria-hidden="true">
      {stars.map((st, i) => (
        <span
          key={i}
          className="stardust"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            animationDelay: `${st.d}s`,
            animationDuration: `${st.dur}s`,
            opacity: st.o,
          }}
        />
      ))}
    </div>
  );
}
