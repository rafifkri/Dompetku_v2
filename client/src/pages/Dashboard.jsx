import { useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { themeCharts } from '../chartSetup';
import { useFinance } from '../store';
import { useUI } from '../ui';
import SummaryCard from '../components/SummaryCard';
import ChartCard from '../components/ChartCard';
import TxRow from '../components/TxRow';
import { PAL, daysIn, rp, srt, sum } from '../utils';

export default function Dashboard({ openEdit }) {
  const { S, M, monthTx } = useFinance();
  const { theme } = useUI();
  themeCharts();
  const n = daysIn(M);
  const inc = sum(monthTx, 'income'), exp = sum(monthTx, 'expense');
  const bal = inc - exp + (+S.saldoAwal || 0);
  const pc = (x, y) => (y > 0 ? Math.min(100, (x / y) * 100) : 0);

  const d = useMemo(() => {
    const L = Array.from({ length: n }, (_, i) => i + 1);
    const di = L.map(() => 0), de = L.map(() => 0), bc = {};
    monthTx.forEach((t) => {
      const i = +t.date.slice(8) - 1;
      if (t.type === 'income') di[i] += t.amount; else { de[i] += t.amount; bc[t.cat] = (bc[t.cat] || 0) + t.amount; }
    });
    const cats = Object.keys(bc).sort((a, b) => bc[b] - bc[a]);
    const act = L.map((day, i) => [day, de[i]]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const hi = act.slice(0, 3), lo = act.slice(3).slice(-3).reverse();
    return { L, di, de, bc, cats, sel: [...hi, ...lo], nHi: hi.length };
  }, [monthTx, n]);

  const tip = (c) => ' ' + (c.dataset.label ? c.dataset.label + ': ' : '') + rp(c.parsed.y ?? c.parsed.x ?? c.parsed);
  const opt = { responsive: true, plugins: { tooltip: { callbacks: { label: tip } } } };
  const total = d.cats.reduce((s, k) => s + d.bc[k], 0);

  return (
    <>
      {!S.tx.length && <div className="card empty" style={{ marginBottom: 18 }}>👋 Belum ada transaksi. Klik <b>+ Tambah Transaksi</b> untuk mulai mencatat. Semua grafik dihitung dari data yang kamu catat.</div>}
      <div className="grid g4">
        <SummaryCard label="Total Pemasukan" value={rp(inc)} icon="📈" color="var(--inc)" pct={inc > 0 ? 100 : 0} note="Uang masuk bulan ini" />
        <SummaryCard label="Total Pengeluaran" value={rp(exp)} icon="📉" color="var(--exp)" pct={pc(exp, inc)} note={inc > 0 ? Math.round((exp / inc) * 100) + '% dari pemasukan' : 'Uang keluar bulan ini'} />
        <SummaryCard label="Sisa Saldo" value={rp(bal)} icon="🏦" color="var(--bal)" pct={pc(bal, inc + (+S.saldoAwal || 0))} note={S.saldoAwal > 0 ? 'Termasuk saldo awal ' + rp(S.saldoAwal) : 'Pemasukan − pengeluaran'} />
        <SummaryCard label="Total Transaksi" value={monthTx.length} icon="🧾" color="var(--pri)" pct={Math.min(100, monthTx.length * 2)} note={monthTx.length ? 'Rata-rata ' + rp(exp / n) + ' / hari' : 'Belum ada transaksi'} />
      </div>
      <div className="grid g2" style={{ marginTop: 18 }}>
        <ChartCard title="Pemasukan vs Pengeluaran">
          <Bar key={theme + 'a'} options={opt} data={{ labels: d.L, datasets: [
            { label: 'Pemasukan', data: d.di, backgroundColor: '#2f8f5b', borderRadius: 5 },
            { label: 'Pengeluaran', data: d.de, backgroundColor: '#d65a43', borderRadius: 5 }] }} />
        </ChartCard>
        <ChartCard title="Pengeluaran per Kategori">
          <Doughnut key={theme + 'b'} data={{ labels: d.cats, datasets: [{ data: d.cats.map((k) => d.bc[k]), backgroundColor: PAL, borderWidth: 0 }] }}
            options={{ responsive: true, cutout: '62%', plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => ` ${c.label}: ${rp(c.parsed)} (${Math.round((c.parsed / total) * 100)}%)` } } } }} />
        </ChartCard>
        <ChartCard title="Tren Pengeluaran Harian">
          <Line key={theme + 'c'} options={opt} data={{ labels: d.L, datasets: [{ label: 'Pengeluaran', data: d.de, borderColor: '#d65a43', backgroundColor: 'rgba(214,90,67,.15)', fill: true, tension: 0.35, pointRadius: 2 }] }} />
        </ChartCard>
        <ChartCard title="Aktivitas: Hari Tertinggi & Terendah">
          <Bar key={theme + 'd'} options={{ ...opt, indexAxis: 'y', plugins: { legend: { display: false }, tooltip: opt.plugins.tooltip } }}
            data={{ labels: d.sel.map((x) => 'Tgl ' + x[0]), datasets: [{ data: d.sel.map((x) => x[1]), backgroundColor: d.sel.map((_, i) => (i < d.nHi ? '#d65a43' : '#2f8f5b')), borderRadius: 6 }] }} />
        </ChartCard>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Transaksi Terbaru</h2>
        {monthTx.length ? [...monthTx].sort(srt).slice(0, 5).map((t) => <TxRow key={t.id} t={t} onEdit={openEdit} />) : <div className="empty">Belum ada data</div>}
      </div>
    </>
  );
}
