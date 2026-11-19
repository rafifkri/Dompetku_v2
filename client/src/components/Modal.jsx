import { useEffect, useRef } from 'react';
// Dialog native: tampil modal saat dipasang, onClose(returnValue) saat ditutup / Esc
export default function Modal({ onClose, children }) {
  const r = useRef();
  useEffect(() => { r.current.showModal(); }, []);
  return <dialog ref={r} onClose={(e) => onClose(e.currentTarget.returnValue)}>{children}</dialog>;
}
