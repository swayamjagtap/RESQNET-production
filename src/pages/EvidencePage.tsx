import React, { useEffect, useState } from 'react';
import { PageShell, Section } from '../components/PageShell';
import { AMBULANCE_SPEED_MPS } from '../sim/engine';
import { loadVileParleGraph } from '../sim/graph';

export const EvidencePage: React.FC = () => {
  const [fetchedAt, setFetchedAt] = useState<string>('Loading...');

  useEffect(() => {
    loadVileParleGraph().then((graph) => {
      setFetchedAt(graph.metadata.fetchedAt);
    }).catch(() => {
      setFetchedAt('Unknown');
    });
  }, []);

  return (
    <PageShell title="Evidence and sources">
      <h1 className="hero-title" style={{ marginBottom: '2rem' }}>Evidence and sources</h1>
      
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '2rem' }}>
        How to read this page: Facts are attributed to the outlet that reported them as of the dates shown. Causes in all three incidents were under investigation or disputed in the reporting reviewed. We use no personal names.
      </div>

      <Section>
        <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Delhi */}
          <div className="feature-card">
            <h3 className="feature-title">Delhi, Satya Niketan, 6 September 2026</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: collapse of a boys' paying-guest building during basement repair work at about 1:30 p.m.; reporting describes a multi-agency rescue lasting more than 27 hours; final reported figures were 7 deaths and 12 people rescued or recovered, after early reports gave different numbers. The cause was still under investigation as of reporting on 2 October 2026.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>What the sources say about response data</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              Reporting generally focused on rescue duration and casualties, not explicit triage categories, ambulance counts, or hospital capacity details.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Limits of the reporting</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              Details on how patients were allocated to specific hospitals and the resources available at those hospitals were not comprehensively documented. Reported figures changed over time.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Sources</h4>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <li>The Hindu 6 Sep 2026 <a href="https://www.thehindu.com/news/cities/Delhi/delhi-satya-niketan-building-collapse-september-6-2026-several-trapped-injured/article71434876.ece" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>The Hindu 7 Sep 2026 <a href="https://www.thehindu.com/news/cities/Delhi/delhi-building-collapse-death-toll-up-to-7-hc-orders-citywide-pg-inspection-flags-student-housing-woes/article71439955.ece" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>New Indian Express 7 Sep 2026 <a href="https://www.newindianexpress.com/cities/delhi/2026/Sep/07/delhi-building-collapse-rescue-operation-ends-after-27-hours-no-fresh-casualties" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Hindustan Times 7 Sep 2026 <a href="https://www.hindustantimes.com/cities/delhi-news/satya-niketan-building-plan-not-sanctioned-mcd-says-latest-work-was-illegal-101788721204156.html" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>India Today 24 Sep 2026 <a href="https://www.indiatoday.in/amp/cities/delhi/story/satya-niketan-building-collapse-delhi-police-six-accused-safety-lapses-ptag-3002201-2026-09-24" target="_blank" rel="noopener noreferrer">Link</a></li>
            </ul>
          </div>

          {/* Boisar */}
          <div className="feature-card">
            <h3 className="feature-title">Boisar, Palghar, Maharashtra, 21 August 2025</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: nitrogen gas leak at a pharmaceutical unit; reporting says six workers were taken to one hospital, four died and two were treated in intensive care. A valve defect was alleged by a family complaint and was not confirmed in the reporting reviewed.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>What the sources say about response data</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              Sources state six workers were taken to one specific hospital, but lack detail on whether this was due to proximity, bed availability, or triage decisions.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Limits of the reporting</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              No documented record of alternative hospitals considered, the capacity of the receiving hospital at the time, or the exact transport logistics.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Sources</h4>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <li>The Hindu 22 Aug 2025 <a href="https://www.thehindu.com/news/national/maharashtra/fatal-gas-leak-at-palghar-pharma-unit-four-company-officials-booked-for-culpable-homicide/article69963530.ece" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Indian Express 22 Aug 2025 <a href="https://indianexpress.com/article/cities/mumbai/tarapur-midc-four-workers-dead-2-critical-after-nitrogen-gas-leak-at-pharma-unit-10203774/" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>PIB 27 Aug 2025 <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2161078" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Hindustan Times 4 Sep 2025 <a href="https://www.hindustantimes.com/cities/mumbai-news/ngt-takes-suo-motu-cognisance-after-four-died-in-gas-leak-at-boisar-based-pharma-company-101757011243005.html" target="_blank" rel="noopener noreferrer">Link</a></li>
            </ul>
          </div>

          {/* Kerala */}
          <div className="feature-card">
            <h3 className="feature-title">Kerala, late May 2025</h3>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              As reported: an early-monsoon multi-district emergency with rain, flash floods, landslide risk and power outages; reported figures for missing people and relief camps changed from day to day and between sources.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>What the sources say about response data</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              Reporting highlighted broad multi-district impacts and relief camp mobilization rather than granular hospital triage or transport data.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Limits of the reporting</h4>
            <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
              Changes in reported figures were not accompanied by a visible record of who updated what and when, making tracking resource allocation challenges difficult.
            </p>
            <h4 style={{ marginTop: '1rem', color: 'var(--text-main)' }}>Sources</h4>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <li>Sphere India Situation Report 2, 30 May 2025 <a href="https://www.sphereindia.org.in/sites/default/files/2025-06/SitRep%202_Kerala%20Rainfall.pdf" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>The New Indian Express 31 May 2025 <a href="https://www.newindianexpress.com/states/kerala/2025/May/31/five-dead-13-missing-as-kerala-reels-under-monsoon-fury" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>Press Trust of India via The Week 29 May 2025 <a href="https://www.theweek.in/wire-updates/national/2025/05/29/mes16-kl-3rdld-rains.html" target="_blank" rel="noopener noreferrer">Link</a></li>
              <li>India Meteorological Department press release 29 May 2025 <a href="https://internal.imd.gov.in/press_release/20250529_pr_4011.pdf" target="_blank" rel="noopener noreferrer">Link</a></li>
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="feature-card">
          <h3 className="feature-title">Data and method</h3>
          <p className="feature-desc" style={{ marginTop: '0.5rem' }}>
            Road data from OpenStreetMap contributors (ODbL), fetched once on {fetchedAt}, one-way tags ignored, parallel edges merged, graph slightly wider than the query box; ambulance speed is an assumption ({AMBULANCE_SPEED_MPS} m/s), all hospitals, ambulances and patients are synthetic; <a href="/graph-preview">Road data</a>.
          </p>
        </div>
      </Section>

    </PageShell>
  );
};
