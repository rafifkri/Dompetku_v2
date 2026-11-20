import { useEffect, useRef, useState } from 'react';
import { BLN } from '../utils';
import calendarIcon from '../assets/icons/calender.webp';

const pad = (n) => String(n).padStart(2, '0');
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;

export default function DatePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const [y, m] = value.split('-').map(Number);
    return { y: Math.max(MIN_YEAR, Math.min(MAX_YEAR, y)), m: m - 1 };
  });
  const root = useRef();

  useEffect(() => {
    const close = (e) => {
      if (root.current && !root.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);

  useEffect(() => {
    if (!open) return;
    const [y, m] = value.split('-').map(Number);
    setCursor({ y: Math.max(MIN_YEAR, Math.min(MAX_YEAR, y)), m: m - 1 });
  }, [open, value]);

  const [y, m, d] = value.split('-').map(Number);
  const first = new Date(cursor.y, cursor.m, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(cursor.y, cursor.m, i - startOffset + 1);
    return { y: date.getFullYear(), m: date.getMonth(), d: date.getDate(), current: date.getMonth() === cursor.m };
  });

  const shift = (offset) => setCursor((p) => {
    const date = new Date(p.y, p.m + offset, 1);
    return {
      y: Math.max(MIN_YEAR, Math.min(MAX_YEAR, date.getFullYear())),
      m: date.getMonth(),
    };
  });

  const select = (day) => {
    const next = `${day.y}-${pad(day.m + 1)}-${pad(day.d)}`;
    onChange(next);
    setCursor({ y: day.y, m: day.m });
    setOpen(false);
  };

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <div className="date-picker" ref={root}>
      <button className="date-trigger" type="button" onClick={() => setOpen((p) => !p)} aria-haspopup="dialog" aria-expanded={open}>
        <img className="date-trigger-icon" src={calendarIcon} alt="" />
        <span>{d} {BLN[m - 1]} {y}</span>
        <span className="date-chevron">⌄</span>
      </button>
      {open && (
        <div className="date-popover" role="dialog" aria-label="Pilih tanggal">
          <div className="date-head">
            <button type="button" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">‹</button>
            <div className="date-head-selects">
              <select aria-label="Pilih bulan" value={cursor.m} onChange={(e) => setCursor((p) => ({ ...p, m: Number(e.target.value) }))}>
                {BLN.map((name, index) => <option key={name} value={index}>{name}</option>)}
              </select>
              <select aria-label="Pilih tahun" value={cursor.y} onChange={(e) => setCursor((p) => ({ ...p, y: Number(e.target.value) }))}>
                {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, index) => MIN_YEAR + index).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => shift(1)} aria-label="Bulan berikutnya">›</button>
          </div>
          <div className="date-week"><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div>
          <div className="date-grid">
            {days.map((day) => {
              const key = `${day.y}-${pad(day.m + 1)}-${pad(day.d)}`;
              return <button key={key} type="button" className={(day.current ? '' : ' muted') + (key === value ? ' selected' : '') + (key === todayKey ? ' today' : '')} onClick={() => select(day)}>{day.d}</button>;
            })}
          </div>
          <button className="date-today" type="button" onClick={() => select({ y: today.getFullYear(), m: today.getMonth(), d: today.getDate(), current: true })}>Hari ini</button>
        </div>
      )}
    </div>
  );
}
