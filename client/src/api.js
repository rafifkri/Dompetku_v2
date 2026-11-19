// Dua mode:
//  - Normal  : memanggil backend Express (/api/...)
//  - Statis  : (VITE_STATIC=true, mis. GitHub Pages) meniru API yang sama memakai localStorage browser
export const STATIC = import.meta.env.VITE_STATIC === 'true';

const KEY = 'dompetku_static_v1';
const read = () => {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.tx)) return d; } catch { /* abaikan */ }
  return { tx: [], saldoAwal: 0, budget: {}, cats: null };
};

function local(url, method, b) {
  const d = read();
  if (url === '/api/data' && method === 'GET') return d;
  if (url === '/api/tx' && method === 'POST') {
    const amount = Math.round(Number(b.amount));
    if (!b.id || !['income', 'expense'].includes(b.type) || !(amount > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !b.cat) throw new Error('Data tidak valid');
    const r = { ...b, amount }, i = d.tx.findIndex((t) => t.id === r.id);
    if (i >= 0) d.tx[i] = r; else d.tx.push(r);
  } else if (url.startsWith('/api/tx/') && method === 'DELETE') {
    const id = decodeURIComponent(url.slice(8)); d.tx = d.tx.filter((t) => t.id !== id);
  } else if (url === '/api/settings' && method === 'PUT') {
    d.saldoAwal = Math.max(0, Number(b.saldoAwal) || 0); d.budget = b.budget || {}; if (b.cats) d.cats = b.cats;
  } else if (url === '/api/rename' && method === 'POST') {
    d.tx = d.tx.map((t) => (t.type === b.type && t.cat === b.from ? { ...t, cat: b.to } : t));
  } else if (url === '/api/restore' && method === 'POST') {
    Object.assign(d, { tx: b.tx, saldoAwal: b.saldoAwal || 0, budget: b.budget || {}, cats: b.cats });
  } else throw new Error('Endpoint tidak dikenal');
  localStorage.setItem(KEY, JSON.stringify(d));
  return { ok: true };
}

export const api = (url, method = 'GET', body) =>
  STATIC
    ? Promise.resolve().then(() => local(url, method, body))
    : fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
        .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
