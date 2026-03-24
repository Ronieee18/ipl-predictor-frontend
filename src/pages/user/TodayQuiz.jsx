import React, { useEffect, useState, useRef } from "react";
import { useUser } from "../../context/UserContext.jsx";
import { getActiveQuestions, getActiveStatus, submitAnswer } from "../../api.js";
import styles from "./TodayQuiz.module.css";

function formatTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function TodayQuiz() {
  const { user } = useUser();
  const [questions, setQuestions] = useState([]);
  const [statuses, setStatuses] = useState({}); // { qId: { answered, answer } }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Independent state per question
  const [selectedOptions, setSelectedOptions] = useState({}); // { qId: optionIndex }
  const [submitting, setSubmitting] = useState({}); // { qId: boolean }
  const [results, setResults] = useState({}); // { qId: resultObj }
  const [started, setStarted] = useState({}); // { qId: boolean }

  function startPrediction(qId) {
    setStarted((prev) => ({ ...prev, [qId]: true }));
    
    // Play IPL sound
    const audio = new Audio('/ipl.mp3');
    audio.play().catch(e => console.log('Audio playback prevented:', e));
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [qs, s] = await Promise.all([
        getActiveQuestions().catch(() => []),
        getActiveStatus(user._id).catch(() => ({ hasQuestions: false, statuses: {} })),
      ]);
      
      setQuestions(qs || []);
      setStatuses(s.statuses || {});

      if (qs && qs.length > 0) {
        // No timer needed anymore.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(questionId) {
    const selected = selectedOptions[questionId];
    if (selected === undefined || selected === null) return;

    setSubmitting((prev) => ({ ...prev, [questionId]: true }));
    
    try {
      const res = await submitAnswer({
        userId: user._id,
        questionId,
        selectedOption: selected,
      });
      
      setResults((prev) => ({ ...prev, [questionId]: { ...res, isEvaluated: false } }));
      
      setStatuses((prev) => ({
        ...prev,
        [questionId]: {
          answered: true,
          answer: {
            selectedOption: selected,
            isEvaluated: false,
            submittedAt: res.submittedAt,
          },
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting((prev) => ({ ...prev, [questionId]: false }));
    }
  }

  // ─── States ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading active questions…</span>
      </div>
    );
  }

  // No questions active right now
  if (!questions || questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏏</div>
        <h2 className={styles.emptyTitle}>No Active Matches</h2>
        <p className={styles.emptyText}>
          There are currently no active matches available for prediction. Check back soon — the
          admin will upload them before the matches!
        </p>
        <div className={styles.emptyMeta}>
          Matches only appear during their scheduled start and end times.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {error && (
        <div className="error-box" style={{ marginBottom: "1rem" }}>
          <span>⚠</span> {error}
        </div>
      )}

      {questions.map((question) => {
        const qId = question._id;
        const status = statuses[qId] || {};
        const alreadyAnswered = status.answered && !results[qId];
        const prevAnswer = status.answer;
        const result = results[qId];
        const selected = selectedOptions[qId];
        const isSubmitting = submitting[qId];

        return (
          <div key={qId} style={{ marginBottom: "2rem" }}>
            {/* Match header */}
            <div className={styles.matchBanner}>
              <div className={styles.matchBadge}>
                <span>⏳</span>
                <span>
                  {new Date(question.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(question.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <h1 className={styles.matchTitle}>{question.matchTitle}</h1>
              <div className={styles.matchMeta}>
                <span className="badge badge-gold">
                  +{question.maxPoints} pts base
                </span>
                {/* <span className="badge badge-blue">Speed bonus up to +5</span> */}
              </div>
            </div>

            {/* Already answered state */}
            {alreadyAnswered && (
              <div className={styles.answeredCard}>
                <div className={styles.answeredHeader}>
                  <span className={styles.answeredIcon}>
                    {!prevAnswer.isEvaluated ? "⏳" : prevAnswer.isCorrect ? "✅" : "❌"}
                  </span>
                  <div>
                    <h2 className={styles.answeredTitle}>
                      {!prevAnswer.isEvaluated
                        ? "Prediction Locked In!"
                        : prevAnswer.isCorrect
                        ? "Correct Prediction!"
                        : "Wrong Prediction"}
                    </h2>
                    <p className={styles.answeredSub}>
                      {!prevAnswer.isEvaluated
                        ? "Waiting for the match to end for results"
                        : "You've already answered this question"}
                    </p>
                  </div>
                </div>
                {prevAnswer.isEvaluated && (
                  <div className={styles.resultStats}>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-gold)" }}>
                        +{prevAnswer.pointsAwarded}
                      </span>
                      <span className={styles.resultStatLabel}>Points Earned</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-blue)", fontSize: "1.2rem" }}>
                        {formatTime(prevAnswer.submittedAt || new Date())}
                      </span>
                      <span className={styles.resultStatLabel}>Submitted At</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue}>
                        {prevAnswer.isCorrect ? "✓" : "✗"}
                      </span>
                      <span className={styles.resultStatLabel}>Outcome</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Just submitted result */}
            {result && (
              <div className={`${styles.resultCard} ${styles.resultPending}`}>
                <div className={styles.resultEmoji}>⏳</div>
                <h2 className={styles.resultTitle}>Prediction Locked In!</h2>
                <p className={styles.resultAnswer}>
                  Your choice has been saved. The results will be updated after the match ends.
                </p>
                <div className={styles.resultStats}>
                  <div className={styles.resultStat}>
                    <span className={styles.resultStatValue} style={{ color: "var(--accent-blue)", fontSize: "1.2rem" }}>
                      {formatTime(result.submittedAt || new Date())}
                    </span>
                    <span className={styles.resultStatLabel}>Submitted At</span>
                  </div>
                </div>
              </div>
            )}

            {/* Question card */}
            <div className={styles.questionCard} style={{ marginTop: alreadyAnswered || result ? '1rem' : '0' }}>

              <p className={styles.questionLabel}>Match Prediction</p>

              {!status.answered && !result && !started[qId] ? (
                <div style={{ textAlign: "center", margin: "2rem 0" }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => startPrediction(qId)}
                    style={{
                      width: "100%",
                      maxWidth: "300px",
                      margin: "0 auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span>▶</span> Play Prediction
                  </button>
                  <p className={styles.submitHint} style={{ marginTop: "1rem" }}>
                    Once locked in, your submission time is final!
                  </p>
                </div>
              ) : (
                <>
                  <h2 className={styles.questionText}>{question.question}</h2>

                  <div className={styles.options}>
                {question.options.map((opt, i) => {
                  let optClass = styles.option;
                  if (alreadyAnswered || result) {
                    const isEval = alreadyAnswered ? prevAnswer.isEvaluated : false;
                    const correctIdx = question.correctOption ?? null;
                    const userIdx = alreadyAnswered ? prevAnswer.selectedOption : selected;
                    
                    if (isEval && correctIdx !== null && i === correctIdx)
                      optClass += ` ${styles.optionCorrect}`;
                    else if (isEval && i === userIdx && !prevAnswer.isCorrect)
                      optClass += ` ${styles.optionWrong}`;
                    else if (i === userIdx)
                      optClass += ` ${styles.optionSelected}`;
                    else optClass += ` ${styles.optionDimmed}`;
                  } else {
                    if (selected === i) optClass += ` ${styles.optionSelected}`;
                  }
                  return (
                    <button
                      key={i}
                      className={optClass}
                      onClick={() => !alreadyAnswered && !result && setSelectedOptions(p => ({ ...p, [qId]: i }))}
                      disabled={alreadyAnswered || !!result}
                    >
                      <span className={styles.optionLetter}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className={styles.optionText}>{opt}</span>
                      {alreadyAnswered && prevAnswer.isEvaluated && i === question.correctOption && (
                        <span className={styles.optionBadge}>✓ Correct</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!alreadyAnswered && !result && (
                <>
                  <button
                    className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                    onClick={() => handleSubmit(qId)}
                    disabled={selected === undefined || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner"
                          style={{ width: 20, height: 20, borderWidth: 2 }}
                        />{" "}
                        Locking in…
                      </>
                    ) : (
                      <>
                        <span>🔒</span> Lock In Answer
                      </>
                    )}
                  </button>
                  <p className={styles.submitHint}>
                    You can only answer once — choose wisely!
                  </p>
                </>
              )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
