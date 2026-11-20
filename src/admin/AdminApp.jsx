import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './admin.css';
import { CONFIG } from './adminConfig';
import { db } from './adminDb';
import { AdminUIProvider, NotFound, useAdminUI } from './ui';
import Overview from './pages/Overview';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Records from './pages/Records';
import RecordDetail from './pages/RecordDetail';
import Roles from './pages/Roles';
import RoleList from './pages/RoleList';
import UserProfile from './pages/UserProfile';
import Report from './pages/Report';

// Mount this at <Route path="/admin/*" element={<AdminApp />} />
export default function AdminApp() {
  return (
    <div className="admin-root">
      <AdminUIProvider><Gate /></AdminUIProvider>
    </div>
  );
}

/* Admin / Developer Verification page: session + role check before anything is shown. */
function Gate() {
  const nav = useNavigate();
  const [state, setState] = useState({ status: 'checking' });

  useEffect(() => {
    let live = true;
    db.me().then(me => {
      if (!live) return;
      if (!me) return nav(CONFIG.LOGIN_PATH, { replace: true });
      setState(me.role === CONFIG.ADMIN_ROLE ? { status: 'ok', me } : { status: 'denied' });
    }).catch(error => live && setState({ status: 'error', error }));
    return () => { live = false; };
  }, [nav]);

  if (state.status === 'ok') return <Shell me={state.me} />;
  return (
    <div className="gate"><div className="card">
      <div className="verify-eyebrow">ADMIN VERIFICATION</div>
      {state.status === 'checking' && <><h1>Checking your access</h1><p className="muted">One moment.</p></>}
      {state.status === 'denied' && <><h1>Administrators only</h1><p className="muted">Your account does not have admin access.</p>
        <div className="actions" style={{ justifyContent: 'center' }}><a className="abtn abtn-primary" href={CONFIG.LOGIN_PATH}>Back to login</a></div></>}
      {state.status === 'error' && <><h1>We couldn’t verify your access</h1><p className="muted">Check your Supabase URL, key and users table.</p>
        <p className="muted"><small>{String(state.error.message || state.error)}</small></p></>}
    </div></div>
  );
}

const TITLES = [
  [/^\/applications\/.+/, 'Application review'], [/^\/applications/, 'Curator applications'],
  [/^\/records\/.+/, 'Record review'], [/^\/records/, 'Plant records'],
  [/^\/(roles|users)/, 'User roles'], [/^\/report/, 'Curator views report']
];
const NAV = [
  ['', 'Overview', 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10'],
  ['/applications', 'Applications', 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6'],
  ['/records', 'Plant records', 'M12 21V11M12 11C12 6 8 4 4 4c0 4 2 7 8 7zM12 14c0-4 3-6 8-6 0 4-3 7-8 6z'],
  ['/roles', 'User roles', 'M2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6M17 4.5a3.5 3.5 0 0 1 0 7M21.5 20c0-3-1.5-5-4-5.8M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z'],
  ['/report', 'Views report', 'M4 20V10M10 20V4M16 20v-7M22 20H2']
];

function Shell({ me }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { toast } = useAdminUI();
  const main = useRef();
  const rel = pathname.replace(CONFIG.BASE, '') || '/';
  const title = (TITLES.find(([re]) => re.test(rel)) || [null, 'Overview'])[1];

  useEffect(() => { document.title = `${title} | CebFlora Admin`; }, [title]);
  useEffect(() => { window.scrollTo(0, 0); if (main.current) main.current.focus({ preventScroll: true }); }, [pathname]);

  async function logout() {
    await db.signOut();
    if (db.demo) toast('Demo mode: you would be signed out here.'); else nav(CONFIG.LOGIN_PATH);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Admin navigation">
        <div className="avatar" aria-hidden="true">CF</div>
        {NAV.map(([path, label, d]) => (
          <NavLink key={label} end={path === ''} to={CONFIG.BASE + path} className={({ isActive }) => 'nav-icon' + (isActive ? ' active' : '')}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg><span>{label}</span>
          </NavLink>
        ))}
        <div className="spacer" />
        <button className="nav-icon logout" type="button" onClick={logout}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg><span>Log out</span>
        </button>
      </aside>
      <div className="main-column">
        {db.demo && <div className="demo-banner">Demo mode: you are seeing sample data. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to connect.</div>}
        <header className="topbar">
          <div className="page-title">{title}</div>
          <div className="grow" />
          <div className="who">{me.email || me.name}</div>
        </header>
        <main className="content-area" ref={main} tabIndex={-1}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="records" element={<Records />} />
            <Route path="records/:id" element={<RecordDetail />} />
            <Route path="roles" element={<Roles />} />
            <Route path="roles/:role" element={<RoleList />} />
            <Route path="users/:id" element={<UserProfile />} />
            <Route path="report" element={<Report />} />
            <Route path="*" element={<NotFound what="page" to={CONFIG.BASE} label="Back to overview" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
