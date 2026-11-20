import { useMemo } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { themeCharts } from '../chartSetup';
import { useFinance } from '../store';
import { useUI } from '../ui';
import SummaryCard from '../components/SummaryCard';
import ChartCard from '../components/ChartCard';
import TxRow from '../components/TxRow';
import { PAL, daysIn, rp, srt, sum } from '../utils';
import pemasukanIcon from '../assets/icons/total-pemasukan.png';
import pengeluaranIcon from '../assets/icons/total-pengeluaran.png';
import transaksiIcon from '../assets/icons/total-transaksi.png';
import saldoIcon from '../assets/icons/sisa-saldo.png';
import handWaveIcon from '../assets/icons/hand-wave.svg';

export default function Dashboard({ openEdit, onNavigate }) {
  const { S, M, monthTx, delTx } = useFinance();
  const { theme, ask, toast } = useUI();
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
  const remove = async (id) => {
    if (await ask('Hapus transaksi ini?', '', true) === null) return;
    try { await delTx(id); toast('Transaksi berhasil dihapus'); } catch { toast('Gagal menghapus transaksi'); }
  };

  const budgetEntries = Object.entries(S.budget || {})
    .map(([category, limit]) => {
      const budget = Math.max(0, +limit || 0);
      const used = monthTx
        .filter((t) => t.type === 'expense' && t.cat === category)
        .reduce((sumAmount, t) => sumAmount + t.amount, 0);
      return { category, budget, used, percent: budget ? (used / budget) * 100 : 0 };
    })
    .filter((item) => item.budget > 0)
    .sort((a, b) => b.percent - a.percent);
  const totalBudget = budgetEntries.reduce((s, item) => s + item.budget, 0);
  const usedBudget = budgetEntries.reduce((s, item) => s + item.used, 0);
  const budgetPercent = totalBudget ? Math.min(100, (usedBudget / totalBudget) * 100) : 0;
  const topCategory = d.cats[0];
  const topCategoryAmount = topCategory ? d.bc[topCategory] : 0;
  const maxDailyExpense = Math.max(...d.de);
  const busiestDay = maxDailyExpense > 0 ? d.de.indexOf(maxDailyExpense) + 1 : 0;

  return (
    <>
      {!S.tx.length && <div className="card empty dashboard-welcome" style={{ marginBottom: 18 }}><img src={handWaveIcon} alt="" /> <span>Belum ada transaksi. Klik <b>+ Tambah Transaksi</b> untuk mulai mencatat. Semua grafik dihitung dari data yang kamu catat.</span></div>}
      <div className="grid g4">
        <SummaryCard label="Sisa Saldo" value={rp(bal)} icon={saldoIcon} color="var(--bal)" pct={pc(bal, inc + (+S.saldoAwal || 0))} note={S.saldoAwal > 0 ? 'Termasuk saldo awal ' + rp(S.saldoAwal) : 'Pemasukan − pengeluaran'} />
        <SummaryCard label="Total Pemasukan" value={rp(inc)} icon={pemasukanIcon} color="var(--inc)" pct={inc > 0 ? 100 : 0} note="Uang masuk bulan ini" />
        <SummaryCard label="Total Pengeluaran" value={rp(exp)} icon={pengeluaranIcon} color="var(--exp)" pct={pc(exp, inc)} note={inc > 0 ? Math.round((exp / inc) * 100) + '% dari pemasukan' : 'Uang keluar bulan ini'} />
        <SummaryCard label="Total Transaksi" value={monthTx.length} icon={transaksiIcon} color="var(--pri)" pct={Math.min(100, monthTx.length * 2)} note={monthTx.length ? 'Rata-rata ' + rp(exp / n) + ' / hari' : 'Belum ada transaksi'} />
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
        <div className="card budget-summary">
          <div className="budget-summary-head">
            <div>
              <h2>Ringkasan Budget</h2>
              <p className="sub">Pantauan batas pengeluaran bulan ini</p>
            </div>
            {budgetEntries.length > 0 && <button className="btn g s" type="button" onClick={() => onNavigate?.('bud')}>Kelola</button>}
          </div>
          {budgetEntries.length ? (
            <>
              <div className="budget-summary-total">
                <div><span>Total budget</span><strong>{rp(totalBudget)}</strong></div>
                <div><span>Terpakai</span><strong className={usedBudget > totalBudget ? 'out' : ''}>{rp(usedBudget)}</strong></div>
              </div>
              <div className="budget-summary-progress">
                <div><span>{Math.round((usedBudget / totalBudget) * 100)}% terpakai</span><span>{rp(Math.max(0, totalBudget - usedBudget))} sisa</span></div>
                <div className="bar"><i style={{ width: budgetPercent + '%', background: usedBudget > totalBudget ? 'var(--exp)' : 'var(--em)' }} /></div>
              </div>
              <div className="budget-category-list">
                {budgetEntries.slice(0, 3).map((item) => {
                  const color = item.percent > 100 ? 'var(--exp)' : item.percent >= 80 ? '#f59e0b' : 'var(--em)';
                  return (
                    <div className="budget-category" key={item.category}>
                      <div><b>{item.category}</b><span>{Math.round(item.percent)}%</span></div>
                      <div className="bar"><i style={{ width: Math.min(100, item.percent) + '%', background: color }} /></div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="budget-empty">
              <div className="budget-empty-icon">◎</div>
              <div>
                <b>Belum ada budget yang dibuat</b>
                <span>Atur batas pengeluaran agar lebih terkontrol.</span>
              </div>
              <button className="btn" type="button" onClick={() => onNavigate?.('bud')}>Buat Budget</button>
            </div>
          )}
        </div>
        <div className="card monthly-insight">
          <div className="monthly-insight-head">
            <div><h2>Insight Bulanan</h2><p className="sub">Ringkasan kecil untuk membantu membaca pola keuanganmu.</p></div>
            <span className="monthly-insight-badge">Bulan ini</span>
          </div>
          {monthTx.length ? (
            <div className="insight-list">
              <div><span className="insight-icon">↗</span><p><b>Kategori terbesar</b><strong>{topCategory || 'Belum ada'}</strong><small>{topCategory ? rp(topCategoryAmount) : 'Belum ada pengeluaran'}</small></p></div>
              <div><span className="insight-icon">◷</span><p><b>Hari pengeluaran tertinggi</b><strong>{busiestDay > 0 ? `Tanggal ${busiestDay}` : 'Belum ada'}</strong><small>{busiestDay > 0 ? rp(maxDailyExpense) : 'Catat transaksi untuk melihat pola'}</small></p></div>
              <div><span className="insight-icon">✓</span><p><b>Rasio pengeluaran</b><strong>{inc ? Math.round((exp / inc) * 100) + '% dari pemasukan' : 'Belum tersedia'}</strong><small>{inc ? 'Jaga agar tetap sesuai rencana' : 'Tambahkan pemasukan bulan ini'}</small></p></div>
            </div>
          ) : <div className="insight-empty"><span>✦</span><b>Belum ada insight</b><p>Mulai catat transaksi untuk melihat pola pengeluaranmu.</p></div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Transaksi Terbaru</h2>
        {monthTx.length ? [...monthTx].sort(srt).slice(0, 5).map((t) => <TxRow key={t.id} t={t} onEdit={openEdit} onDelete={remove} />) : <div className="empty">Belum ada data</div>}
      </div>
    </>
  );
}
