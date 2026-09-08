import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowLeft,
  Sun,
  Moon,
  ShieldAlert,
  Droplet,
  CheckCircle2,
  RefreshCw,
  Share2,
  Download
} from 'lucide-react';
// // useContext: Accessing global assessment results and navigation
import { useApp } from '../context/AppContext';
import { getSkinRecommendations } from '../utils/skinScoreCalculator';

export default function AssessmentResult() {
  // // useContext: Consuming assessment results from AppContext
  const { currentAssessment, setActiveTab, triggerNotification } = useApp();

  // // useState: Active tab for routine viewer (AM vs PM vs Care Plan)
  const [activeRoutineTab, setActiveRoutineTab] = useState('am');

  const score = currentAssessment?.score || 62;
  const riskLevel = currentAssessment?.riskLevel || 'Moderate';
  const skinType = currentAssessment?.skinType || 'Combination';
  const userName = currentAssessment?.name || 'Jeet';

  // useMemo: Formats recommendation guidelines based on score and skin type
  const routines = useMemo(() => {
    return getSkinRecommendations(skinType, score, riskLevel);
  }, [skinType, score, riskLevel]);

  return (
    <div className="result-container">
      {/* Top Back Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          className="btn-secondary"
          onClick={() => setActiveTab('assessment')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Retake Assessment</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              window.print();
            }}
          >
            <Download size={15} style={{ marginRight: '6px' }} />
            Print Report
          </button>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="result-hero-card">
        <div className="result-score-circle">
          <div className="big-num">{score}</div>
          <div className="score-label">Score / 100</div>
        </div>

        <div className="result-hero-info">
          <span className="result-risk-badge">
            {riskLevel} Skin Health Risk
          </span>
          <h2>Dermatological Assessment for {userName}</h2>
          <p>{routines.summary}</p>

          <div style={{ display: 'flex', gap: '18px', marginTop: '14px', fontSize: '12px', color: '#c7d8ce' }}>
            <div><strong>Skin Type:</strong> {skinType}</div>
            <div><strong>Water Intake:</strong> {currentAssessment?.waterIntake || 2.5} L/day</div>
            <div><strong>Age:</strong> {currentAssessment?.age || 24} yrs</div>
          </div>
        </div>
      </div>

      {/* Routine Tabs & Detailed Recommendations */}
      <div className="result-routines-grid">
        {/* Morning Routine Box */}
        <div className="routine-box">
          <div className="routine-box-header">
            <Sun size={20} color="#eab308" />
            <h3>Morning Dermatological Regimen (AM)</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a72', marginBottom: '14px' }}>
            Designed for UV defense, free-radical neutralization, and moisture barrier support.
          </p>

          <div className="routine-steps-list">
            {routines.amRoutine.map((step, idx) => (
              <div key={idx} className="routine-step-item">
                <span className="routine-step-num">{idx + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evening Routine Box */}
        <div className="routine-box">
          <div className="routine-box-header">
            <Moon size={20} color="#6366f1" />
            <h3>Evening Repair & Recovery Regimen (PM)</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7a72', marginBottom: '14px' }}>
            Focuses on lipid barrier restoration, cellular turnover, and overnight trans-epidermal retention.
          </p>

          <div className="routine-steps-list">
            {routines.pmRoutine.map((step, idx) => (
              <div key={idx} className="routine-step-item">
                <span className="routine-step-num">{idx + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Guidance Actions */}
      <div className="card-panel" style={{ marginTop: '10px' }}>
        <div className="card-panel-header">
          <h3>Lifestyle & Clinical Action Steps</h3>
          <span style={{ fontSize: '12px', color: '#6b7a72' }}>Evidence-based dermatology protocol</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {routines.actions.map((act, i) => (
            <div
              key={i}
              style={{
                border: '1px solid #e5ece6',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#fbfdfa'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#226f43', textTransform: 'uppercase', marginBottom: '4px' }}>
                {act.tag}
              </div>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#121f18', marginBottom: '6px' }}>
                {act.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#5e6f65', lineHeight: 1.4 }}>
                {act.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
