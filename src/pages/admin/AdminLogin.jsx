import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext.jsx';
import styles from './AdminLogin.module.css';

import { adminVerify } from '../../api.js';

export default function AdminLogin() {
  const { adminSecret, adminLogin } = useAdmin();
  const navigate = useNavigate();
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (adminSecret) {
    return <Navigate to="/admin/panel/dashboard" replace />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (!secret.trim()) { setError('Enter the admin secret'); return; }
    setLoading(true);
    setError('');

    const tryLogin = async () => {
      try {
        await adminVerify(secret.trim());
        adminLogin(secret.trim());
        navigate('/admin/panel/dashboard');
      } catch (err) {
        setError('Invalid admin secret. Try again.');
      } finally {
        setLoading(false);
      }
    };
    tryLogin();
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>⚙️</div>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.sub}>Enter the admin secret to access HR dashboard</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div>
            <label className="input-label" htmlFor="secret">Admin Secret</label>
            <input
              id="secret"
              className="input"
              type="password"
              placeholder="Enter secret key"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          {error && <div className="error-box"><span>⚠</span> {error}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</>
              : '→ Access Dashboard'}
          </button>
        </form>

        <a href="/" className={styles.backLink}>← Back to user app</a>
      </div>
    </div>
  );
}