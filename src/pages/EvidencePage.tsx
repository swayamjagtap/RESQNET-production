import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell, Section } from '../components/PageShell';

const gradientTextStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 52%, #f43f5e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const bodyStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '1.05rem',
  lineHeight: 1.75,
};

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-block',
  marginBottom: '1.25rem',
  color: 'var(--text-muted)',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const smallLabelStyle: React.CSSProperties = {
  color: '#38bdf8',
  fontSize: '0.78rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '0.6rem',
};

const sectionSpacing: React.CSSProperties = {
  marginTop: '5rem',
};

const cardStyle: React.CSSProperties = {
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface, rgba(15, 23, 42, 0.55))',
};

const textLinkStyle: React.CSSProperties = {
  color: '#38bdf8',
  fontWeight: 700,
  textDecoration: 'none',
};

const sourceLinkStyle: React.CSSProperties = {
  color: '#38bdf8',
  textDecoration: 'none',
  fontWeight: 650,
  lineHeight: 1.5,
};

const SectionHeading: React.FC<{
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ children, maxWidth = '900px' }) => (
  <h2
    className="evidence-section-heading"
    style={{
      lineHeight: 1.1,
      letterSpacing: '-0.035em',
      marginBottom: '1.25rem',
      maxWidth,
    }}
  >
    {children}
  </h2>
);

const EvidenceCard: React.FC<{
  label: string;
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'violet' | 'rose';
}> = ({ label, title, children, accent = 'blue' }) => {
  const accentMap = {
    blue: {
      border: 'rgba(56, 189, 248, 0.28)',
      background: 'rgba(56, 189, 248, 0.05)',
    },
    violet: {
      border: 'rgba(139, 92, 246, 0.28)',
      background: 'rgba(139, 92, 246, 0.05)',
    },
    rose: {
      border: 'rgba(244, 63, 94, 0.28)',
      background: 'rgba(244, 63, 94, 0.05)',
    },
  };

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: accentMap[accent].border,
        background: accentMap[accent].background,
      }}
    >
      <div style={smallLabelStyle}>{label}</div>

      <h3
        style={{
          marginTop: 0,
          marginBottom: '0.75rem',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      <div style={{ ...bodyStyle, margin: 0 }}>{children}</div>
    </div>
  );
};

const ClaimRow: React.FC<{
  claim: string;
  proof: string;
}> = ({ claim, proof }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(160px, 0.8fr) minmax(260px, 2fr)',
      gap: '1rem',
      padding: '1rem 0',
      borderBottom: '1px solid var(--border-color)',
    }}
  >
    <div
      style={{
        fontWeight: 750,
        lineHeight: 1.45,
      }}
    >
      {claim}
    </div>

    <div style={bodyStyle}>{proof}</div>
  </div>
);

export const EvidencePage: React.FC = () => {
  return (
    <PageShell title="Evidence">
      <style>
        {`
          .evidence-hero-heading {
            font-size: 3.35rem;
          }

          .evidence-section-heading {
            font-size: 2.35rem;
          }

          .evidence-case-heading {
            font-size: 1.85rem;
          }

          .evidence-pull-quote {
            font-size: 1.65rem;
          }

          .evidence-final-heading {
            font-size: 2.7rem;
          }

          @media (max-width: 800px) {
            .evidence-hero-heading {
              font-size: 2.7rem;
            }

            .evidence-section-heading {
              font-size: 2.05rem;
            }

            .evidence-case-heading {
              font-size: 1.65rem;
            }

            .evidence-pull-quote {
              font-size: 1.45rem;
            }

            .evidence-final-heading {
              font-size: 2.3rem;
            }

            .evidence-claim-row {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 520px) {
            .evidence-hero-heading {
              font-size: 2.2rem;
              line-height: 1.08 !important;
            }

            .evidence-section-heading {
              font-size: 1.8rem;
            }

            .evidence-case-heading {
              font-size: 1.5rem;
            }

            .evidence-pull-quote {
              font-size: 1.28rem;
            }

            .evidence-final-heading {
              font-size: 2rem;
            }
          }

          .evidence-source-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      {/* HERO */}
      <section
        aria-labelledby="evidence-hero-title"
        style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxWidth: '980px',
        }}
      >
        <div style={eyebrowStyle}>Evidence</div>

        <h1
          id="evidence-hero-title"
          className="hero-title evidence-hero-heading"
          style={{
            marginBottom: '1.75rem',
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            maxWidth: '940px',
          }}
        >
          Evidence should make a claim easier to inspect,
          <br />
          <span style={gradientTextStyle}>not harder to trust.</span>
        </h1>

        <div
          style={{
            ...bodyStyle,
            maxWidth: '840px',
            fontSize: '1.15rem',
          }}
        >
          <p>RESQNET is built around two different kinds of evidence.</p>

          <p>
            First, real disaster reporting that shows how complex emergency
            coordination becomes — and how difficult it can be to reconstruct
            the allocation decisions afterwards.
          </p>

          <p>
            Second, synthetic simulation runs that let us inspect how the MVP
            behaves under controlled conditions.
          </p>

          <p>
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              We keep those two evidence layers separate.
            </strong>
          </p>
        </div>
      </section>

      {/* EVIDENCE LAYER ONE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Evidence layer one</div>

          <SectionHeading>
            Real incidents motivate the problem.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              We reviewed three very different emergencies: a structural
              collapse in Delhi, an industrial nitrogen leak in Boisar, and a
              multi-district early-monsoon emergency in Kerala.
            </p>

            <p>
              The purpose was not to judge the responders or recreate those
              incidents inside RESQNET.
            </p>

            <p>
              The purpose was to ask a narrower question:
            </p>
          </div>

          <blockquote
            className="evidence-pull-quote"
            style={{
              margin: '1.75rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            What can the public record tell us about how ambulances, hospitals
            and limited medical resources were allocated?
          </blockquote>
        </div>
      </Section>

      {/* DELHI */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 01 · Structural collapse · Delhi
          </div>

          <h2
            className="evidence-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.35rem',
            }}
          >
            Hostel Daze PG collapse
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: 0,
              marginBottom: '1.5rem',
              fontWeight: 600,
            }}
          >
            Satya Niketan · 6 September 2026
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <EvidenceCard
              label="Verified in the reviewed record"
              title="What we can establish"
              accent="blue"
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Collapse at about 1:30 p.m.</li>
                <li>Seven deaths</li>
                <li>12 people rescued or recovered</li>
                <li>Multi-agency emergency response</li>
                <li>CATS ambulances reported at the site</li>
                <li>
                  AIIMS Trauma Centre and Safdarjung Hospital received
                  casualties
                </li>
                <li>Rescue operation lasted more than 27 hours</li>
              </ul>
            </EvidenceCard>

            <EvidenceCard
              label="Not established in the reviewed record"
              title="What we cannot fully reconstruct"
              accent="rose"
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Exact ambulance count</li>
                <li>Formal on-site triage categories</li>
                <li>Trauma-bed capacity at the relevant times</li>
                <li>Detailed patient-by-patient treatment protocols</li>
                <li>
                  Complete reasoning for each individual hospital allocation
                </li>
              </ul>
            </EvidenceCard>
          </div>

          <blockquote
            className="evidence-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            We can see that transport and hospital care happened.
            <br />
            <span style={gradientTextStyle}>
              We cannot fully reconstruct every allocation decision from the
              public record.
            </span>
          </blockquote>
        </div>
      </Section>

      {/* BOISAR */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 02 · Industrial gas release · Maharashtra
          </div>

          <h2
            className="evidence-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.35rem',
            }}
          >
            Medley Pharmaceuticals nitrogen gas leak
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: 0,
              marginBottom: '1.5rem',
              fontWeight: 600,
            }}
          >
            Tarapur MIDC, Boisar · 21 August 2025
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <EvidenceCard
              label="Verified in the reviewed record"
              title="What we can establish"
              accent="violet"
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Nitrogen gas release from a reaction tank</li>
                <li>Six workers directly affected</li>
                <li>Four deaths</li>
                <li>Two workers admitted to intensive care</li>
                <li>All six workers taken to Shinde Hospital</li>
                <li>
                  Police, district authorities, DISH and the Palghar Disaster
                  Management Cell were involved
                </li>
              </ul>
            </EvidenceCard>

            <EvidenceCard
              label="Not established in the reviewed record"
              title="What remains incomplete"
              accent="rose"
            >
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Specific ambulance service used</li>
                <li>Detailed dispatch sequence</li>
                <li>Ambulance-to-hospital allocation logic</li>
                <li>Exact transport duration</li>
                <li>
                  Complete status of pre-incident safety systems and procedures
                </li>
              </ul>
            </EvidenceCard>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              marginTop: '1.5rem',
              borderColor: 'rgba(244, 63, 94, 0.28)',
              background: 'rgba(244, 63, 94, 0.05)',
            }}
          >
            <div style={smallLabelStyle}>Causation caution</div>

            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              The nitrogen leak from the reaction tank is established in the
              reporting. A defective valve and alleged continuation of
              production despite knowledge of the issue were reported as
              allegations under investigation, not as final technical findings.
            </p>
          </div>

          <blockquote
            className="evidence-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #8b5cf6',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            The receiving hospital is known.
            <br />
            <span style={gradientTextStyle}>
              The operational path that produced that outcome is much less
              visible.
            </span>
          </blockquote>
        </div>
      </Section>

      {/* KERALA */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 03 · Multi-district monsoon emergency · Kerala
          </div>

          <h2
            className="evidence-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.35rem',
            }}
          >
            Kerala early-monsoon emergency
          </h2>

          <p
            style={{
              color: 'var(--text-muted)',
              marginTop: 0,
              marginBottom: '1.5rem',
              fontWeight: 600,
            }}
          >
            Late May to early June 2025
          </p>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              This was not one neatly bounded flood event at a single location.
            </p>

            <p>
              The reviewed material describes a multi-district emergency
              involving heavy rainfall, river flooding, flash floods, landslide
              risk, dam releases, transport disruption and widespread
              electricity failures.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1rem',
              marginTop: '1.75rem',
            }}
          >
            <EvidenceCard
              label="29 May 2025"
              title="About 1,200 people"
              accent="blue"
            >
              Reported across 59 relief camps.
            </EvidenceCard>

            <EvidenceCard
              label="30 May 2025"
              title="1,329 people"
              accent="violet"
            >
              395 families reported across 51 camps.
            </EvidenceCard>

            <EvidenceCard
              label="31 May 2025"
              title="1,894 people"
              accent="rose"
            >
              Reported shifted to 66 camps.
            </EvidenceCard>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            These figures are dated operational snapshots. They should not be
            combined into one final cumulative total.
          </p>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              marginTop: '1.5rem',
            }}
          >
            <div style={smallLabelStyle}>
              Not available as one consolidated public dataset
            </div>

            <ul
              style={{
                ...bodyStyle,
                marginBottom: 0,
                paddingLeft: '1.2rem',
              }}
            >
              <li>Statewide ambulance count</li>
              <li>Statewide patient-treatment total</li>
              <li>Emergency-bed additions</li>
              <li>Complete hospital-by-hospital coordination record</li>
              <li>Statewide medical-camp total</li>
            </ul>
          </div>

          <blockquote
            className="evidence-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #f43f5e',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            When the disaster state changes continuously, static reporting
            snapshots make the allocation picture even harder to reconstruct.
          </blockquote>
        </div>
      </Section>

      {/* WHAT CASES ESTABLISH */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>What the evidence supports</div>

          <SectionHeading>
            The evidence supports the question — not a claim of failure.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              The three incidents differ in scale, hazard type and response
              structure.
            </p>

            <p>
              RESQNET does not claim that they shared the same operational
              weakness.
            </p>

            <p>
              What the reviewed material does show is that public reporting can
              describe outcomes, agencies, transfers and response actions more
              clearly than it describes the full sequence of allocation
              decisions.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '0.9rem',
              marginTop: '1.75rem',
            }}
          >
            {[
              'Who was waiting?',
              'Which vehicle was available?',
              'What hospital resources remained?',
              'Which route was still usable?',
              'Why was that option selected at that moment?',
            ].map((question) => (
              <div
                key={question}
                style={{
                  padding: '1rem 1.1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(15, 23, 42, 0.45)',
                  fontWeight: 650,
                  lineHeight: 1.45,
                }}
              >
                {question}
              </div>
            ))}
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 750,
            }}
          >
            That decision layer is the part RESQNET chooses to make explicit.
          </p>
        </div>
      </Section>

      {/* EVIDENCE LAYER TWO */}
      <Section>
        <div
          style={{
            ...sectionSpacing,
            padding: '2.25rem',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius)',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08), rgba(244,63,94,0.05))',
          }}
        >
          <div style={smallLabelStyle}>Evidence layer two</div>

          <SectionHeading>
            Then we test the idea in a controlled synthetic environment.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>RESQNET does not replay the historical incidents.</p>

            <p>
              The MVP uses synthetic casualties, ambulances and hospital
              inventories so that the inputs, allocations and resulting state
              changes can be inspected directly.
            </p>

            <p>
              <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                The hospital inventory values are illustrative simulation
                inputs.
              </strong>{' '}
              They are not published real-world capacities from AIIMS,
              Safdarjung, Shinde Hospital or any other real facility.
            </p>
          </div>
        </div>
      </Section>

      {/* MVP CLAIMS */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Observable MVP evidence</div>

          <SectionHeading>
            What the MVP actually demonstrates.
          </SectionHeading>

          <div
            style={{
              ...cardStyle,
              maxWidth: '950px',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            }}
          >
            <div className="evidence-claim-row">
              <ClaimRow
                claim="Capacity matters"
                proof="Ambulances can carry only a limited number of patients, forcing repeated dispatch cycles rather than one unrealistic all-at-once transfer."
              />
            </div>

            <div className="evidence-claim-row">
              <ClaimRow
                claim="Hospital resources matter"
                proof="Simulated hospitals have different inventories, and earlier assignments change what remains available for later decisions."
              />
            </div>

            <div className="evidence-claim-row">
              <ClaimRow
                claim="Road state matters"
                proof="Routes follow the road graph and can change when roads are restricted or blocked during a running simulation."
              />
            </div>

            <div className="evidence-claim-row">
              <ClaimRow
                claim="State changes matter"
                proof="Later allocations use the remaining simulated resource state rather than assuming that the original hospital capacity still exists."
              />
            </div>

            <div className="evidence-claim-row">
              <ClaimRow
                claim="Decisions are inspectable"
                proof="Dispatches, hospital choices, deliveries, resource changes and reroutes are recorded in the decision log."
              />
            </div>

            <div className="evidence-claim-row">
              <ClaimRow
                claim="Edits can be detected"
                proof="Decision entries are linked using SHA-256, and the verification flow recomputes the chain to check for inconsistency."
              />
            </div>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            The hash chain is tamper-evident within the MVP's storage model. It
            is not a blockchain, an immutable ledger or an independently
            witnessed proof system.
          </p>
        </div>
      </Section>

      {/* POLICY COMPARISON */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Synthetic policy comparison</div>

          <SectionHeading>
            The comparison does not produce a universal winner.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            The same synthetic scenario can be run under a resource-aware policy
            and a simpler nearest-hospital / arrival-order baseline.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <EvidenceCard
              label="Balanced scenario"
              title="When simulated resources were sufficient"
              accent="blue"
            >
              <p style={bodyStyle}>
                Resource-aware mean high-priority delivery time:
              </p>

              <p
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 850,
                  margin: '0.5rem 0',
                }}
              >
                11:11
              </p>

              <p style={bodyStyle}>Baseline:</p>

              <p
                style={{
                  fontSize: '1.9rem',
                  fontWeight: 850,
                  margin: '0.5rem 0 1rem',
                }}
              >
                13:41
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                Both policies delivered all patients without a resource
                shortfall, and their overall simulated completion time tied.
              </p>
            </EvidenceCard>

            <EvidenceCard
              label="Resource-stress scenario"
              title="When the nearest hospital lacked critical stock"
              accent="violet"
            >
              <p style={bodyStyle}>
                High-priority delivery time:
              </p>

              <p
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  margin: '0.5rem 0',
                }}
              >
                Baseline 13:41 · Resource-aware 14:13
              </p>

              <p style={bodyStyle}>Overall completion:</p>

              <p
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  margin: '0.5rem 0 1rem',
                }}
              >
                Baseline 17:52 · Resource-aware 23:34
              </p>

              <p style={bodyStyle}>
                The baseline delivered{' '}
                <strong>9 patients</strong> to a hospital short of the required
                simulated stock.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                Resource-aware delivered <strong>0 patients</strong> short of
                required stock.
              </p>
            </EvidenceCard>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              marginTop: '1.5rem',
              borderColor: 'rgba(244, 63, 94, 0.28)',
              background: 'rgba(244, 63, 94, 0.05)',
            }}
          >
            <div style={smallLabelStyle}>Interpretation</div>

            <p
              style={{
                marginTop: 0,
                fontSize: '1.2rem',
                fontWeight: 750,
                lineHeight: 1.55,
              }}
            >
              The baseline was faster on timing in the resource-stress run.
              <br />
              <span style={gradientTextStyle}>
                The resource-aware policy avoided the simulated stock-shortfall
                outcome.
              </span>
            </p>

            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              These are individual synthetic simulation runs. They are not
              clinical results, general performance guarantees or proof that
              one policy will always outperform the other.
            </p>
          </div>
        </div>
      </Section>

      {/* INTERPRETATION */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>What the comparison means</div>

          <SectionHeading>
            Speed is not the only thing being optimised.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              A nearest-hospital policy can be faster when distance dominates
              the decision.
            </p>

            <p>
              A resource-aware policy may take longer when it avoids a
              destination that lacks the simulated resource required by the
              patient.
            </p>

            <p>
              The experiment is therefore not designed to prove that RESQNET is
              always faster.
            </p>

            <p
              style={{
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '1.25rem',
                lineHeight: 1.55,
                fontWeight: 750,
              }}
            >
              It is designed to make the trade-off visible.
            </p>
          </div>
        </div>
      </Section>

      {/* CLAIM BOUNDARIES */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Claim boundaries</div>

          <SectionHeading>
            Evidence is strongest when the limits are visible too.
          </SectionHeading>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              borderColor: 'rgba(244, 63, 94, 0.28)',
              background: 'rgba(244, 63, 94, 0.04)',
            }}
          >
            <div style={smallLabelStyle}>We do not claim</div>

            <ul
              style={{
                ...bodyStyle,
                marginBottom: 0,
                paddingLeft: '1.2rem',
              }}
            >
              <li>
                That RESQNET would have changed the outcome of any historical
                disaster
              </li>
              <li>
                That synthetic policy comparisons prove a clinical benefit
              </li>
              <li>
                That simulated hospital inventories represent real published
                hospital capacities
              </li>
              <li>
                That the casualty-priority logic is clinically validated triage
              </li>
              <li>
                That the SHA-256 decision chain is a blockchain or immutable
                ledger
              </li>
              <li>That the current MVP tracks fund allocation</li>
              <li>
                That the current allocator performs global optimisation across
                every possible allocation
              </li>
              <li>
                That RESQNET is ready for production emergency-dispatch use
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* SOURCE DISCIPLINE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Source discipline</div>

          <SectionHeading>
            Every real-world claim should lead back to a source.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            The case-study research prioritises official sources and established
            reporting. The links below are a compact public reference set rather
            than the complete bibliography.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>Delhi</div>

              <h3 style={{ marginTop: 0 }}>
                Hostel Daze PG collapse
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: '0.7rem',
                  marginTop: '1rem',
                }}
              >
                <a
                  href="https://www.thehindu.com/news/cities/Delhi/delhi-satya-niketan-building-collapse-september-6-2026-several-trapped-injured/article71434876.ece"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  The Hindu — initial incident and response ↗
                </a>

                <a
                  href="https://www.thehindu.com/news/cities/Delhi/delhi-building-collapse-death-toll-up-to-7-hc-orders-citywide-pg-inspection-flags-student-housing-woes/article71439955.ece"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  The Hindu — final casualty and hospital update ↗
                </a>

                <a
                  href="https://www.newindianexpress.com/cities/delhi/2026/Sep/07/delhi-building-collapse-rescue-operation-ends-after-27-hours-no-fresh-casualties"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  New Indian Express — rescue completion ↗
                </a>

                <a
                  href="https://ndrf.gov.in/en/news/delhi-building-collapse-how-ndrf-conducts-search-and-rescue-operations"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  NDRF — search-and-rescue coverage ↗
                </a>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>Boisar</div>

              <h3 style={{ marginTop: 0 }}>
                Medley Pharmaceuticals gas leak
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: '0.7rem',
                  marginTop: '1rem',
                }}
              >
                <a
                  href="https://www.thehindu.com/news/national/maharashtra/fatal-gas-leak-at-palghar-pharma-unit-four-company-officials-booked-for-culpable-homicide/article69963530.ece"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  The Hindu — incident and FIR ↗
                </a>

                <a
                  href="https://indianexpress.com/article/cities/mumbai/tarapur-midc-four-workers-dead-2-critical-after-nitrogen-gas-leak-at-pharma-unit-10203774/"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  Indian Express — victims and hospital response ↗
                </a>

                <a
                  href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2161078"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  PIB / NHRC — official cognizance ↗
                </a>

                <a
                  href="https://www.hindustantimes.com/cities/mumbai-news/ngt-takes-suo-motu-cognisance-after-four-died-in-gas-leak-at-boisar-based-pharma-company-101757011243005.html"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  Hindustan Times — NGT proceedings ↗
                </a>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>Kerala</div>

              <h3 style={{ marginTop: 0 }}>
                Early-monsoon emergency, 2025
              </h3>

              <div
                style={{
                  display: 'grid',
                  gap: '0.7rem',
                  marginTop: '1rem',
                }}
              >
                <a
                  href="https://mausam.imd.gov.in/Forecast/marquee_data/Press%20Release%2023-05-2025.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  IMD — 23 May heavy-rain warning ↗
                </a>

                <a
                  href="https://www.sphereindia.org.in/sites/default/files/2025-06/SitRep%202_Kerala%20Rainfall.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  Sphere India — Kerala Rainfall Situation Report 2 ↗
                </a>

                <a
                  href="https://www.theweek.in/wire-updates/national/2025/05/29/mes16-kl-3rdld-rains.html"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  PTI / The Week — Kerala response update ↗
                </a>

                <a
                  href="https://www.newindianexpress.com/states/kerala/2025/May/31/five-dead-13-missing-as-kerala-reels-under-monsoon-fury"
                  target="_blank"
                  rel="noreferrer"
                  className="evidence-source-link"
                  style={sourceLinkStyle}
                >
                  New Indian Express — 31 May operational snapshot ↗
                </a>
              </div>
            </div>
          </div>

          <p
            style={{
              ...bodyStyle,
              fontSize: '0.9rem',
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            Reported figures are preserved with their date and reporting scope
            where necessary. Changing operational figures are not silently
            combined into one final total.
          </p>
        </div>
      </Section>

      {/* FINAL CTA */}
      <Section>
        <div
          style={{
            ...sectionSpacing,
            marginBottom: '4rem',
            textAlign: 'center',
            padding: '3rem 1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08), rgba(244,63,94,0.08))',
          }}
        >
          <div style={smallLabelStyle}>From evidence to demonstration</div>

          <h2
            className="evidence-final-heading"
            style={{
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: '850px',
              margin: '0 auto 1.4rem',
            }}
          >
            The evidence explains the problem.
            <br />
            <span style={gradientTextStyle}>
              The demo shows the mechanism.
            </span>
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            Review the sources, then run the allocation logic yourself.
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1.25rem',
              flexWrap: 'wrap',
              marginTop: '2rem',
            }}
          >
            <Link
              to="/demo"
              className="btn btn-primary"
              style={{
                padding: '0.9rem 1.8rem',
                fontSize: '1rem',
              }}
            >
              Run the simulation
            </Link>

            <Link to="/roadmap" style={textLinkStyle}>
              See what comes next →
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
};