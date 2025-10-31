const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_PATH = path.join(__dirname, 'submissions.csv');

app.use(express.json());

// 简单的 CORS 允许（如果页面从其他源请求）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 提供静态文件（所以直接访问 http://localhost:3000/index.html 即可）
app.use(express.static(path.join(__dirname)));

// 确保 CSV 文件存在并写入表头（如果还没写的话）
function ensureCsvHeader() {
  if (!fs.existsSync(CSV_PATH)) {
    const header = 'timestamp,name,email,phone,q1,q2,ua,ip\n';
    fs.writeFileSync(CSV_PATH, header, { encoding: 'utf8' });
  }
}

app.post('/submit', (req, res) => {
  try {
    ensureCsvHeader();
    const { name = '', email = '', phone = '', q1 = '', q2 = '', ua = '' } = req.body || {};
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';
    const ts = new Date().toISOString();
    // 简单 CSV 转义（将逗号和换行替换）
    const esc = v => '"' + String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
    const line = [ts, esc(name), esc(email), esc(phone), esc(q1), esc(q2), esc(ua), esc(ip)].join(',') + '\n';
    fs.appendFile(CSV_PATH, line, err => {
      if (err) {
        console.error('写入 CSV 失败', err);
        return res.status(500).json({ ok: false, error: '写入失败' });
      }
      res.json({ ok: true });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: '服务器异常' });
  }
});

app.listen(PORT, () => {
  ensureCsvHeader();
  console.log(`Server started at http://localhost:${PORT}`);
});
