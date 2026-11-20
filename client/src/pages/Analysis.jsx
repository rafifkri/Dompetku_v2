import { useFinance } from '../store';
import { BLN, daysIn, rp, sum, today } from '../utils';

export default function Analysis() {
  const { S, M, monthTx } = useFinance();
  const ex = monthTx.filter((t) => t.type === 'expense');
  const inc = sum(monthTx, 'income'), out = sum(ex, 'expense');
  const n = M === today().slice(0, 7) ? +today().slice(8) : daysIn(M);
  const byC = {}, cnt = {}, byD = {};
  ex.forEach((t) => { byC[t.cat] = (byC[t.cat] || 0) + t.amount; cnt[t.cat] = (cnt[t.cat] || 0) + 1; byD[t.date] = (byD[t.date] || 0) + t.amount; });
  const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0];

  const I = [];
  if (!ex.length) I.push(['+', <>Belum ada pengeluaran tercatat pada bulan ini.</>]);
  else {
    const c = top(byC), d = top(byD), f = top(cnt);
    I.push(['#', <>Kategori terbesar: <b>{c[0]}</b> sebesar {rp(c[1])} ({Math.round((c[1] / out) * 100)}% dari pengeluaran).</>]);
    I.push(['&', <>Pengeluaran main bareng teman: <b>{rp(byC['Main Bareng Teman'] || 0)}</b>.</>]);
    I.push(['♥', <>Pengeluaran date bareng pacar: <b>{rp(byC['Date Bareng Pacar'] || 0)}</b>.</>]);
    I.push(['•', <>Rata-rata pengeluaran per hari: <b>{rp(out / n)}</b> (dihitung {n} hari).</>]);
    I.push(['!', <>Hari pengeluaran tertinggi: <b>{d[0].split('-').reverse().join('/')}</b> sebesar {rp(d[1])}.</>]);
    I.push(['↻', <>Kategori paling sering dipakai: <b>{f[0]}</b> ({f[1]} transaksi).</>]);
  }
  I.push(['=', <>Pemasukan <b>{rp(inc)}</b> vs pengeluaran <b>{rp(out)}</b>{inc || out ? <> → selisih <b>{rp(inc - out)}</b></> : null}.</>]);
  if (inc > 0) {
    const p = ((inc - out) / inc) * 100;
    I.push([p >= 20 ? '✓' : p >= 0 ? '~' : '!', <>Uang yang berhasil disimpan: <b>{Math.round(p)}%</b> dari pemasukan{p < 0 ? ' (pengeluaran melebihi pemasukan)' : p < 20 ? ' — coba targetkan minimal 20%' : ' — kebiasaan bagus!'}.</>]);
  }
  const months = [...new Set(S.tx.map((t) => t.date.slice(0, 7)))].sort().reverse();

  return (
    <>
      <div className="card">
        <h2>Insight Bulan Ini</h2>
        {I.map((x, i) => <div className="ins" key={i}><span>{x[0]}</span><div>{x[1]}</div></div>)}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h2>Rekapitulasi Semua Bulan</h2>
        <div className="tw">
          {months.length ? (
            <table>
              <thead><tr><th>Bulan</th><th>Pemasukan</th><th>Pengeluaran</th><th>Selisih</th><th>Ditabung</th><th>Transaksi</th></tr></thead>
              <tbody>{months.map((k) => {
                const b = S.tx.filter((t) => t.date.startsWith(k)), x = sum(b, 'income'), y = sum(b, 'expense');
                return <tr key={k}><td>{BLN[+k.slice(5) - 1]} {k.slice(0, 4)}</td><td className="in">{rp(x)}</td><td className="out">{rp(y)}</td><td><b>{rp(x - y)}</b></td><td>{x ? Math.round(((x - y) / x) * 100) + '%' : '–'}</td><td>{b.length}</td></tr>;
              })}</tbody>
            </table>
          ) : <div className="empty">Belum ada data</div>}
        </div>
      </div>
    </>
  );
}
