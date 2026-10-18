import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import SkinAssessmentForm from './SkinAssessmentForm';
import AssessmentResult from './AssessmentResult';
import AuthModal from './AuthModal';
import {
  HereditaryRiskView,
  CarePlansView,
  FamilyHistoryView,
  ReportsView
} from './PlaceholderViews';
import UserForm from './UserForm';
import UserProfile from './UserProfile';
import About from './About';
import Settings from './Settings';
// useContext: Accessing global state via custom hook useApp
import { useApp } from '../context/AppContext';

/**
 * Home Component
 * Serves as the primary page (route '/') of the SkinGen application.
 * Retains the complete SkinGen dashboard, assessments, and React Hooks implementation.
 */
export default function Home() {
  // ==========================================================================
  // 3. useContext: AppContext
  // Reading active navigation tab and global notification from AppContext
  // ==========================================================================
  const { activeTab, notification } = useApp();

  // ==========================================================================
  // 1. useState: Local UI states
  // Controls banner dismissal and layout mode
  // ==========================================================================
  const [showBanner, setShowBanner] = useState(true);

  // View router based on activeTab
  const renderCurrentView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <UserProfile />;
      case 'assessment':
        return <SkinAssessmentForm />;
      case 'userform':
        return <UserForm />;
      case 'result':
        return <AssessmentResult />;
      case 'risk':
        return <HereditaryRiskView />;
      case 'care':
        return <CarePlansView />;
      case 'family':
        return <FamilyHistoryView />;
      case 'reports':
        return <ReportsView />;
      case 'about':
        return <About />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Figma Sidebar Navigation */}
      <Sidebar />

      {/* Main Application Wrapper */}
      <div className="main-wrapper">
        {/* Figma Top Header Bar */}
        <Header />

        {/* Page Content Area */}
        <main className="page-content">
          {/* Global Notification Toast (if active) */}
          {notification && (
            <div className="banner-toast">
              <span>{notification.message}</span>
            </div>
          )}

          {/* Active View Content: Render child route via Outlet, or fallback to state-driven view */}
          <Outlet />
        </main>
      </div>

      {/* Login & User Profile Modal (Figma Screen) */}
      <AuthModal />
    </div>
  );
}
