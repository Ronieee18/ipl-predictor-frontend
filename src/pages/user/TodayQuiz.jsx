import React, { useEffect, useState } from "react";
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
  const [results, setResults] = useState({}); // { qId: resultObj }
  
  // State per group
  const [startedGroup, setStartedGroup] = useState({}); // { gId: boolean }
  const [submittingGroup, setSubmittingGroup] = useState({}); // { gId: boolean }

  function startGroupPrediction(gId) {
    setStartedGroup((prev) => ({ ...prev, [gId]: true }));
  }

  useEffect(() => {
    load();
    const audio = new Audio('/ipl2.mp3');
    audio.play().catch(e => console.log('Audio playback prevented:', e));
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const [qs, s] = await Promise.all([
        getActiveQuestions().catch(() => []),
        getActiveStatus(user._id).catch(() => ({ hasQuestions: false, statuses: {} })),
      ]);
      setQuestions(qs || []);
      setStatuses(s.statuses || {});
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleGroupSubmit(group) {
    const gId = group.groupId;
    
    // Validate all selected
    for(const q of group.questions) {
      if(selectedOptions[q._id] === undefined) return;
    }

    setSubmittingGroup((prev) => ({ ...prev, [gId]: true }));
    setError("");
    
    try {
      // Submit all concurrently
      const promises = group.questions.map(q => 
        submitAnswer({
          userId: user._id,
          questionId: q._id,
          selectedOption: selectedOptions[q._id],
        })
      );
      
      const resArray = await Promise.all(promises);
      
      const newResults = { ...results };
      const newStatuses = { ...statuses };
      
      group.questions.forEach((q, idx) => {
        newResults[q._id] = { ...resArray[idx], isEvaluated: false };
        newStatuses[q._id] = {
          answered: true,
          answer: {
            selectedOption: selectedOptions[q._id],
            isEvaluated: false,
            submittedAt: resArray[idx].submittedAt,
          },
        };
      });
      
      setResults(newResults);
      setStatuses(newStatuses);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingGroup((prev) => ({ ...prev, [gId]: false }));
    }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Loading active questions…</span></div>;

  if (!questions || questions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🏏</div>
        <h2 className={styles.emptyTitle}>No Active Matches</h2>
        <p className={styles.emptyText}>There are currently no active matches available for prediction.</p>
        <div className={styles.emptyMeta}>Matches only appear during their scheduled start and end times.</div>
      </div>
    );
  }

  // 1. Group questions
  const groupedQuestions = {};
  questions.forEach(q => {
    const gId = q.groupId || q._id; // fallback to distinct _id if not grouped
    if (!groupedQuestions[gId]) {
      groupedQuestions[gId] = {
        groupId: gId,
        matchTitle: q.matchTitle,
        startTime: q.startTime,
        endTime: q.endTime,
        maxPointsTotal: 0,
        questions: []
      };
    }
    groupedQuestions[gId].questions.push(q);
    groupedQuestions[gId].maxPointsTotal += q.maxPoints;
  });
  const groups = Object.values(groupedQuestions);

  return (
    <div className={styles.page}>
      {error && <div className="error-box" style={{ marginBottom: "1rem" }}><span>⚠</span> {error}</div>}

      {groups.map((group) => {
        const gId = group.groupId;
        
        // Group properties
        const isGroupAnswered = group.questions.some(q => statuses[q._id]?.answered);
        const isGroupJustSubmitted = group.questions.some(q => results[q._id]);
        
        // Top-level display properties based on the first question
        const firstQid = group.questions[0]._id;
        const prevAnswer = statuses[firstQid]?.answer || {};
        const isEvaluated = isGroupAnswered ? prevAnswer.isEvaluated : false;

        let totalGroupPointsEarned = 0;
        let allCorrect = true;
        let anyWrong = false;

        if (isEvaluated) {
          group.questions.forEach(q => {
            const ans = statuses[q._id]?.answer;
            if (ans && ans.isCorrect) {
               totalGroupPointsEarned += q.maxPoints;
            } else {
               allCorrect = false;
               anyWrong = true;
            }
          });
        }

        const isSubmitting = submittingGroup[gId];
        const hasStarted = startedGroup[gId];
        const allSelected = group.questions.every(q => selectedOptions[q._id] !== undefined);

        return (
          <div key={gId} style={{ marginBottom: "2rem" }}>
            {/* Match header */}
            <div className={styles.matchBanner}>
              <div className={styles.matchBadge}>
                <span>⏳</span>
                <span>
                  {new Date(group.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(group.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <h1 className={styles.matchTitle}>{group.matchTitle}</h1>
              <div className={styles.matchMeta}>
                <span className="badge badge-gold">
                  +{group.maxPointsTotal} pts
                </span>
              </div>
            </div>

            {/* Already answered state (group level) */}
            {isGroupAnswered && !isGroupJustSubmitted && (
              <div className={styles.answeredCard}>
                <div className={styles.answeredHeader}>
                  <span className={styles.answeredIcon}>
                    {!isEvaluated ? "⏳" : allCorrect ? "✅" : "❌"}
                  </span>
                  <div>
                    <h2 className={styles.answeredTitle}>
                      {!isEvaluated
                        ? "Predictions Locked In!"
                        : allCorrect
                        ? "Perfect Predictions!"
                        : anyWrong && totalGroupPointsEarned > 0 
                        ? "Partial Correct Predictions"
                        : "Wrong Predictions"}
                    </h2>
                    <p className={styles.answeredSub}>
                      {!isEvaluated
                        ? "Waiting for the match to end for results"
                        : "You've already answered these questions"}
                    </p>
                  </div>
                </div>
                {isEvaluated && (
                  <div className={styles.resultStats}>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-gold)" }}>
                        +{totalGroupPointsEarned}
                      </span>
                      <span className={styles.resultStatLabel}>Points Earned</span>
                    </div>
                    <div className={styles.resultStat}>
                      <span className={styles.resultStatValue} style={{ color: "var(--accent-blue)", fontSize: "1.2rem" }}>
                        {formatTime(prevAnswer.submittedAt || new Date())}
                      </span>
                      <span className={styles.resultStatLabel}>Submitted At</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Just submitted result (group level) */}
            {isGroupJustSubmitted && (
              <div className={`${styles.resultCard} ${styles.resultPending}`}>
                <div className={styles.resultEmoji}>⏳</div>
                <h2 className={styles.resultTitle}>Predictions Locked In!</h2>
                <p className={styles.resultAnswer}>
                  Your choices have been saved. The results will be updated after the match ends.
                </p>
                <div className={styles.resultStats}>
                  <div className={styles.resultStat}>
                    <span className={styles.resultStatValue} style={{ color: "var(--accent-blue)", fontSize: "1.2rem" }}>
                      {formatTime(results[firstQid]?.submittedAt || new Date())}
                    </span>
                    <span className={styles.resultStatLabel}>Submitted At</span>
                  </div>
                </div>
              </div>
            )}

            {/* Questions container */}
            <div className={styles.questionCard} style={{ marginTop: isGroupAnswered || isGroupJustSubmitted ? '1rem' : '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className={styles.questionLabel} style={{ marginBottom: 0 }}>Match Predictions</p>
                {group.questions.length > 1 && (
                  <span className="badge badge-primary">{group.questions.length} Questions</span>
                )}
              </div>

              {!isGroupAnswered && !isGroupJustSubmitted && !hasStarted ? (
                <div style={{ textAlign: "center", margin: "2rem 0" }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => startGroupPrediction(gId)}
                    style={{
                      width: "100%", maxWidth: "300px", margin: "0 auto",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
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
                  {group.questions.map((q, idx) => {
                    const qId = q._id;
                    const status = statuses[qId] || {};
                    const qAlreadyAnswered = status.answered && !results[qId];
                    const qPrevAnswer = status.answer;
                    const result = results[qId];
                    const selected = selectedOptions[qId];

                    return (
                      <div key={qId} style={{ 
                        borderBottom: idx < group.questions.length - 1 ? '1px solid var(--border)' : 'none',
                        paddingBottom: idx < group.questions.length - 1 ? 24 : 0,
                        marginBottom: idx < group.questions.length - 1 ? 24 : 0
                      }}>
                        <h2 className={styles.questionText} style={{ fontSize: '1.15rem' }}>
                          <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{idx + 1}.</span>
                          {q.question}
                        </h2>

                        <div className={styles.options}>
                          {q.options.map((opt, i) => {
                            let optClass = styles.option;
                            if (qAlreadyAnswered || result) {
                              const qIsEval = qAlreadyAnswered ? qPrevAnswer.isEvaluated : false;
                              const correctIdx = q.correctOption ?? null;
                              const userIdx = qAlreadyAnswered ? qPrevAnswer.selectedOption : selected;
                              
                              if (qIsEval && correctIdx !== null && i === correctIdx)
                                optClass += ` ${styles.optionCorrect}`;
                              else if (qIsEval && i === userIdx && !qPrevAnswer.isCorrect)
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
                                onClick={() => !qAlreadyAnswered && !result && setSelectedOptions(p => ({ ...p, [qId]: i }))}
                                disabled={qAlreadyAnswered || !!result}
                              >
                                <span className={styles.optionLetter}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className={styles.optionText}>{opt}</span>
                                {qAlreadyAnswered && qPrevAnswer.isEvaluated && i === q.correctOption && (
                                  <span className={styles.optionBadge}>✓ Correct</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Group Submit Button */}
                  {!isGroupAnswered && !isGroupJustSubmitted && (
                    <div style={{ marginTop: 32, paddingTop: 24, borderTop: '2px dashed var(--border)', textAlign: 'center' }}>
                      <button
                        className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                        onClick={() => handleGroupSubmit(group)}
                        disabled={!allSelected || isSubmitting}
                        style={{ width: '100%', maxWidth: 300, margin: '0 auto' }}
                      >
                        {isSubmitting ? (
                          <><span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Locking in…</>
                        ) : (
                          <><span>🔒</span> Lock In {group.questions.length > 1 ? 'All Answers' : 'Answer'}</>
                        )}
                      </button>
                      
                      {!allSelected ? (
                        <p className={styles.submitHint} style={{ color: 'var(--accent-red)' }}>
                          Please answer all {group.questions.length} questions to lock in.
                        </p>
                      ) : (
                        <p className={styles.submitHint}>
                          You can only answer once — choose wisely!
                        </p>
                      )}
                    </div>
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
