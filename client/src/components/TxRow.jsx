import { useFinance } from '../store';
import { icon, rp } from '../utils';
import Icon from './Icon';
import editIcon from '../assets/icons/edit.png';
import CategoryIcon from './CategoryIcon';

export default function TxRow({ t, onEdit, onDelete }) {
  const { S } = useFinance();
  const inc = t.type === 'income';
  return (
    <div className="row">
      <div className="ic"><CategoryIcon category={t.cat} value={icon(S.cats, t.type, t.cat)} /></div>
      <div className="grow">
        <b>{t.desc || t.sub || t.cat}</b>
        <span className="sub">{t.cat}{t.sub ? ' · ' + t.sub : ''} · {t.date.split('-').reverse().join('/')} · {t.method}</span>
      </div>
      <div className={'amt ' + (inc ? 'in' : 'out')}>{inc ? '+' : '−'}{rp(t.amount)}</div>
      {onEdit && <button className="btn g s tx-action" aria-label="Edit transaksi" title="Edit transaksi" onClick={() => onEdit(t)}><Icon src={editIcon} /></button>}
      {onDelete && <button className="btn g s tx-action tx-delete" aria-label="Hapus transaksi" title="Hapus transaksi" onClick={() => onDelete(t.id)}>×</button>}
    </div>
  );
}
