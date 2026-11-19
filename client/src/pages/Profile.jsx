import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function Profile({ onLogout, onProfileChange }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const fileRef = useRef();
  const coverRef = useRef();
  useEffect(() => { api('/api/profile').then(setForm).catch(() => setForm({ name: '', email: '', bio: '', photo: '' })); }, []);

  const save = async (e) => {
    e.preventDefault();
    const next = { ...form, name: form.name.trim(), email: form.email.trim() };
    try {
      await api('/api/profile', 'PUT', next);
      onProfileChange(next);
      setForm(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch { setSaved('Gagal menyimpan.'); }
  };

  const choosePhoto = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return setSaved('Foto maksimal 2 MB.');
    const reader = new FileReader();
    reader.onload = () => { setForm((p) => ({ ...p, [field]: reader.result })); setShowPicker(false); };
    reader.readAsDataURL(file);
  };

  if (!form) return <div className="empty">Memuat profil…</div>;
  const initials = (form.name || form.email || '?').slice(0, 1).toUpperCase();
  return (
    <div className="profile-layout">
      <section className="card profile-hero">
        <div className="profile-cover" style={form.cover ? { backgroundImage: `linear-gradient(90deg, rgba(7, 17, 10, .58), rgba(31, 92, 54, .25)), url(${form.cover})` } : undefined}>
          <span className="cover-edit">Ganti background</span>
        </div>
        <div className="profile-identity">
          <button className="profile-avatar profile-avatar-large" type="button" onClick={() => setShowPicker((p) => !p)} aria-label="Ubah foto atau background profil" aria-expanded={showPicker}>
            {form.photo ? <img src={form.photo} alt="Foto profil" /> : initials}
            <span className="avatar-edit">+</span>
          </button>
          {showPicker && <div className="profile-picker-menu">
            <button type="button" onClick={() => fileRef.current.click()}>Ganti foto profil</button>
            <button type="button" onClick={() => coverRef.current.click()}>Ganti background</button>
          </div>}
          <div><h2>{form.name || 'Profil kamu'}</h2><p className="sub">{form.email}</p></div>
        </div>
        <p className="profile-tip">Klik avatar untuk mengganti foto atau klik background untuk mengganti cover.</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={(e) => choosePhoto(e, 'photo')} hidden />
        <input ref={coverRef} type="file" accept="image/*" onChange={(e) => choosePhoto(e, 'cover')} hidden />
      </section>
      <form className="card profile-form" onSubmit={save}>
        <div className="profile-section-heading"><div><h2>Informasi profil</h2><p className="sub">Buat tampilan akunmu terasa lebih personal.</p></div>{saved && <span className="save-state">{typeof saved === 'string' ? saved : 'Tersimpan'}</span>}</div>
        <label>Nama lengkap<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Tentang kamu<textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Ceritakan sedikit tentang dirimu..." /></label>
        <div className="profile-actions"><button className="btn" type="submit">Simpan perubahan</button><button className="btn g" type="button" onClick={onLogout}>Keluar</button></div>
      </form>
    </div>
  );
}
