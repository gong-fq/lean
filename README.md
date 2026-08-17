# ⊢ Lean 4 形式化推理学习平台

面向**没有形式化证明背景的高校教师、数学研究人员和普通科研人员**的 Lean 4 入门课程网站。
每一讲都遵循同一闭环：**概念 → 代码 → 证明 → 调试 → 练习 → AI 辅导**。

在线部署形态：一个纯静态 `index.html`（内含全部 12 讲课程内容与交互逻辑）+ 一个 Netlify
Function（`netlify/functions/lean.js`）作为 AI 辅导的后端代理。

## 目录结构

```
.
├── index.html                  # 全部前端内容（12 讲课程、习题、AI 辅导面板）
├── package.json
├── netlify.toml                 # Netlify 构建 / 函数 / 重定向配置
├── netlify/
│   └── functions/
│       └── lean.js              # AI 辅导后端：转发到大模型 API
└── README.md
```

## 课程大纲（12 讲）

1. 为什么是 Lean 4 —— AI 时代的形式化思维
2. 环境与基本语法（`#eval` / `#check` / `def`）
3. 类型与函数：函数式编程基础
4. 命题即类型：Curry-Howard 与项证明
5. 策略证明入门（`intro` / `exact` / `apply` / `rw`）
6. 逻辑联结词的证明（`And` / `Or` / `Not` / `Iff`）
7. 量词的证明（`∀` / `∃`，`use` / `obtain`）
8. 等式与计算证明（`calc` / `simp` / `unfold`）
9. 归纳类型与归纳证明（`inductive` / `induction`）
10. 结构体与类型类（`structure` / `class` / `instance`）
11. Mathlib 与自动化策略（`ring` / `linarith` / `omega` / `exact?`）
12. 综合实战：形式化一道教学定理

每讲含：概念讲解（简明）、可复制运行的示例代码、2 道练习题（含参考答案，默认折叠）、
跳转 [live.lean-lang.org](https://live.lean-lang.org) 在线验证代码的按钮，以及一个可向 AI
提问的辅导面板。学习进度保存在浏览器 `localStorage` 中（无需登录/后端数据库）。

> 说明：本平台不在服务器端运行真实的 Lean 4 工具链（完整工具链体积达数百 MB，不适合
> serverless 环境）。"证明→调试"环节由学员点击"在线运行"跳转到官方 Playground 完成真正的
> 类型检查；"AI 辅导"环节由 `lean.js` 调用大模型 API，负责讲解、纠错建议与思路启发。

## 部署到 Netlify

### 方式一：拖拽部署（最快）
1. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 把本项目整个文件夹拖进去即可（`netlify/functions/lean.js` 会被自动识别为 Function）

### 方式二：Git 部署（推荐，便于后续迭代）
1. 把本项目推送到一个 GitHub 仓库
2. 在 Netlify 后台 **Add new site → Import an existing project**，选择该仓库
3. Build command 留空或使用默认（`netlify.toml` 已声明 `publish = "."`）
4. 部署完成后，进入 **Site settings → Environment variables**，添加：

   | Key | Value |
   |---|---|
   | `DEEPSEEK_API_KEY` | 你的 DeepSeek API Key |

   （若改用 Anthropic Claude 或 OpenAI，只需修改 `netlify/functions/lean.js` 中
   `callModel()` 函数里的请求地址与请求体格式，并把环境变量名换成对应的 Key。）
5. 重新触发一次部署（Trigger deploy），使新的环境变量生效

### 本地开发/预览
```bash
npm install
npx netlify dev
```
`netlify dev` 会同时启动静态页面与本地 Functions 服务，`index.html` 中对
`/.netlify/functions/lean` 的请求会被自动代理到本地函数。

## 常用外部链接

- [Lean 4 官方在线 Playground](https://live.lean-lang.org/) —— 无需安装，浏览器内类型检查
- [Theorem Proving in Lean 4](https://leanprover.github.io/theorem_proving_in_lean4/) —— 官方权威教程
- [Mathlib4 文档](https://leanprover-community.github.io/mathlib4_docs/)
- [Lean Community 学习资源索引](https://leanprover-community.github.io/learn.html)

## 后续可扩展方向

- 把课程数据（`index.html` 中的 `CHAPTERS` 数组）拆分为独立 JSON/Markdown 文件，便于持续增补章节
- 接入用户账号系统，把 `localStorage` 进度改为云端存储
- 在 AI 辅导面板中加入"允许 AI 直接调用 Lean 类型检查"的能力（需要独立的、常驻的
  Lean 后端服务，而非本平台使用的轻量 serverless 架构）
