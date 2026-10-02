import React from 'react';
import { PageShell, Section } from '../components/PageShell';

export const RoadmapPage: React.FC = () => {
  return (
    <PageShell title="Roadmap">
      <h1 className="hero-title" style={{ marginBottom: '2rem' }}>Roadmap</h1>
      
      <Section title="What is built / what is planned">
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem' }}>Capability</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {/* Built */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Sign-in with owner-scoped data (database row-level security)</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Scenario/hospital/ambulance management</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Map-based location picking</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Real OpenStreetMap road graph</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>A* routing</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Capacity-limited dispatch with reservations and repeated trips</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Resource-aware hospital choice</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Live road blocking and rerouting</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Hash-chained log with verify/export/verify-file</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Policy comparison</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Live dashboard</td>
                <td style={{ padding: '0.75rem' }}>Built</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              {/* Prototype */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Public sign-up email</td>
                <td style={{ padding: '0.75rem' }}>Prototype</td>
                <td style={{ padding: '0.75rem' }}>Uses the default email service which is rate limited; custom SMTP needed.</td>
              </tr>
              {/* Planned */}
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Mid-run demand and stock changes</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>One-way road rules</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Live hospital data feeds</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Role-based dispatcher/hospital accounts</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Independent time-stamping or external witness for the log</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Validation with domain experts</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem' }}>Global optimisation</td>
                <td style={{ padding: '0.75rem' }}>Planned</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Funds tracking</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Out of scope</td>
                <td style={{ padding: '0.75rem' }}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Can it handle success next week?">
        <p style={{ marginBottom: '1rem' }}>
          Static front end on Vercel, Supabase free tier for sign-in and scenario storage, the simulation runs entirely in the visitor's browser so simulation load does not scale with server cost.
        </p>
        <p>
          Known limits: Supabase free-tier and email limits, one scenario per run in the browser, no multi-operator live control.
        </p>
      </Section>
    </PageShell>
  );
};
