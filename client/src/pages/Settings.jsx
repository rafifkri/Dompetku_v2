import { useState } from 'react';
import { useFinance } from '../store';
import { useUI } from '../ui';
import { DEF } from '../defaults';
import { STATIC } from '../api';
import { download, toCSV } from '../utils';
import Icon from '../components/Icon';
import trashIcon from '../assets/icons/sampah.png';
import themeLightIcon from '../assets/icons/theme-light.png';
import themeDarkIcon from '../assets/icons/theme-dark.png';

export default function Settings() {
  const { S, upd, restore } = useFinance();
  const { toast, ask, theme, setTheme } = useUI();
  const [sa, setSa] = useState(S.saldoAwal || '');
  const [txt, setTxt] = useState('');

  const apply = async (raw) => {
    try {
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.tx) || !d.cats) throw new Error();
      await restore(d); toast('Data berhasil dipulihkan');
    } catch { toast('Format backup tidak valid'); }
  };
  const onFile = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => apply(r.result); r.readAsText(f); };
  const wipe = async () => {
    if ((await ask('Hapus SEMUA transaksi, kategori, dan budget?', '', true)) === null) return;
    try { await restore(DEF()); toast('Data direset'); } catch { toast('Gagal reset data'); }
  };

  return (
    <>
      {STATIC && <div className="card" style={{ marginBottom: 18 }}><b>Mode demo:</b> data tersimpan di browser ini saja (tidak ada server). Unduh backup secara berkala agar data aman.</div>}
      <div className="grid g2">
        <div className="card">
          <h2>Saldo Awal</h2>
          <p className="sub" style={{ marginTop: 0 }}>Ditambahkan ke Sisa Saldo di dashboard.</p>
          <input type="number" min="0" placeholder="0" value={sa} onChange={(e) => setSa(e.target.value)} />
          <button className="btn" style={{ marginTop: 12 }} onClick={() => { upd((p) => ({ ...p, saldoAwal: Math.max(0, +sa || 0) })); toast('Saldo awal disimpan'); }}>Simpan</button>
        </div>
        <div className="card theme-card">
          <h2>Tema</h2>
          <div className="theme-switch-row">
            <span className="sub">Pilih tampilan aplikasi</span>
            <button className={'theme-switch ' + (theme === 'light' ? 'light' : 'dark')} type="button" role="switch" aria-checked={theme === 'light'} aria-label={`Aktifkan mode ${theme === 'light' ? 'gelap' : 'terang'}`} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
              <img src={theme === 'light' ? themeLightIcon : themeDarkIcon} alt="" />
            </button>
          </div>
          <div className="theme-status">
            <span className="theme-status-dot" aria-hidden="true" />
            <span>Mode {theme === 'light' ? 'terang' : 'gelap'} aktif</span>
            <span className="theme-status-note">Tersimpan otomatis</span>
          </div>
          <div className="theme-tip">Perubahan tema langsung diterapkan ke seluruh aplikasi.</div>
          <div className="theme-guide">
            <div><b>Mode terang</b><span>Warna cerah untuk penggunaan siang hari.</span></div>
            <div><b>Mode gelap</b><span>Lebih nyaman untuk kondisi minim cahaya.</span></div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Ekspor, Backup &amp; Restore</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn g" onClick={() => download("laporan-keuangan.csv", toCSV(S.tx), "text/csv;charset=utf-8")}>Unduh CSV (Excel)</button>
          <button className="btn g" onClick={() => download("dompetku-backup.json", JSON.stringify({ tx: S.tx, saldoAwal: S.saldoAwal, budget: S.budget, goals: S.goals, recurring: S.recurring, cats: S.cats }, null, 1), "application/json")}>Unduh Backup JSON</button>
        </div>
        <p className="sub">Restore: pilih file backup .json, atau tempel isinya di kotak berikut.</p>
        <input type="file" accept=".json" onChange={onFile} style={{ marginBottom: 10 }} />
        <textarea rows={5} placeholder="Tempel JSON backup di sini..." value={txt} onChange={(e) => setTxt(e.target.value)} />
        <button className="btn" style={{ marginTop: 10 }} onClick={() => apply(txt)}>Restore dari teks</button>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
        <button className="btn d icon-text" onClick={wipe}><Icon src={trashIcon} />Hapus semua data</button>
      </div>
    </>
  );
}
