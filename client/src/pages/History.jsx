import { useMemo, useState } from 'react';
import { useFinance } from '../store';
import { useUI } from '../ui';
import TxRow from '../components/TxRow';
import { rp, srt } from '../utils';

export default function History({ openEdit }) {
  const { S, monthTx, delTx } = useFinance();
  const { ask, toast } = useUI();
  const [q, setQ] = useState(''), [type, setType] = useState(''), [cat, setCat] = useState(''), [all, setAll] = useState('0');
  const cats = [...new Set([...Object.keys(S.cats.expense), ...Object.keys(S.cats.income)])];

  const rows = useMemo(() => (all === '1' ? S.tx : monthTx)
    .filter((t) => (!type || t.type === type) && (!cat || t.cat === cat) && (!q || `${t.desc} ${t.cat} ${t.sub}`.toLowerCase().includes(q.toLowerCase())))
    .sort(srt), [S.tx, monthTx, all, type, cat, q]);
  const o = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const e = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const remove = async (id) => {
    if ((await ask('Hapus transaksi ini?', '', true)) === null) return;
    try { await delTx(id); toast('Transaksi dihapus'); } catch { toast('Gagal menghapus di server'); }
  };

  return (
    <div className="card">
      <div className="filters">
        <input placeholder="Cari nama / deskripsi" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={all} onChange={(e) => setAll(e.target.value)}><option value="0">Bulan terpilih</option><option value="1">Semua bulan</option></select>
        <select value={type} onChange={(e) => setType(e.target.value)}><option value="">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select>
        <select value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Semua kategori</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="sub" style={{ marginBottom: 6 }}>{rows.length} transaksi · <span className="in">+{rp(o)}</span> · <span className="out">−{rp(e)}</span></div>
      {rows.length ? rows.map((t) => <TxRow key={t.id} t={t} onEdit={openEdit} onDelete={remove} />) : <div className="empty">Tidak ada transaksi yang cocok</div>}
    </div>
  );
}
