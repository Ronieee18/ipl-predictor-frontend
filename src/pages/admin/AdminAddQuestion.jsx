import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { adminCreateQuestion } from '../../api.js';
import styles from './AdminAddQuestion.module.css';

const EMPTY_FORM = { matchTitle: '', startTime: '', endTime: '', question: '', options: ['', '', '', ''], maxPoints: 10 };

export default function AdminAddQuestion() {
  const { adminSecret } = useAdmin();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function updateOption(i, val) {
    const opts = [...form.options]; opts[i] = val;
    setForm({ ...form, options: opts });
  }

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    const cleanOptions = form.options.filter((o) => o.trim());
    if (cleanOptions.length < 2) { setError('Add at least 2 options'); return; }
    
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        matchDate: form.startTime.split('T')[0],
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        options: cleanOptions,
        maxPoints: Number(form.maxPoints)
      };
      await adminCreateQuestion(adminSecret, payload);
      setSuccess('✅ Question created successfully!');
      setForm(EMPTY_FORM);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>➕ Add Question</h1>
      </div>

      <div className="card">
        <h2 className={styles.sectionTitle}>Upload New Question</h2>
        <form onSubmit={handleCreate} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className="input-label">Match Title *</label>
              <input className="input" placeholder="e.g. Mumbai Indians vs Chennai Super Kings" value={form.matchTitle} onChange={(e) => setForm({ ...form, matchTitle: e.target.value })} required />
            </div>
            <div className={styles.formField} style={{ maxWidth: 200 }}>
              <label className="input-label">Start Time *</label>
              <input className="input" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className={styles.formField} style={{ maxWidth: 200 }}>
              <label className="input-label">End Time *</label>
              <input className="input" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          <div className={styles.formField}>
            <label className="input-label">Question *</label>
            <textarea className="input" style={{ resize: 'vertical', minHeight: 80 }} placeholder="e.g. Who will win today's match?" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
          </div>

          <div className={styles.optionsGrid}>
            {form.options.map((opt, i) => (
              <div key={i} className={styles.optionInput}>
                <label className="input-label">Option {String.fromCharCode(65 + i)}{i < 2 ? ' *' : ' (optional)'}</label>
                <div className={styles.optionRow}>
                  <input className="input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => updateOption(i, e.target.value)} required={i < 2} />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField} style={{ maxWidth: 160 }}>
              <label className="input-label">Max Points</label>
              <input className="input" type="number" min={1} max={50} value={form.maxPoints} onChange={(e) => setForm({ ...form, maxPoints: e.target.value })} />
            </div>
          </div>

          {error && <div className="error-box"><span>⚠</span> {error}</div>}
          {success && <div className="success-box">{success}</div>}

          <div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating…</> : '+ Upload Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
