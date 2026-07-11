# 意识形态镜室

一个以哲学追问为方法的自我探索产品。它不做人设测评，也不急着给答案，而是把用户原话中的默认规则、不可退让之物、经验方式和行动方向逐步显影，并始终保留一扇观察外部现实的窗。

## 现在可以做什么

- 从一件具体、反复发生的事开始，完成 4 至 5 个单问题追问
- 生成带原话证据和反证的三条临时读法
- 让用户选择“像我”“不像”“只在这里”或补充自己的反例
- 用“一位之差”思想实验只改变一个前提，观察结构如何变化
- 检查现实边界、权力差与外部约束，避免把一切都内化
- 本地持久化会话、实验与反馈，并允许用户随时删除
- 在高风险表达出现时停止普通分析，转向即时安全提示
- 无 API Key 时完整运行本地确定性引擎；配置 DeepSeek 后仅优化追问措辞，失败会自动回退

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

语言模型只负责把本地草稿改写得更贴近用户原话。安全检查、会话状态、结果结构和回退逻辑都在服务端完成，因此不配置 Key 也能走通全部功能。

## 工程结构

```text
src/app/                 Next.js 页面与 Route Handlers
src/components/landing  首页和可交互产品演示
src/components/session  四轮镜面显影体验
src/components/result   证据、反例、思想实验与反馈
src/lib/domain          领域模型、安全检查和本地推理引擎
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
| `GET` | `/api/sessions/:id/result` | 获取结构化结果 |
| `POST` | `/api/sessions/:id/stance` | 修正或反驳一条读法 |
| `POST` | `/api/sessions/:id/experiment` | 运行一位之差实验 |
| `POST` | `/api/sessions/:id/feedback` | 提交边界反馈 |
| `GET` | `/api/health` | 健康检查 |

## 产品边界

意识形态镜室不是心理治疗、临床诊断、人格测评或危机干预工具。所有读法只绑定当前议题，必须允许用户反驳；当表达涉及即时自伤、伤人或危险时，普通显影流程会停止。
