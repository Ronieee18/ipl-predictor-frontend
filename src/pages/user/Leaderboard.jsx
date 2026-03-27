import React, { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext.jsx";
import { getLeaderboard } from "../../api.js";
import styles from "./Leaderboard.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

function formatDelay(ms) {
  if (!ms || ms === Infinity) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function Leaderboard() {
  const { user } = useUser();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("overall");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  });

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [filter, selectedDate, startDate, endDate]);

  async function load() {
    setData([]);
    setLoading(true);
    try {
      const res = await getLeaderboard(
        filter, 
        filter === 'daily' ? selectedDate : null,
        filter === 'weekly' ? startDate : null,
        filter === 'weekly' ? endDate : null
      );
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const myEntry = data.find(
    (d) => d._id === user._id || d.username === user.username,
  );
  const myRank = myEntry?.rank;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading leaderboard…</span>
      </div>
    );
  }

  if (error) {
    if (error.includes('hidden')) {
      return (
        <div className="error-box" style={{ margin: "40px auto", maxWidth: 500, padding: 30, textAlign: 'center', background: 'var(--bg-mid)', border: '1px solid var(--border)', fontSize: '1.1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🙈</div>
          <div>{error}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Check back later!</div>
        </div>
      );
    }
    return (
      <div className="error-box" style={{ margin: "40px auto", maxWidth: 500 }}>
        <span>⚠</span> {error}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>🏆 Leaderboard</h1>
          <p className={styles.subtitle}>
            Rankings updated in real-time · Tie-broken by average response delay
          </p>
          <div className={styles.filterGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className={`${styles.filterBtn} ${filter === 'daily' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('daily')}>
                1D Fastest
              </button>
              {filter === 'daily' && (
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ 
                    background: 'var(--bg-mid)', 
                    color: 'var(--text-main)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    padding: '4px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem'
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className={`${styles.filterBtn} ${filter === 'weekly' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('weekly')}>
                Weekly Fastest
              </button>
              {filter === 'weekly' && (
                <>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ 
                      background: 'var(--bg-mid)', 
                      color: 'var(--text-main)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '4px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem'
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>to</span>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ 
                      background: 'var(--bg-mid)', 
                      color: 'var(--text-main)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '4px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem'
                    }}
                  />
                </>
              )}
            </div>
            <button className={`${styles.filterBtn} ${filter === 'overall' ? styles.filterBtnActive : ''}`} onClick={() => setFilter('overall')}>
              Overall Fastest
            </button>
          </div>
        </div>
        {myRank && (
          <div className={styles.myRankCard}>
            <span className={styles.myRankLabel}>Your Rank</span>
            <span className={styles.myRankValue}>#{myRank}</span>
            <span className={styles.myRankScore}>{myEntry.totalScore} pts</span>
          </div>
        )}
      </div>

      {/* Top 3 podium */}
      {data.length >= 3 && (
        <div className={styles.podium}>
          {[data[1], data[0], data[2]].map((entry, podiumIdx) => {
            const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const heights = ["120px", "150px", "100px"];
            return (
              <div
                key={entry._id}
                className={`${styles.podiumItem} ${actualRank === 1 ? styles.podiumFirst : ""}`}
                style={{ "--height": heights[podiumIdx] }}
              >
                <div className={styles.podiumAvatar}>
                  {entry.displayName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.podiumName}>{entry.displayName}</div>
                <div className={styles.podiumScore}>{entry.totalScore}</div>
                <div
                  className={styles.podiumBar}
                  style={{ height: heights[podiumIdx] }}
                >
                  <span className={styles.podiumMedal}>
                    {MEDALS[actualRank - 1]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {data.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📊</div>
          <p>No entries yet. Be the first to answer!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Accuracy</th>
                  <th>Avg Delay</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry) => {
                  const isMe =
                    entry._id === user._id || entry.username === user.username;
                  return (
                    <tr key={entry._id} className={isMe ? styles.myRow : ""}>
                      <td>
                        {entry.rank <= 3 ? (
                          <span style={{ fontSize: "1.2rem" }}>
                            {MEDALS[entry.rank - 1]}
                          </span>
                        ) : (
                          <span className={styles.rankNum}>#{entry.rank}</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.playerCell}>
                          <div className={styles.playerAvatar}>
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.playerName}>
                              {entry.displayName}
                              {isMe && (
                                <span
                                  className="badge badge-gold"
                                  style={{ marginLeft: 8 }}
                                >
                                  You
                                </span>
                              )}
                            </div>
                            <div className={styles.playerUsername}>
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.scoreValue}>
                          {entry.totalScore}
                        </span>
                      </td>
                      <td>
                        <span>
                          {entry.correctAnswers}/{entry.totalAnswered}
                        </span>
                      </td>
                      <td>
                        <div className={styles.accuracyBar}>
                          <div
                            className={styles.accuracyFill}
                            style={{
                              width: `${entry.accuracy}%`,
                              background:
                                entry.accuracy >= 70
                                  ? "var(--accent-green)"
                                  : entry.accuracy >= 40
                                    ? "var(--accent-gold)"
                                    : "var(--accent-red)",
                            }}
                          />
                          <span className={styles.accuracyText}>
                            {entry.accuracy}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.speedValue}
                          style={{ color: "var(--accent-blue)" }}
                        >
                          {formatDelay(entry.avgTimeMs)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className={styles.refreshNote}>🔄 Auto-refreshes every 30 seconds</p>
    </div>
  );
}
