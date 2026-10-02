import React from 'react';
import { PageShell, Section } from '../components/PageShell';

export const WhyPage: React.FC = () => {
  return (
    <PageShell title="Why this problem">
      <h1 className="hero-title" style={{ marginBottom: '2rem' }}>Why this problem</h1>
      
      <Section title="The decisions that matter">
        <p>
          Who goes first, which hospital, which route, what changes when a road is blocked.
        </p>
      </Section>

      <Section title="What the public record shows">
        <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="feature-card">
            <h3 className="feature-title">Delhi, Satya Niketan, 6 September 2026</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: collapse of a boys' paying-guest building during basement repair work at about 1:30 p.m.; reporting describes a multi-agency rescue lasting more than 27 hours; final reported figures were 7 deaths and 12 people rescued or recovered, after early reports gave different numbers. The cause was still under investigation as of reporting on 2 October 2026.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Boisar, Palghar, Maharashtra, 21 August 2025</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: nitrogen gas leak at a pharmaceutical unit; reporting says six workers were taken to one hospital, four died and two were treated in intensive care. A valve defect was alleged by a family complaint and was not confirmed in the reporting reviewed.
            </p>
          </div>
          <div className="feature-card">
            <h3 className="feature-title">Kerala, late May 2025</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: an early-monsoon multi-district emergency with rain, flash floods, landslide risk and power outages; reported figures for missing people and relief camps changed from day to day and between sources.
            </p>
          </div>
        </div>
      </Section>

      <Section title="What these cases do not show">
        <p style={{ marginBottom: '1rem' }}>
          In the public reporting we reviewed, details such as ambulance counts, formal triage categories, hospital bed or blood capacity, and how patients were allocated to hospitals were generally not documented. Reported figures also changed over time without a visible record of who updated what and when.
        </p>
        <p>
          RESQNET does not claim it would have changed any outcome in these incidents. It explores how allocation decisions could be made explicit and checkable.
        </p>
      </Section>

      <Section title="Our response">
        <p>
          Make the decision logic explicit. Run it on real road geometry. Keep a verifiable record.
        </p>
      </Section>
    </PageShell>
  );
};
