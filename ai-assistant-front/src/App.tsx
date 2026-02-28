import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout';
import ChatPage from './pages/ChatPage';
import EmailPage from './pages/EmailPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LandingPage from './pages/LandingPage';
import AuthGuard from './components/AuthGuard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route Publique d'entré */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Espace Protégé */}
        <Route element={<AuthGuard />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<ChatPage />} />
            <Route path="emails" element={<EmailPage />} />
            <Route path="sources" element={<AdminPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
