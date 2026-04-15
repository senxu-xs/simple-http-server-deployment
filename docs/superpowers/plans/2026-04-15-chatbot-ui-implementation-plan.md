# Chatbot UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `simple-agent-server` 添加嵌入式聊天 UI，用户可在浏览器对话框内与 agent 对话。

**Architecture:** 在 `server.js` 中新增 `GET /chat-ui` 路由，内联返回完整 HTML 页面（含 CSS/JS）。前端通过 `fetch` 调用现有 `POST /chat` 接口，渲染 Markdown 回复。

**Tech Stack:** 原生 Node.js HTTP + 内联 HTML/CSS/JS + marked.js CDN

---

## Task 1: 添加 `GET /chat-ui` 路由

**Files:**
- Modify: `server.js:36-79`

- [ ] **Step 1: 在 server.js 中添加 `/chat-ui` 路由**

在 `server.js` 的 `server.createServer` 回调中，在现有路由逻辑之后、404 之前插入以下路由：

```javascript
  if (req.method === 'GET' && url.pathname === '/chat-ui') {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Agent Chat</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; height: 100vh; display: flex; flex-direction: column; }
    .chat-header { background: #fff; border-bottom: 1px solid #e0e0e0; padding: 14px 20px; font-size: 16px; font-weight: 600; color: #333; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .message { display: flex; flex-direction: column; max-width: 70%; }
    .message.user { align-self: flex-end; }
    .message.agent { align-self: flex-start; }
    .message-label { font-size: 12px; color: #999; margin-bottom: 4px; padding: 0 4px; }
    .message-bubble { padding: 10px 14px; border-radius: 12px; line-height: 1.5; font-size: 14px; word-break: break-word; }
    .message.user .message-bubble { background: #e8f4fd; color: #1a1a1a; border-bottom-right-radius: 4px; }
    .message.agent .message-bubble { background: #fff; border: 1px solid #e0e0e0; border-bottom-left-radius: 4px; }
    .message-bubble pre { background: #f0f0f0; padding: 8px 12px; border-radius: 6px; overflow-x: auto; margin-top: 6px; font-size: 13px; }
    .message-bubble code { background: #f0f0f0; padding: 1px 5px; border-radius: 3px; font-size: 13px; }
    .message-bubble pre code { background: none; padding: 0; }
    .message-bubble ul, .message-bubble ol { padding-left: 20px; margin-top: 4px; }
    .message-bubble p + p { margin-top: 6px; }
    .typing-indicator { display: flex; gap: 4px; padding: 4px 0; }
    .typing-indicator span { width: 7px; height: 7px; background: #aaa; border-radius: 50%; animation: bounce 1.2s infinite; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
    .error-msg { color: #e53935; font-size: 13px; text-align: center; padding: 8px; }
    .chat-input-area { background: #fff; border-top: 1px solid #e0e0e0; padding: 14px 20px; display: flex; gap: 10px; }
    .chat-input-area textarea { flex: 1; resize: none; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px 14px; font-size: 14px; outline: none; line-height: 1.4; min-height: 42px; max-height: 120px; font-family: inherit; }
    .chat-input-area textarea:focus { border-color: #aaa; }
    .chat-input-area button { background: #1976d2; color: #fff; border: none; border-radius: 8px; padding: 0 20px; font-size: 14px; cursor: pointer; font-weight: 500; transition: background 0.2s; }
    .chat-input-area button:hover { background: #1565c0; }
    .chat-input-area button:disabled { background: #ccc; cursor: default; }
  </style>
</head>
<body>
  <div class="chat-header">Agent Chat</div>
  <div class="chat-messages" id="messages"></div>
  <div class="chat-input-area">
    <textarea id="input" rows="1" placeholder="输入消息，Enter 发送，Shift+Enter 换行"></textarea>
    <button id="sendBtn">发送</button>
  </div>
  <script>
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function appendMessage(role, content, isError) {
      const div = document.createElement('div');
      div.className = 'message ' + role;
      const label = document.createElement('div');
      label.className = 'message-label';
      label.textContent = role === 'user' ? '你' : 'Agent';
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';
      if (isError) {
        div.style.alignSelf = 'center';
        bubble.textContent = content;
      } else if (role === 'agent') {
        bubble.innerHTML = marked.parse(content);
      } else {
        bubble.textContent = content;
      }
      div.appendChild(label);
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollToBottom();
    }

    function showTyping() {
      const div = document.createElement('div');
      div.className = 'message agent';
      div.id = 'typing';
      const label = document.createElement('div');
      label.className = 'message-label';
      label.textContent = 'Agent';
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble typing-indicator';
      bubble.innerHTML = '<span></span><span></span><span></span>';
      div.appendChild(label);
      div.appendChild(bubble);
      messagesEl.appendChild(div);
      scrollToBottom();
    }

    function removeTyping() {
      const el = document.getElementById('typing');
      if (el) el.remove();
    }

    async function sendMessage() {
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      inputEl.style.height = 'auto';
      appendMessage('user', text);
      sendBtn.disabled = true;
      showTyping();
      try {
        const res = await fetch('/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        removeTyping();
        appendMessage('agent', data.reply || '');
      } catch (e) {
        removeTyping();
        appendMessage('agent', '网络错误，请检查服务器是否运行', true);
      } finally {
        sendBtn.disabled = false;
        inputEl.focus();
      }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
    inputEl.focus();
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
```

- [ ] **Step 2: 验证服务器启动正常**

Run: `node server.js`
Expected: 输出 `Server running at http://localhost:3000`

- [ ] **Step 3: 验证 `/chat-ui` 返回 HTML**

Run: `curl -s http://localhost:3000/chat-ui | head -5`
Expected: `<!DOCTYPE html>` 开头

- [ ] **Step 4: 提交**

```bash
git add server.js
git commit -m "feat: add embedded chat UI at GET /chat-ui

Inline HTML with dialog bubbles, typing indicator, markdown rendering.
Uses existing POST /chat endpoint.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
