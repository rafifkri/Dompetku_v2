import { useState } from 'react';
import Modal from './Modal';
import { useFinance } from '../store';
import { useUI } from '../ui';
import { today, uid } from '../utils';

export default function TxForm({ edit, onClose }) {
  const { S, M, saveTx } = useFinance();
  const { toast } = useUI();
  const [er, setEr] = useState('');
  const [f, setF] = useState(() => {
    if (edit) return { ...edit };
    const c = Object.keys(S.cats.expense)[0];
    return { type: 'expense', amount: '', cat: c, sub: S.cats.expense[c].s[0] || '', date: today().startsWith(M) ? today() : M + '-01', desc: '', method: 'Cash' };
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setType = (t) => { const c = Object.keys(S.cats[t])[0]; setF((p) => ({ ...p, type: t, cat: c, sub: S.cats[t][c].s[0] || '' })); };
  const setCat = (c) => setF((p) => ({ ...p, cat: c, sub: S.cats[p.type][c]?.s[0] || '' }));

  const cats = Object.keys(S.cats[f.type]); if (!cats.includes(f.cat)) cats.unshift(f.cat);
  const subs = [...(S.cats[f.type][f.cat]?.s || [])]; if (f.sub && !subs.includes(f.sub)) subs.unshift(f.sub);

  const submit = async (e) => {
    e.preventDefault();
    const amount = Math.round(+f.amount);
    if (!(amount > 0)) return setEr('Nominal harus lebih dari 0.');
    if (!f.date) return setEr('Pilih tanggal.');
    const r = { ...f, amount, id: edit ? edit.id : uid(), ts: edit ? edit.ts : Date.now(), desc: f.desc.trim() };
    try { await saveTx(r); toast(edit ? 'Transaksi diperbarui' : 'Transaksi tersimpan'); onClose(); }
    catch { setEr('Gagal menyimpan ke server.'); }
  };

  return (
    <Modal onClose={() => onClose()}>
      <form onSubmit={submit}>
        <h2>{edit ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
        <div className="seg">
          <button type="button" className={'o' + (f.type === 'expense' ? ' on' : '')} onClick={() => setType('expense')}>Pengeluaran</button>
          <button type="button" className={'i' + (f.type === 'income' ? ' on' : '')} onClick={() => setType('income')}>Pemasukan</button>
        </div>
        <label>Nominal (Rp)</label>
        <input type="number" min="1" step="1" inputMode="numeric" placeholder="25000" value={f.amount} onChange={(e) => set('amount', e.target.value)} required />
        <label>Kategori</label>
        <select value={f.cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select>
        <label>Subkategori</label>
        <select value={f.sub} onChange={(e) => set('sub', e.target.value)}>{subs.length ? subs.map((s) => <option key={s}>{s}</option>) : <option value="">—</option>}</select>
        <label>Tanggal</label>
        <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} required />
        <label>Nama kegiatan / deskripsi</label>
        <input maxLength={120} placeholder="mis. Nonton bareng, beli sayur" value={f.desc} onChange={(e) => set('desc', e.target.value)} />
        <label>Metode pembayaran</label>
        <select value={f.method} onChange={(e) => set('method', e.target.value)}>{['Cash','Transfer','E-Wallet','Lainnya'].map((m) => <option key={m}>{m}</option>)}</select>
        <p className="out sub">{er}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button type="button" className="btn g" onClick={() => onClose()}>Batal</button>
          <button className="btn">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
