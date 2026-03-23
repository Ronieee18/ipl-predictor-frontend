import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';

import JoinPage from './pages/JoinPage.jsx';
import UserLayout from './pages/user/UserLayout.jsx';
import TodayQuiz from './pages/user/TodayQuiz.jsx';
import Leaderboard from './pages/user/Leaderboard.jsx';
import UserHistory from './pages/user/UserHistory.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminQuestions from './pages/admin/AdminQuestions.jsx';
import AdminAddQuestion from './pages/admin/AdminAddQuestion.jsx';
import AdminLeaderboard from './pages/admin/AdminLeaderboard.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AdminProvider>
          <Routes>
            <Route path="/" element={<JoinPage />} />

            {/* User routes */}
            <Route path="/app" element={<UserLayout />}>
              <Route index element={<Navigate to="quiz" replace />} />
              <Route path="quiz" element={<TodayQuiz />} />
              <Route path="history" element={<UserHistory />} />
              <Route path="leaderboard" element={<Leaderboard />} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/panel" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="add-question" element={<AdminAddQuestion />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminProvider>
      </UserProvider>
    </BrowserRouter>
  );
}