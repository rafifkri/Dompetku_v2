import { useFinance } from '../store';
import { icon, rp } from '../utils';

export default function TxRow({ t, onEdit, onDelete }) {
  const { S } = useFinance();
  const inc = t.type === 'income';
  return (
    <div className="row">
      <div className="ic">{icon(S.cats, t.type, t.cat)}</div>
      <div className="grow">
        <b>{t.desc || t.sub || t.cat}</b>
        <span className="sub">{t.cat}{t.sub ? ' · ' + t.sub : ''} · {t.date.split('-').reverse().join('/')} · {t.method}</span>
      </div>
      <div className={'amt ' + (inc ? 'in' : 'out')}>{inc ? '+' : '−'}{rp(t.amount)}</div>
      {onEdit && <button className="btn g s" onClick={() => onEdit(t)}>✏️</button>}
      {onDelete && <button className="btn g s" onClick={() => onDelete(t.id)}>🗑️</button>}
    </div>
  );
}
