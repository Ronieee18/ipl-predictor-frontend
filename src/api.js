const BASE = 'https://ipl-predictor-backend.vercel.app/api';
// const BASE = 'http://localhost:5000/api';

async function req(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Users ──────────────────────────────────────────────────────────
export const joinUser = (username) =>
  req('/users/join', { method: 'POST', body: { username } });

export const getLeaderboard = (filter = 'overall', date = null) => {
  let url = `/users/leaderboard?filter=${filter}`;
  if (date) url += `&date=${date}`;
  return req(url);
};

export const getUserHistory = (userId) => req(`/users/${userId}/history`);

export const getLeaderboardSettings = () => req('/users/settings/leaderboard');

// ── Questions ─────────────────────────────────────────────────────
export const getActiveQuestions = () => req('/questions/active');

export const getActiveStatus = (userId) =>
  req(`/questions/active/status?userId=${userId}`);

export const submitAnswer = ({ userId, questionId, selectedOption, timeTakenMs }) =>
  req('/questions/answer', {
    method: 'POST',
    body: { userId, questionId, selectedOption, timeTakenMs },
  });

// ── Admin ─────────────────────────────────────────────────────────
const adminHeaders = (secret) => ({ 'x-admin-secret': secret });

export const adminVerify = (secret) =>
  req('/admin/verify', { headers: adminHeaders(secret) });

export const adminGetQuestions = (secret) =>
  req('/admin/questions', { headers: adminHeaders(secret) });

export const adminGetQuestionAnswers = (secret, id) =>
  req(`/admin/questions/${id}/answers`, { headers: adminHeaders(secret) });

export const adminCreateQuestion = (secret, body) =>
  req('/admin/questions', { method: 'POST', headers: adminHeaders(secret), body });

export const adminDeleteQuestion = (secret, id) =>
  req(`/admin/questions/${id}`, { method: 'DELETE', headers: adminHeaders(secret) });

export const adminEvaluateQuestion = (secret, id, correctOption) =>
  req(`/admin/questions/${id}/evaluate`, { method: 'POST', headers: adminHeaders(secret), body: { correctOption } });

export const adminUpdateQuestion = (secret, id, body) =>
  req(`/admin/questions/${id}`, { method: 'PUT', headers: adminHeaders(secret), body });

export const adminGetAnalytics = (secret) =>
  req('/admin/analytics', { headers: adminHeaders(secret) });

export const adminGetLeaderboard = (secret, filter = 'overall', date = null) => {
  let url = `/admin/leaderboard?filter=${filter}`;
  if (date) url += `&date=${date}`;
  return req(url, { headers: adminHeaders(secret) });
};

export const adminGetSettings = (secret) =>
  req('/admin/settings', { headers: adminHeaders(secret) });

export const adminUpdateSetting = (secret, key, value) =>
  req('/admin/settings', { method: 'PUT', headers: adminHeaders(secret), body: { key, value } });

export const adminGetUsers = (secret) =>
  req('/admin/users', { headers: adminHeaders(secret) });

export const adminCreateUser = (secret, body) =>
  req('/admin/users', { method: 'POST', headers: adminHeaders(secret), body });

export const adminDeleteUser = (secret, id) =>
  req(`/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders(secret) });