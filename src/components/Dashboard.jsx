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
  // useContext: Consuming shared assessment values, navigation, and persistent SPF state from AppContext
  const {
    currentAssessment,
    setActiveTab,
    triggerNotification,
    spfConfirmed,
    setSpfConfirmed
  } = useApp();

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'env' | 'analysis' | 'research'

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
      next ? 'Daily SPF 50+ photoprotection confirmed for today!' : 'SPF application log unconfirmed.'
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
                {/* Background Ring (Dark-mode responsive via CSS variable) */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="var(--border-color)"
                  strokeWidth="22"
                />
                {/* Active Score Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke={score >= 75 ? '#15803d' : score >= 50 ? '#275941' : '#b91c1c'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Showing: {activeFilter === 'all' ? 'All (3)' : activeFilter === 'env' ? 'Environmental' : activeFilter === 'analysis' ? 'Analysis' : 'Research'}
            </span>
            <button
              className="header-link"
              onClick={() =>
                setActiveFilter((prev) =>
                  prev === 'all' ? 'env' : prev === 'env' ? 'analysis' : prev === 'analysis' ? 'research' : 'all'
                )
              }
              title="Cycle through insight categories"
            >
              <SlidersHorizontal size={14} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        <div className="insights-list">
          {(() => {
            const items = [
              {
                id: 1,
                category: 'env',
                badge: 'Environmental',
                icon: Sun,
                title: 'UV Exposure Advisory',
                desc: 'High UV index detected in your area today. Protective measures recommended.',
                date: 'Today'
              },
              {
                id: 2,
                category: 'analysis',
                badge: 'Analysis',
                icon: SearchCheck,
                title: 'Assessment Complete: Right Forearm',
                desc: 'AI analysis complete. No significant changes detected since last scan.',
                date: '2 days ago'
              },
              {
                id: 3,
                category: 'research',
                badge: 'Research',
                icon: BookOpen,
                title: 'New Publication Relevant to Your Profile',
                desc: 'Recent studies on hereditary melanoma added to knowledge base.',
                date: '1 week ago'
              }
            ];

            const displayed = activeFilter === 'all' ? items : items.filter((it) => it.category === activeFilter);

            return displayed.map((insight) => {
              const IconComp = insight.icon;
              return (
                <div key={insight.id} className="insight-item">
                  <div className="insight-left">
                    <div className="insight-icon-box">
                      <IconComp size={18} />
                    </div>
                    <div className="insight-text">
                      <h4>{insight.title}</h4>
                      <p>{insight.desc}</p>
                    </div>
                  </div>
                  <div className="insight-meta">
                    <span className="insight-date">{insight.date}</span>
                    <span className="insight-badge">{insight.badge}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <button
          className="btn-view-all-insights"
          onClick={() => {
            setActiveFilter('all');
            triggerNotification('Displaying full archival clinical insights and recent environmental publications.');
          }}
        >
          View All Insights
        </button>
      </section>

      {/* Footer matching Figma */}
      <footer className="app-footer">
        <div>© 2026 SkinGen Professional Dermatological Guidance.</div>
        <div className="footer-links">
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              triggerNotification('Privacy: All clinical data is encrypted in local state and not transferred to external servers.');
            }}
          >
            Privacy Policy
          </a>
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              triggerNotification('Terms: Platform for educational and preliminary dermatological screening.');
            }}
          >
            Terms of Service
          </a>
          <a
            href="#disclaimer"
            onClick={(e) => {
              e.preventDefault();
              triggerNotification('Medical Disclaimer: Not a substitute for formal histological biopsy or physician review.');
            }}
          >
            Medical Disclaimer
          </a>
          <a
            href="mailto:support@skingen.ai"
            onClick={(e) => {
              e.preventDefault();
              window.open('mailto:support@skingen.ai', '_blank');
            }}
          >
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
