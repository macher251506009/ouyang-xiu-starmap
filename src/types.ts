// 核心数据类型定义
// 本网站呈现的是"根据所提供关系资料整理的关系图"，并非绝对完整的历史事实。

/** 关系大类 */
export type RelationCategory =
  | "family" // 亲属与姻亲 — 朱砂
  | "teacher" // 师生与门生 — 青色
  | "friend" // 朋友与文学交往 — 金色
  | "exam" // 科举与同年 — 紫色
  | "politics" // 政治与仕途 — 蓝灰
  | "recommendation" // 举荐与赏识 — 绿色
  | "group" // 团体、并称与称号 — 淡黄虚线
  | "other"; // 其他 — 灰色虚线

export type Confidence = "confirmed" | "uncertain";

/** 人物 */
export interface Person {
  id: string;
  name: string;
  aliases?: string[];
  category?: string[]; // 人物自身的归类标签（如 文学家、政治家）
  title?: string[]; // 称号（如 “宋四家之一”“横渠先生”）
  birthYear?: number;
  deathYear?: number;
  courtesyName?: string; // 字
  introduction?: string; // 生平简介，暂无数据时留空
  works?: string[]; // 代表作
  source?: string;
  confidence?: Confidence;
  note?: string; // 备注 / 待复核说明
}

/** 一条关系事实 */
export interface Relationship {
  id: string;
  source: string; // 人物 id
  target: string; // 人物 id
  relation: string; // 正向称谓：source 到 target
  reverseRelation?: string; // 反向称谓：target 到 source；缺省时使用 relation + description
  category: RelationCategory;
  description: string; // 完整原始事实说明
  directed?: boolean; // 有方向的关系（默认为双向对称可反转；true 表示按正向理解）
  confidence?: Confidence;
  sourceNote?: string;
  /** 是否为需要弱化展示的匿名辅助节点关系（如 “吴充之女”） */
  anonymous?: boolean;
}

/** 并称 / 团体 / 称号（不作为人物节点） */
export interface Group {
  id: string;
  name: string;
  members: string[]; // 人物 id
  description?: string;
}

export interface DataSet {
  people: Person[];
  relationships: Relationship[];
  groups: Group[];
}

export const CATEGORY_LABEL: Record<RelationCategory, string> = {
  family: "亲属与姻亲",
  teacher: "师生与门生",
  friend: "朋友与文学交往",
  exam: "科举与同年",
  politics: "政治与仕途",
  recommendation: "举荐与赏识",
  group: "团体、并称与称号",
  other: "其他",
};

export const CATEGORY_COLORS: Record<RelationCategory, string> = {
  family: "#b3402f", // 朱砂
  teacher: "#2f7f8f", // 青色
  friend: "#c9a24b", // 金色
  exam: "#7a5fb0", // 紫色
  politics: "#647083", // 蓝灰
  recommendation: "#4f8a5a", // 绿色
  group: "#c9c07a", // 淡黄
  other: "#8a8a8a", // 灰色
};
