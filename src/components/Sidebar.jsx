import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Dna,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  HelpCircle,
  PlusCircle
} from 'lucide-react';
// // useContext: Importing useApp to access global activeTab and navigation actions
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  // // useContext: Accessing global navigation state and modal triggers
  const {
    activeTab,
    setActiveTab,
    setIsAuthModalOpen
  } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
    { id: 'assessment', label: 'SKIN ASSESSMENT', icon: Activity },
    { id: 'risk', label: 'HEREDITARY RISK', icon: Dna },
    { id: 'family', label: 'FAMILY HISTORY', icon: Users },
    { id: 'care', label: 'CARE PLANS', icon: ClipboardList },
    { id: 'reports', label: 'REPORTS', icon: BarChart3 }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Section matching Figma */}
      <a href="#dashboard" className="brand-section" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
        <img src="/logo.svg" alt="SkinGen Logo" className="brand-logo-img" />
        <div className="brand-text">
          <h1>SkinGen</h1>
          <span>PRECISION DERMATOLOGY</span>
        </div>
      </a>

      {/* New Assessment Primary Pill Button */}
      <button
        className="btn-new-assessment"
        onClick={() => setActiveTab('assessment')}
      >
        <PlusCircle size={17} />
        <span>NEW ASSESSMENT</span>
      </button>

      {/* Sidebar Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="nav-divider" />

        <div className="sidebar-bottom">
          <button
            className="nav-item"
            onClick={() => setIsAuthModalOpen(true)}
          >
            <Settings size={18} />
            <span>SETTINGS</span>
          </button>

          <button
            className="nav-item"
            onClick={() => {
              window.open('mailto:support@skingen.ai', '_blank');
            }}
          >
            <HelpCircle size={18} />
            <span>SUPPORT</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
