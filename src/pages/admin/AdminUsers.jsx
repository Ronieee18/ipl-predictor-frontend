import React, { useEffect, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { adminGetUsers, adminCreateUser, adminDeleteUser, adminCreateUsersBulk } from '../../api.js';
import styles from './AdminQuestions.module.css';

const EMPTY_FORM = { email: '', displayName: '' };

export default function AdminUsers() {
  const { adminSecret } = useAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const fileInputRef = React.useRef(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setBulkUploading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        // Skip header if it exists
        let startIndex = 0;
        if (lines.length > 0 && lines[0].toLowerCase().includes('email')) {
          startIndex = 1;
        }

        const usersToAdd = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            usersToAdd.push({ email: parts[0], displayName: parts[1] });
          }
        }

        if (usersToAdd.length === 0) {
          throw new Error('No valid users found in CSV. Ensure format is: Email, Display Name');
        }

        const res = await adminCreateUsersBulk(adminSecret, { users: usersToAdd });
        setSuccess(`✅ Added ${res.added} users! ${res.errors.length > 0 ? `(${res.errors.length} failed, possibly duplicates)` : ''}`);
        
        load(); // Refresh table
      } catch (err) {
        setError('Bulk upload failed: ' + err.message);
      } finally {
        setBulkUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setBulkUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetUsers(adminSecret);
      setUsers(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault(); setError(''); setSuccess('');
    setSubmitting(true);
    try {
      const newUser = await adminCreateUser(adminSecret, form);
      setSuccess('✅ User allowed successfully!');
      setForm(EMPTY_FORM);
      setUsers(prev => [newUser, ...prev]);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(id) {
    try {
      await adminDeleteUser(adminSecret, id);
      setUsers(prev => prev.filter(u => u._id !== id));
      setDeleteId(null);
      setSuccess('User access revoked.');
    } catch (err) { setError(err.message); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>👥 Allowed Users</h1>
        <span className="badge badge-muted">{users.length} users</span>
      </div>

      <div className="card">
        <h2 className={styles.sectionTitle}>Add a Player</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="input-label">Company Email</label>
            <input 
              className="input" 
              type="email" 
              required 
              placeholder="name@company.com" 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="input-label">Display Name</label>
            <input 
              className="input" 
              type="text" 
              required 
              placeholder="e.g. Employee Name" 
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })} 
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 24 }}>
            {submitting ? 'Adding...' : '+ Add User'}
          </button>
          
          <div style={{ flexBasis: '100%', height: 0 }}></div>
          
          <div style={{ marginTop: 16, borderTop: '1px dashed var(--border)', paddingTop: 16, width: '100%' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Upload via CSV</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Format: <code>email, displayName</code> (First row acts as header if "email" is present)
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label 
                htmlFor="csv-upload" 
                className="btn btn-ghost" 
                style={{ cursor: 'pointer', opacity: bulkUploading ? 0.5 : 1, pointerEvents: bulkUploading ? 'none' : 'auto' }}
              >
                {bulkUploading ? 'Uploading...' : '📁 Select .csv File'}
              </label>
            </div>
          </div>
        </form>
        {error && <div className="error-box" style={{ marginTop: 16 }}>{error}</div>}
        {success && <div className="success-box" style={{ marginTop: 16 }}>{success}</div>}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 0' }}>
          <h2 className={styles.sectionTitle}>Company Players</h2>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No allowed users yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.displayName}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                    <td style={{ fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className="badge badge-gold">{u.totalScore} pts</span></td>
                    <td style={{ textAlign: 'right' }}>
                      {deleteId === u._id ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Confirm Revoke</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteId(u._id)}>🗑 Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
