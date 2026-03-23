import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { joinUser } from "../api.js";
import styles from "./JoinPage.module.css";

export default function JoinPage() {
  const { user, login } = useUser();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If already logged in, redirect
  if (user) {
    return <Navigate to="/app/quiz" replace />;
  }

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!username.trim() || username.trim().length < 2) {
      setError("Enter at least 2 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userData = await joinUser(username.trim());
      login(userData);
      navigate("/app/quiz");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background cricket field lines */}
      <div className={styles.fieldLines} aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={styles.fieldLine} style={{ "--i": i }} />
        ))}
      </div>

      <div className={styles.container}>
        {/* Logo / Title */}
        <div className={styles.hero}>
          <div className={styles.iplBadge}>
            <span className={styles.iplIcon}>🏏</span>
            <span className={styles.iplLabel}>IPL 2025</span>
          </div>
          <h1 className={styles.title}>
            Match
            <br />
            <span className={styles.titleAccent}>Predictor</span>
          </h1>
          <p className={styles.subtitle}>
            Predict daily IPL match outcomes · Earn points · Climb the
            leaderboard
          </p>
        </div>

        {/* Stats teaser */}
        <div className={styles.statsRow}>
          {[
            { icon: "⚡", label: "Daily Questions", value: "1" },
            { icon: "🏆", label: "Points per Correct", value: "10+" },
            { icon: "🎁", label: "Season Prizes", value: "3" },
          ].map((s) => (
            <div key={s.label} className={styles.statItem}>
              <span className={styles.statIcon}>{s.icon}</span>
              <span className={styles.statValue}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Join form */}
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Enter the Arena</h2>
          <p className={styles.formSub}>Log in with your company email</p>

          <form onSubmit={handleJoin} className={styles.form}>
            <div>
              <label className="input-label" htmlFor="username">
                Company Email
              </label>
              <input
                id="username"
                className="input"
                type="email"
                placeholder="name@company.com"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                maxLength={60}
                autoFocus
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="error-box">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <span
                    className="spinner"
                    style={{ width: 20, height: 20, borderWidth: 2 }}
                  />{" "}
                  Entering…
                </>
              ) : (
                <>
                  <span>🚀</span> Enter the Arena
                </>
              )}
            </button>
          </form>

          <div className={styles.adminLink}>
            <a href="/admin" className={styles.adminLinkText}>
              ⚙ Admin Panel
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
