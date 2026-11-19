// Dompetku - backend REST API (Express) + database (SQLite)
const express = require('express');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'dompetku.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  cat TEXT NOT NULL,
  sub TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  desc TEXT NOT NULL DEFAULT '',
  method TEXT NOT NULL DEFAULT 'Cash'
);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);

const getKV = (k, fallback) => {
  const r = db.prepare('SELECT value FROM kv WHERE key=?').get(k);
  return r ? JSON.parse(r.value) : fallback;
};
const setKV = (k, v) =>
  db.prepare('INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(k, JSON.stringify(v));

const UPSERT = db.prepare(`INSERT INTO transactions(id,ts,type,amount,cat,sub,date,desc,method)
  VALUES(@id,@ts,@type,@amount,@cat,@sub,@date,@desc,@method)
  ON CONFLICT(id) DO UPDATE SET type=@type,amount=@amount,cat=@cat,sub=@sub,date=@date,desc=@desc,method=@method`);

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

// Opsional: proteksi password sederhana. Jalankan dengan APP_PASSWORD=rahasia
if (process.env.APP_PASSWORD) {
  app.use((req, res, next) => {
    const h = req.headers.authorization || '';
    const pass = Buffer.from(h.split(' ')[1] || '', 'base64').toString().split(':').slice(1).join(':');
    if (pass === process.env.APP_PASSWORD) return next();
    res.set('WWW-Authenticate', 'Basic realm="Dompetku"').status(401).send('Login diperlukan');
  });
}

// Frontend React hasil build (jalankan: npm run build)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Ambil seluruh data
app.get('/api/data', (req, res) => {
  res.json({
    tx: db.prepare('SELECT * FROM transactions ORDER BY date DESC, ts DESC').all(),
    saldoAwal: getKV('saldoAwal', 0),
    budget: getKV('budget', {}),
    cats: getKV('cats', null),
  });
});

// Tambah / edit transaksi
app.post('/api/tx', (req, res) => {
  try { UPSERT.run(clean(req.body)); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Hapus transaksi
app.delete('/api/tx/:id', (req, res) => {
  db.prepare('DELETE FROM transactions WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Simpan saldo awal, budget, dan kategori
app.put('/api/settings', (req, res) => {
  const { saldoAwal, budget, cats } = req.body || {};
  db.transaction(() => {
    setKV('saldoAwal', Math.max(0, Number(saldoAwal) || 0));
    setKV('budget', budget || {});
    if (cats) setKV('cats', cats);
  })();
  res.json({ ok: true });
});

// Ganti nama kategori di semua transaksi lama
app.post('/api/rename', (req, res) => {
  const { type, from, to } = req.body || {};
  if (!type || !from || !to) return res.status(400).json({ error: 'Data tidak lengkap' });
  db.prepare('UPDATE transactions SET cat=? WHERE type=? AND cat=?').run(to, type, from);
  res.json({ ok: true });
});

// Restore / reset seluruh data
app.post('/api/restore', (req, res) => {
  try {
    const d = req.body;
    if (!d || !Array.isArray(d.tx) || !d.cats) throw new Error('Format backup tidak valid');
    const rows = d.tx.map(clean);
    db.transaction(() => {
      db.prepare('DELETE FROM transactions').run();
      rows.forEach((r) => UPSERT.run(r));
      setKV('saldoAwal', Number(d.saldoAwal) || 0);
      setKV('budget', d.budget || {});
      setKV('cats', d.cats);
    })();
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Unduh backup JSON & laporan CSV
app.get('/api/backup.json', (req, res) => {
  res.attachment('dompetku-backup.json').json({
    tx: db.prepare('SELECT * FROM transactions ORDER BY date DESC').all(),
    saldoAwal: getKV('saldoAwal', 0), budget: getKV('budget', {}), cats: getKV('cats', {}),
  });
});
app.get('/api/export.csv', (req, res) => {
  const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC, ts DESC').all();
  const csv = ['Tanggal,Jenis,Kategori,Subkategori,Deskripsi,Metode,Nominal']
    .concat(rows.map((t) => [t.date, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.cat, t.sub, t.desc, t.method, t.amount].map(q).join(',')))
    .join('\n');
  res.attachment('laporan-keuangan.csv').type('text/csv').send('\uFEFF' + csv);
});

app.listen(PORT, () => console.log(`Dompetku berjalan di http://localhost:${PORT}`));
