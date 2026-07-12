# 意识形态镜室

一个以哲学追问为方法的世界观显影工具。用户带来一个具体判断，系统从场域、本体、现象与目的四个轴向追问，观察观念、选择、物质条件和制度结构怎样进入解释。每个轴向分为四档，因此共有 `4⁴ = 256` 种临时组合；结果只绑定本次议题，不把人永久归入某个哲学阵营。

## 现在可以做什么

- 从一个确信、犹豫或争论过的判断开始，完成 4 个单问题追问
- 每一问先给出 3 至 4 个可编辑的常见回答，既可一键选用，也可继续改写或完全手写
- 回答过程中生成一张随用词和轮次变化的临时思想拓扑，并与四面镜子的显影状态并置
- 把 256 种组合归入 4 个角色家族与 16 个核心思想角色，例如“意义守灯人”“裂隙破题人”
- 四条轴分别控制角色的舞台、轮廓、表情与道具，实时组合成 256 幅稳定画像
- 把四个轴向分别归入四档，生成一枚 `3–2–4–1` 式四位短码
- 为 256 种组合生成稳定且唯一的几何徽记，以及可分享、可反驳的临时“主义名”
- 用可交互的 `4 × 4 × 4` 思想立方呈现前三个轴向，并以第四轴的轨道状态完成整枚坐标
- 呈现本次议题中的观念优先、条件优先或分层因果倾向，而不是固定人格结论
- 生成带原话证据和反证的三条临时读法
- 让用户选择“像我”“不像”“只在这里”或补充自己的反例
- 用“一位之差”思想实验只改变一个前提，观察结构如何变化
- 检查资源、身体、制度、技术与权力条件，避免把结构问题缩成个人心态
- 本地持久化会话、实验与反馈，并允许用户随时删除
- 在高风险表达出现时停止普通分析，转向即时安全提示
- 无 API Key 时完整运行本地确定性引擎；配置 DeepSeek 后会提炼开场议题，并在不改变问题结构的前提下动态生成候选回答

## 仓库边界

这个仓库现在只包含 Next.js 前端。独立后端位于 [philosophy_backend](https://github.com/0xWeakSheep/philosophy_backend)，负责 API、会话存储、本地推理规则与可选的模型调用。

本地工作区可以把后端仓库放在本仓库的 `philosophy_backend/` 目录中；该目录已经被前端 `.gitignore` 忽略，两个仓库可以分别提交、拉取和发布。

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

同时在独立后端仓库启动 API：

```bash
cd philosophy_backend
npm install
npm run dev
```

前端默认打开 [http://localhost:3000](http://localhost:3000)，并把 `/api/*` 重写到 `http://127.0.0.1:4000`。

生产验证：

```bash
npm run check
npm run build
npm start
```

## Vercel 部署

在 Vercel 中导入当前前端仓库，Framework Preset 选择 Next.js，构建命令和输出目录保持默认。配置：

```dotenv
BACKEND_API_URL=http://43.167.160.55
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

`BACKEND_API_URL` 只供 Next.js 服务端 rewrite 使用，不会暴露给浏览器，也不要写成 `NEXT_PUBLIC_BACKEND_API_URL`。浏览器继续请求 Vercel 同源的 `/api/*`，Vercel 再从服务端转发到后端，因此不会触发浏览器 CORS 或 HTTPS 页面直连 HTTP API 的混合内容限制。

Production 和 Preview 环境都应配置 `BACKEND_API_URL`。修改变量后需要重新部署；若 Vercel 构建时缺少它，构建会直接失败，避免生成一个看似成功但 API 全部不可用的站点。

DeepSeek Key、数据文件路径等变量只配置在后端服务器，不要放入 Vercel。知识库与后续 AI 能力也只在后端仓库演进。

## 工程结构

```text
src/app/                 Next.js 页面与 SEO 元数据
src/components/landing  首页和可交互产品演示
src/components/session  动态思想拓扑、四轮镜面与双轨回答体验
src/components/result   思想角色、生成式画像、世界观坐标、证据、反例与思想实验
src/lib                 前端使用的 256 型画像计算
design-system/          本项目的视觉原则与设计令牌
```

## 前端使用的接口

这些路径都由 `next.config.ts` 重写到独立后端：

| 方法 | 同源路径 | 用途 |
| --- | --- | --- |
| `POST` | `/api/sessions` | 创建探索 |
| `GET / DELETE` | `/api/sessions/:id` | 读取或删除探索 |
| `POST` | `/api/sessions/:id/messages` | 提交一次回答 |
| `POST` | `/api/sessions/:id/suggestions` | 结合当前问题刷新可编辑的候选回答 |
| `GET` | `/api/sessions/:id/result` | 获取结构化结果 |
| `POST` | `/api/sessions/:id/stance` | 修正或反驳一条读法 |
| `POST` | `/api/sessions/:id/experiment` | 运行一位之差实验 |
| `POST` | `/api/sessions/:id/feedback` | 提交边界反馈 |
| `GET` | `/api/health` | 健康检查 |

## 产品边界

意识形态镜室不是“唯心或唯物人格测试”，也不会推断政治立场、道德水平或固定人格。思想角色、人物画像、四位短码和“主义名”都是本次议题的可分享切片，不是永久身份。强调责任不自动等于唯心，看见资源与制度也不自动等于唯物。所有读法必须允许用户反驳；当表达涉及即时自伤、伤人或危险时，普通显影流程会停止。
