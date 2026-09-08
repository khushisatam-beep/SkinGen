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
      <p style={{ fontSize: '13.5px', color: '#5e6f65', lineHeight: 1.6, marginBottom: '20px' }}>
        Dermatologist-formulated regimens synchronized with your daily lifestyle and climate factors.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: '1px solid #e5ece6', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Barrier Restoration Protocol</h4>
            <p style={{ fontSize: '12px', color: '#6b7a72' }}>Morning broad-spectrum SPF 50+ paired with вечер squalane barrier hydration.</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '9999px', background: '#eaf4ee', color: '#166534' }}>
            Active
          </span>
        </div>
        <div style={{ border: '1px solid #e5ece6', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Periodic Lesion Photography Scan</h4>
            <p style={{ fontSize: '12px', color: '#6b7a72' }}>Every 30 days - high-resolution dermoscopic comparison check.</p>
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
  const { setActiveTab } = useApp();
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
      <p style={{ fontSize: '13.5px', color: '#5e6f65', lineHeight: 1.6 }}>
        Track hereditary dermatological history across 3 generations to calibrate AI predisposition weights.
      </p>
    </div>
  );
}

export function ReportsView() {
  const { setActiveTab } = useApp();
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
      <p style={{ fontSize: '13.5px', color: '#5e6f65', lineHeight: 1.6 }}>
        Review your historic skin health assessments and export printable clinical PDF summaries.
      </p>
    </div>
  );
}
