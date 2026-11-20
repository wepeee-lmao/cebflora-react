import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { House, Users, SlidersHorizontal, FileSearch, Gamepad2, Settings, Bell, Search, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../lib/usePageTitle';
import logo from '../assets/icons/ceblogo.svg';

// One place to add / rename sidebar pages. `roles` limits who sees an item.
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home',              Icon: House },
  { path: '/curators',  label: 'Community',         Icon: Users },
  { path: '/taxonomy',  label: 'Browse Taxonomy',   Icon: SlidersHorizontal },
  { path: '/compare',   label: 'Compare Specimens', Icon: FileSearch },
  { path: '/quiz',      label: 'Taxonomy Quiz',     Icon: Gamepad2 },
  { path: '/manage',    label: 'Manage Plants',     Icon: Sprout, roles: ['curator', 'admin'] },
];
const SETTINGS_ITEM = { path: '/profile', label: 'Settings', Icon: Settings };

// Which sidebar item should light up for the current URL
function activePath(pathname, from) {
  if (pathname.startsWith('/manage')) return '/manage';
  if (pathname.startsWith('/plants/')) return from === 'manage' ? '/manage' : '/taxonomy';
  if (pathname === '/saved') return '/dashboard';
  return pathname;
}

// Title shown at the left of the top bar
function titleFor(pathname) {
  if (pathname === '/dashboard') return 'Home';
  if (pathname === '/saved') return 'Saved Plants';
  if (pathname.startsWith('/plants/')) return 'Plant Information';
  if (pathname === '/manage') return 'Manage Plants';
  if (pathname === '/manage/new') return 'Add Plant';
  if (pathname.startsWith('/manage/')) return 'Edit Plant';
  const hit = [...NAV_ITEMS, SETTINGS_ITEM].find((i) => i.path === pathname);
  return hit ? hit.label : 'CebFlora';
}

// Detail and edit pages use the plain dark-green background from the design
const isPlainPage = (pathname) => pathname.startsWith('/plants/') || pathname.startsWith('/manage/');

// Defined outside DashboardLayout so React doesn't rebuild it on every render.
function NavItem({ item, active, onClick, iconOnly = false }) {
  const { Icon } = item;
  return (
    <button
      type="button"
      className={`nav-item${active ? ' active' : ''}${iconOnly ? ' icon-only' : ''}`}
      title={item.label}
      onClick={onClick}
    >
      <Icon size={iconOnly ? 38 : 30} strokeWidth={iconOnly ? 2.2 : 2} />
      {!iconOnly && <span className="nav-label">{item.label}</span>}
    </button>
  );
}

export default function DashboardLayout() {
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const [openPanel, setOpenPanel] = useState(null); // 'notif' | 'account' | null

  const pageTitle = titleFor(pathname);
  usePageTitle(`CebFlora — ${pageTitle}`);

  const navItems = NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(profile?.role));
  const current = activePath(pathname, state?.from);

  const togglePanel = (name) => setOpenPanel((p) => (p === name ? null : name));
  const goTo = (path) => { setOpenPanel(null); navigate(path); };

  const handleLogOut = async () => {
    await logOut();
    navigate('/login');
  };

  // Avatar: shows an image if profile.avatar_url is a web address,
  // otherwise the first letter of the name.
  const initial = (profile?.full_name || profile?.email || '?').charAt(0).toUpperCase();
  const hasImage = profile?.avatar_url?.startsWith('http');

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img className="sidebar-logo" src={logo} alt="CebFlora" />

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} active={current === item.path} onClick={() => goTo(item.path)} />
          ))}
        </nav>

        <div className="spacer"></div>

        <NavItem item={SETTINGS_ITEM} iconOnly active={current === SETTINGS_ITEM.path}
          onClick={() => goTo(SETTINGS_ITEM.path)} />
      </aside>

      <div className={`main-column${isPlainPage(pathname) ? ' plain' : ''}`}>
        <header className="topbar">
          <span className="page-title">{pageTitle}</span>

          <div className="search-box">
            <Search size={20} />
            <input type="text" placeholder="Search plant details..." />
          </div>

          <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => togglePanel('notif')}>
            <Bell size={26} fill="currentColor" />
          </button>

          <button type="button" className="avatar-btn" aria-label="Account menu" onClick={() => togglePanel('account')}>
            {hasImage ? <img src={profile.avatar_url} alt="" /> : <span>{initial}</span>}
          </button>

          {openPanel === 'notif' && (
            <div className="dropdown-panel">
              <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
              <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 8 }}>No new notifications.</p>
            </div>
          )}

          {openPanel === 'account' && (
            <div className="dropdown-panel">
              <div className="dropdown-email">{profile?.email}</div>
              <div className="dropdown-item" onClick={() => goTo('/profile')}>⚙ Settings</div>
              <div className="dropdown-item">◐ Switch Theme</div>
              <div className="dropdown-item">ⓘ Help and feedback</div>
              <hr style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
              <div className="dropdown-item" onClick={handleLogOut}>↪ Log Out</div>
            </div>
          )}
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
