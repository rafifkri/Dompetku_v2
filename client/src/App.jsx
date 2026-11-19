import { useEffect, useState } from 'react';
import { FinanceProvider, useFinance } from './store';
import { UIProvider } from './ui';
import Sidebar from './components/Sidebar';
import TxForm from './components/TxForm';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Categories from './pages/Categories';
import Budget from './pages/Budget';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';
import { BLN } from './utils';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { api, clearToken, getToken } from './api';

const PAGES = { dash: [Dashboard, 'Dashboard'], hist: [History, 'Riwayat Transaksi'], cat: [Categories, 'Kategori'], bud: [Budget, 'Budget Bulanan'], ana: [Analysis, 'Analisis Keuangan'], set: [Settings, 'Pengaturan'], prof: [Profile, 'Profil Saya'] };

function Shell({ profile, onLogout, onProfileChange }) {
  const [view, setView] = useState('dash');
  const [form, setForm] = useState(null); // null | {} (baru) | { edit: transaksi }
  const { M, setM, ready, err } = useFinance();
  const [Page, title] = PAGES[view];
  const [y, m] = M.split('-');
  return (
    <>
      <Sidebar view={view} onNav={(v) => (v === 'add' ? setForm({}) : setView(v))} />
      <main>
        <div className="top">
          <div><h1>{title}</h1><div className="sub">{BLN[m - 1]} {y}</div></div>
          <div className="top-actions">
            {view !== 'prof' && <><input type="month" style={{ width: 'auto' }} value={M} onChange={(e) => e.target.value && setM(e.target.value)} /><button className="btn" onClick={() => setForm({})}>+ Tambah Transaksi</button></>}
            <button className="profile-chip" onClick={() => setView('prof')}><span className="profile-avatar">{profile.photo ? <img src={profile.photo} alt="" /> : profile.name.slice(0, 1).toUpperCase()}</span><span>{profile.name}</span></button>
          </div>
        </div>
        {err && <div className="card out" style={{ marginBottom: 18 }}>⚠️ {err}</div>}
        {ready ? <div className="page" key={view}><Page openEdit={(t) => setForm({ edit: t })} onLogout={onLogout} onProfileChange={onProfileChange} /></div> : <div className="empty">Memuat data…</div>}
      </main>
      {form && <TxForm edit={form.edit} onClose={() => setForm(null)} />}
    </>
  );
}
export default function App() {
  const [profile, setProfile] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  useEffect(() => {
    if (!getToken()) return;
    api('/api/auth/me').then((d) => setProfile(d.user)).catch(() => clearToken()).finally(() => setChecking(false));
  }, []);
  if (checking) return <div className="auth-loading">Memuat Dompetku…</div>;
  if (!profile) return <UIProvider><Login onLogin={setProfile} /></UIProvider>;
  return <UIProvider><FinanceProvider><Shell profile={profile} onLogout={() => { api('/api/auth/logout', 'POST').catch(() => {}).finally(() => { clearToken(); setProfile(null); }); }} onProfileChange={setProfile} /></FinanceProvider></UIProvider>;
}
