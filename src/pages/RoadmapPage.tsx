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

const SectionHeading: React.FC<{
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ children, maxWidth = '900px' }) => (
  <h2
    className="roadmap-section-heading"
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

const CapabilityCard: React.FC<{
  label: string;
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'violet' | 'rose';
}> = ({ label, title, children, accent = 'blue' }) => {
  const styles = {
    blue: {
      border: 'rgba(56, 189, 248, 0.28)',
      background: 'rgba(56, 189, 248, 0.045)',
    },
    violet: {
      border: 'rgba(139, 92, 246, 0.28)',
      background: 'rgba(139, 92, 246, 0.045)',
    },
    rose: {
      border: 'rgba(244, 63, 94, 0.28)',
      background: 'rgba(244, 63, 94, 0.045)',
    },
  };

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: styles[accent].border,
        background: styles[accent].background,
      }}
    >
      <div style={smallLabelStyle}>{label}</div>

      <h3
        style={{
          marginTop: 0,
          marginBottom: '0.7rem',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      <div style={{ ...bodyStyle, margin: 0 }}>{children}</div>
    </div>
  );
};

const PhaseNumber: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.3rem',
      height: '2.3rem',
      borderRadius: '999px',
      border: '1px solid rgba(56, 189, 248, 0.35)',
      background: 'rgba(56, 189, 248, 0.08)',
      color: '#38bdf8',
      fontSize: '0.82rem',
      fontWeight: 800,
      marginBottom: '1rem',
    }}
  >
    {children}
  </div>
);

export const RoadmapPage: React.FC = () => {
  return (
    <PageShell title="Roadmap">
      <style>
        {`
          .roadmap-hero-heading {
            font-size: 3.35rem;
          }

          .roadmap-section-heading {
            font-size: 2.35rem;
          }

          .roadmap-phase-heading {
            font-size: 1.9rem;
          }

          .roadmap-pull-quote {
            font-size: 1.65rem;
          }

          .roadmap-final-heading {
            font-size: 2.75rem;
          }

          @media (max-width: 800px) {
            .roadmap-hero-heading {
              font-size: 2.7rem;
            }

            .roadmap-section-heading {
              font-size: 2.05rem;
            }

            .roadmap-phase-heading {
              font-size: 1.65rem;
            }

            .roadmap-pull-quote {
              font-size: 1.45rem;
            }

            .roadmap-final-heading {
              font-size: 2.3rem;
            }
          }

          @media (max-width: 520px) {
            .roadmap-hero-heading {
              font-size: 2.2rem;
              line-height: 1.08 !important;
            }

            .roadmap-section-heading {
              font-size: 1.8rem;
            }

            .roadmap-phase-heading {
              font-size: 1.5rem;
            }

            .roadmap-pull-quote {
              font-size: 1.28rem;
            }

            .roadmap-final-heading {
              font-size: 2rem;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        aria-labelledby="roadmap-hero-title"
        style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxWidth: '980px',
        }}
      >
        <div style={eyebrowStyle}>Roadmap</div>

        <h1
          id="roadmap-hero-title"
          className="hero-title roadmap-hero-heading"
          style={{
            marginBottom: '1.75rem',
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            maxWidth: '940px',
          }}
        >
          The MVP proves the decision loop.
          <br />
          <span style={gradientTextStyle}>
            The roadmap is about making it operational.
          </span>
        </h1>

        <div
          style={{
            ...bodyStyle,
            maxWidth: '850px',
            fontSize: '1.15rem',
          }}
        >
          <p>
            RESQNET already demonstrates the core idea end to end:
            resource-aware allocation, repeated ambulance trips, live road
            disruption, changing hospital capacity, policy comparison and a
            verifiable decision record.
          </p>

          <p>
            But a disaster-response system intended for real operations would
            need much more than a working simulation.
          </p>

          <p>
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              This page separates what exists today from what still has to be
              built.
            </strong>
          </p>
        </div>
      </section>

      {/* BUILT TODAY */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Working today</div>

          <SectionHeading>
            Built into the current MVP.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '840px',
              marginBottom: '2rem',
            }}
          >
            These are capabilities that already exist in the current RESQNET
            system rather than future architecture presented as if it were
            finished.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
              gap: '1rem',
            }}
          >
            <CapabilityCard
              label="Scenario management"
              title="Saved operational scenarios"
            >
              Users can create and manage scenarios, hospitals and ambulances
              using owner-scoped stored data.
            </CapabilityCard>

            <CapabilityCard
              label="Road intelligence"
              title="Routing on a real road graph"
            >
              RESQNET uses an OpenStreetMap-derived road network rather than
              straight-line distance between an incident and a hospital.
            </CapabilityCard>

            <CapabilityCard
              label="Allocation"
              title="Resource-aware destination choice"
            >
              Simulated casualty priority, vehicle capacity, hospital resources
              and road reachability influence allocation decisions.
            </CapabilityCard>

            <CapabilityCard
              label="Fleet behaviour"
              title="Capacity limits and repeated trips"
            >
              Ambulances can carry only a limited number of patients and can
              re-enter the response cycle while unresolved casualties remain.
            </CapabilityCard>

            <CapabilityCard
              label="Live adaptation"
              title="Road restriction and rerouting"
            >
              Roads can be restricted or blocked while the simulation is
              running, forcing affected routes to be recalculated.
            </CapabilityCard>

            <CapabilityCard
              label="Transparency"
              title="A visible decision record"
            >
              Dispatches, hospital choices, deliveries, resource changes and
              reroutes become part of the simulation's reviewable history.
            </CapabilityCard>

            <CapabilityCard
              label="Verification"
              title="Hash-chained decision history"
            >
              SHA-256 chaining, verification, export and file-verification
              tools make changes to retained decision records detectable.
            </CapabilityCard>

            <CapabilityCard
              label="Evaluation"
              title="Policy comparison"
            >
              The same synthetic scenario can be evaluated under a
              resource-aware policy and a simpler nearest-hospital baseline.
            </CapabilityCard>

            <CapabilityCard
              label="Interface"
              title="Live operational dashboard"
            >
              Ambulance movement, hospital state, outcomes and decision data are
              presented together in the current simulation experience.
            </CapabilityCard>
          </div>
        </div>
      </Section>

      {/* CURRENT LIMITATIONS */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Current limits</div>

          <SectionHeading>
            Working does not mean finished.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '840px',
              marginBottom: '2rem',
            }}
          >
            Several parts of the real EL-02 challenge remain deliberately
            outside the current MVP.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <CapabilityCard
              label="Demand"
              title="Casualty demand is fixed at the start"
              accent="rose"
            >
              Roads and hospital resources can change during a run, but new
              casualty groups do not currently appear as a secondary demand
              surge while the simulation is underway.
            </CapabilityCard>

            <CapabilityCard
              label="Hospital data"
              title="Resource inventories are synthetic"
              accent="rose"
            >
              The MVP is not connected to live hospital beds, blood-bank stock,
              ICU availability or ventilator data.
            </CapabilityCard>

            <CapabilityCard
              label="Routing"
              title="Production road rules are simplified"
              accent="rose"
            >
              The road graph demonstrates realistic network routing but does not
              yet model every production routing constraint, including one-way
              road behaviour.
            </CapabilityCard>

            <CapabilityCard
              label="Verification"
              title="The witness is still local"
              accent="rose"
            >
              The hash chain can expose edits to the retained record, but the
              current system has no independent timestamping authority or
              external witness.
            </CapabilityCard>

            <CapabilityCard
              label="Clinical use"
              title="The decision model is not clinically validated"
              accent="rose"
            >
              Casualty priority and resource matching demonstrate allocation
              behaviour. They are not a validated medical triage protocol.
            </CapabilityCard>

            <CapabilityCard
              label="Operations"
              title="No multi-operator incident room"
              accent="rose"
            >
              The current simulation is not a live multi-agency command system
              with simultaneous dispatcher, hospital and government operators.
            </CapabilityCard>
          </div>

          <blockquote
            className="roadmap-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #f43f5e',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            The MVP shows that the idea can work.
            <br />
            <span style={gradientTextStyle}>
              The roadmap asks what would have to become true before people
              could trust it operationally.
            </span>
          </blockquote>
        </div>
      </Section>

      {/* PHASE 1 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>01</PhaseNumber>

          <div style={smallLabelStyle}>Connect to live state</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Replace simulated inputs with authorised operational data.
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            The allocation engine becomes more valuable as the state it sees
            becomes more representative of the real response environment.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            <CapabilityCard
              label="Hospitals"
              title="Live resource feeds"
            >
              Connect authorised sources for beds, blood inventory, ICU
              availability and critical equipment.
            </CapabilityCard>

            <CapabilityCard
              label="Ambulances"
              title="Live fleet state"
            >
              Receive vehicle position, availability, carrying capacity and
              operational status.
            </CapabilityCard>

            <CapabilityCard
              label="Demand"
              title="Mid-response casualty updates"
            >
              Allow newly discovered casualties or secondary incidents to enter
              the allocation engine while an existing response is already
              underway.
            </CapabilityCard>

            <CapabilityCard
              label="Roads"
              title="Richer transport constraints"
            >
              Add one-way roads, closures and other operational routing rules
              beyond the current graph model.
            </CapabilityCard>
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              fontWeight: 750,
              lineHeight: 1.6,
            }}
          >
            The allocation engine becomes more useful as the state becomes more
            real.
          </p>
        </div>
      </Section>

      {/* PHASE 2 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>02</PhaseNumber>

          <div style={smallLabelStyle}>Optimisation</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Move from deterministic allocation toward global optimisation.
          </h2>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              The current MVP uses deterministic priority rules,
              resource-matching logic and A* routing.
            </p>

            <p>
              <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                It is not a global optimisation engine.
              </strong>
            </p>

            <p>
              A future operational version could formulate the allocation
              problem using optimisation tools such as OR-Tools or a MILP
              solver, allowing many patients, ambulances, hospitals and
              constraints to be considered together.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.9rem',
              marginTop: '1.75rem',
            }}
          >
            {[
              'Reduce delay for high-priority casualties',
              'Avoid overloaded destinations',
              'Respect ambulance capacity',
              'Balance scarce hospital resources',
              'Re-optimise when conditions change',
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: '1rem 1.1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(15, 23, 42, 0.45)',
                  fontWeight: 650,
                  lineHeight: 1.45,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '880px',
              marginTop: '1.75rem',
              borderColor: 'rgba(139, 92, 246, 0.3)',
              background: 'rgba(139, 92, 246, 0.055)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '1.15rem',
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              That would be a new optimisation layer — not a claim about what
              the current MVP already does.
            </p>
          </div>
        </div>
      </Section>

      {/* PHASE 3 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>03</PhaseNumber>

          <div style={smallLabelStyle}>Multi-stakeholder operations</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Give every stakeholder the right view — and only the right view.
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            A real deployment would involve organisations with different
            responsibilities and different levels of access.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <CapabilityCard label="Dispatcher" title="Coordinate movement">
              View incidents, vehicles, assignments and route disruptions.
            </CapabilityCard>

            <CapabilityCard label="Hospital" title="Manage receiving capacity">
              View incoming allocations and update authorised resource
              availability.
            </CapabilityCard>

            <CapabilityCard
              label="Command centre"
              title="See the wider response"
            >
              Coordinate resources and operational state across incidents,
              hospitals and regions.
            </CapabilityCard>

            <CapabilityCard label="Auditor" title="Inspect without controlling">
              Verify allocation and decision history without receiving
              operational permissions.
            </CapabilityCard>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            Those permissions would need to be enforced server-side through
            role-based access controls. Simply hiding interface controls would
            not be sufficient security.
          </p>
        </div>
      </Section>

      {/* PHASE 4 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>04</PhaseNumber>

          <div style={smallLabelStyle}>Stronger verification</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Move verification beyond the browser.
          </h2>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              Today, SHA-256 chaining makes edits detectable within the retained
              decision sequence.
            </p>

            <p>
              A stronger operational model would need independent evidence that
              records were created when claimed and were not silently replaced
              afterwards.
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
            <CapabilityCard
              label="Future"
              title="Trusted timestamping"
              accent="violet"
            >
              Anchor events to an independently verifiable time source.
            </CapabilityCard>

            <CapabilityCard
              label="Future"
              title="External witness"
              accent="violet"
            >
              Preserve evidence outside the local browser or operator's direct
              control.
            </CapabilityCard>

            <CapabilityCard
              label="Future"
              title="Signed records"
              accent="violet"
            >
              Associate sensitive operational events with authenticated,
              authorised actors.
            </CapabilityCard>

            <CapabilityCard
              label="Future"
              title="Append controls"
              accent="violet"
            >
              Restrict who can create, modify or verify operational history.
            </CapabilityCard>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            Blockchain could be explored, but it is not automatically required.
            The real requirement is stronger evidence that a record existed in
            a particular form at a particular time.
          </p>
        </div>
      </Section>

      {/* PHASE 5 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>05</PhaseNumber>

          <div style={smallLabelStyle}>Fund transparency</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Extend transparency from physical resources to relief funds.
          </h2>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              The current MVP models physical medical resources such as
              ambulances, beds, blood, ICU capacity and ventilators.
            </p>

            <p>
              <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
                It does not currently model financial relief flows.
              </strong>
            </p>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              marginTop: '1.75rem',
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.05), rgba(139,92,246,0.055))',
            }}
          >
            <div style={smallLabelStyle}>Possible future flow</div>

            <div
              style={{
                display: 'grid',
                gap: '0.7rem',
                marginTop: '1rem',
              }}
            >
              {[
                'Fund approved',
                'Responsible organisation identified',
                'Intended purpose recorded',
                'Disbursement recorded',
                'Utilisation recorded',
                'History verified',
              ].map((item, index) => (
                <React.Fragment key={item}>
                  <div
                    style={{
                      padding: '0.95rem 1rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)',
                      background: 'rgba(15, 23, 42, 0.4)',
                      fontWeight: 650,
                    }}
                  >
                    {item}
                  </div>

                  {index < 5 && (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#38bdf8',
                        fontWeight: 800,
                      }}
                    >
                      ↓
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <p
            style={{
              marginTop: '1.5rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 750,
            }}
          >
            The same principle applies: every transfer should have context,
            ownership and an inspectable history.
          </p>
        </div>
      </Section>

      {/* PHASE 6 */}
      <Section>
        <div style={sectionSpacing}>
          <PhaseNumber>06</PhaseNumber>

          <div style={smallLabelStyle}>Validation</div>

          <h2
            className="roadmap-phase-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
            }}
          >
            Test with the people who would actually use it.
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            Before any real deployment, RESQNET would need validation with the
            people who understand emergency constraints firsthand.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <CapabilityCard
              label="Domain"
              title="Disaster-management professionals"
            >
              Test whether the allocation model reflects actual coordination
              constraints and escalation patterns.
            </CapabilityCard>

            <CapabilityCard
              label="Field"
              title="Ambulance operators"
            >
              Validate vehicle assumptions, route behaviour and the usability of
              dispatch decisions under time pressure.
            </CapabilityCard>

            <CapabilityCard
              label="Clinical"
              title="Hospital and trauma teams"
            >
              Review resource matching, receiving-capacity assumptions and the
              boundaries between logistics and clinical judgement.
            </CapabilityCard>

            <CapabilityCard
              label="Government"
              title="District and command authorities"
            >
              Test multi-agency workflows, governance, accountability and
              information-sharing requirements.
            </CapabilityCard>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '900px',
              marginTop: '1.75rem',
            }}
          >
            <div style={smallLabelStyle}>Questions validation must answer</div>

            <ul
              style={{
                ...bodyStyle,
                marginBottom: 0,
                paddingLeft: '1.2rem',
              }}
            >
              <li>Does the allocation logic represent real constraints?</li>
              <li>Are explanations useful under time pressure?</li>
              <li>Which data can actually be accessed reliably?</li>
              <li>What decisions must remain human-controlled?</li>
              <li>Which system failures would be unacceptable?</li>
            </ul>
          </div>

          <blockquote
            className="roadmap-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            A technically correct model is not automatically an operationally
            safe system.
          </blockquote>
        </div>
      </Section>

      {/* SCALING */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Scaling and robustness</div>

          <SectionHeading>
            Could the MVP handle success next week?
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            As a demonstration, the current architecture has some useful scaling
            properties. As an operational disaster-response system, it still has
            clear limits.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(56, 189, 248, 0.28)',
                background: 'rgba(56, 189, 248, 0.04)',
              }}
            >
              <div style={smallLabelStyle}>What scales reasonably today</div>

              <ul
                style={{
                  ...bodyStyle,
                  marginBottom: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Public frontend is statically deployed</li>
                <li>
                  Simulation execution happens primarily in the visitor's
                  browser
                </li>
                <li>
                  Additional demo users do not require one central simulation
                  server to compute every run
                </li>
                <li>
                  Supabase supports authentication and stored scenario data
                </li>
              </ul>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(244, 63, 94, 0.28)',
                background: 'rgba(244, 63, 94, 0.04)',
              }}
            >
              <div style={smallLabelStyle}>Current scaling limits</div>

              <ul
                style={{
                  ...bodyStyle,
                  marginBottom: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Free-tier service quotas</li>
                <li>Email-delivery limits</li>
                <li>One independently operated scenario per browser run</li>
                <li>No multi-operator live control room</li>
                <li>No production telemetry ingestion</li>
                <li>No live hospital-system integrations</li>
              </ul>
            </div>
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
            The demo can scale as a demonstration. The operational system would
            need a different infrastructure layer.
          </p>
        </div>
      </Section>

      {/* LONG TERM */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Long-term direction</div>

          <SectionHeading>
            What RESQNET could grow into.
          </SectionHeading>

          <div
            style={{
              ...cardStyle,
              maxWidth: '950px',
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.045), rgba(139,92,246,0.05), rgba(244,63,94,0.035))',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: '0.8rem',
              }}
            >
              <div
                style={{
                  padding: '1.2rem',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(56, 189, 248, 0.045)',
                }}
              >
                <div style={smallLabelStyle}>MVP</div>

                <strong>
                  Deterministic allocation + browser simulation + transparent
                  decision record
                </strong>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: '#38bdf8',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                ↓
              </div>

              <div
                style={{
                  padding: '1.2rem',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(56, 189, 248, 0.035)',
                }}
              >
                <div style={smallLabelStyle}>Connected pilot</div>

                <strong>
                  Live resource feeds + roles + dynamic demand + stronger
                  verification
                </strong>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: '#8b5cf6',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                ↓
              </div>

              <div
                style={{
                  padding: '1.2rem',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(139, 92, 246, 0.04)',
                }}
              >
                <div style={smallLabelStyle}>
                  Operational decision support
                </div>

                <strong>
                  Global optimisation + real-time event ingestion + resilient
                  backend + audited access
                </strong>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: '#f43f5e',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                }}
              >
                ↓
              </div>

              <div
                style={{
                  padding: '1.2rem',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(244, 63, 94, 0.035)',
                }}
              >
                <div style={smallLabelStyle}>
                  Multi-region coordination
                </div>

                <strong>
                  Cross-agency resource sharing + large-scale optimisation +
                  interoperable operational standards
                </strong>
              </div>
            </div>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            These later stages describe a direction, not features hidden inside
            the current MVP.
          </p>
        </div>
      </Section>

      {/* FINAL */}
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
          <div style={smallLabelStyle}>The current claim</div>

          <h2
            className="roadmap-final-heading"
            style={{
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: '850px',
              margin: '0 auto 1.4rem',
            }}
          >
            The direction is ambitious.
            <br />
            <span style={gradientTextStyle}>
              The current claim stays small.
            </span>
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '760px',
              margin: '0 auto',
            }}
          >
            RESQNET today is a Minimum Viable Product demonstrating one core
            idea: resource allocation can respond to changing conditions while
            leaving behind a decision trail that people can inspect.
          </p>

          <p
            style={{
              maxWidth: '760px',
              margin: '1.25rem auto 0',
              fontSize: '1.1rem',
              lineHeight: 1.65,
              fontWeight: 700,
            }}
          >
            Everything beyond that should be earned through better data,
            stronger optimisation, stakeholder validation, security and real
            operational testing.
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
              Run the current MVP
            </Link>

            <Link to="/evidence" style={textLinkStyle}>
              Back to the evidence →
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
};