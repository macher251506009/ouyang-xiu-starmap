/**
 * 数据校验脚本
 * 运行：npm run validate  （内部使用 tsx）
 * 校验项：
 *  1. relationship 的 source/target 是否都存在
 *  2. 人物 id 是否重复
 *  3. 关系 id 是否重复
 *  4. 是否为空姓名
 *  5. 是否存在指向自身的错误关系
 *  6. uncertain 数据是否正确带“待复核”信息
 *  7. 欧阳修是否能作为默认中心节点
 *  8. 是否可对任意两个连通人物计算路径
 *  9. 并称 group 成员是否都存在、是否混入人物节点
 */

import { dataset } from "../src/dataset";
import { allShortestPaths, distancesToCenter } from "../src/lib/graph";

const errors: string[] = [];
const warnings: string[] = [];

function err(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

// 1 & 2 & 4. 人物校验
{
  const seen = new Map<string, number>();
  for (const p of dataset.people) {
    if (seen.has(p.id)) err(`人物 id 重复：${p.id}（${p.name}）`);
    seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
    if (!p.name || !p.name.trim()) err(`人物 ${p.id} 姓名为空`);
  }
}

const personIds = new Set(dataset.people.map((p) => p.id));

// 3. 关系 id 唯一；1. source/target 存在；5. 指向自身；6. uncertain
{
  const relIds = new Map<string, number>();
  for (const r of dataset.relationships) {
    if (relIds.has(r.id)) err(`关系 id 重复：${r.id}`);
    relIds.set(r.id, 1);
    if (!personIds.has(r.source)) err(`关系 ${r.id}（${r.relation}）的 source 不存在：${r.source}`);
    if (!personIds.has(r.target)) err(`关系 ${r.id}（${r.relation}）的 target 不存在：${r.target}`);
    if (r.source === r.target) err(`关系 ${r.id} 指向自身：${r.source}`);
    if (r.confidence === "uncertain" && !r.description.includes("待复核") && !r.description.includes("待考")) {
      warn(`关系 ${r.id} 标记 uncertain 但说明未含“待复核”，请补充：${r.description}`);
    }
  }
}

// 7. 欧阳修可作为默认中心
{
  if (!personIds.has("ousyangxiu")) err("缺少默认中心人物 欧阳修 (id=ousyangxiu)");
  const center = distancesToCenter.map;
  let reachable = 0;
  for (const id of personIds) {
    if (center.get(id) !== undefined) reachable++;
  }
  console.log(`[信息] 到欧阳修可达的人物：${reachable} / ${personIds.size}`);
  for (const id of personIds) {
    if (center.get(id) === undefined) {
      warn(`人物“${id}”与欧阳修不连通（孤立节点）。`);
    }
  }
}

// 8. 任意两个连通人物可计算路径（抽样全量校验，步数上限保护）
{
  const ids = [...personIds];
  let checked = 0;
  let disconnected = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i];
      const b = ids[j];
      const paths = allShortestPaths(a, b, 1);
      checked++;
      if (paths.length === 0) {
        disconnected++;
        // 不打印所有，仅统计
      }
    }
  }
  console.log(`[信息] 人物对路径校验：${checked} 对，其中不可达【断开】${disconnected} 对。`);
  if (disconnected > 0) {
    // 打印前几个断开的示例
    let printed = 0;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (allShortestPaths(ids[i], ids[j], 1).length === 0 && printed < 5) {
          warn(`人物对 "${ids[i]}" 与 "${ids[j]}" 之间不存在可达路径。`);
          printed++;
        }
      }
    }
  }
}

// 9. group 成员都存在；group 不混入人物
{
  for (const g of dataset.groups) {
    for (const m of g.members) {
      if (!personIds.has(m)) err(`并称 group ${g.name} 的成员不存在：${m}`);
    }
    if (g.members.length === 0) warn(`并称 group ${g.name} 没有成员。`);
  }
  const groupNames = new Set(dataset.groups.map((g) => g.name));
  const nameClash = dataset.people.filter((p) => groupNames.has(p.name));
  if (nameClash.length) {
    warn(`并称名与人物名存在重复（作为并称不应建立人物节点）：${nameClash.map((p) => p.name).join("、")}`);
  }
}

// 反向称谓日志检查：确保关键对称称谓一致
{
  const checkPairs: Array<[string, string]> = [
    ["ousyangxiu", "xuyan"],
    ["ousyangxiu", "susong"],
    ["ousyangxiu", "shijie"],
    ["xiejingchu", "huangtingjian"],
    ["sushi", "ligefei"],
  ];
  for (const [a, b] of checkPairs) {
    const paths = allShortestPaths(a, b, 1);
    if (paths.length) {
      const p = paths[0];
      if (p.nodes.length === 2) {
        const fwd = p.stepTexts[0];
        const back = allShortestPaths(b, a, 1)[0].stepTexts[0];
        console.log(`[称谓] ${a}→${b}: ${fwd} | ${b}→${a}: ${back}`);
      }
    }
  }
}

console.log("");
if (errors.length) {
  console.error(`✗ 校验失败：发现 ${errors.length} 个错误`);
  errors.forEach((e) => console.error(`   - ${e}`));
  process.exit(1);
} else {
  console.log("✓ 数据校验通过：未发现错误");
}
if (warnings.length) {
  console.log(`\n提示（${warnings.length} 条，不影响运行，但建议关注）：`);
  warnings.forEach((w) => console.log(`   - ${w}`));
}
console.log(`\n人物 ${dataset.people.length} 位，关系 ${dataset.relationships.length} 条，并称 ${dataset.groups.length} 组。`);
