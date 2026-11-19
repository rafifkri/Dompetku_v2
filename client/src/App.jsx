import { useState } from 'react';
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

const PAGES = { dash: [Dashboard, 'Dashboard'], hist: [History, 'Riwayat Transaksi'], cat: [Categories, 'Kategori'], bud: [Budget, 'Budget Bulanan'], ana: [Analysis, 'Analisis Keuangan'], set: [Settings, 'Pengaturan'] };

function Shell() {
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
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="month" style={{ width: 'auto' }} value={M} onChange={(e) => e.target.value && setM(e.target.value)} />
            <button className="btn" onClick={() => setForm({})}>+ Tambah Transaksi</button>
          </div>
        </div>
        {err && <div className="card out" style={{ marginBottom: 18 }}>⚠️ {err}</div>}
        {ready ? <div className="page" key={view}><Page openEdit={(t) => setForm({ edit: t })} /></div> : <div className="empty">Memuat data…</div>}
      </main>
      {form && <TxForm edit={form.edit} onClose={() => setForm(null)} />}
    </>
  );
}
export default function App() {
  return <UIProvider><FinanceProvider><Shell /></FinanceProvider></UIProvider>;
}
