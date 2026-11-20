import { useEffect, useMemo, useState } from 'react';
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
import { BLN, today } from './utils';
import Login from './pages/Login';
import Profile from './pages/Profile';
import { api, clearToken, getToken } from './api';
import DatePicker from './components/DatePicker';
import Goals from './pages/Goals';
import Recurring from './pages/Recurring';
import Icon from './components/Icon';
import profileIcon from './assets/icons/profile.png';

const PAGES = { dash: [Dashboard, 'Dashboard'], hist: [History, 'Riwayat Transaksi'], cat: [Categories, 'Kategori'], bud: [Budget, 'Budget Bulanan'], goals: [Goals, 'Target Keuangan'], recurring: [Recurring, 'Transaksi Berulang'], ana: [Analysis, 'Analisis Keuangan'], set: [Settings, 'Pengaturan'], prof: [Profile, 'Profil Saya'] };

function Shell({ profile, onLogout, onProfileChange }) {
  const [view, setView] = useState('dash');
  const [form, setForm] = useState(null); // null | {} (baru) | { edit: transaksi }
  const { S, M, setM, ready, err, monthTx } = useFinance();
  const [onboarding, setOnboarding] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());
  const [followToday, setFollowToday] = useState(true);
  const [Page, title] = PAGES[view];
  const alerts = useMemo(() => Object.entries(S.budget || {}).map(([category, limit]) => {
    const budget = +limit || 0;
    const used = monthTx.filter((t) => t.type === 'expense' && t.cat === category).reduce((sum, t) => sum + t.amount, 0);
    return { category, percent: budget ? (used / budget) * 100 : 0 };
  }).filter((item) => item.percent >= 80), [S.budget, monthTx]);
  useEffect(() => {
    try { setOnboarding(!localStorage.getItem(`dompetku_onboarding_${profile.id || profile.email}`)); } catch { setOnboarding(false); }
  }, [profile.id, profile.email]);
  const finishOnboarding = () => {
    try { localStorage.setItem(`dompetku_onboarding_${profile.id || profile.email}`, '1'); } catch { /* abaikan */ }
    setOnboarding(false);
  };
  useEffect(() => {
    const timer = setInterval(() => { if (followToday) setSelectedDate(today()); }, 60 * 1000);
    return () => clearInterval(timer);
  }, [followToday]);
  useEffect(() => {
    setM(selectedDate.slice(0, 7));
  }, [selectedDate, setM]);
  const chooseDate = (date) => {
    setSelectedDate(date);
    setFollowToday(date === today());
    setM(date.slice(0, 7));
  };
  return (
    <>
      <Sidebar view={view} onNav={(v) => (v === 'add' ? setForm({}) : setView(v))} />
      <main className={view === 'prof' ? 'profile-main' : ''}>
        <div className="top">
          <div><h1 className={view === 'prof' ? 'title-with-icon' : ''}>{view === 'prof' && <Icon src={profileIcon} size={24} />}{title}</h1>{view === 'prof' ? <div className="sub">{BLN[selectedDate.slice(5, 7) - 1]} {selectedDate.slice(0, 4)}</div> : <DatePicker value={selectedDate} onChange={chooseDate} />}</div>
          <div className="top-actions">
            {view !== 'prof' && <button className="btn" onClick={() => setForm({})}>+ Tambah Transaksi</button>}
            <NotificationCenter alerts={alerts} onNavigate={setView} />
            <button className="profile-chip" onClick={() => setView('prof')}><span className="profile-avatar">{profile.photo ? <img src={profile.photo} alt="" /> : profile.name.slice(0, 1).toUpperCase()}</span><span>{profile.name}</span></button>
          </div>
        </div>
        {err && <div className="card out" style={{ marginBottom: 18 }}>Error: {err}</div>}
        {ready ? <div className="page" key={view}><Page openEdit={(t) => setForm({ edit: t })} onNavigate={setView} onLogout={onLogout} onProfileChange={onProfileChange} /></div> : <div className="empty">Memuat data…</div>}
      </main>
      {form && <TxForm edit={form.edit} onClose={() => setForm(null)} />}
      {onboarding && <Onboarding onNavigate={setView} onFinish={finishOnboarding} onAdd={() => { finishOnboarding(); setForm({}); }} />}
    </>
  );
}

function NotificationCenter({ alerts, onNavigate }) {
  const [open, setOpen] = useState(false);
  return <div className="notification-center">
    <button className="notification-button" type="button" aria-label="Notifikasi budget" aria-expanded={open} onClick={() => setOpen((value) => !value)}>♢{alerts.length > 0 && <span>{alerts.length}</span>}</button>
    {open && <div className="notification-menu">
      <b>Notifikasi budget</b>
      {alerts.length ? alerts.map((alert) => <button type="button" key={alert.category} onClick={() => { onNavigate('bud'); setOpen(false); }}><strong>{alert.category}</strong><small>{Math.round(alert.percent)}% dari batas budget</small></button>) : <p>Tidak ada peringatan saat ini.</p>}
    </div>}
  </div>;
}

function Onboarding({ onNavigate, onFinish, onAdd }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Selamat datang di Dompetku', text: 'Atur keuangan harianmu dengan lebih terarah dan mudah dipahami.' },
    { title: 'Catat transaksi', text: 'Mulai dari mencatat pemasukan atau pengeluaran pertama agar dashboard berisi data yang berguna.' },
    { title: 'Atur budget dan target', text: 'Gunakan Budget Bulanan dan Target Keuangan untuk menjaga rencana tetap berjalan.' },
  ];
  const current = steps[step];
  return <div className="onboarding-backdrop">
    <div className="onboarding-card">
      <div className="onboarding-mark">✦</div><span className="onboarding-step">Langkah {step + 1} dari {steps.length}</span>
      <h2>{current.title}</h2><p>{current.text}</p>
      <div className="onboarding-dots">{steps.map((_, index) => <i className={index === step ? 'on' : ''} key={index} />)}</div>
      <div className="onboarding-actions">
        <button className="btn g" type="button" onClick={onFinish}>Lewati</button>
        {step === 1 ? <button className="btn" type="button" onClick={onAdd}>Tambah transaksi</button> : step < steps.length - 1 ? <button className="btn" type="button" onClick={() => { if (step === 0) onNavigate('hist'); setStep(step + 1); }}>Lanjut</button> : <button className="btn" type="button" onClick={() => { onNavigate('goals'); onFinish(); }}>Buat target</button>}
      </div>
    </div>
  </div>;
}
export default function App() {
  const [profile, setProfile] = useState(null);
  const freshNavigation = performance.getEntriesByType('navigation')[0]?.type === 'navigate';
  const [checking, setChecking] = useState(!freshNavigation && Boolean(getToken()));
  useEffect(() => {
    if (freshNavigation) { clearToken(); return; }
    if (!getToken()) return;
    api('/api/auth/me').then((d) => setProfile(d.user)).catch(() => clearToken()).finally(() => setChecking(false));
  }, [freshNavigation]);
  if (checking) return <div className="auth-loading">Memuat Dompetku…</div>;
  if (!profile) return <UIProvider><Login onLogin={setProfile} /></UIProvider>;
  return <UIProvider><FinanceProvider><Shell profile={profile} onLogout={() => { api('/api/auth/logout', 'POST').catch(() => {}).finally(() => { clearToken(); setProfile(null); }); }} onProfileChange={setProfile} /></FinanceProvider></UIProvider>;
}
