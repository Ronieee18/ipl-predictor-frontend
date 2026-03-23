import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAdmin } from "../../context/AdminContext.jsx";
import { adminGetAnalytics } from "../../api.js";
import styles from "./AdminDashboard.module.css";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}:{" "}
          <strong>
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div
      className={styles.statCard}
      style={{ "--accent": accent || "var(--accent-gold)" }}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { adminSecret, adminLogout } = useAdmin();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await adminGetAnalytics(adminSecret);
      setData(res);
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        adminLogout();
      }
      setError("Cannot reach backend: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading analytics…</span>
      </div>
    );
  if (error)
    return (
      <div style={{ padding: 40 }}>
        <div className="error-box">
          <span>⚠</span> {error}
        </div>
        <button
          className="btn btn-secondary"
          style={{ marginTop: 16 }}
          onClick={load}
        >
          ↻ Retry
        </button>
      </div>
    );
  if (!data) return null;

  const {
    summary,
    perQuestion = [],
    dailyParticipation = [],
    recentActivity = [],
    top10 = [],
  } = data;

  const dailyChartData = [...dailyParticipation].reverse().map((d) => ({
    date: d.date ? d.date.slice(5) : "",
    Participants: d.participantCount || 0,
    Correct: d.correctAnswers || 0,
  }));

  const questionChartData = perQuestion.map((q) => ({
    match: (q.matchTitle || "").split(" v")[0].trim().slice(0, 10),
    Accuracy: Math.round(q.accuracy || 0),
    Responses: q.totalResponses || 0,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Dashboard</h1>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          ↻ Refresh
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          icon="👥"
          label="Total Players"
          value={summary?.totalUsers ?? 0}
          accent="var(--accent-blue)"
        />
        <StatCard
          icon="❓"
          label="Questions Posted"
          value={summary?.totalQuestions ?? 0}
          accent="var(--accent-purple)"
        />
        <StatCard
          icon="📝"
          label="Total Answers"
          value={summary?.totalAnswers ?? 0}
          accent="var(--accent-gold)"
        />
        <StatCard
          icon="🎯"
          label="Overall Accuracy"
          value={`${summary?.overallAccuracy ?? 0}%`}
          sub="across all answers"
          accent="var(--accent-green)"
        />
      </div>

      <div className={styles.chartsRow}>
        <div className="card" style={{ flex: 2 }}>
          <h2 className={styles.chartTitle}>Daily Participation</h2>
          {dailyChartData.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: 40,
              }}
            >
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={dailyChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8890ab", fontSize: 11 }}
                />
                <YAxis tick={{ fill: "#8890ab", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="Participants"
                  stroke="#3d7eff"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Correct"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card" style={{ flex: 1 }}>
          <h2 className={styles.chartTitle}>Question Accuracy %</h2>
          {questionChartData.length === 0 ? (
            <div
              style={{
                color: "var(--text-muted)",
                textAlign: "center",
                padding: 40,
              }}
            >
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={questionChartData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="match"
                  tick={{ fill: "#8890ab", fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#8890ab", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Accuracy" fill="#f4b942" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={styles.tableRow}>
        <div className="card" style={{ flex: 3 }}>
          <h2 className={styles.chartTitle}>Per-Question Stats</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Date</th>
                  <th>Responses</th>
                  <th>Accuracy</th>
                  <th>Avg Time</th>
                  <th>Fastest</th>
                </tr>
              </thead>
              <tbody>
                {perQuestion.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: 24,
                      }}
                    >
                      No data yet
                    </td>
                  </tr>
                ) : (
                  perQuestion.map((q) => (
                    <tr key={q._id}>
                      <td>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: "0.88rem",
                          }}
                        >
                          {q.matchTitle}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {(q.question || "").slice(0, 50)}…
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-muted">{q.matchDate}</span>
                      </td>
                      <td>{q.totalResponses}</td>
                      <td>
                        <span
                          style={{
                            color:
                              q.accuracy >= 70
                                ? "var(--accent-green)"
                                : q.accuracy >= 40
                                  ? "var(--accent-gold)"
                                  : "var(--accent-red)",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                          }}
                        >
                          {Math.round(q.accuracy)}%
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {q.avgTimeSec}s
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.85rem",
                            color: "var(--accent-green)",
                          }}
                        >
                          {q.minTimeSec}s
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: 2 }}>
          <h2 className={styles.chartTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            {recentActivity.length === 0 ? (
              <div
                style={{
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: 24,
                }}
              >
                No activity yet
              </div>
            ) : (
              recentActivity.map((a) => (
                <div key={a._id} className={styles.activityItem}>
                  <span
                    className={styles.activityDot}
                    style={{
                      background: a.isCorrect
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                    }}
                  />
                  <div className={styles.activityBody}>
                    <div className={styles.activityUser}>
                      {a.userId?.displayName ?? "Unknown"}
                    </div>
                    <div className={styles.activityMatch}>
                      {a.questionId?.matchTitle ?? "—"}
                    </div>
                  </div>
                  <div className={styles.activityRight}>
                    <span
                      style={{
                        color: a.isCorrect
                          ? "var(--accent-green)"
                          : "var(--accent-red)",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                      }}
                    >
                      {a.isCorrect ? `+${a.pointsAwarded}` : "0"}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {new Date(a.submittedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className={styles.chartTitle}>🏆 Top 10 Players</h2>
        {top10.length === 0 ? (
          <div
            style={{
              color: "var(--text-muted)",
              textAlign: "center",
              padding: 24,
            }}
          >
            No players yet
          </div>
        ) : (
          <div className={styles.top10Grid}>
            {top10.map((u, i) => (
              <div key={u._id} className={styles.top10Item}>
                <span className={styles.top10Rank}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </span>
                <span className={styles.top10Name}>{u.displayName}</span>
                <span className={styles.top10Score}>{u.totalScore} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
