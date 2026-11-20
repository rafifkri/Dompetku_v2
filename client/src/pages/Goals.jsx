import { useState } from 'react';
import { useFinance } from '../store';
import { useUI } from '../ui';
import { formatAmount, parseAmount, rp, uid } from '../utils';
import Icon from '../components/Icon';
import trashIcon from '../assets/icons/sampah.png';
import editIcon from '../assets/icons/edit.png';

export default function Goals() {
  const { S, upd } = useFinance();
  const { toast } = useUI();
  const [form, setForm] = useState({ name: '', target: '', saved: '', deadline: '' });
  const [editing, setEditing] = useState('');
  const goals = S.goals || [];
  const add = (e) => {
    e.preventDefault();
    const target = parseAmount(form.target), saved = parseAmount(form.saved);
    if (!form.name.trim() || !(target > 0) || saved > target) return;
    upd((p) => ({ ...p, goals: editing
      ? (p.goals || []).map((g) => g.id === editing ? { ...g, name: form.name.trim(), target, saved, deadline: form.deadline } : g)
      : [...(p.goals || []), { id: uid(), name: form.name.trim(), target, saved, deadline: form.deadline }] }));
    setForm({ name: '', target: '', saved: '', deadline: '' });
    setEditing('');
    toast(editing ? 'Target keuangan diperbarui' : 'Target keuangan ditambahkan');
  };
  const remove = (id) => upd((p) => ({ ...p, goals: (p.goals || []).filter((g) => g.id !== id) }));
  const startEdit = (g) => { setEditing(g.id); setForm({ name: g.name, target: formatAmount(g.target), saved: formatAmount(g.saved), deadline: g.deadline || '' }); };
  return (
    <div className="grid g2">
      <form className="card" onSubmit={add}>
        <h2>{editing ? 'Edit Target' : 'Target Baru'}</h2>
        <p className="sub">Buat tujuan dan pantau progres tabunganmu.</p>
        <label>Nama target<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dana darurat" required /></label>
        <label>Nominal target<input inputMode="numeric" value={form.target} onChange={(e) => setForm({ ...form, target: formatAmount(e.target.value) })} placeholder="5.000.000" required /></label>
        <label>Sudah terkumpul<input inputMode="numeric" value={form.saved} onChange={(e) => setForm({ ...form, saved: formatAmount(e.target.value) })} placeholder="0" /></label>
        <label>Target waktu<input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit">{editing ? 'Simpan perubahan' : 'Tambah target'}</button>
          {editing && <button className="btn g" type="button" onClick={() => { setEditing(''); setForm({ name: '', target: '', saved: '', deadline: '' }); }}>Batal</button>}
        </div>
      </form>
      <div className="card">
        <h2>Target Keuangan</h2>
        {goals.length ? goals.map((g) => {
          const percent = Math.min(100, (g.saved / g.target) * 100);
          return <div className="goal-item" key={g.id}>
            <div className="goal-head"><div><b>{g.name}</b><span>{g.deadline ? `Target ${g.deadline}` : 'Tanpa batas waktu'}</span></div><div className="goal-actions"><button className="icon-btn" type="button" onClick={() => startEdit(g)} aria-label={`Edit ${g.name}`}><Icon src={editIcon} /></button><button className="icon-btn" type="button" onClick={() => remove(g.id)} aria-label={`Hapus ${g.name}`}><Icon src={trashIcon} /></button></div></div>
            <div className="goal-values"><strong>{rp(g.saved)}</strong><span>dari {rp(g.target)} · {Math.round(percent)}%</span></div>
            <div className="bar"><i style={{ width: percent + '%', background: percent >= 100 ? 'var(--em)' : 'var(--focus)' }} /></div>
          </div>;
        }) : <div className="empty">Belum ada target. Mulai dari tujuan kecil yang ingin kamu capai.</div>}
      </div>
    </div>
  );
}
