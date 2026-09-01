import { people } from "../data/people";
import type { Person } from "../types";

export interface SearchHit {
  person: Person;
  score: number;
}

/** 简单模糊匹配：子串优先，其次逐字包含，最后别名/字号匹配 */
export function searchPeople(query: string, limit = 12): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const p of people) {
    let score = -1;
    if (p.name.includes(q)) score = 100 + q.length;
    else if (q.split("").every((ch) => p.name.includes(ch)))
      score = 60;
    // 别名、字
    for (const alias of [...(p.aliases ?? []), p.courtesyName ?? ""]) {
      if (!alias) continue;
      if (alias.includes(q)) score = Math.max(score, 80);
    }
    if (score >= 0) hits.push({ person: p, score });
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
