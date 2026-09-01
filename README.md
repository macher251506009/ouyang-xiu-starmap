# 欧阳修星图 · 北宋文人关系宇宙

以欧阳修为核心的北宋文人关系可视化网站。人物如夜空星辰分布，欧阳修位于中央最亮，其他人物按与欧阳修的关系距离分布于不同星环。可任意选择两位人物，自动计算并高亮二人之间的最短关系路径，并按行进方向生成通顺的中文关系称谓。

> 本图依据用户提供的人物关系资料整理，用于关系探索与文学史学习。部分复杂亲属称谓及个别人名仍待进一步校勘，**不作为绝对完整的历史事实**。

---

## 技术栈

- **React 18** + **TypeScript** + **Vite 5**
- **d3-force**（力导向 + 同心轨道混合布局）
- **d3-zoom / d3-selection / d3-transition**（缩放、平移、聚焦）
- 纯前端，数据全部保存在本地 TS 文件；**无需后端、无需登录、不调用任何付费 API 与 LLM API**。

## 目录结构

```
ouyang-xiu-starmap/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── scripts/
│   └── validate-data.ts        # 数据校验脚本（npm run validate）
└── src/
    ├── main.tsx
    ├── App.tsx                 # 顶层状态与组件编排
    ├── styles.css              # 全局主题（北宋文人星河）
    ├── types.ts                # Person / Relationship / Group 类型
    ├── dataset.ts              # 数据装配（含并称生成的关系）
    ├── data/
    │   ├── people.ts           # 122 位人物
    │   └── relationships.ts    # 167 条关系边 + 11 组并称
    ├── lib/
    │   ├── graph.ts            # 邻接表 / BFS / 全部最短路径 / 正反向称谓
    │   └── search.ts           # 中文模糊搜索
    ├── hooks/
    │   ├── useForceLayout.ts   # d3-force 布局封装
    │   └── useMisc.ts          # 临时中心 / 减少动画
    └── components/
        ├── Background.tsx      # 星空 + 星尘背景
        ├── StarMap.tsx         # 主星图（节点/边/缩放/拖动/聚焦）
        ├── ControlPanel.tsx    # 人物A/B搜索、筛选、图例、快捷开关
        ├── DetailPanel.tsx     # 人物详情与直接关系
        ├── PathPanel.tsx       # 关系路径中文说明（多路径切换）
        └── InfoModal.tsx       # 资料说明弹窗
```

## 本地启动与构建

```bash
npm install                 # 安装依赖
npm run validate            # 数据校验（可先跑）
npm run dev                 # 本地开发（默认 http://localhost:5173）
npm run build               # 生产构建 → dist/
npm run preview             # 本地预览生产包
```

> 首次运行先 `npm install`。数据校验非启动必需，但建议在改动数据后运行，会自动列出孤立人物、重复 id、悬空引用、指向自身等错误。

## 部署

线上分享地址（GitHub Pages）：**https://macher251506009.github.io/ouyang-xiu-starmap/**

发布方式：**GitHub Pages + `gh-pages` 分支**（分支存放构建产物 `index.html` + `assets/`，相对路径；Settings → Pages → branch `gh-pages` → root）。每次更新网页成品，重新 `npm run build` 后将新的 `dist/` 更新到 `gh-pages` 分支并推送，GitHub 自动重新上线。

更新 `gh-pages` 分支（本机 WSL 连 GitHub 443 不稳，多试几次或换网络）：
```bash
npm run build
git worktree add --detach /tmp/ghpage origin/gh-pages
cp -r dist/. /tmp/ghpage/
cd /tmp/ghpage && git add -A && git commit -m "update dist" && git push origin HEAD:gh-pages
cd /mnt/c/Users/75044/ouyang-xiu-starmap && git worktree remove /tmp/ghpage
```
亦可部署到 Vercel / Netlify / Cloudflare Pages（构建 `npm run build`，输出 `dist`），或本地 `npx serve dist`。

## 数据模型

`Person`（人物）：

```ts
interface Person {
  id: string; name: string; aliases?: string[];
  category?: string[]; title?: string[];   // 称号（横渠先生、宋四家之一等）
  courtesyName?: string;                   // 字
  birthYear?; deathYear?; introduction?; works?; source?;  // 未提供数据时留空，绝不虚构
  confidence?: "confirmed" | "uncertain";
  note?: string;
}
```

`Relationship`（关系边）：

```ts
interface Relationship {
  id: string; source: string; target: string;   // 人物 id
  relation: string;                              // 正向称谓：source 认为 target 是自己的什么
  reverseRelation?: string;                      // 反向称谓；缺省用 relation + description
  category: "family"|"teacher"|"friend"|"exam"|"politics"|"recommendation"|"group"|"other";
  description: string;                           // 完整事实说明
  directed?: boolean; confidence?: "confirmed"|"uncertain"; sourceNote?: string;
}
```

- 扁平、无向的图（路径可双向搜索），但称谓按行进方向反转（如 `学生 ↔ 老师`、`父亲 ↔ 儿子`、`好友 ↔ 好友`）。
- “并称”（二苏、二宋、天圣四友、熙宁三舍人等）作为 `Group` 数据，**不作为人物节点**；并称成员之间自动生成 `group` 类别的关系边以参与路径连通。

## 核心算法

- **最短路径**：无权图 BFS 求单点到各点距离，再沿“距离-1”反向回溯求**全部同长最短路径**（最多返回 40 条，可切换查看）。
- **正反向称谓**：沿某条边行进时，若行进方向与记录的 `source→target` 一致用 `relation`，反之用 `reverseRelation`；对称关系两端相同。
- **到欧阳修距离**：以欧阳修起点的 BFS 距离表（首次惰性计算）。

## 交互特性

- 点击星体：第一次设为「人物 A」（金环），第二次设为「人物 B」（青蓝环）；再次点击 A 或 B 可更改/清除。
- 顶部/左侧搜索框可直接指定 A、B；选中后自动高亮路径并放大。
- 鼠标拖节点、画布拖动/缩放；移动端支持双指缩放与单指拖动。
- 右侧「人物详情」：与欧阳修距离、关系概述、全部直接关系、称号一并称、设为 A/B、以此人为临时中心、返回欧阳修中心。
- 关系类别筛选 + 图例（颜色 + 线型区分，不仅靠颜色）；「仅欧阳修两层」快捷开关；「减少动画」尊重 `prefers-reduced-motion`。
- 无障碍：键盘可达（节点可用 Enter/空格触发）、中文 `aria-label`、明显焦点状态、触控区域足够大。

## 数据校验范围（`npm run validate`）

relationship 的 source/target 是否存在 · 人物 id 是否重复 · 关系 id 是否重复 · 是否空姓名 · 是否指向自身 · uncertain 是否标注「待复核」 · 欧阳修能否作为默认中心 · 任意两连通人物能否算出路径 · group 成员是否存在且不与人物名冲突。

## 已知说明

- 杨察、杨寘兄弟在原资料中未给出与欧阳修网络的任何连接，故为独立小簇；本图按“不擅自添加资料之外的关系”原则保留其孤立状态。如需连通，请在 `relationships.ts` 中补充依据。
- “苏箦（姓名待复核）”、晁端彦与章惇的“三同”均以 `uncertain` 标注并在说明中保留原描述，不作擅自推断。
