const BASE = 'https://ipl-predictor-backend.vercel.app/api';

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

export const getLeaderboard = (filter = 'overall') => req(`/users/leaderboard?filter=${filter}`);

export const getUserHistory = (userId) => req(`/users/${userId}/history`);

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

export const adminGetLeaderboard = (secret, filter = 'overall') =>
  req(`/admin/leaderboard?filter=${filter}`, { headers: adminHeaders(secret) });