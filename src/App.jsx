import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SkinAssessmentForm from './components/SkinAssessmentForm';
import AssessmentResult from './components/AssessmentResult';
import AuthModal from './components/AuthModal';
import {
  HereditaryRiskView,
  CarePlansView,
  FamilyHistoryView,
  ReportsView
} from './components/PlaceholderViews';
// // useContext: Accessing global state via custom hook useApp
import { useApp } from './context/AppContext';

export default function App() {
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
      case 'assessment':
        return <SkinAssessmentForm />;
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

          {/* Active View Content */}
          {renderCurrentView()}
        </main>
      </div>

      {/* Login & User Profile Modal (Figma Screen) */}
      <AuthModal />
    </div>
  );
}
