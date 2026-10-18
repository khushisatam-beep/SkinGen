import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import SkinAssessmentForm from './components/SkinAssessmentForm';
import AssessmentResult from './components/AssessmentResult';
import UserForm from './components/UserForm';
import UserProfile from './components/UserProfile';
import About from './components/About';
import Settings from './components/Settings';
import AuthScreen from './components/AuthScreen';
import {
  HereditaryRiskView,
  CarePlansView,
  FamilyHistoryView,
  ReportsView
} from './components/PlaceholderViews';
import { useApp } from './context/AppContext';

export default function App() {
  const { isAuthenticated } = useApp();

  // Initial screen for unauthenticated users: Standalone Login screen (Dashboard hidden behind)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />}>
        {/* Default & Dashboard */}
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Skin Assessment Flow & Results */}
        <Route path="assessment" element={<SkinAssessmentForm />} />
        <Route path="result" element={<AssessmentResult />} />
        <Route path="results" element={<AssessmentResult />} />

        {/* User Profile Page */}
        <Route path="profile" element={<UserProfile />} />

        {/* User Details Form (mapped to /user-details, /userform, and /form for backwards compatibility) */}
        <Route path="userform" element={<UserForm />} />
        <Route path="user-details" element={<UserForm />} />
        <Route path="form" element={<UserForm />} />

        {/* Specialty Clinical Views */}
        <Route path="risk" element={<HereditaryRiskView />} />
        <Route path="care" element={<CarePlansView />} />
        <Route path="family" element={<FamilyHistoryView />} />
        <Route path="reports" element={<ReportsView />} />

        {/* Dedicated Settings Page */}
        <Route path="settings" element={<Settings />} />

        {/* Platform Information */}
        <Route path="about" element={<About />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
