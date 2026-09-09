import React, { useState } from 'react';
import {
  ShieldAlert,
  Dna,
  UserCheck,
  Calendar,
  ChevronRight,
  Camera,
  FileText,
  Sun,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Sparkles,
  SearchCheck,
  BookOpen
} from 'lucide-react';
// useContext: Accessing global user assessment and activeTab navigation
import { useApp } from '../context/AppContext';

export default function Dashboard() {
  // useContext: Consuming shared assessment values from AppContext
  const { currentAssessment, setActiveTab, triggerNotification } = useApp();

  // useState: Managing interactive checkmark state for daily action
  const [spfConfirmed, setSpfConfirmed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const score = currentAssessment?.score || 62;
  const riskLevel = currentAssessment?.riskLevel || 'Moderate';

  // SVG Gauge calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleSpfToggle = (e) => {
    e.stopPropagation();
    const next = !spfConfirmed;
    setSpfConfirmed(next);
    triggerNotification(
      next ? 'Daily SPF application confirmed for today!' : 'SPF application log unconfirmed.'
    );
  };

  return (
    <div className="dashboard-content">
      {/* 4 Stat Cards Grid matching Figma */}
      <section className="stats-grid">
        {/* Stat 1: Skin Health Risk */}
        <div className="stat-card" onClick={() => setActiveTab('assessment')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span>SKIN HEALTH RISK</span>
            <ShieldAlert className="stat-icon" />
          </div>
          <div className="stat-card-body">
            <div className="stat-primary-value">{riskLevel}</div>
            <div className="stat-subtitle">Based on latest assessment</div>
          </div>
        </div>

        {/* Stat 2: Hereditary Risk */}
        <div className="stat-card" onClick={() => setActiveTab('risk')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span>HEREDITARY RISK</span>
            <Dna className="stat-icon" />
          </div>
          <div className="stat-card-body">
            <div className="stat-primary-value">{currentAssessment?.hereditaryRisk || 'Low'}</div>
            <div className="stat-subtitle">Marker screening negative</div>
          </div>
        </div>

        {/* Stat 3: Health Profile Complete */}
        <div className="stat-card" onClick={() => setActiveTab('userform')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span>HEALTH PROFILE</span>
            <UserCheck className="stat-icon" />
          </div>
          <div className="stat-card-body">
            <div className="health-profile-row">
              <div className="stat-primary-value">85%</div>
              <span>Complete</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        {/* Stat 4: Last Assessment */}
        <div className="stat-card" onClick={() => setActiveTab('assessment')} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span>LAST ASSESSMENT</span>
            <Calendar className="stat-icon" />
          </div>
          <div className="stat-card-body">
            <div className="stat-primary-value">{currentAssessment?.lastAssessmentDate || 'Sep 2'}</div>
            <div className="stat-subtitle">Full Body Scan</div>
          </div>
        </div>
      </section>

      {/* Middle Section: Health Risk Overview + Recommended Actions */}
      <section className="middle-grid">
        {/* Health Risk Overview with Circular Score Gauge */}
        <div className="card-panel">
          <div className="card-panel-header">
            <h3>Health Risk Overview</h3>
            <button className="header-link" onClick={() => setActiveTab('result')}>
              <span>Details</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="gauge-wrapper-box">
            <div className="gauge-svg-container">
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Background Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#edf3ee"
                  strokeWidth="22"
                />
                {/* Active Score Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#275941"
                  strokeWidth="22"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>

              {/* Center Score Value matching Figma ("62 SCORE") */}
              <div className="gauge-center-text">
                <div className="gauge-number">{score}</div>
                <div className="gauge-label">SCORE</div>
              </div>
            </div>

            {/* Gauge Legend */}
            <div className="gauge-legend">
              <div className="legend-row">
                <span className="legend-dot dot-green" />
                <span>Identified Factors</span>
              </div>
              <div className="legend-row">
                <span className="legend-dot dot-gray" />
                <span>Baseline</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Actions Column */}
        <div className="card-panel">
          <div className="card-panel-header">
            <h3>Recommended Actions</h3>
          </div>

          <div className="actions-list">
            {/* Action 1: Update Arm Lesion Photo */}
            <div className="action-card" onClick={() => triggerNotification('Opening camera for lesion photo verification...')}>
              <div className="action-icon-wrap">
                <Camera size={18} />
              </div>
              <div className="action-content">
                <div className="action-title">Update Arm Lesion Photo</div>
                <div className="action-desc">
                  It has been 30 days since your last capture. Routine monitoring is advised.
                </div>
              </div>
              <ChevronRight size={16} className="action-arrow" />
            </div>

            {/* Action 2: Complete Family History */}
            <div className="action-card" onClick={() => setActiveTab('family')}>
              <div className="action-icon-wrap">
                <FileText size={18} />
              </div>
              <div className="action-content">
                <div className="action-title">Complete Family History</div>
                <div className="action-desc">
                  Missing data regarding maternal grandfather.
                </div>
              </div>
              <ChevronRight size={16} className="action-arrow" />
            </div>

            {/* Action 3: Daily SPF Log */}
            <div className="action-card" onClick={handleSpfToggle}>
              <div className="action-icon-wrap" style={{ color: spfConfirmed ? '#16a34a' : 'inherit' }}>
                <Sun size={18} />
              </div>
              <div className="action-content">
                <div className="action-title">Daily SPF Log</div>
                <div className="action-desc">
                  {spfConfirmed ? 'Confirmed broad-spectrum SPF applied.' : 'Confirm application for today.'}
                </div>
              </div>
              <div
                className="action-arrow"
                style={{ color: spfConfirmed ? '#16a34a' : '#94a3b8' }}
              >
                <CheckCircle2 size={19} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Recent Health Insights matching Figma */}
      <section className="insights-panel">
        <div className="card-panel-header">
          <h3>Recent Health Insights</h3>
          <button
            className="header-link"
            onClick={() => setActiveFilter(prev => prev === 'all' ? 'env' : 'all')}
          >
            <SlidersHorizontal size={14} />
            <span>Filter</span>
          </button>
        </div>

        <div className="insights-list">
          {/* Insight 1: UV Exposure */}
          <div className="insight-item">
            <div className="insight-left">
              <div className="insight-icon-box">
                <Sun size={18} />
              </div>
              <div className="insight-text">
                <h4>UV Exposure Advisory</h4>
                <p>High UV index detected in your area today. Protective measures recommended.</p>
              </div>
            </div>
            <div className="insight-meta">
              <span className="insight-date">Today</span>
              <span className="insight-badge">Environmental</span>
            </div>
          </div>

          {/* Insight 2: Assessment Complete */}
          <div className="insight-item">
            <div className="insight-left">
              <div className="insight-icon-box">
                <SearchCheck size={18} />
              </div>
              <div className="insight-text">
                <h4>Assessment Complete: Right Forearm</h4>
                <p>AI analysis complete. No significant changes detected since last scan.</p>
              </div>
            </div>
            <div className="insight-meta">
              <span className="insight-date">2 days ago</span>
              <span className="insight-badge">Analysis</span>
            </div>
          </div>

          {/* Insight 3: Research Publication */}
          <div className="insight-item">
            <div className="insight-left">
              <div className="insight-icon-box">
                <BookOpen size={18} />
              </div>
              <div className="insight-text">
                <h4>New Publication Relevant to Your Profile</h4>
                <p>Recent studies on hereditary melanoma added to knowledge base.</p>
              </div>
            </div>
            <div className="insight-meta">
              <span className="insight-date">1 week ago</span>
              <span className="insight-badge">Research</span>
            </div>
          </div>
        </div>

        <button
          className="btn-view-all-insights"
          onClick={() => triggerNotification('Displaying full archival insights and clinical references.')}
        >
          View All Insights
        </button>
      </section>

      {/* Footer matching Figma */}
      <footer className="app-footer">
        <div>© 2026 SkinGen Professional Dermatological Guidance.</div>
        <div className="footer-links">
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a href="#disclaimer" onClick={(e) => e.preventDefault()}>Medical Disclaimer</a>
          <a href="#contact" onClick={(e) => e.preventDefault()}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
