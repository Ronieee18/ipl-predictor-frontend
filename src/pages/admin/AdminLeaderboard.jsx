import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { adminGetLeaderboard } from '../../api.js';
import styles from './AdminLeaderboard.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

function formatMs(ms) {
  if (!ms || ms === Infinity || ms === 0) return '—';
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function AdminLeaderboard() {
  const { adminSecret } = useAdmin();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('rank');
  const [filter, setFilter] = useState('overall');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setData([]);
    setLoading(true);
    try {
      const res = await adminGetLeaderboard(adminSecret, filter);
      setData(res);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const filtered = data.filter((u) =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    switch (sortKey) {
      case 'score': return b.totalScore - a.totalScore;
      case 'accuracy': return b.accuracy - a.accuracy;
      case 'speed': return (a.avgTimeMs || Infinity) - (b.avgTimeMs || Infinity);
      case 'answered': return b.totalAnswered - a.totalAnswered;
      default: return a.rank - b.rank;
    }
  });

  const exportCSV = () => {
    const header = ['Rank','Name','Username','Score','Correct','Total','Accuracy%','Avg Speed(s)','Fastest(s)'];
    const rows = sorted.map((u) => [u.rank, u.displayName, u.username, u.totalScore, u.correctAnswers, u.totalAnswered, u.accuracy, u.avgTimeMs ? (u.avgTimeMs/1000).toFixed(2) : '', u.fastestTimeMs ? (u.fastestTimeMs/1000).toFixed(2) : '']);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ipl-leaderboard.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading leaderboard…</span></div>;
  if (error) return <div className="error-box"><span>⚠</span> {error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🏆 Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>{data.length} players · Tie-broken by average response speed</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>

      <div className={styles.prizeBanner}>
        {[{ rank: '1st', prize: '🥇 Grand Prize', desc: 'Season Champion' }, { rank: '2nd', prize: '🥈 Runner-up', desc: '2nd Place Prize' }, { rank: '3rd', prize: '🥉 Third Place', desc: '3rd Place Prize' }].map((p) => (
          <div key={p.rank} className={styles.prizeItem}>
            <div className={styles.prizeRank}>{p.rank}</div>
            <div className={styles.prizeName}>{p.prize}</div>
            <div className={styles.prizeDesc}>{p.desc}</div>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.filterGroup}>
          <button className={`${styles.filterBtn} ${filter === 'daily' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('daily')}>
            1D Fastest
          </button>
          <button className={`${styles.filterBtn} ${filter === 'weekly' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('weekly')}>
            Weekly Fastest
          </button>
          <button className={`${styles.filterBtn} ${filter === 'overall' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('overall')}>
            Overall Fastest
          </button>
        </div>
        <input className="input" style={{ maxWidth: 280 }} placeholder="🔍 Search player…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className={styles.sortBtns}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-display)' }}>Sort by:</span>
          {[{ key: 'rank', label: 'Rank' }, { key: 'score', label: 'Score' }, { key: 'accuracy', label: 'Accuracy' }, { key: 'speed', label: 'Fastest' }, { key: 'answered', label: 'Answered' }].map((s) => (
            <button key={s.key} className={`btn btn-sm ${sortKey === s.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSortKey(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th style={{ width: 60 }}>Rank</th><th>Player</th><th>Score</th><th>Correct/Total</th><th>Accuracy</th><th>Avg Speed</th><th>Fastest</th></tr>
            </thead>
            <tbody>
              {sorted.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No players found</td></tr>}
              {sorted.map((u) => (
                <tr key={u._id}>
                  <td>{u.rank <= 3 ? <span style={{ fontSize: '1.2rem' }}>{MEDALS[u.rank - 1]}</span> : <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{u.rank}</span>}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={styles.avatar}>{u.displayName.charAt(0).toUpperCase()}</div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{u.displayName}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{u.totalScore}</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>{u.correctAnswers}/{u.totalAnswered}</span></td>
                  <td>
                    <div className={styles.accBar}>
                      <div className={styles.accFill} style={{ width: `${u.accuracy}%`, background: u.accuracy >= 70 ? 'var(--accent-green)' : u.accuracy >= 40 ? 'var(--accent-gold)' : 'var(--accent-red)' }} />
                      <span className={styles.accText}>{u.accuracy}%</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-blue)' }}>{formatMs(u.avgTimeMs)}</span></td>
                  <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-green)' }}>{formatMs(u.fastestTimeMs)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Tie-breaking rule: Equal scores → ranked by average response time (faster = higher)
      </p>
    </div>
  );
}