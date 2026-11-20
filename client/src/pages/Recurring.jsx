import { useState } from 'react';
import { useFinance } from '../store';
import { useUI } from '../ui';
import { rp, uid } from '../utils';

export default function Recurring() {
  const { S, upd } = useFinance();
  const { toast } = useUI();
  const firstCat = Object.keys(S.cats.expense)[0];
  const [form, setForm] = useState({ desc: '', amount: '', type: 'expense', cat: firstCat, day: '1' });
  const cats = Object.keys(S.cats[form.type]);
  const add = (e) => {
    e.preventDefault();
    const amount = Math.round(+form.amount), day = Math.max(1, Math.min(28, +form.day || 1));
    if (!form.desc.trim() || !(amount > 0)) return;
    upd((p) => ({ ...p, recurring: [...(p.recurring || []), { id: uid(), desc: form.desc.trim(), amount, type: form.type, cat: form.cat, sub: S.cats[form.type][form.cat]?.s?.[0] || '', day, active: true, lastRun: '' }] }));
    setForm({ ...form, desc: '', amount: '' });
    toast('Transaksi berulang ditambahkan');
  };
  const toggle = (id) => upd((p) => ({ ...p, recurring: (p.recurring || []).map((r) => r.id === id ? { ...r, active: !r.active } : r) }));
  const remove = (id) => upd((p) => ({ ...p, recurring: (p.recurring || []).filter((r) => r.id !== id) }));
  return (
    <div className="grid g2">
      <form className="card" onSubmit={add}>
        <h2>Transaksi Berulang</h2><p className="sub">Siapkan tagihan atau pemasukan bulanan agar tidak lupa dicatat.</p>
        <label>Nama transaksi<input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Tagihan internet" required /></label>
        <div className="seg"><button type="button" className={'o' + (form.type === 'expense' ? ' on' : '')} onClick={() => setForm({ ...form, type: 'expense', cat: Object.keys(S.cats.expense)[0] })}>Pengeluaran</button><button type="button" className={'i' + (form.type === 'income' ? ' on' : '')} onClick={() => setForm({ ...form, type: 'income', cat: Object.keys(S.cats.income)[0] })}>Pemasukan</button></div>
        <label>Nominal<input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="250000" required /></label>
        <label>Kategori<select value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })}>{cats.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Tanggal setiap bulan<input type="number" min="1" max="28" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} /></label>
        <button className="btn" type="submit">Tambah jadwal</button>
      </form>
      <div className="card"><h2>Jadwal Aktif</h2>
        {(S.recurring || []).length ? S.recurring.map((r) => <div className="recurring-item" key={r.id}><div><b>{r.desc}</b><span>{rp(r.amount)} · setiap tanggal {r.day}</span></div><div><button className="btn g s" type="button" onClick={() => toggle(r.id)}>{r.active ? 'Aktif' : 'Nonaktif'}</button><button className="icon-btn" type="button" onClick={() => remove(r.id)} aria-label={`Hapus ${r.desc}`}>×</button></div></div>) : <div className="empty">Belum ada transaksi berulang.</div>}
      </div>
    </div>
  );
}
