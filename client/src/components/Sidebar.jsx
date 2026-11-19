import Icon from './Icon';
import logo from '../assets/logo.png';
import dashboard from '../assets/icons/dashboard.png';
import tambah from '../assets/icons/tambah.png';
import riwayat from '../assets/icons/riwayat.png';
import kategori from '../assets/icons/kategori.png';
import budget from '../assets/icons/budget.png';
import analisis from '../assets/icons/analisis.png';
import settings from '../assets/icons/settings.png';

const NAV = [['dash', dashboard, 'Dashboard'], ['add', tambah, 'Tambah Transaksi'], ['hist', riwayat, 'Riwayat Transaksi'], ['cat', kategori, 'Kategori'], ['bud', budget, 'Budget Bulanan'], ['ana', analisis, 'Analisis Keuangan'], ['set', settings, 'Pengaturan']];

export default function Sidebar({ view, onNav }) {
  return (
    <aside>
      <div className="logo"><img src={logo} alt="Dompetku" /></div>
      {NAV.map(([k, ic, l]) => (
        <button key={k} className={'nav' + (view === k ? ' on' : '')} onClick={() => onNav(k)}><Icon src={ic} /><span>{l}</span></button>
      ))}
    </aside>
  );
}
