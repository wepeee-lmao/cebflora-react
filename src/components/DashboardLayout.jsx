import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../lib/usePageTitle';

// One place to add/rename sidebar pages.
const NAV_ITEMS = [
  { path: '/dashboard', title: 'Home',                  icon: '🏠' },
  { path: '/curators',  title: 'Platform Curators',     icon: '👥' },
  { path: '/taxonomy',  title: 'Browse Taxonomy',       icon: '🧬' },
  { path: '/compare',   title: 'Compare Specimens',     icon: '📋' },
  { path: '/identify',  title: 'Identification Wizard', icon: '🔍' },
  { path: '/quiz',      title: 'Taxonomy Quiz',         icon: '🎮' },
];
const SETTINGS_ITEM = { path: '/profile', title: 'Settings', icon: '⚙️' };

export default function DashboardLayout() {
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openPanel, setOpenPanel] = useState(null); // 'notif' | 'account' | null

  const current = [...NAV_ITEMS, SETTINGS_ITEM].find((i) => i.path === pathname);
  const pageTitle = current ? (current.path === '/dashboard' ? 'Home' : current.title) : 'CebFlora';
  usePageTitle(`CebFlora — ${pageTitle}`);

  // Opening one panel closes the other; clicking the open one closes it.
  const togglePanel = (name) => setOpenPanel((p) => (p === name ? null : name));

  const handleLogOut = async () => {
    await logOut();
    navigate('/login');
  };

  const NavIcon = ({ item }) => (
    <div
      className={`nav-icon${pathname === item.path ? ' active' : ''}`}
      title={item.title}
      onClick={() => navigate(item.path)}
    >
      {item.icon}
    </div>
  );

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="avatar"></div>
        {NAV_ITEMS.map((item) => <NavIcon key={item.path} item={item} />)}
        <div className="spacer"></div>
        <NavIcon item={SETTINGS_ITEM} />
      </nav>

      <div className="main-column">
        <header className="topbar" style={{ position: 'relative' }}>
          <span className="page-title">{pageTitle}</span>
          <div className="search-box">
            🔍 <input type="text" placeholder="Search plant details..." />
          </div>
          <div className="icon-btn" onClick={() => togglePanel('notif')}>🔔</div>
          <div className="account-chip" onClick={() => togglePanel('account')}>
            <div className="avatar-sm"></div>
            <span style={{ fontSize: '0.85rem' }}>{profile?.email ?? 'loading...'}</span>
            <span>⌄</span>
          </div>

          <div className={`dropdown-panel${openPanel === 'notif' ? '' : ' hidden'}`}>
            <strong style={{ fontSize: '0.85rem' }}>Notifications</strong>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: 8 }}>No new notifications.</p>
          </div>

          <div className={`dropdown-panel${openPanel === 'account' ? '' : ' hidden'}`}>
            <div className="dropdown-item" onClick={() => navigate('/profile')}>⚙ Settings</div>
            <div className="dropdown-item">◐ Switch Theme</div>
            <div className="dropdown-item">ⓘ Help and feedback</div>
            <hr style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
            <div className="dropdown-item" onClick={handleLogOut}>↪ Log Out</div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
