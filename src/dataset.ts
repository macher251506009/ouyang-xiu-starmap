import type { DataSet, Person, Relationship, Group } from "./types";
import { people, peopleById, CENTER_PERSON_ID } from "./data/people";
import {
  relationships,
  groups,
  personTags,
} from "./data/relationships";

export * from "./types";
export { CENTER_PERSON_ID } from "./data/people";

// 「并称」生成的关系（group 类别，用于路径连通与展示，非原始史料边）
import { groupRelationships } from "./data/relationships";
export { groupRelationships };

/** 供路径／关系计算使用的全部边 = 原始关系 + 并称关系 */
export const allRelationships: Relationship[] = [
  ...relationships,
  ...groupRelationships,
];

export const dataset: DataSet = {
  people,
  relationships: allRelationships,
  groups,
};

export function getPerson(id: string): Person | undefined {
  return peopleById[id];
}

export function personName(id: string): string {
  return peopleById[id]?.name ?? id;
}

export function personTagsOf(id: string): string[] {
  return personTags[id] ?? [];
}

export { people, relationships, groups, personTags, peopleById };
