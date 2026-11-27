// Oddiy server: sayt fayllarini beradi va aloqa formasini Telegram botga yuboradi.
// Hech qanday qo'shimcha kutubxona kerak emas (faqat Node.js 18+).
const http = require('http');
const fs = require('fs');
const path = require('path');

// ---- .env faylini o'qish ----
try {
  const lines = fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#') && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
} catch (e) { /* .env topilmasa, tizim o'zgaruvchilari ishlatiladi */ }

const { BOT_TOKEN, CHAT_ID } = process.env;
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon'
};

// Spamdan himoya: bitta IP dan daqiqada 3 ta xabar
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now); hits.set(ip, list);
  return list.length > 3;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

async function handleContact(req, res) {
  let body = '';
  req.on('data', c => { body += c; if (body.length > 20000) req.destroy(); });
  req.on('end', async () => {
    let data;
    try { data = JSON.parse(body); } catch { return json(res, 400, { ok: false, error: "Noto'g'ri so'rov." }); }

    if (data.website) return json(res, 200, { ok: true }); // yashirin maydon: bot-spam

    const name = String(data.name || '').trim().slice(0, 80);
    const contact = String(data.contact || '').trim().slice(0, 100);
    const message = String(data.message || '').trim().slice(0, 2000);
    if (!name || !message) return json(res, 400, { ok: false, error: 'Ism va xabarni yozing.' });

    if (tooMany(req.socket.remoteAddress)) {
      return json(res, 429, { ok: false, error: "Juda tez-tez yubordingiz. Bir daqiqadan so'ng urinib ko'ring." });
    }
    if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN.startsWith('BotFather') || CHAT_ID.startsWith('sizning')) {
      console.error('.env faylida BOT_TOKEN va CHAT_ID to\'ldirilmagan!');
      return json(res, 500, { ok: false, error: 'Server sozlanmagan. Keyinroq urinib ko\'ring.' });
    }

    const text =
      `📩 <b>Saytdan yangi xabar</b>\n\n` +
      `👤 <b>Ism:</b> ${esc(name)}\n` +
      `📞 <b>Aloqa:</b> ${esc(contact || "ko'rsatilmagan")}\n\n` +
      `💬 ${esc(message)}`;

    try {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
      });
      const result = await r.json();
      if (!result.ok) {
        console.error('Telegram xatosi:', result.description);
        return json(res, 502, { ok: false, error: "Xabarni yuborib bo'lmadi. Keyinroq urinib ko'ring." });
      }
      json(res, 200, { ok: true });
    } catch (e) {
      console.error('Tarmoq xatosi:', e.message);
      json(res, 502, { ok: false, error: "Telegramga ulanib bo'lmadi." });
    }
  });
}

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const file = path.normalize(path.join(PUBLIC, urlPath));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, content) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Topilmadi'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(content);
  });
}

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/contact') return handleContact(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end();
}).listen(PORT, () => console.log(`Sayt ishlayapti: http://localhost:${PORT}`));
