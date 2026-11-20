import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STATUS_LABEL, roleLabel } from './adminConfig';

/* ---------- toast + confirm dialog, available to every admin page ---------- */
const Ctx = createContext(null);
export const useAdminUI = () => useContext(Ctx);

export function AdminUIProvider({ children }) {
  const [msg, setMsg] = useState('');
  const [dlg, setDlg] = useState(null);
  const timer = useRef();
  const pending = useRef(null);
  const ref = useRef();

  const toast = useCallback(m => {
    setMsg(m); clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 3200);
  }, []);

  const confirm = useCallback(opts => new Promise(resolve => { pending.current = resolve; setDlg(opts); }), []);

  const finish = v => {
    const r = pending.current; if (!r) return;
    pending.current = null; setDlg(null);
    if (ref.current && ref.current.open) ref.current.close();
    r(v);
  };

  useEffect(() => { if (dlg && ref.current && !ref.current.open) ref.current.showModal(); }, [dlg]);

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      <dialog ref={ref} onClose={() => finish(false)} aria-labelledby="dlg-title">
        {dlg && (<>
          <h2 id="dlg-title">{dlg.title}</h2>
          <p>{dlg.body}</p>
          <div className="actions">
            <button className="abtn" type="button" onClick={() => finish(false)}>Cancel</button>
            <button className={'abtn ' + (dlg.danger ? 'abtn-danger' : 'abtn-primary')} type="button" onClick={() => finish(true)}>{dlg.okLabel || 'Confirm'}</button>
          </div>
        </>)}
      </dialog>
      <div id="toast" className={msg ? 'show' : ''} role="status" aria-live="polite">{msg}</div>
    </Ctx.Provider>
  );
}

/* ---------- loading hook: load(fn, deps) -> { data, error, reload } ---------- */
export function useLoad(fn, deps = []) {
  const [s, setS] = useState({ data: null, error: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    let live = true;
    fn().then(data => live && setS({ data, error: null })).catch(error => live && setS({ data: null, error }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...s, reload: () => setN(x => x + 1) };
}

export function PageState({ st, children }) {
  if (st.error) return (
    <div className="card">
      <h2>We couldn’t load this page</h2>
      <p className="muted">Check your Supabase settings, the table names in adminConfig.js, and that supabase-admin.sql has been run.</p>
      <p className="muted"><small>{String(st.error.message || st.error)}</small></p>
    </div>
  );
  if (!st.data) return <p className="sub">Loading…</p>;
  return children(st.data);
}

/* ---------- small presentational pieces ---------- */
export const Badge = ({ s, cls }) => <span className={'badge b-' + String(cls || s).toLowerCase()}>{STATUS_LABEL[s] || s}</span>;
export const RoleBadge = ({ r }) => <span className={'badge b-' + r}>{roleLabel(r)}</span>;
export const Empty = ({ children }) => <div className="empty">{children}</div>;
export const NotFound = ({ what, to, label = 'Go back' }) => (
  <>
    <Link className="back" to={to}>{label}</Link>
    <div className="card"><h2>We couldn’t find that {what}</h2><p className="muted">It may have been removed. Go back and pick another one.</p></div>
  </>
);
