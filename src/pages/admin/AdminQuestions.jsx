import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { adminGetQuestions, adminCreateQuestion, adminDeleteQuestion, adminEvaluateQuestion, adminGetQuestionAnswers } from '../../api.js';
import styles from './AdminQuestions.module.css';



function formatTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function AdminQuestions() {
  const { adminSecret } = useAdmin();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [evalId, setEvalId] = useState(null);
  const [evalOption, setEvalOption] = useState(0);

  // View Responses State
  const [viewingAnswersId, setViewingAnswersId] = useState(null);
  const [answersData, setAnswersData] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  // Filter States
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const qs = await adminGetQuestions(adminSecret);
      setQuestions(qs);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }



  async function handleEvaluate(id) {
    try {
      await adminEvaluateQuestion(adminSecret, id, evalOption);
      setSuccess('✅ Results evaluated successfully!');
      setEvalId(null);
      load();
    } catch (err) { setError(err.message); }
  }

  async function toggleViewAnswers(id) {
    if (viewingAnswersId === id) {
      setViewingAnswersId(null);
      return;
    }
    setViewingAnswersId(id);
    if (!answersData[id]) {
      setLoadingAnswers(true);
      try {
        const data = await adminGetQuestionAnswers(adminSecret, id);
        setAnswersData((prev) => ({ ...prev, [id]: data }));
      } catch (err) {
        setError('Failed to fetch responses: ' + err.message);
      } finally {
        setLoadingAnswers(false);
      }
    }
  }

  async function handleDelete(id) {
    try {
      await adminDeleteQuestion(adminSecret, id);
      setQuestions((qs) => qs.filter((q) => q._id !== id));
      setDeleteId(null);
    } catch (err) { setError(err.message); }
  }

  function todayIST() {
    const now = new Date();
    const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10);
  }

  // Derived filtered state
  const filteredQuestions = questions.filter(q => {
    // 1. Status Filter
    if (filterStatus !== 'all') {
      const now = Date.now();
      const isActive = q.isActive && new Date(q.startTime).getTime() <= now && new Date(q.endTime).getTime() >= now;
      
      if (filterStatus === 'active' && !isActive) return false;
      if (filterStatus === 'pending' && (q.isEvaluated || isActive)) return false; // ended, not evaluated
      if (filterStatus === 'evaluated' && !q.isEvaluated) return false;
    }

    // 2. Date Filter
    if (filterDate) {
      const d = new Date(q.startTime);
      const qDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      if (qDate !== filterDate) return false;
    }

    // 3. Text Search
    if (filterText) {
      const term = filterText.toLowerCase();
      if (!q.matchTitle.toLowerCase().includes(term) && !q.question.toLowerCase().includes(term)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>❓ Questions</h1>
        <span className="badge badge-muted">{questions.length} questions total</span>
      </div>



      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 0' }}>
          <h2 className={styles.sectionTitle}>All Questions ({filteredQuestions.length})</h2>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: 'var(--text-muted)' }}>No questions uploaded yet.</div>
        ) : (
          <div className={styles.questionsList}>

            {/* Premium Filter Bar */}
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup} style={{ flex: '2 1 250px' }}>
                <span className={styles.filterIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search matches or questions..."
                  className={styles.filterInput}
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup} style={{ flex: '1 1 180px' }}>
                <span className={styles.filterIcon}>📅</span>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className={styles.filterGroup} style={{ flex: '1 1 180px' }}>
                <span className={styles.filterIcon}>🏷️</span>
                <select
                  className={styles.filterInput}
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Now</option>
                  <option value="pending">Pending Eval</option>
                  <option value="evaluated">Evaluated</option>
                </select>
              </div>
              {(filterText || filterDate || filterStatus !== 'all') && (
                 <button className="btn btn-ghost" style={{ color: 'var(--text-secondary)' }} onClick={() => { setFilterText(''); setFilterDate(''); setFilterStatus('all'); }}>
                   ✕ Clear
                 </button>
              )}
            </div>
            {filteredQuestions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 24px', color: 'var(--text-muted)' }}>No questions match your filters.</div>
            )}

            {filteredQuestions.map((q) => (
              <div key={q._id} className={styles.questionItem}>
                <div className={styles.questionHeader}>
                  <div className={styles.questionMeta}>
                    <span className="badge badge-gold">
                      {new Date(q.startTime).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(q.endTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="badge badge-blue">{q.maxPoints} pts base</span>
                    <span className={`badge ${q.isActive ? 'badge-green' : 'badge-red'}`}>{q.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  {deleteId === q._id ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q._id)}>Confirm Delete</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!q.isEvaluated && <button className="btn btn-primary btn-sm" onClick={() => { setEvalId(q._id); setEvalOption(0); }}>🏆 Set Result</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleViewAnswers(q._id)}>
                        {viewingAnswersId === q._id ? 'Hide Responses' : '📋 Responses'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(q._id)}>🗑 Delete</button>
                    </div>
                  )}
                </div>
                {evalId === q._id && (
                  <div style={{ margin: '12px 0', padding: 12, background: 'var(--bg-mid)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>Select the winning option:</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {q.options.map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="radio" name={`eval_${q._id}`} value={i} checked={evalOption === i} onChange={() => setEvalOption(i)} />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleEvaluate(q._id)}>Confirm & Evaluate</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEvalId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
                <div className={styles.questionMatchTitle}>{q.matchTitle}</div>
                <div className={styles.questionText}>{q.question}</div>
                <div className={styles.questionOptions}>
                  {q.options.map((opt, i) => (
                    <div key={i} className={`${styles.questionOption} ${q.isEvaluated && i === q.correctOption ? styles.questionOptionCorrect : ''}`}>
                      <span className={styles.questionOptionLetter}>{String.fromCharCode(65 + i)}</span>
                      {opt}
                      {q.isEvaluated && i === q.correctOption && <span style={{ marginLeft: 'auto', color: 'var(--accent-green)', fontSize: '0.75rem' }}>✓ Correct</span>}
                    </div>
                  ))}
                </div>

                {viewingAnswersId === q._id && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 600 }}>User Responses</h3>
                    {loadingAnswers && !answersData[q._id] ? (
                      <div className="spinner" style={{ width: 24, height: 24 }} />
                    ) : answersData[q._id]?.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No responses yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {answersData[q._id]?.map(ans => (
                          <div key={ans._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: '6px', border: '1px solid var(--border-accent)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>{ans.userId?.displayName || 'Unknown User'}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{ans.userId?.username || 'unknown'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>Option {String.fromCharCode(65 + ans.selectedOption)}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTime(ans.submittedAt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}