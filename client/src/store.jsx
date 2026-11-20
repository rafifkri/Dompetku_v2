import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { DEF } from './defaults';
import { today, uid } from './utils';

const Ctx = createContext();
export const useFinance = () => useContext(Ctx);

export function FinanceProvider({ children }) {
  const [S, setS] = useState(DEF());
  const [M, setM] = useState(today().slice(0, 7));
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const ref = useRef(S); ref.current = S;
  const timer = useRef();

  const push = (x) => {            // simpan pengaturan (saldo awal, budget, kategori) ke server
    clearTimeout(timer.current);
    timer.current = setTimeout(() =>
      api('/api/settings', 'PUT', { saldoAwal: x.saldoAwal, budget: x.budget, goals: x.goals, recurring: x.recurring, cats: x.cats })
        .catch(() => setErr('Gagal menyimpan pengaturan ke server')), 250);
  };
  const upd = (f) => { const n = f(ref.current); ref.current = n; setS(n); push(n); };

  useEffect(() => {
    api('/api/data')
      .then(async (d) => {
        if (!d.cats) { const x = DEF(); setS(x); push(x); return; }
        const next = { ...d, goals: d.goals || [], recurring: d.recurring || [] };
        const month = today().slice(0, 7);
        const due = next.recurring.filter((r) => r.active && r.lastRun !== month);
        const generated = due.map((r) => ({ id: uid(), ts: Date.now(), type: r.type, amount: r.amount, cat: r.cat, sub: r.sub || '', date: `${month}-${String(r.day).padStart(2, '0')}`, desc: r.desc + ' (berulang)', method: 'Auto' }));
        if (generated.length) {
          await Promise.all(generated.map((tx) => api('/api/tx', 'POST', tx)));
          next.tx = [...generated, ...next.tx];
          next.recurring = next.recurring.map((r) => due.some((x) => x.id === r.id) ? { ...r, lastRun: month } : r);
          await api('/api/settings', 'PUT', { saldoAwal: next.saldoAwal, budget: next.budget, goals: next.goals, recurring: next.recurring, cats: next.cats });
        }
        setS(next);
      })
      .catch(() => setErr('Server tidak terjangkau. Pastikan backend berjalan.'))
      .finally(() => setReady(true));
  }, []);

  const saveTx = async (r) => {
    await api('/api/tx', 'POST', r);
    setS((p) => ({ ...p, tx: p.tx.some((t) => t.id === r.id) ? p.tx.map((t) => (t.id === r.id ? r : t)) : [...p.tx, r] }));
    setM(r.date.slice(0, 7));
  };
  const delTx = async (id) => { await api('/api/tx/' + id, 'DELETE'); setS((p) => ({ ...p, tx: p.tx.filter((t) => t.id !== id) })); };
  const renameCat = (type, from, to) => {
    upd((p) => {
      const o = {}; Object.keys(p.cats[type]).forEach((k) => { o[k === from ? to : k] = p.cats[type][k]; });
      const budget = { ...p.budget }; if (budget[from] != null) { budget[to] = budget[from]; delete budget[from]; }
      return { ...p, cats: { ...p.cats, [type]: o }, budget, tx: p.tx.map((t) => (t.type === type && t.cat === from ? { ...t, cat: to } : t)) };
    });
    api('/api/rename', 'POST', { type, from, to }).catch(() => setErr('Gagal mengganti nama kategori di server'));
  };
  const restore = async (d) => {
    await api('/api/restore', 'POST', d);
    setS({ tx: d.tx, saldoAwal: d.saldoAwal || 0, budget: d.budget || {}, goals: d.goals || [], recurring: d.recurring || [], cats: d.cats });
  };
  const monthTx = useMemo(() => S.tx.filter((t) => t.date.startsWith(M)), [S.tx, M]);

  return <Ctx.Provider value={{ S, M, setM, ready, err, monthTx, upd, saveTx, delTx, renameCat, restore }}>{children}</Ctx.Provider>;
}
