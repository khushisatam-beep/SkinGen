import React, { useState, useReducer, useCallback, useMemo, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Droplets,
  Sun,
  User,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Award
} from 'lucide-react';
// // useContext: Accessing global user & assessment updater
import { useApp } from '../context/AppContext';
// // useReducer: Importing reducer and actions
import { assessmentReducer, initialFormState, ASSESSMENT_ACTIONS } from '../reducers/assessmentReducer';
// Scoring algorithm helper
import { calculateSkinScore, getSkinRecommendations } from '../utils/skinScoreCalculator';

export default function SkinAssessmentForm() {
  // ==========================================================================
  // 3. useContext: AppContext
  // Connects this component to global application state (user name, saved state)
  // ==========================================================================
  const { user, currentAssessment, saveAssessment, setActiveTab } = useApp();

  // ==========================================================================
  // 4. useReducer: Assessment Form State Machine
  // Manages multi-field form state, supporting UPDATE_FIELD, RESET_FORM & hydration.
  // ==========================================================================
  const [formState, dispatch] = useReducer(assessmentReducer, {
    ...initialFormState,
    name: user?.name || 'Khushi',
    skinType: currentAssessment?.skinType || 'Combination',
    age: currentAssessment?.age || 24,
    waterIntake: currentAssessment?.waterIntake || 2.5,
    sunExposure: currentAssessment?.sunExposure || 2
  });

  // ==========================================================================
  // 1. useState: Local UI and Interactive States
  // Used for step navigation, loading animation, and quick feedback alerts
  // ==========================================================================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(formState.waterIntake);

  // ==========================================================================
  // 2. useEffect: Syncing with initial context data
  // Updates the form whenever the user logs in or profile changes
  // ==========================================================================
  useEffect(() => {
    // // useEffect: Synchronizing form state when global user name changes
    if (user?.name && formState.name !== user.name) {
      dispatch({
        type: ASSESSMENT_ACTIONS.UPDATE_FIELD,
        field: 'name',
        value: user.name
      });
    }
  }, [user?.name]);

  // ==========================================================================
  // 5. useCallback: Memoized Updater & Submission Handlers
  // Prevents recreation of callbacks on every render pass
  // ==========================================================================

  // useCallback: Memoized generic field updater
  const updateField = useCallback((field, value) => {
    dispatch({
      type: ASSESSMENT_ACTIONS.UPDATE_FIELD,
      field,
      value
    });
  }, [dispatch]);

  // useCallback: Memoized reset form handler
  const handleReset = useCallback(() => {
    dispatch({
      type: ASSESSMENT_ACTIONS.RESET_FORM,
      defaultName: user?.name || 'Khushi'
    });
    setSelectedPreset(2.5);
    setFormMessage('Form reset back to default baseline values.');
    setTimeout(() => setFormMessage(''), 3000);
  }, [user?.name, dispatch]);

  // ==========================================================================
  // 6. useMemo: Skin Health Score & Recommendations Calculation
  // Computes score (0-100) and personalized recommendations only when
  // relevant assessment inputs (skinType, age, waterIntake, sunExposure) change.
  // ==========================================================================
  const liveAnalysis = useMemo(() => {
    // // useMemo: Calculates score dynamically when dependencies change
    return calculateSkinScore({
      skinType: formState.skinType,
      age: formState.age,
      waterIntake: formState.waterIntake,
      sunExposure: formState.sunExposure
    });
  }, [formState.skinType, formState.age, formState.waterIntake, formState.sunExposure]);

  // // useMemo: Generates personalized routine based on calculated score & skin type
  const recommendations = useMemo(() => {
    return getSkinRecommendations(formState.skinType, liveAnalysis.score, liveAnalysis.riskLevel);
  }, [formState.skinType, liveAnalysis.score, liveAnalysis.riskLevel]);

  // // useCallback: Memoized form submission handler
  const handleAssessmentSubmit = useCallback((e) => {
    e.preventDefault();

    // Basic validation
    if (!formState.name.trim()) {
      setFormMessage('Please enter your name.');
      return;
    }
    if (formState.age < 12 || formState.age > 100) {
      setFormMessage('Please enter a valid age between 12 and 100.');
      return;
    }

    setIsSubmitting(true);
    setFormMessage('AI dermatological engine calculating health score...');

    // Simulate fast precision AI analysis
    setTimeout(() => {
      const finalizedAssessment = {
        name: formState.name,
        age: parseInt(formState.age, 10),
        skinType: formState.skinType,
        waterIntake: parseFloat(formState.waterIntake),
        sunExposure: parseFloat(formState.sunExposure),
        score: liveAnalysis.score,
        riskLevel: liveAnalysis.riskLevel,
        factors: liveAnalysis.factors,
        recommendations,
        hereditaryRisk: 'Low',
        lastAssessmentDate: 'Today'
      };

      // Save to global context + triggers localStorage effect
      saveAssessment(finalizedAssessment);
      setIsSubmitting(false);

      // Navigate to results screen
      setActiveTab('result');
    }, 600);
  }, [formState, liveAnalysis, recommendations, saveAssessment, setActiveTab]);

  // Skin Type options with descriptions and icons
  const skinTypes = [
    { id: 'Normal', label: 'Normal', desc: 'Balanced hydration, few imperfections, smooth texture.' },
    { id: 'Dry', label: 'Dry', desc: 'Prone to tightness, flaking, fine lines, needs barrier moisture.' },
    { id: 'Oily', label: 'Oily', desc: 'Excess sebum, visible pores, prone to shine and blemishes.' },
    { id: 'Combination', label: 'Combination', desc: 'Oily T-zone (forehead, nose) and normal-to-dry cheeks.' }
  ];

  return (
    <div className="assessment-page">
      {/* Top Banner */}
      <div className="assessment-header-banner">
        <div>
          <h2>Precision Skin Assessment</h2>
          <p>Complete the dermatological parameters below to calculate your Skin Health Score.</p>
        </div>
        <div className="hook-indicator-tag">
          <Sparkles size={14} />
          <span>Clinical AI Assessment</span>
        </div>
      </div>

      {formMessage && (
        <div className="banner-toast" style={{ backgroundColor: '#1b382b' }}>
          <span>{formMessage}</span>
          <button
            onClick={() => setFormMessage('')}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Stepper Header matching slice 2 */}
      <div className="stepper-nav">
        <button
          type="button"
          className={`step-pill ${formState.step === 1 ? 'active' : ''}`}
          onClick={() => updateField('step', 1)}
        >
          <span className="step-num">1</span>
          <span>Personal Info</span>
        </button>
        <span style={{ color: '#cbd5e1' }}>—</span>
        <button
          type="button"
          className={`step-pill ${formState.step === 2 ? 'active' : ''}`}
          onClick={() => updateField('step', 2)}
        >
          <span className="step-num">2</span>
          <span>Skin Attributes</span>
        </button>
        <span style={{ color: '#cbd5e1' }}>—</span>
        <button
          type="button"
          className={`step-pill ${formState.step === 3 ? 'active' : ''}`}
          onClick={() => updateField('step', 3)}
        >
          <span className="step-num">3</span>
          <span>Hydration & Lifestyle</span>
        </button>
      </div>

      <form onSubmit={handleAssessmentSubmit}>
        <div className="form-grid-layout">
          {/* Main Form Body */}
          <div className="form-main-card">
            {/* Step 1: Personal Info */}
            <div className="form-section-title">
              <User size={18} />
              <span>Step 1: Patient Details</span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="user-name">Your Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Khushi Satam"
                  value={formState.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="user-age">Age (years)</label>
                <input
                  id="user-age"
                  type="number"
                  min="12"
                  max="100"
                  className="form-input"
                  value={formState.age}
                  onChange={(e) => updateField('age', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Step 2: Skin Type Selector */}
            <div className="form-section-title" style={{ marginTop: '20px' }}>
              <ShieldCheck size={18} />
              <span>Step 2: Select Skin Type</span>
            </div>

            <div className="skin-types-grid">
              {skinTypes.map((type) => {
                const isSelected = formState.skinType === type.id;
                return (
                  <div
                    key={type.id}
                    className={`skin-type-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => updateField('skinType', type.id)}
                  >
                    <div className="skin-card-top">
                      <span className="skin-card-title">{type.label}</span>
                      {isSelected && <CheckCircle2 size={16} color="#15803d" />}
                    </div>
                    <p className="skin-card-desc">{type.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Step 3: Water Intake & Sun Exposure */}
            <div className="form-section-title" style={{ marginTop: '28px' }}>
              <Droplets size={18} />
              <span>Step 3: Daily Water Intake & Sun Exposure</span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Water Intake: {formState.waterIntake} Liters/Day</label>
                <span style={{ fontSize: '11.5px', color: '#15803d', fontWeight: 600 }}>
                  {formState.waterIntake >= 2.5 ? '✓ Optimal Hydration' : '⚠ Below Recommended'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.5"
                step="0.1"
                className="range-slider"
                value={formState.waterIntake}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateField('waterIntake', val);
                  setSelectedPreset(val);
                }}
              />
              <div className="slider-labels">
                <span>0.5 L (Dehydrated)</span>
                <span>2.5 L (Standard)</span>
                <span>4.5 L (High)</span>
              </div>

              {/* Quick Presets */}
              <div className="quick-pills">
                {[1.5, 2.0, 2.5, 3.0, 3.5].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`pill-btn ${selectedPreset === amt ? 'active' : ''}`}
                    onClick={() => {
                      updateField('waterIntake', amt);
                      setSelectedPreset(amt);
                    }}
                  >
                    {amt}L
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">
                Sun Exposure: {formState.sunExposure} Hour{formState.sunExposure > 1 ? 's' : ''} / Day
              </label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                className="range-slider"
                value={formState.sunExposure}
                onChange={(e) => updateField('sunExposure', parseFloat(e.target.value))}
              />
              <div className="slider-labels">
                <span>0 hrs (Indoor)</span>
                <span>3 hrs</span>
                <span>8+ hrs (High UV)</span>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="form-actions-bar">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                title="Reset form state using useReducer"
              >
                <RotateCcw size={15} style={{ marginRight: '6px' }} />
                Reset Form
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Analyzing...</span>
                ) : (
                  <>
                    <span>Analyze My Skin</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: AI Live Pre-screening Summary */}
          <aside className="guide-side-card">
            <div className="ai-preview-box">
              <h3>
                <Sparkles size={17} color="#255e42" />
                <span>Live AI Pre-Screening</span>
              </h3>
              <p style={{ fontSize: '12px', color: '#6b7a72', marginBottom: '14px' }}>
                Real-time algorithmic estimate based on your physiological inputs.
              </p>

              <div className="preview-stat-row">
                <span>Estimated Score:</span>
                <span style={{ fontSize: '18px', color: '#14281e' }}>{liveAnalysis.score} / 100</span>
              </div>

              <div className="preview-stat-row">
                <span>Calculated Risk:</span>
                <span style={{ color: liveAnalysis.riskColor }}>{liveAnalysis.riskLevel}</span>
              </div>

              <div className="preview-stat-row">
                <span>Hydration Status:</span>
                <span>{liveAnalysis.factors.hydrationRating}</span>
              </div>

              <div className="preview-stat-row">
                <span>UV Exposure Rating:</span>
                <span>{liveAnalysis.factors.uvRisk}</span>
              </div>

              <div className="preview-stat-row">
                <span>Selected Skin Type:</span>
                <span>{formState.skinType}</span>
              </div>
            </div>

            {/* Clinical Guidance Card */}
            <div className="ai-preview-box" style={{ background: '#f4f8f5', borderColor: '#d3e4d8' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#163828', marginBottom: '6px' }}>
                Clinical Protocol Note:
              </h4>
              <p style={{ fontSize: '11.5px', color: '#45594e', lineHeight: 1.45 }}>
                Evaluated against dermatological barrier preservation metrics. Results are automatically synchronized with your clinical profile and historic scans.
              </p>
            </div>
          </aside>
        </div>
      </form>
    </div>
  );
}
