import React, { useEffect,useState } from "react";
import { Outlet, NavLink, useNavigate, Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext.jsx";
import { getLeaderboardSettings } from "../../api.js";
import styles from "./UserLayout.module.css";

export default function UserLayout() {
  const { user, logout, refreshUser } = useUser();
  const navigate = useNavigate();
  const [leaderboardVisible, setLeaderboardVisible] = useState(true);

  useEffect(() => {
    if (user?.username) {
      refreshUser();
      
      const fetchSettings = () => {
        getLeaderboardSettings().then(res => setLeaderboardVisible(res.visible)).catch(() => {});
      };
      fetchSettings();

      const interval = setInterval(() => {
        refreshUser();
        fetchSettings();
      }, 15000); // 15s polling
      return () => clearInterval(interval);
    }
  }, [user?.username, refreshUser]);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className={styles.layout}>
      {/* Top Nav */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🏏</span>
            <span className={styles.logoText}>IPL Predictor</span>
          </div>

          <nav className={styles.nav}>
            <NavLink
              to="/app/quiz"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span>⚡</span> Today's Quiz
            </NavLink>
            <NavLink
              to="/app/history"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              <span>📜</span> Records
            </NavLink>
            {leaderboardVisible && (
              <NavLink
                to="/app/leaderboard"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
              >
                <span>🏆</span> Leaderboard
              </NavLink>
            )}
          </nav>

          <div className={styles.userArea}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user.displayName}</span>
                <span className={styles.userScore}>{user.totalScore} pts</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Exit
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className={styles.mobileNav}>
        <NavLink
          to="/app/quiz"
          className={({ isActive }) =>
            `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`
          }
        >
          <span className={styles.mobileNavIcon}>⚡</span>
          <span>Quiz</span>
        </NavLink>
        <NavLink
          to="/app/history"
          className={({ isActive }) =>
            `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`
          }
        >
          <span className={styles.mobileNavIcon}>📜</span>
          <span>Records</span>
        </NavLink>
        {leaderboardVisible && (
          <NavLink
            to="/app/leaderboard"
            className={({ isActive }) =>
              `${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`
            }
          >
            <span className={styles.mobileNavIcon}>🏆</span>
            <span>Board</span>
          </NavLink>
        )}
        {/* <button
          className={styles.mobileNavLink}
          onClick={handleLogout}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <span className={styles.mobileNavIcon}>🚪</span>
          <span>Exit</span>
        </button> */}
      </nav>

      {/* Main content */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
