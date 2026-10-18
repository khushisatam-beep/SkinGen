import React, { useMemo } from 'react';
import {
  ArrowLeft,
  Sun,
  Moon,
  Download,
  Share2
} from 'lucide-react';
// // useContext: Accessing global assessment results and navigation
import { useApp } from '../context/AppContext';
import { getSkinRecommendations } from '../utils/skinScoreCalculator';

export default function AssessmentResult() {
  const { user, currentAssessment, setActiveTab, triggerNotification } = useApp();

  const score = currentAssessment?.score || 62;
  const riskLevel = currentAssessment?.riskLevel || 'Moderate';
  const skinType = currentAssessment?.skinType || 'Combination';
  const userName = currentAssessment?.name || user?.name || 'Patient';

  // useMemo: Formats recommendation guidelines based on score and skin type
  const routines = useMemo(() => {
    return getSkinRecommendations(skinType, score, riskLevel);
  }, [skinType, score, riskLevel]);

  return (
    <div className="result-container">
      {/* Printed Document Header (Visible only when printed) */}
      <div className="print-report-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #235d40', paddingBottom: '12px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#13281e' }}>SkinGen Clinical Dermatology Report</h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#55695e' }}>
              Precision barrier health evaluation & automated regimen formulation
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#55695e' }}>
            <div><strong>Patient:</strong> {userName}</div>
            <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div><strong>Status:</strong> Verified Clinical Assessment</div>
          </div>
        </div>
      </div>

      {/* Top Back Action Bar (Hidden on print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        <div className="lifestyle-actions-grid">
          {routines.actions.map((act, i) => (
            <div
              key={i}
              className="action-step-card"
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                {act.tag}
              </div>
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {act.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {act.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
