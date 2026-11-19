import Icon from './Icon';

export default function SummaryCard({ label, value, icon, color, pct, note }) {
  return (
    <div className="card stat">
      <div className="lbl"><span>{label}</span><Icon src={icon} className="stat-icon" /></div>
      <div className="val" style={{ color }}>{value}</div>
      <div className="bar"><i style={{ width: pct + '%', background: color }} /></div>
      <div className="sub" style={{ marginTop: 6 }}>{note}</div>
    </div>
  );
}
