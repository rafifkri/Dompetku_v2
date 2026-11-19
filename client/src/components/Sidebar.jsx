const NAV = [['dash','📊','Dashboard'],['add','➕','Tambah Transaksi'],['hist','🧾','Riwayat Transaksi'],['cat','🗂️','Kategori'],['bud','🎯','Budget Bulanan'],['ana','💡','Analisis Keuangan'],['set','⚙️','Pengaturan']];
export default function Sidebar({ view, onNav }) {
  return (
    <aside>
      <div className="logo"><b>💸</b>Dompetku</div>
      {NAV.map(([k, i, l]) => (
        <button key={k} className={'nav' + (view === k ? ' on' : '')} onClick={() => onNav(k)}><span>{i}</span><span>{l}</span></button>
      ))}
    </aside>
  );
}
