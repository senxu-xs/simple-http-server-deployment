const http = require('http');

const port = process.env.PORT || 3000;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function reply(message) {
  const text = String(message || '').trim().toLowerCase();

  if (!text) {
    return '你好，我是一个简单的 agent，对我说点什么。';
  }

  if (text.includes('你好') || text.includes('hello') || text.includes('hi')) {
    return '你好，我是简单对话机器人。';
  }

  if (text.includes('你是谁')) {
    return '我是一个基于 HTTP 接口的简单 agent。';
  }

  if (text.includes('help') || text.includes('帮助')) {
    return '你可以试试：你好、你是谁、今天天气怎么样。';
  }

  if (text.includes('天气')) {
    return '我还不会查实时天气，但今天天气应该适合写代码。';
  }

  return `你刚才说的是：${message}`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/') {
    return sendJson(res, 200, {
      name: 'simple-agent',
      endpoints: {
        health: 'GET /health',
        chatGet: 'GET /chat?message=你好',
        chatPost: 'POST /chat {"message":"你好"}'
      }
    });
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/chat') {
    const message = url.searchParams.get('message') || '';
    return sendJson(res, 200, { reply: reply(message) });
  }

  if (req.method === 'POST' && url.pathname === '/chat') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        return sendJson(res, 200, { reply: reply(parsed.message) });
      } catch {
        return sendJson(res, 400, { error: '请求体必须是 JSON' });
      }
    });

    return;
  }

  return sendJson(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
