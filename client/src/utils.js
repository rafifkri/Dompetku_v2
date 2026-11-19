export const rp = (n) => (n < 0 ? '-' : '') + 'Rp' + Math.round(Math.abs(n)).toLocaleString('id-ID');
export const BLN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const daysIn = (M) => { const [y, m] = M.split('-').map(Number); return new Date(y, m, 0).getDate(); };
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
export const sum = (a, type) => a.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
export const srt = (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0);
export const icon = (cats, type, cat) => cats[type]?.[cat]?.i || (type === 'income' ? '💰' : '📦');
export const PAL = ['#10b981','#3b82f6','#f0624d','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#64748b'];

// Ekspor di sisi browser (dipakai di mode normal maupun mode statis)
export const toCSV = (tx) => '\uFEFF' + ['Tanggal,Jenis,Kategori,Subkategori,Deskripsi,Metode,Nominal']
  .concat([...tx].sort(srt).map((t) => [t.date, t.type === 'income' ? 'Pemasukan' : 'Pengeluaran', t.cat, t.sub, t.desc, t.method, t.amount]
    .map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','))).join('\n');
export const download = (name, text, mime) => {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
