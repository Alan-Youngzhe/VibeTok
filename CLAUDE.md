# VibeTok 开发约定

VibeTok：人类贡献注意力，换取 Agent 的机器劳动。手机优先 Web MVP，单机运行。

## 文档权限（先读这里）

- `VIBETOK_CONCEPT.md` — **唯一需求源，对 agent 只读，禁止修改**。需求疑义以它为准。
- `TECH_SPEC.md` — 施工蓝图：技术栈、表结构、API、目录、待定问题决策。实现与 spec 冲突时先改 spec（说明理由）再写码。
- 核心红线：**账本数据必须真实**。观看秒数、tokens、耗时、轮次一律来自真实事件流（心跳 / claude CLI usage），任何代码路径不得写入伪造数字；补贴与倍率单独入账并明示。

## 命令

脚手架用 `create-next-app`（TypeScript + Tailwind + App Router，src 目录），包管理用 pnpm。

```bash
pnpm dev          # 开发服务器 http://localhost:3000
pnpm build        # 生产构建
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest run
pnpm seed         # tsx scripts/seed-cards.ts，灌内容卡片池
```

数据库：better-sqlite3，文件在 `data/vibetok.db`；启动时由 `src/lib/db/migrate.ts` 自动建表（无独立迁移工具）。`data/` 整目录 gitignore。

Agent Worker 依赖本机已登录的 `claude` CLI（headless `claude -p`），无需新增凭据。硬上限：单任务 ≤10 分钟、输出 ≤50k tokens，超限强制终止并如实记账——此上限不可放宽。

## 目录结构

```
src/
├── app/            # 页面 + API route.ts，只做装配和参数校验，逻辑下沉 services
├── components/     # 一个 .tsx 只放一个 React 组件
├── lib/
│   ├── db/         # SQLite 连接 + migrate
│   ├── dao/        # 一表一文件（tasks.ts、ledgerEntries.ts…），只写 SQL 不写业务
│   ├── schemas/    # Zod schema；类型一律 z.infer 推导，不手写重复类型
│   └── services/   # 一域一文件（quote.ts、attention.ts、ledger.ts…），纯函数优先
└── worker/         # agentWorker.ts：spawn claude -p、stream-json 解析、限额终止、记账
data/               # 运行时数据（db + workspaces），gitignore
scripts/            # 种子脚本
```

## 代码规范

- 业务代码单文件 ≤300 行，超了就拆。
- `index.ts` 只做 barrel re-export，不放业务逻辑。
- 命名反映本质：检查叫 `check`，修复叫 `fix`，累计叫 `accrue`。
- 纯函数与不可变数据优先，副作用（DB 写入、spawn 进程）收在 dao/worker 边界层。
- API 边界必须过 Zod 校验；错误响应统一 `{ error: { code, message } }`。
- 移动端优先；UI 走冷峻官僚风（见 spec §5 模块一），禁止金币/庆祝动画/emoji/蓝紫渐变。
- 施工顺序：后端 API/服务 → 后端测试 → 前端实现 → 浏览器真机验证。声称完成前先跑 `pnpm test && pnpm typecheck && pnpm lint`，UI 改动必须在浏览器验证。

## Git

- 个人仓库，直接在 `main` 上工作：每完成一个功能即 commit + push（`git push origin main`）。
- 提交信息用中文。
- 破坏性 git 操作（reset --hard、force push）前必须先确认。
