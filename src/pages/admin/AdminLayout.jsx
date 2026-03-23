import React from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import styles from './AdminLayout.module.css';

const NAV_ITEMS = [
  { to: '/admin/panel/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/panel/add-question', icon: '➕', label: 'Add Question' },
  { to: '/admin/panel/questions', icon: '❓', label: 'All Questions' },
  { to: '/admin/panel/leaderboard', icon: '🏆', label: 'Leaderboard' },
];

export default function AdminLayout() {
  const { adminSecret, adminLogout } = useAdmin();
  const navigate = useNavigate();

  if (!adminSecret) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>
            <span>🏏</span>
            <div>
              <div className={styles.logoTitle}>IPL Predictor</div>
              <div className={styles.logoSub}>Admin Console</div>
            </div>
          </div>
          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className={styles.sidebarBottom}>
          <a href="/app/quiz" className={styles.viewUser}>
            <span>👤</span> View User App
          </a>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <div className={styles.mobileLogo}>🏏 Admin</div>
        <nav className={styles.mobileNav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ''}`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}