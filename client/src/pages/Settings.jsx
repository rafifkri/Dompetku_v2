import { useState } from 'react';
import { useFinance } from '../store';
import { useUI } from '../ui';
import { DEF } from '../defaults';
import { STATIC } from '../api';
import { download, toCSV } from '../utils';

export default function Settings() {
  const { S, upd, restore } = useFinance();
  const { toast, ask, setTheme } = useUI();
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
      {STATIC && <div className="card" style={{ marginBottom: 18 }}>ℹ️ <b>Mode demo:</b> data tersimpan di browser ini saja (tidak ada server). Unduh backup secara berkala agar data aman.</div>}
      <div className="grid g2">
        <div className="card">
          <h2>Saldo Awal</h2>
          <p className="sub" style={{ marginTop: 0 }}>Ditambahkan ke Sisa Saldo di dashboard.</p>
          <input type="number" min="0" placeholder="0" value={sa} onChange={(e) => setSa(e.target.value)} />
          <button className="btn" style={{ marginTop: 12 }} onClick={() => { upd((p) => ({ ...p, saldoAwal: Math.max(0, +sa || 0) })); toast('Saldo awal disimpan'); }}>Simpan</button>
        </div>
        <div className="card">
          <h2>Tema</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn g" onClick={() => setTheme('light')}>☀️ Terang</button>
            <button className="btn g" onClick={() => setTheme('dark')}>🌙 Gelap</button>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Ekspor, Backup &amp; Restore</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn g" onClick={() => download("laporan-keuangan.csv", toCSV(S.tx), "text/csv;charset=utf-8")}>⬇️ Unduh CSV (Excel)</button>
          <button className="btn g" onClick={() => download("dompetku-backup.json", JSON.stringify({ tx: S.tx, saldoAwal: S.saldoAwal, budget: S.budget, goals: S.goals, recurring: S.recurring, cats: S.cats }, null, 1), "application/json")}>⬇️ Unduh Backup JSON</button>
        </div>
        <p className="sub">Restore: pilih file backup .json, atau tempel isinya di kotak berikut.</p>
        <input type="file" accept=".json" onChange={onFile} style={{ marginBottom: 10 }} />
        <textarea rows={5} placeholder="Tempel JSON backup di sini..." value={txt} onChange={(e) => setTxt(e.target.value)} />
        <button className="btn" style={{ marginTop: 10 }} onClick={() => apply(txt)}>♻️ Restore dari teks</button>
        <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '18px 0' }} />
        <button className="btn d" onClick={wipe}>🗑️ Hapus semua data</button>
      </div>
    </>
  );
}
