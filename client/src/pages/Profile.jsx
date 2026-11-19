import { useEffect, useRef, useState } from 'react';
import { api } from '../api';

export default function Profile({ onLogout, onProfileChange }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [editor, setEditor] = useState(null);
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
    reader.onload = () => {
      const prefix = field === 'photo' ? 'photo' : 'cover';
      setEditor({ field, src: reader.result, scale: form[`${prefix}Scale`] || 1, x: form[`${prefix}X`] || 0, y: form[`${prefix}Y`] || 0 });
      setShowPicker(false);
    };
    reader.readAsDataURL(file);
  };

  if (!form) return <div className="empty">Memuat profil…</div>;
  const initials = (form.name || form.email || '?').slice(0, 1).toUpperCase();
  const applyEditor = () => {
    const prefix = editor.field === 'photo' ? 'photo' : 'cover';
    setForm((p) => ({ ...p, [editor.field]: editor.src, [`${prefix}Scale`]: editor.scale, [`${prefix}X`]: editor.x, [`${prefix}Y`]: editor.y }));
    setEditor(null);
  };
  return (
    <div className="profile-layout">
      <section className="card profile-hero">
        <div className="profile-cover">{form.cover && <img className="profile-cover-image" src={form.cover} alt="" style={{ transform: `translate(${form.coverX || 0}px, ${form.coverY || 0}px) scale(${form.coverScale || 1})` }} />}</div>
        <div className="profile-identity">
          <button className="profile-avatar profile-avatar-large" type="button" onClick={() => setShowPicker((p) => !p)} aria-label="Ubah foto atau background profil" aria-expanded={showPicker}>
            {form.photo ? <img src={form.photo} alt="Foto profil" style={{ transform: `translate(${form.photoX || 0}px, ${form.photoY || 0}px) scale(${form.photoScale || 1})` }} /> : initials}
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
      {editor && <ImageAdjuster editor={editor} setEditor={setEditor} onApply={applyEditor} />}
    </div>
  );
}

function ImageAdjuster({ editor, setEditor, onApply }) {
  const drag = useRef(null);
  const move = (e) => {
    if (!drag.current) return;
    setEditor((p) => ({ ...p, x: drag.current.x + e.clientX - drag.current.clientX, y: drag.current.y + e.clientY - drag.current.clientY }));
  };
  return (
    <div className="image-adjuster-backdrop">
      <div className="image-adjuster">
        <div className="image-adjuster-head"><h2>Atur {editor.field === 'photo' ? 'avatar' : 'background'}</h2><button className="btn g s" type="button" onClick={() => setEditor(null)}>×</button></div>
        <p className="image-adjuster-help">Geser gambar untuk mengatur posisi, lalu gunakan slider untuk memperbesar atau memperkecil.</p>
        <div className={'image-adjuster-frame ' + (editor.field === 'photo' ? 'round' : '')} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { clientX: e.clientX, clientY: e.clientY, x: editor.x, y: editor.y }; }} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          <img src={editor.src} alt="Pratinjau" style={{ transform: `translate(${editor.x}px, ${editor.y}px) scale(${editor.scale})` }} />
        </div>
        <div className="image-adjuster-controls">
          <label>Zoom <strong>{Math.round(editor.scale * 100)}%</strong><input type="range" min="1" max="3" step=".05" value={editor.scale} onChange={(e) => setEditor({ ...editor, scale: Number(e.target.value) })} /></label>
          <button className="btn g s" type="button" onClick={() => setEditor({ ...editor, scale: 1, x: 0, y: 0 })}>Reset</button>
        </div>
        <button className="btn image-adjuster-apply" type="button" onClick={onApply}>Gunakan gambar</button>
      </div>
    </div>
  );
}
