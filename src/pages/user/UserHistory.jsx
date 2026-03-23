import React, { useEffect, useState } from "react";
import { getUserHistory } from "../../api.js";
import { useUser } from "../../context/UserContext.jsx";
import styles from "./TodayQuiz.module.css"; // Reuse similar UI styles

function formatTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function UserHistory() {
  const { user } = useUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getUserHistory(user._id);
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user._id]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading past records…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="error-box">
          <span>⚠</span> {error}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📜</div>
          <h2 className={styles.emptyTitle}>No Past Records</h2>
          <p className={styles.emptyText}>
            You haven't predicted any matches yet. Go to today's quiz to start making predictions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.5rem", marginBottom: "1rem" }}>
        Past Records
      </h1>

      {history.map((record) => {
        const question = record.questionId || {}; // in case question is deleted
        const isEval = question.isEvaluated;
        const correctOpt = question.correctOption;
        const userOpt = record.selectedOption;
        
        // Use provided values or fallback
        const isCorrect = record.isCorrect;
        const points = record.pointsAwarded;
        const submittedAt = record.submittedAt;

        return (
          <div key={record._id} style={{ marginBottom: "2rem" }}>
            <div className={styles.matchBanner}>
              <div className={styles.matchBadge}>
                <span>🏏</span>
                <span>
                  {question.startTime ? new Date(question.startTime).toLocaleDateString() : 'Unknown Date'}
                </span>
              </div>
              <h2 className={styles.matchTitle}>{question.matchTitle || 'Match Unavailable'}</h2>
            </div>

            <div className={styles.questionCard} style={{ marginTop: '1rem', padding: '24px' }}>
              <p className={styles.questionLabel}>Question</p>
              <h3 className={styles.questionText} style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                {question.question || 'Question deleted'}
              </h3>
              
              <div className={styles.options}>
                {(question.options || []).map((opt, i) => {
                  let optClass = styles.option;
                  
                  if (isEval && correctOpt !== null && i === correctOpt) {
                    optClass += ` ${styles.optionCorrect}`;
                  } else if (isEval && i === userOpt && !isCorrect) {
                    optClass += ` ${styles.optionWrong}`;
                  } else if (i === userOpt) {
                    optClass += ` ${styles.optionSelected}`;
                  } else {
                    optClass += ` ${styles.optionDimmed}`;
                  }

                  return (
                    <div key={i} className={optClass} style={{ cursor: 'default' }}>
                      <span className={styles.optionLetter}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={styles.optionText}>{opt}</span>
                      {isEval && i === correctOpt && (
                        <span className={styles.optionBadge}>✓ Correct Answer</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Section */}
              <div className={styles.answeredCard} style={{ marginTop: '1.5rem', padding: '16px 20px' }}>
                <div className={styles.answeredHeader} style={{ marginBottom: isEval ? '16px' : '0' }}>
                  <span className={styles.answeredIcon}>
                    {!isEval ? "⏳" : isCorrect ? "✅" : "❌"}
                  </span>
                  <div>
                    <h4 className={styles.answeredTitle}>
                      {!isEval
                        ? "Pending Evaluation"
                        : isCorrect
                        ? "Correct Prediction!"
                        : "Wrong Prediction"}
                    </h4>
                    <p className={styles.answeredSub}>
                      {!isEval
                        ? "Waiting for match results."
                        : `You answered Option ${String.fromCharCode(65 + userOpt)}`}
                    </p>
                  </div>
                </div>

                {isEval && (
                  <div className={styles.resultStats} style={{ gap: '24px' }}>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-gold)", fontSize: '1.4rem' }}>
                        +{points}
                      </span>
                      <span className={styles.resultStatLabel}>Points Earned</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-blue)", fontSize: '1.4rem' }}>
                        {formatTime(submittedAt || new Date())}
                      </span>
                      <span className={styles.resultStatLabel}>Submitted At</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
