# 聊天机器人 UI 设计

## 概述

为现有的 `simple-agent-server` 添加嵌入式浏览器聊天界面，让用户可以在对话框内与 agent 对话。

## 技术选型

| 决策 | 选择 |
|------|------|
| 布局 | 嵌入式对话框（页面内嵌入聊天区域） |
| 风格 | 简洁现代（白色/浅灰背景，细线条边框） |
| 嵌入方式 | 单文件 HTML，路由返回（不依赖静态文件服务） |
| 功能范围 | 对话气泡、Markdown 渲染、打字指示器 |

## 架构

```
server.js
  └── GET  /chat-ui      → 返回聊天 HTML 页面（内联 JS/CSS）
  └── POST /chat         → 接收 { message }，返回 { reply }
  └── GET  /chat         → 保留（query 参数方式）

浏览器
  └── fetch POST /chat { message }
  └── 收到回复后渲染 Markdown + 打字动画
```

## 功能详情

### 1. 路由
- `GET /chat-ui` — 返回完整 HTML 页面（状态码 200，Content-Type: text/html）
- 现有 `/chat` POST 接口保持不变，无需修改

### 2. HTML 页面结构
- 顶部：标题栏（"Agent Chat"）
- 中间：消息列表区域（flex-grow，滚动）
- 底部：输入区（textarea + 发送按钮）
- 对话框固定在页面内，高度约 500px

### 3. 对话气泡
- 用户消息：右对齐，浅蓝色背景（#e8f4fd），深色文字
- Agent 消息：左对齐，白色背景，灰色边框
- 每条消息显示发送者标签（"你" / "Agent"）

### 4. 打字指示器
- Agent 回复前，在消息列表底部显示动画点（... 循环动画）
- 请求完成后动画消失，替换为实际回复

### 5. Markdown 渲染
- 使用 `marked` 库（CDN）将 Agent 回复转为 HTML
- 支持：粗体、斜体、代码块（` `` `）、无序列表
- 代码块渲染为 `<pre><code>` 样式（灰色背景，monospace 字体）

### 6. 交互逻辑
- Enter 发送消息，Shift+Enter 换行
- 发送时清空输入框，追加用户消息到列表
- 请求失败时显示错误提示

### 7. 错误处理
- 网络错误：追加一条红色错误提示消息
- 空输入：不发送

## 文件变更

| 文件 | 操作 |
|------|------|
| `server.js` | 新增 `GET /chat-ui` 路由，内联 HTML 页面 |
| `package.json` | 无变更（不引入新依赖） |
| `docs/superpowers/specs/2026-04-15-chatbot-ui-design.md` | 本文档 |

## 访问方式

启动服务器后，浏览器访问 `http://localhost:3000/chat-ui`
