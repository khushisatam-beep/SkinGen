import React from 'react';
import { Info, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

/**
 * About Component
 * Serves as the About page (route '/about').
 * Displays SkinGen platform information within the standard application layout.
 */
export default function About() {
  const { setActiveTab } = useApp();

  return (
    <div className="card-panel" style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Info size={22} color="#275941" />
          <h3>About SkinGen AI</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '20px' }}>
        <strong>SkinGen AI</strong> is an advanced Precision Dermatology platform designed to assist individuals and clinicians in tracking and assessing skin health metrics.
      </p>

      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
        Platform Overview
      </h4>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
        SkinGen provides automated evaluations that factor in environmental triggers such as UV exposure, lifestyle routines including hydration levels, and hereditary genetic risk markers. Our goal is to make preventive dermatological health insights clear, accessible, and actionable.
      </p>

      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
        Core Features
      </h4>
      <ul style={{ paddingLeft: '22px', color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '13.5px', marginBottom: '20px' }}>
        <li>Precision Skin Assessment and personalized risk scoring</li>
        <li>Hereditary marker tracking and pedigree analysis</li>
        <li>Customized lifestyle and UV protection care plans</li>
        <li>Centralized health profile and historical report logs</li>
      </ul>
    </div>
  );
}
