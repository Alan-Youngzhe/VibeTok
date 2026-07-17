---
title: VibeTok 技术方案（MVP）
version: v1.0
last_updated: 2026-07-17
status: approved-for-build
source: VIBETOK_CONCEPT.md v0.1（唯一需求源，本文档不得与其冲突）
---

# VibeTok TECH_SPEC

本方案覆盖概念稿「初步系统边界」的全部六个模块，遵守「MVP 必须真实 / 可以模拟 / 明确不做」三张清单。核心红线：**账本数据必须真实，不许伪造**——观看秒数、tokens、耗时、操作次数全部来自真实事件流，补贴与倍率单独记账并明示。

---

## 1. 技术栈选型

| 层 | 选型 | 理由 |
|---|---|---|
| 框架 | Next.js 15（App Router）+ TypeScript | 页面与 API 同仓同进程，移动端 Web 优先，符合默认偏好 |
| 样式 | Tailwind CSS v4 | 快速实现《1984》式冷峻官僚风格，移动优先 |
| 数据库 | SQLite（better-sqlite3，同步 API） | MVP 单机跑通、零运维；同步 API 简化 DAO，无 ORM 迁移负担 |
| 校验 | Zod（类型用 `z.infer` 推导） | API 边界强类型，单一 schema 来源 |
| Agent 执行 | 本机 `claude -p "<task>"` headless 子进程 | 零新增凭据；`--output-format stream-json` 提供真实 usage（tokens / 耗时 / 轮次），满足真实记账 |
| 实时进度 | 客户端轮询（2s 间隔） | MVP 最简；不引入 WebSocket/SSE 基础设施 |
| 内容素材 | 生成式视觉卡片（CSS/Canvas 动画 + 主题文案），可选本地 mp4 占位 | 不联网抓取、零版权风险、不接广告 |
| 包管理 / 测试 | pnpm / Vitest | 轻量、快 |

**不采用**（对应「明确不做」清单）：不自研 Agent、不做多模型路由、不做账号订阅系统（匿名 cookie 身份）、不做无限 Feed（内容卡片按需循环，池子有限）、不接程序化广告。

### Agent Worker 硬上限（不可推翻）

- 单任务执行 ≤ **10 分钟**（wall clock），到时 `SIGTERM` → 5s 后 `SIGKILL`；
- 输出 ≤ **50k tokens**，流式统计超限即终止；
- 超限终止**如实记账**：`agent_runs.exit_reason = 'timeout' | 'token_limit'`，已消耗的 tokens 与秒数照常入账，账单公开显示失败原因。

---

## 2. 数据模型（SQLite 表结构）

匿名身份：首次访问下发 `participant_id` cookie（uuid），不做注册登录。

```sql
-- 匿名参与者（发起人与助力者同表）
CREATE TABLE participants (
  id          TEXT PRIMARY KEY,            -- uuid，存 cookie
  codename    TEXT NOT NULL,               -- 自动生成的官僚风编号，如 "劳动者 No.0047"
  created_at  TEXT NOT NULL                -- ISO8601，下同
);

-- 任务（一个任务即一个助力房间，share_token 即房间钥匙）
CREATE TABLE tasks (
  id                       TEXT PRIMARY KEY,   -- uuid
  creator_id               TEXT NOT NULL REFERENCES participants(id),
  prompt                   TEXT NOT NULL,      -- 用户原始劳动申请
  status                   TEXT NOT NULL,      -- quoted|accepted|running|succeeded|failed|timeout|token_limit
  quote_summary            TEXT,               -- Agent 侧复述（规则模板生成）
  quote_labor_seconds_est  INTEGER,            -- 预计机器劳动秒数
  quote_attention_seconds  INTEGER,            -- 需要的人类注意力秒数（报价）
  attention_pool_seconds   INTEGER NOT NULL DEFAULT 0,  -- 已入池有效注意力（含倍率加成，冗余汇总，源头在 ledger）
  verdict                  TEXT,               -- worth|not_worth|NULL
  verdict_at               TEXT,
  share_token              TEXT NOT NULL UNIQUE,  -- 短随机串，助力/账单链接
  is_public                INTEGER NOT NULL DEFAULT 1,  -- 账单是否进档案馆
  reveal_content           INTEGER NOT NULL DEFAULT 0,  -- prompt/产物是否公开（默认隐藏）
  error_message            TEXT,
  created_at               TEXT NOT NULL,
  accepted_at              TEXT,
  finished_at              TEXT
);

-- Agent 执行记录（一次任务一次 run；重试即多行，全部保留）
CREATE TABLE agent_runs (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES tasks(id),
  started_at       TEXT NOT NULL,
  finished_at      TEXT,
  exit_reason      TEXT,               -- completed|timeout|token_limit|error
  duration_seconds INTEGER,            -- 真实 wall clock
  tokens_input     INTEGER,            -- 来自 claude stream-json usage
  tokens_output    INTEGER,
  num_turns        INTEGER,            -- 操作次数口径：Agent 轮次数
  num_tool_errors  INTEGER NOT NULL DEFAULT 0,  -- 失败次数口径
  cost_usd         REAL,               -- CLI 报告的 total_cost_usd
  workspace_dir    TEXT NOT NULL       -- data/workspaces/<task_id>
);

-- Agent 过程事件（观看页展示"AI 正在做什么"）
CREATE TABLE agent_events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id   TEXT NOT NULL REFERENCES agent_runs(id),
  ts       TEXT NOT NULL,
  kind     TEXT NOT NULL,              -- tool_use|text|error|system
  summary  TEXT NOT NULL               -- 单行摘要，如 "读取文件 report.md"
);

-- 观看会话（一名参与者进入一个任务的观看流一次 = 一行）
CREATE TABLE attention_sessions (
  id                 TEXT PRIMARY KEY,
  task_id            TEXT NOT NULL REFERENCES tasks(id),
  participant_id     TEXT NOT NULL REFERENCES participants(id),
  started_at         TEXT NOT NULL,
  last_heartbeat_at  TEXT,
  effective_seconds  INTEGER NOT NULL DEFAULT 0,  -- 服务端根据心跳判定累计
  cards_watched      INTEGER NOT NULL DEFAULT 0
);

-- 心跳原始事件（真实性的证据链，只追加不修改）
CREATE TABLE attention_heartbeats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES attention_sessions(id),
  ts          TEXT NOT NULL,
  visible     INTEGER NOT NULL,        -- document.visibilityState === 'visible'
  playing     INTEGER NOT NULL         -- 内容卡片处于播放态
);

-- 统一账本（模型成本 / 平台补贴 / 协作倍率分开记录，账单直接由此渲染）
CREATE TABLE ledger_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     TEXT NOT NULL REFERENCES tasks(id),
  entry_type  TEXT NOT NULL,   -- attention_earned（真实观看）| multiplier_bonus（协作补贴）
                               -- | labor_tokens（模型消耗）| platform_subsidy（实验预算补贴说明）
  amount      REAL NOT NULL,
  unit        TEXT NOT NULL,   -- seconds|tokens|usd
  source_id   TEXT,            -- 关联 session_id / run_id
  note        TEXT,            -- 如 "3 人协作 ×1.5，VibeTok 协作补贴"
  created_at  TEXT NOT NULL
);

-- 产物文件
CREATE TABLE artifacts (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id),
  filename    TEXT NOT NULL,
  path        TEXT NOT NULL,           -- data/workspaces/<task_id>/out/ 下
  mime        TEXT,
  size_bytes  INTEGER,
  created_at  TEXT NOT NULL
);

-- 内容卡片池（有限池，不做无限 Feed）
CREATE TABLE content_cards (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL,      -- generative|video
  title            TEXT NOT NULL,
  src              TEXT,               -- video 时为 public/videos/ 路径；generative 为卡片组件 key
  duration_seconds INTEGER NOT NULL,   -- 每段 15s
  theme            TEXT                -- labor|ai|consumption
);
```

**兑换率与补贴（写死为配置常量，账单明示）**：`1 秒有效注意力 = 400 tokens 预算`（由实验预算补贴，账单固定显示「本兑换由实验预算补贴，非广告收入」）。任务所需注意力报价 = 预估 tokens ÷ 400 ÷ 倍率，向上取整到 30s。

---

## 3. API 设计（App Router Route Handlers）

所有请求/响应体经 Zod 校验；错误统一 `{ error: { code, message } }`。身份靠 `participant_id` cookie（中间件自动种）。

| 方法 | 路由 | 请求 | 响应 | 说明 |
|---|---|---|---|---|
| POST | `/api/tasks` | `{ prompt: string }` | `{ task: { id, shareToken, status:'quoted', quoteSummary, quoteLaborSecondsEst, quoteAttentionSeconds } }` | 创建劳动申请并生成交换报价（规则估算：按 prompt 长度/类型模板，见 §7 模块三） |
| POST | `/api/tasks/:id/accept` | `{}` | `{ task }` | 接受报价；状态 `accepted`，spawn Agent Worker 转 `running` |
| GET | `/api/tasks/:id` | — | `{ task, run: { durationSeconds, tokensTotal, numTurns, latestEvents[] }, pool: { earnedSeconds, requiredSeconds, participantCount, multiplier } }` | 观看页 2s 轮询的唯一状态端点 |
| POST | `/api/tasks/:id/sessions` | `{}` | `{ session: { id } }` | 进入观看流/助力房间，创建观看会话 |
| POST | `/api/sessions/:id/heartbeat` | `{ visible: boolean, playing: boolean, cardId: string }` | `{ effectiveSeconds, poolSeconds }` | 每 5s 一次；服务端判定有效性后累计（规则见 §7 模块四） |
| POST | `/api/tasks/:id/verdict` | `{ verdict: 'worth' \| 'not_worth' }` | `{ task }` | 仅创建者、仅任务终态可调；写入后账单定稿 |
| GET | `/api/tasks/:id/bill` | — | `{ bill: { human: {...}, machine: {...}, delivery: {...}, verdict, subsidyNote } }` | 账单数据（人类支付/机器劳动/交付/裁决四段） |
| GET | `/api/tasks/:id/artifacts/:artifactId` | — | 文件流 | 产物下载；`reveal_content=0` 时仅创建者可下 |
| GET | `/api/archive?cursor=` | — | `{ bills: [...], nextCursor }` | 公开档案馆列表（`is_public=1` 且已裁决），分页非无限流 |
| GET | `/api/cards?taskId=` | — | `{ cards: [...] }` | 拉取本次观看的内容卡片序列 |

**页面路由**（非 API）：`GET /t/:shareToken` 由 token 解析任务，是分享/助力/恢复的统一入口。

---

## 4. 页面结构与目录规划

### 页面（移动端优先；桌面访问 `/t/*` 时展示二维码引导转手机）

| 路由 | 页面 | 内容 |
|---|---|---|
| `/` | 劳动申请 | 一句话产品声明 + 任务输入框 + 「提交劳动申请」 |
| `/t/[token]` | 任务状态机 | 按 `status` 渲染：报价确认（quoted）→ 征召引导+进入观看（running）→ 结果与裁决（终态）；关闭重开即恢复 |
| `/t/[token]/watch` | 竖屏内容流 | 全屏卡片流 + 顶部 Agent 实时操作字幕 + 底部真实兑换计数（"你已为 Agent 赚取 38 秒机器劳动"）|
| `/t/[token]/bill` | 公开账单 | 不可修饰的四段式账单 + 参与者名单 + 补贴声明 + 分享 |
| `/archive` | 人机劳动档案馆 | 已裁决公开账单列表（含失败与"不值得"）|

### 目录规划

```
vibetok/
├── VIBETOK_CONCEPT.md        # 唯一需求源（只读）
├── TECH_SPEC.md              # 本文档
├── CLAUDE.md                 # 开发约定
├── data/                     # 运行时数据（gitignore）
│   ├── vibetok.db            # SQLite
│   └── workspaces/<taskId>/  # Agent 子进程 cwd，out/ 放交付物
├── public/videos/            # 可选本地占位 mp4
├── scripts/seed-cards.ts     # 内容卡片池种子
└── src/
    ├── app/                  # 页面 + API 路由（仅装配，逻辑下沉 services）
    │   ├── page.tsx
    │   ├── t/[token]/{page,watch/page,bill/page}.tsx
    │   ├── archive/page.tsx
    │   └── api/…             # §3 的 route.ts
    ├── components/           # 一文件一组件（QuoteCard、AttentionMeter、BillSheet、GenerativeCard…）
    ├── lib/
    │   ├── db/               # 连接 + migrate.ts（启动时建表）
    │   ├── dao/              # 一表一文件：tasks.ts、agentRuns.ts、ledgerEntries.ts…
    │   ├── schemas/          # Zod schema，类型一律 z.infer
    │   └── services/         # 一域一文件：quote.ts、attention.ts、ledger.ts、verdict.ts、archive.ts
    └── worker/               # agentWorker.ts：spawn claude -p、流解析、限额终止、记账
```

---

## 5. 六模块技术方案

### 模块一：手机 Web 仪式
§4 的五个页面即仪式全流程：申请 → 报价 → 观看 → 裁决 → 账单。视觉规范：冷峻官僚风（无金币/庆祝动画/emoji），操作文案统一用「劳动申请 / 交换报价 / 征召 / 裁决」。关闭页面后任务继续（Worker 在服务端），重开 `/t/[token]` 恢复。桌面端中间件按 UA 在 `/t/*` 叠加二维码浮层。

### 模块二：任务与注意力账本
`ledger_entries` 为唯一事实源，四类条目（真实观看 / 协作补贴 / 模型消耗 / 预算补贴说明）分开记录，`tasks.attention_pool_seconds` 仅为冗余汇总。账单页与档案馆全部由账本聚合渲染，无任何手写数字。**禁止任何代码路径直接写"漂亮数字"**。

### 模块三：单一 Agent Worker
`accept` 后由 Next 服务端 `spawn('claude', ['-p', prompt, '--output-format', 'stream-json', '--verbose'], { cwd: workspaceDir })`。流式解析 NDJSON：assistant/tool 消息摘要写 `agent_events`（供观看页字幕）；累计 output tokens ≥50k 或 wall clock ≥10min 即终止并记 `exit_reason`；`result` 消息的 `usage`、`num_turns`、`total_cost_usd`、`duration_ms` 写 `agent_runs` 与账本。交付物约定写入 `<workspace>/out/`，结束后扫描登记 `artifacts`。报价阶段不调模型，用规则估算（prompt 长度分档 + 任务类型关键词 → 预估 tokens/耗时模板），报价文案如实标注"估算值"。进程崩溃/服务重启导致的孤儿任务标 `failed` 并如实入账。

### 模块四：内容流与有效观看计时
竖屏卡片流，每段 15s 生成式视觉卡片（主题：劳动/AI/消费）。客户端每 5s 心跳上报 `{visible, playing}`；服务端累计规则：**仅当本次与上次心跳间隔 ≤8s 且两次均 visible+playing，才累计该间隔秒数**——切后台、锁屏、断网的时段自然不计入。心跳原始记录追加写入 `attention_heartbeats` 作为证据链。有限卡片池循环播放，不做推荐算法、不做无限 Feed。

### 模块五：多人助力房间
任务即房间：`share_token` 链接进入 `/t/[token]` → 助力者获得匿名身份 → 开 session 观看，秒数进同一 `attention pool`。协作倍率（决策见 §6-Q4）按**去重有效参与者数**（effective_seconds ≥30 才算参与）阶梯生效，倍率加成部分以 `multiplier_bonus` 单独入账并标注「VibeTok 协作补贴」。页面始终显示真实剩余量（`required - earned`），归零即止，无虚假进度。贡献者化名列入最终账单。

### 模块六：结果与公开档案
终态后 `/t/[token]` 展示结果（文本/Markdown 内嵌渲染 + `artifacts` 下载），创建者裁决「值得 / 不值得」后账单定稿。`is_public=1` 的已裁决账单进 `/archive`（含失败与不值得，失败不隐藏）。隐私默认：账单只公开数字、化名与裁决；prompt 与产物默认隐藏，创建者可显式公开（`reveal_content`）。

---

## 6. 待定问题决策表（概念稿 §待定问题，逐一给出 MVP 默认决策）

| # | 待定问题 | MVP 默认决策 | 一句话理由 |
|---|---|---|---|
| 1 | 接入哪个 Agent/模型 | 本机 Claude Code headless（`claude -p` 子进程） | 零新增凭据即可跑通真实执行，且 CLI 原生输出真实 tokens/耗时/轮次，满足账本真实性 |
| 2 | 单次任务时长与预算上限 | ≤10 分钟、输出 ≤50k tokens，超限强制终止并如实记账 | 上限明确可执行，失败本身就是实验结果，不需要弹性 |
| 3 | 第一批视频内容 | 自制生成式视觉卡片（CSS/Canvas 动画），主题围绕劳动/AI/消费 | 零版权风险、零采购成本、主题自洽，且不违反"不联网抓取"约束 |
| 4 | 协作倍率阶梯/上限/有效期 | 1 人 ×1.0，2 人 ×1.2，≥3 人 ×1.5（封顶）；任务生命周期内有效；加成记为协作补贴 | 规则简单可解释、有硬上限，补贴单独入账不假装是广告收入 |
| 5 | 公开与隐藏边界 | 账单数字/化名/裁决默认公开，prompt 与产物默认永久隐藏、创建者可选公开 | 默认匿名保护隐私，选择权交给任务所有者 |
| 6 | 结果交付形式 | 网页内嵌展示 + 文件下载双通道 | 覆盖问答与文件两大类产出，实现成本最低 |
| 7 | 账单是否允许评论 | 不做评论，只保留「值得 / 不值得」裁决 | 裁决即作品语言，评论区是 MVP 之外的社区系统 |
| 8 | 发布形态 | 独立网站（先本机单机 MVP） | 与"SQLite 单机跑通、不上云"约束一致，展览/合作版本留待验证后 |

---

## 7. 明确不做（本 spec 范围外）

真实广告接入、多模型路由、账号/订阅系统、推荐算法与无限 Feed、生产级交付质量保证、云端部署与横向扩展、任务内容自动审核（MVP 仅在提交页声明使用边界 + Worker cwd 隔离到任务工作区）。
