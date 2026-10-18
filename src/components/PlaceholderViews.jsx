import React from 'react';
import { Dna, Users, ClipboardList, BarChart3, ArrowLeft } from 'lucide-react';
// // useContext: Accessing activeTab and navigation
import { useApp } from '../context/AppContext';

export function HereditaryRiskView() {
  const { setActiveTab } = useApp();
  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Dna size={22} color="#275941" />
          <h3>Hereditary & Genetic Risk Markers</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>
      <p style={{ fontSize: '13.5px', color: '#5e6f65', lineHeight: 1.6, marginBottom: '20px' }}>
        AI genomic cross-referencing against hereditary cutaneous melanoma mutations (CDKN2A, CDK4, BAP1).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ border: '1px solid #e5ece6', borderRadius: '12px', padding: '16px', background: '#fbfdfa' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>STATUS: NEGATIVE</span>
          <h4 style={{ fontSize: '15px', marginTop: '6px' }}>CDKN2A Marker</h4>
          <p style={{ fontSize: '12px', color: '#6b7a72', marginTop: '4px' }}>No high-risk familial melanoma mutations detected.</p>
        </div>
        <div style={{ border: '1px solid #e5ece6', borderRadius: '12px', padding: '16px', background: '#fbfdfa' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>STATUS: NORMAL</span>
          <h4 style={{ fontSize: '15px', marginTop: '6px' }}>MC1R Red Hair Variant</h4>
          <p style={{ fontSize: '12px', color: '#6b7a72', marginTop: '4px' }}>Standard cutaneous phototype baseline sensitivity.</p>
        </div>
        <div style={{ border: '1px solid #e5ece6', borderRadius: '12px', padding: '16px', background: '#fbfdfa' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>STATUS: IN REVIEW</span>
          <h4 style={{ fontSize: '15px', marginTop: '6px' }}>Maternal Pedigree</h4>
          <p style={{ fontSize: '12px', color: '#6b7a72', marginTop: '4px' }}>Maternal grandfather lineage history pending entry.</p>
        </div>
      </div>
    </div>
  );
}

export function CarePlansView() {
  const { setActiveTab } = useApp();
  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ClipboardList size={22} color="#275941" />
          <h3>Active Care Plans & Protocols</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
        Dermatologist-formulated regimens synchronized with your daily lifestyle and climate factors.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Barrier Restoration Protocol</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Morning broad-spectrum SPF 50+ paired with evening squalane barrier hydration.</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', background: '#eaf4ee', color: '#166534' }}>
            Active
          </span>
        </div>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Periodic Lesion Photography Scan</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Every 30 days - high-resolution dermoscopic comparison check.</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', background: '#fef3c7', color: '#92400e' }}>
            Due in 2 days
          </span>
        </div>
      </div>
    </div>
  );
}

export function FamilyHistoryView() {
  const { setActiveTab, triggerNotification } = useApp();
  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} color="#275941" />
          <h3>Family Dermatological Pedigree</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
        Track hereditary dermatological history across 3 generations to calibrate AI predisposition weights.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: 'var(--bg-app)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>GENERATION 1 • PARENTAL</span>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>Mother & Father Lineage</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>No history of melanoma or atypical dysplastic nevi reported.</p>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: 'var(--bg-app)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>GENERATION 2 • MATERNAL</span>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>Maternal Grandfather</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Phototype II skin; actinic keratosis history documented.</p>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', background: 'var(--bg-app)' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>GENERATION 2 • PATERNAL</span>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>Paternal Grandparents</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Negative for cutaneous malignancies.</p>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          className="btn-secondary"
          onClick={() => triggerNotification('Pedigree record entry prompt logged.')}
        >
          + Add Relative Medical History
        </button>
      </div>
    </div>
  );
}

export function ReportsView() {
  const { setActiveTab, currentAssessment } = useApp();
  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={22} color="#275941" />
          <h3>Clinical Assessment Archive & Reports</h3>
        </div>
        <button className="btn-secondary" onClick={() => setActiveTab('dashboard')}>
          <ArrowLeft size={14} style={{ marginRight: '4px' }} /> Dashboard
        </button>
      </div>
      <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
        Review your historic skin health assessments and export printable clinical PDF summaries.
      </p>

      <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>LATEST AI DERMATOLOGICAL SCAN</span>
          <h4 style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
            Full Clinical Barrier Evaluation — Score: {currentAssessment?.score || 62}/100
          </h4>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Classification: {currentAssessment?.riskLevel || 'Moderate'} Risk • Skin Type: {currentAssessment?.skinType || 'Combination'} • Date: {currentAssessment?.lastAssessmentDate || 'Recent'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-primary"
            onClick={() => setActiveTab('result')}
          >
            Open Full Report
          </button>
          <button
            className="btn-secondary"
            onClick={() => window.print()}
          >
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}
