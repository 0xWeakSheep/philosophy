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

## 本地运行

需要 Node.js 20.9 或更高版本。

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

生产验证：

```bash
npm run check
npm run build
npm start
```

## Vercel 前端 + 自托管后端

项目仍保持同一套 Next.js 代码，但可以把浏览器页面部署到 Vercel，并把 `/api/*` 交给独立服务器。Vercel 项目需要配置：

```dotenv
BACKEND_API_URL=http://your-backend-origin
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
```

`BACKEND_API_URL` 只在 Vercel 构建与代理层使用，不会暴露给浏览器。前端继续请求同源 `/api/*`，Vercel 会在服务器侧转发到后端，因此不需要在浏览器里配置 CORS，也不会触发 HTTPS 页面请求 HTTP API 的混合内容限制。修改环境变量后需要重新部署一次。

DeepSeek Key、数据文件路径等后端变量只配置在自托管服务器，不要重复放入 Vercel 前端环境。

## 可选的语言模型

复制环境变量示例，然后填入自己的 Key：

```bash
cp .env.example .env.local
```

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
MIRROR_DATA_FILE=.data/mirror-sessions.json
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

语言模型负责把开场草稿改写得更贴近用户原话，并为当前问题生成一组可编辑的回答起点。问题维度、安全检查、会话状态、结果结构和即时回退都由服务端控制；候选生成失败时会继续显示本地候选，因此不配置 Key 也能走通全部功能。

## 工程结构

```text
src/app/                 Next.js 页面与 Route Handlers
src/components/landing  首页和可交互产品演示
src/components/session  动态思想拓扑、四轮镜面与双轨回答体验
src/components/result   思想角色、生成式画像、世界观坐标、证据、反例与思想实验
src/lib/domain          领域模型、256 型档案、安全检查和本地推理引擎
src/lib/server          JSON 存储、服务层与可选模型提供器
design-system/          本项目的视觉原则与设计令牌
```

会话默认写入 `.data/mirror-sessions.json`。写入采用串行队列和临时文件原子替换，数据文件不会进入 Git。

## 主要接口

| 方法 | 路径 | 用途 |
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
