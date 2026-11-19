import { useFinance } from '../store';
import { useUI } from '../ui';

export default function Categories() {
  const { S, upd, renameCat } = useFinance();
  const { ask, toast } = useUI();

  const addCat = async (t) => {
    const n = await ask('Nama kategori baru'); if (!n) return;
    if (S.cats[t][n]) return toast('Kategori sudah ada');
    const i = await ask('Ikon (emoji)', '📦');
    upd((p) => ({ ...p, cats: { ...p.cats, [t]: { ...p.cats[t], [n]: { i: i || '📦', s: [] } } } }));
  };
  const rename = async (t, n) => { const v = await ask('Ubah nama kategori', n); if (v && v !== n && !S.cats[t][v]) renameCat(t, n, v); };
  const del = async (t, n) => {
    if ((await ask(`Hapus kategori "${n}"? Transaksi lama tetap tersimpan.`, '', true)) === null) return;
    upd((p) => { const c = { ...p.cats[t] }; delete c[n]; const b = { ...p.budget }; delete b[n]; return { ...p, cats: { ...p.cats, [t]: c }, budget: b }; });
  };
  const setSubs = (t, n, f) => upd((p) => ({ ...p, cats: { ...p.cats, [t]: { ...p.cats[t], [n]: { ...p.cats[t][n], s: f(p.cats[t][n].s) } } } }));
  const addSub = async (t, n) => { const v = await ask('Nama subkategori'); if (v) setSubs(t, n, (s) => [...s, v]); };
  const editSub = async (t, n, i) => { const v = await ask('Ubah subkategori', S.cats[t][n].s[i]); if (v) setSubs(t, n, (s) => s.map((x, k) => (k === i ? v : x))); };
  const delSub = (t, n, i) => setSubs(t, n, (s) => s.filter((_, k) => k !== i));

  return ['expense', 'income'].map((t) => (
    <div key={t} style={{ marginBottom: 22 }}>
      <h2>{t === 'expense' ? 'Uang Keluar' : 'Uang Masuk'}</h2>
      <div className="grid g2">
        {Object.entries(S.cats[t]).map(([n, c]) => (
          <div className="card" key={n}>
            <div className="row" style={{ border: 0, padding: '0 0 10px' }}>
              <div className="ic">{c.i}</div><div className="grow"><b>{n}</b></div>
              <button className="btn g s" onClick={() => rename(t, n)}>✏️</button>
              <button className="btn g s" onClick={() => del(t, n)}>🗑️</button>
            </div>
            {c.s.map((s, i) => (
              <span className="chip" key={s + i}>{s}<button onClick={() => editSub(t, n, i)}>✏️</button><button onClick={() => delSub(t, n, i)}>×</button></span>
            ))}
            <button className="btn g s" style={{ margin: 3 }} onClick={() => addSub(t, n)}>+ Sub</button>
          </div>
        ))}
        <div className="card" style={{ display: 'grid', placeItems: 'center' }}><button className="btn" onClick={() => addCat(t)}>+ Kategori baru</button></div>
      </div>
    </div>
  ));
}
