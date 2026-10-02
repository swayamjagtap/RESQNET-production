import React, { useState } from 'react';
import { PageShell, Section } from '../components/PageShell';
import { COMPARISON_CONSTANTS } from '../lib/comparison-constants';

export const HowItWorksPage: React.FC = () => {
  const [tamperExpanded, setTamperExpanded] = useState(false);

  return (
    <PageShell title="How it works">
      <h1 className="hero-title" style={{ marginBottom: '2rem' }}>How it works</h1>
      
      <Section>
        <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <li><strong>Build or load a scenario</strong> (hospitals, ambulances, casualties, incident location on a map)</li>
          <li><strong>Snap to real roads</strong> (OpenStreetMap road graph for Vile Parle and surroundings)</li>
          <li><strong>Dispatch</strong> (severity-first groups sized to ambulance capacity, resources reserved so two ambulances cannot claim the same stock)</li>
          <li><strong>Choose a hospital</strong> (reachable and sufficiently stocked, with the reasons for every candidate shown)</li>
          <li><strong>Move and adapt</strong> (A* routing; blocked or partial roads change routes; an ambulance on a newly blocked road finishes that road, then reroutes)</li>
          <li><strong>Record and verify</strong> (each event is hashed together with the previous hash; Verify log recomputes the whole chain and names the first broken entry with recorded and recomputed hashes)</li>
          <li><strong>Compare policies</strong> (same scenario run under a nearest-hospital, arrival-order baseline and the resource-aware policy)</li>
        </ol>
      </Section>

      <Section>
        <div className="feature-card" style={{ marginBottom: '2rem' }}>
          <button 
            onClick={() => setTamperExpanded(!tamperExpanded)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-main)', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: 0
            }}
            aria-expanded={tamperExpanded}
          >
            What does tamper-evident mean? {tamperExpanded ? '▼' : '▶'}
          </button>
          {tamperExpanded && (
            <p style={{ marginTop: '1rem' }}>
              Each entry's hash includes the previous entry's hash, so editing an old entry breaks every later link and Verify log reports the first broken entry. The chain is stored in this browser with no outside witness: someone who can rewrite the whole chain can recompute every hash. It is not immutable and not a blockchain.
            </p>
          )}
        </div>
      </Section>

      <Section>
        <div className="feature-card">
          <h3 className="feature-title">Policy comparison, in one synthetic scenario</h3>
          <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
            On the balanced demo, the resource-aware policy reached high-priority patients sooner ({COMPARISON_CONSTANTS.demo.raHighPriorityMean} vs {COMPARISON_CONSTANTS.demo.baselineHighPriorityMean} mean) and everything else tied. On the resource-stress demo, which is designed so the nearest hospital lacks critical stock, the baseline was faster ({COMPARISON_CONSTANTS.stress.baselineHighPriorityMean} vs {COMPARISON_CONSTANTS.stress.raHighPriorityMean} for high-priority patients; {COMPARISON_CONSTANTS.stress.baselineElapsed} vs {COMPARISON_CONSTANTS.stress.raElapsed} overall) but delivered {COMPARISON_CONSTANTS.stress.baselineShortOfStock} patients to a hospital short of required stock, against {COMPARISON_CONSTANTS.stress.raShortOfStock} for the resource-aware policy. These are single synthetic runs, not general or clinical results.
          </p>
        </div>
      </Section>
    </PageShell>
  );
};
