import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from './components/Modal';

const Ctx = createContext();
export const useUI = () => useContext(Ctx);

export function UIProvider({ children }) {
  const [msg, setMsg] = useState(''); const tm = useRef();
  const [p, setP] = useState(null);
  const [theme, setThemeState] = useState(() => { try { return localStorage.getItem('dompetku_theme') || ''; } catch { return ''; } });
  if (theme && document.documentElement.dataset.theme !== theme) document.documentElement.dataset.theme = theme;

  const toast = useCallback((m) => { setMsg(m); clearTimeout(tm.current); tm.current = setTimeout(() => setMsg(''), 2200); }, []);
  const ask = useCallback((title, value = '', conf = false) => new Promise((resolve) => setP({ title, value, conf, resolve })), []);
  const setTheme = (t) => { document.documentElement.dataset.theme = t; try { localStorage.setItem('dompetku_theme', t); } catch { /* abaikan */ } setThemeState(t); };

  return (
    <Ctx.Provider value={{ toast, ask, theme, setTheme }}>
      {children}
      {p && <AskDialog p={p} done={(v) => { p.resolve(v); setP(null); }} />}
      <div className={'toast' + (msg ? ' s' : '')}>{msg}</div>
    </Ctx.Provider>
  );
}

function AskDialog({ p, done }) {
  const [v, setV] = useState(p.value);
  return (
    <Modal onClose={(rv) => done(rv === 'ok' ? v.trim() : null)}>
      <form method="dialog">
        <h2>{p.title}</h2>
        {!p.conf && <input autoFocus value={v} onChange={(e) => setV(e.target.value)} />}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-start', flexDirection: 'row-reverse', marginTop: 16 }}>
          <button value="ok" className="btn">{p.conf ? 'Ya, hapus' : 'OK'}</button>
          <button value="no" className="btn g">Batal</button>
        </div>
      </form>
    </Modal>
  );
}
