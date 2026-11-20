import { useMemo } from 'react';
import { useFinance } from '../store';
import { formatAmount, icon, parseAmount, rp } from '../utils';
import CategoryIcon from '../components/CategoryIcon';

export default function Budget() {
  const { S, monthTx, upd } = useFinance();
  const spent = useMemo(() => { const m = {}; monthTx.filter((t) => t.type === 'expense').forEach((t) => { m[t.cat] = (m[t.cat] || 0) + t.amount; }); return m; }, [monthTx]);
  const setB = (c, v) => upd((p) => ({ ...p, budget: { ...p.budget, [c]: Math.max(0, +v || 0) } }));

  return (
    <div className="card">
      <p className="sub" style={{ marginTop: 0 }}>Atur batas per kategori. Nominal awal hanyalah contoh, silakan ubah. Kosongkan / 0 untuk tanpa batas.</p>
      {Object.keys(S.cats.expense).map((c) => {
        const b = +S.budget[c] || 0, u = spent[c] || 0, p = b ? (u / b) * 100 : 0;
        const col = p > 100 ? 'var(--exp)' : p >= 80 ? '#f59e0b' : 'var(--em)';
        const msg = !b ? 'Belum ada budget' : p > 100 ? `⚠️ Melebihi budget ${rp(u - b)}` : p >= 80 ? `🟠 Mendekati batas · sisa ${rp(b - u)}` : `Sisa ${rp(b - u)}`;
        return (
          <div className="row" key={c} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="ic"><CategoryIcon category={c} value={icon(S.cats, 'expense', c)} /></div>
            <div className="grow" style={{ minWidth: 200 }}>
              <b>{c}</b>
              <div className="bar" style={{ margin: '8px 0 4px' }}><i style={{ width: Math.min(100, p) + '%', background: col }} /></div>
              <span className="sub" style={{ color: p > 100 ? 'var(--exp)' : undefined }}>{rp(u)} terpakai{b ? ` (${Math.round(p)}%)` : ''} · {msg}</span>
            </div>
            <input inputMode="numeric" style={{ width: 150 }} placeholder="Budget" value={b ? formatAmount(b) : ''} onChange={(e) => setB(c, parseAmount(e.target.value))} />
          </div>
        );
      })}
    </div>
  );
}
