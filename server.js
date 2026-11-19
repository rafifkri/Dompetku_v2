// Dompetku - backend REST API (Express) + database (SQLite)
const express = require('express');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'dompetku.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
if (db.pragma('user_version', { simple: true }) < 2) {
  db.exec('DROP TABLE IF EXISTS transactions; DROP TABLE IF EXISTS kv; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS users;');
  db.pragma('user_version = 2');
}
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  cat TEXT NOT NULL,
  sub TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  desc TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'Cash',
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, date);
CREATE TABLE IF NOT EXISTS kv (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);
`);

const getKV = (userId, k, fallback) => {
  const r = db.prepare('SELECT value FROM kv WHERE user_id=? AND key=?').get(userId, k);
  return r ? JSON.parse(r.value) : fallback;
};
const setKV = (userId, k, v) =>
  db.prepare('INSERT INTO kv(user_id,key,value) VALUES(?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=excluded.value')
    .run(userId, k, JSON.stringify(v));

const UPSERT = db.prepare(`INSERT INTO transactions(user_id,id,ts,type,amount,cat,sub,date,desc,method)
  VALUES(@userId,@id,@ts,@type,@amount,@cat,@sub,@date,@desc,@method)
  ON CONFLICT(user_id,id) DO UPDATE SET type=@type,amount=@amount,cat=@cat,sub=@sub,date=@date,desc=@desc,method=@method`);

function clean(t) {
  const amount = Math.round(Number(t.amount));
  if (!t || typeof t.id !== 'string' || !t.id) throw new Error('ID tidak valid');
  if (!['income', 'expense'].includes(t.type)) throw new Error('Jenis transaksi tidak valid');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Nominal harus lebih dari 0');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t.date)) throw new Error('Tanggal tidak valid');
  if (!t.cat) throw new Error('Kategori wajib diisi');
  return {
    id: t.id, ts: Number(t.ts) || Date.now(), type: t.type, amount, cat: String(t.cat),
    sub: String(t.sub || ''), date: t.date, desc: String(t.desc || '').slice(0, 120),
    method: String(t.method || 'Cash'),
  };
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// GitHub Pages hosts the frontend on a different origin than this API.
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', allowedOrigin);
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Opsional: proteksi password sederhana. Jalankan dengan APP_PASSWORD=rahasia
if (process.env.APP_PASSWORD) {
  app.use((req, res, next) => {
    const h = req.headers.authorization || '';
    const pass = Buffer.from(h.split(' ')[1] || '', 'base64').toString().split(':').slice(1).join(':');
    if (pass === process.env.APP_PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="Dompetku"').status(401).send('Login diperlukan');
  });
}

const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
const passwordHash = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(password, salt, 64).toString('hex');
};
const passwordMatches = (password, stored) => {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
};
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, bio: u.bio, photo: u.photo });
const createSession = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)')
    .run(hash(token), userId, Date.now() + 1000 * 60 * 60 * 24 * 30);
  return token;
};
const requireAuth = (req, res, next) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const session = token && db.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash(token), Date.now());
  if (!session) return res.status(401).json({ error: 'Login diperlukan' });
  req.user = session;
  next();
};

app.get('/health', (req, res) => res.json({ ok: true }));
app.post('/api/auth/register', (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) throw new Error('Data akun tidak valid');
    const result = db.prepare('INSERT INTO users(email,password_hash,name,created_at) VALUES(?,?,?,?)').run(email, passwordHash(password), name, Date.now());
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
    res.status(201).json({ token: createSession(user.id), user: publicUser(user) });
  } catch (e) { res.status(400).json({ error: e.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email sudah terdaftar' : e.message }); }
});
app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !passwordMatches(String(req.body.password || ''), user.password_hash)) return res.status(401).json({ error: 'Email atau password salah' });
  res.json({ token: createSession(user.id), user: publicUser(user) });
});
app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(token));
  res.json({ ok: true });
});
app.use('/api', requireAuth);
app.get('/api/profile', (req, res) => res.json(publicUser(req.user)));
app.put('/api/profile', (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const bio = String(req.body.bio || '').slice(0, 500);
  const photo = String(req.body.photo || '');
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || (photo && !photo.startsWith('data:image/'))) return res.status(400).json({ error: 'Profil tidak valid' });
  try {
    db.prepare('UPDATE users SET name=?,email=?,bio=?,photo=? WHERE id=?').run(name, email, bio, photo, req.user.id);
    res.json(publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)));
  } catch (e) { res.status(400).json({ error: e.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'Email sudah digunakan' : e.message }); }
});

// Frontend React hasil build (jalankan: npm run build)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Ambil seluruh data
app.get('/api/data', (req, res) => {
  res.json({
    tx: db.prepare('SELECT id,ts,type,amount,cat,sub,date,desc,method FROM transactions WHERE user_id=? ORDER BY date DESC, ts DESC').all(req.user.id),
    saldoAwal: getKV(req.user.id, 'saldoAwal', 0),
    budget: getKV(req.user.id, 'budget', {}),
    cats: getKV(req.user.id, 'cats', null),
  });
});

// Tambah / edit transaksi
app.post('/api/tx', (req, res) => {
  try { UPSERT.run({ ...clean(req.body), userId: req.user.id }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Hapus transaksi
app.delete('/api/tx/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE user_id=? AND id=?').run(req.user.id, req.params.id);
  res.json({ ok: true });
});

// Simpan saldo awal, budget, dan kategori
app.put('/api/settings', (req, res) => {
  const { saldoAwal, budget, cats } = req.body || {};
  db.transaction(() => {
    setKV(req.user.id, 'saldoAwal', Math.max(0, Number(saldoAwal) || 0));
    setKV(req.user.id, 'budget', budget || {});
    if (cats) setKV(req.user.id, 'cats', cats);
  })();
  res.json({ ok: true });
});

// Ganti nama kategori di semua transaksi lama
app.post('/api/rename', (req, res) => {
  const { type, from, to } = req.body || {};
  if (!type || !from || !to) return res.status(400).json({ error: 'Data tidak lengkap' });
  db.prepare('UPDATE transactions SET cat=? WHERE user_id=? AND type=? AND cat=?').run(to, req.user.id, type, from);
  res.json({ ok: true });
});

// Restore / reset seluruh data
app.post('/api/restore', (req, res) => {
  try {
    const d = req.body;
    if (!d || !Array.isArray(d.tx) || !d.cats) throw new Error('Format backup tidak valid');
    const rows = d.tx.map(clean);
    db.transaction(() => {
      db.prepare('DELETE FROM transactions WHERE user_id=?').run(req.user.id);
      rows.forEach((r) => UPSERT.run({ ...r, userId: req.user.id }));
      setKV(req.user.id, 'saldoAwal', Number(d.saldoAwal) || 0);
      setKV(req.user.id, 'budget', d.budget || {});
      setKV(req.user.id, 'cats', d.cats);
    })();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Unduh backup JSON & laporan CSV
app.get('/api/backup.json', (req, res) => {
  res.attachment('dompetku-backup.json').json({
    tx: db.prepare('SELECT id,ts,type,amount,cat,sub,date,desc,method FROM transactions WHERE user_id=? ORDER BY date DESC').all(req.user.id),
    saldoAwal: getKV(req.user.id, 'saldoAwal', 0), budget: getKV(req.user.id, 'budget', {}), cats: getKV(req.user.id, 'cats', {}),
  });
});
app.get('/api/export.csv', (req, res) => {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = db.prepare('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC, ts DESC').all(req.user.id);
  const csv = ['Tanggal,Jenis,Kategori,Subkategori,Deskripsi,Metode,Nominal']
    .concat(rows.map((t) => [t.date, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.cat, t.sub, t.desc, t.method, t.amount].map(q).join(',')))
    .join('\n');
  res.attachment('laporan-keuangan.csv').type('text/csv').send('\uFEFF' + csv);
});

app.listen(PORT, () => console.log(`Dompetku berjalan di http://localhost:${PORT}`));
