import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { adminCreateQuestionsBulk } from '../../api.js';
import styles from './AdminAddQuestion.module.css';

const EMPTY_MATCH = { matchTitle: '', startTime: '', endTime: '' };
const EMPTY_QUESTION = { question: '', options: ['', '', '', ''], maxPoints: 10 };

export default function AdminAddQuestion() {
  const { adminSecret } = useAdmin();
  const [matchForm, setMatchForm] = useState(EMPTY_MATCH);
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function updateQuestion(index, key, value) {
    const updated = [...questions];
    updated[index][key] = value;
    setQuestions(updated);
  }

  function updateOption(qIndex, oIndex, val) {
    const updated = [...questions];
    updated[qIndex] = { ...updated[qIndex], options: [...updated[qIndex].options] };
    updated[qIndex].options[oIndex] = val;
    setQuestions(updated);
  }

  function addQuestion() {
    setQuestions([...questions, { ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] }]);
  }

  function removeQuestion(index) {
    if (questions.length > 1) {
      const updated = questions.filter((_, i) => i !== index);
      setQuestions(updated);
    }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    
    if (!matchForm.matchTitle.trim() || !matchForm.startTime || !matchForm.endTime) {
      setError('Please fill out all match details.');
      return;
    }

    const payloadQuestions = [];
    // Generate a unique groupId for this batch of questions
    const groupId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is missing text.`); return;
      }
      const cleanOptions = q.options.filter((o) => o.trim());
      if (cleanOptions.length < 2) { 
        setError(`Question ${i + 1} must have at least 2 options`); return; 
      }
      payloadQuestions.push({
        matchTitle: matchForm.matchTitle.trim(),
        startTime: new Date(matchForm.startTime).toISOString(),
        endTime: new Date(matchForm.endTime).toISOString(),
        groupId,
        question: q.question.trim(),
        options: cleanOptions,
        maxPoints: Number(q.maxPoints)
      });
    }
    
    setSubmitting(true);
    try {
      await adminCreateQuestionsBulk(adminSecret, { questions: payloadQuestions });
      setSuccess(`✅ ${payloadQuestions.length} Question(s) created and grouped successfully!`);
      setMatchForm(EMPTY_MATCH);
      setQuestions([{ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] }]);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>➕ Add Match & Questions</h1>
      </div>

      <div className="card">
        <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>1. Match Details</h2>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.formRow} style={{ background: 'var(--bg-mid)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
            <div className={styles.formField} style={{ flex: 1 }}>
              <label className="input-label">Match Title *</label>
              <input className="input" placeholder="e.g. Mumbai Indians vs Chennai Super Kings" value={matchForm.matchTitle} onChange={(e) => setMatchForm({ ...matchForm, matchTitle: e.target.value })} required />
            </div>
            <div className={styles.formField} style={{ width: 180 }}>
              <label className="input-label">Start Time *</label>
              <input className="input" type="datetime-local" value={matchForm.startTime} onChange={(e) => setMatchForm({ ...matchForm, startTime: e.target.value })} required />
            </div>
            <div className={styles.formField} style={{ width: 180 }}>
              <label className="input-label">End Time *</label>
              <input className="input" type="datetime-local" value={matchForm.endTime} onChange={(e) => setMatchForm({ ...matchForm, endTime: e.target.value })} required />
            </div>
          </div>

          <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>
            2. Questions (Grouped Together)
          </h2>
          
          {questions.map((q, qIndex) => (
            <div key={qIndex} style={{ border: '1px solid var(--border)', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Question {qIndex + 1}</h3>
                {questions.length > 1 && (
                  <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--accent-red)' }} onClick={() => removeQuestion(qIndex)}>
                    Remove
                  </button>
                )}
              </div>

              <div className={styles.formField}>
                <label className="input-label">Question Text *</label>
                <textarea className="input" style={{ resize: 'vertical', minHeight: 60 }} placeholder="e.g. Who will win today's match?" value={q.question} onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)} required />
              </div>

              <div className={styles.optionsGrid}>
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className={styles.optionInput} style={{ marginBottom: 12 }}>
                    <label className="input-label" style={{ fontSize: '0.8rem' }}>Option {String.fromCharCode(65 + oIndex)}{oIndex < 2 ? ' *' : ' (optional)'}</label>
                    <div className={styles.optionRow}>
                      <input className="input" placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} required={oIndex < 2} />
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField} style={{ width: 120 }}>
                  <label className="input-label">Max Points</label>
                  <input className="input" type="number" min={1} max={50} value={q.maxPoints} onChange={(e) => updateQuestion(qIndex, 'maxPoints', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginBottom: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={addQuestion} style={{ width: '100%', borderStyle: 'dashed' }}>
              + Add Another Question to this Match
            </button>
          </div>

          {error && <div className="error-box"><span>⚠</span> {error}</div>}
          {success && <div className="success-box">{success}</div>}

          <div style={{ marginTop: 20 }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading all questions…</> : `Upload ${questions.length} Grouped Question(s)`}
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Users will be required to answer all these questions at once.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
