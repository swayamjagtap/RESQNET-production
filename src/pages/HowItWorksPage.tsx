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
}> = ({ children, maxWidth = '880px' }) => (
  <h2
    className="how-section-heading"
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

const StepCard: React.FC<{
  number: string;
  label: string;
  title: string;
  children: React.ReactNode;
}> = ({ number, label, title, children }) => (
  <div style={cardStyle}>
    <div style={smallLabelStyle}>
      {number} · {label}
    </div>

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

const StateCard: React.FC<{
  label: string;
  title: string;
  children: React.ReactNode;
}> = ({ label, title, children }) => (
  <div style={cardStyle}>
    <div style={smallLabelStyle}>{label}</div>

    <h3
      style={{
        marginTop: 0,
        marginBottom: '0.65rem',
      }}
    >
      {title}
    </h3>

    <div style={{ ...bodyStyle, margin: 0 }}>{children}</div>
  </div>
);

export const HowItWorksPage: React.FC = () => {
  return (
    <PageShell title="How RESQNET Works">
      <style>
        {`
          .how-hero-heading {
            font-size: 3.35rem;
          }

          .how-section-heading {
            font-size: 2.35rem;
          }

          .how-highlight-heading {
            font-size: 2.8rem;
          }

          .how-pull-quote {
            font-size: 1.7rem;
          }

          @media (max-width: 800px) {
            .how-hero-heading {
              font-size: 2.7rem;
            }

            .how-section-heading {
              font-size: 2.05rem;
            }

            .how-highlight-heading {
              font-size: 2.3rem;
            }

            .how-pull-quote {
              font-size: 1.5rem;
            }
          }

          @media (max-width: 520px) {
            .how-hero-heading {
              font-size: 2.2rem;
              line-height: 1.08 !important;
            }

            .how-section-heading {
              font-size: 1.8rem;
            }

            .how-highlight-heading {
              font-size: 2rem;
            }

            .how-pull-quote {
              font-size: 1.3rem;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        aria-labelledby="how-hero-title"
        style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxWidth: '980px',
        }}
      >
        <div style={eyebrowStyle}>How RESQNET works</div>

        <h1
          id="how-hero-title"
          className="hero-title how-hero-heading"
          style={{
            marginBottom: '1.75rem',
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            maxWidth: '940px',
          }}
        >
          A disaster response is not one decision.
          <br />
          <span style={gradientTextStyle}>
            It is a sequence of decisions that keep changing the next one.
          </span>
        </h1>

        <div
          style={{
            ...bodyStyle,
            maxWidth: '830px',
            fontSize: '1.15rem',
          }}
        >
          <p>RESQNET models that sequence directly.</p>

          <p>
            It starts with casualties, ambulances, hospitals and a road network,
            then continuously updates what is possible as patients move,
            resources are reserved and roads change.
          </p>

          <p>
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              The goal is not to create one perfect plan at the beginning.
            </strong>{' '}
            It is to keep making the next decision from the state that exists
            right now.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
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
            Run the live simulation
          </Link>

          <Link to="/why" style={textLinkStyle}>
            Why this problem matters →
          </Link>
        </div>
      </section>

      {/* START STATE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>The starting state</div>

          <SectionHeading>
            The simulation begins with four kinds of state.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '820px',
              marginBottom: '2rem',
            }}
          >
            RESQNET makes allocation decisions from the information currently
            available inside the simulation.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1rem',
            }}
          >
            <StateCard label="01" title="Casualties">
              Each casualty group has a priority and a simulated resource need,
              such as a bed, blood, ICU capacity or ventilator support.
            </StateCard>

            <StateCard label="02" title="Ambulances">
              Each vehicle has a current position, availability state and
              limited carrying capacity.
            </StateCard>

            <StateCard label="03" title="Hospitals">
              Each hospital has a simulated inventory of resources that changes
              as patients are assigned and delivered.
            </StateCard>

            <StateCard label="04" title="Road network">
              Routes follow a road graph rather than a straight line between the
              incident and the destination.
            </StateCard>
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            RESQNET decides from the current state of the system — not from a
            fixed plan that ignores what has already changed.
          </p>
        </div>
      </Section>

      {/* DECISION FLOW */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>The allocation cycle</div>

          <SectionHeading>
            One response cycle, step by step.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '820px',
              marginBottom: '2rem',
            }}
          >
            Every decision changes the state that the next decision will see.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <StepCard
              number="01"
              label="Prioritise"
              title="Consider higher-priority casualty groups first."
            >
              The MVP uses simulated casualty priority to determine which groups
              should be considered before less urgent groups. It is a
              demonstration of allocation logic, not a clinically validated
              triage protocol.
            </StepCard>

            <StepCard
              number="02"
              label="Assign"
              title="Find an ambulance that can actually take the job."
            >
              RESQNET checks availability, current position and carrying
              capacity before assigning a vehicle.
            </StepCard>

            <StepCard
              number="03"
              label="Match"
              title="Choose a reachable hospital that can support the need."
            >
              The system checks candidate destinations against the simulated
              resources required by the patients being transported.
            </StepCard>

            <StepCard
              number="04"
              label="Reserve"
              title="Protect the remaining capacity from double allocation."
            >
              Once a hospital is selected, the relevant simulated resources are
              reserved so that another assignment does not rely on the same
              capacity.
            </StepCard>

            <StepCard
              number="05"
              label="Route"
              title="Calculate a path through the current road network."
            >
              A* pathfinding is used on the road graph while accounting for the
              current road state.
            </StepCard>

            <StepCard
              number="06"
              label="Deliver"
              title="Move the ambulance and update the destination."
            >
              The vehicle travels along the route. When delivery completes, the
              simulated hospital state is updated to reflect the allocation.
            </StepCard>

            <StepCard
              number="07"
              label="Repeat"
              title="If casualties remain, continue the response."
            >
              An ambulance does not have to stop after one trip. It can be
              reassigned into another response cycle while unresolved
              casualties remain.
            </StepCard>
          </div>
        </div>
      </Section>

      {/* DYNAMIC ROAD STATE */}
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
          <div style={smallLabelStyle}>Dynamic routing</div>

          <SectionHeading>
            The plan can change while the ambulance is already moving.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '820px' }}>
            <p>
              Disaster conditions do not stay fixed, so the road network does
              not have to stay fixed either.
            </p>

            <p>
              During the simulation, a road can be partially restricted or
              completely blocked.
            </p>

            <p>
              If that change affects an ambulance's active path, RESQNET
              recalculates the route from the ambulance's current position to
              its existing destination using the updated road state.
            </p>
          </div>

          <blockquote
            className="how-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            The route adapts to the new state of the world.
          </blockquote>

          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/demo" style={textLinkStyle}>
              Try blocking a road yourself →
            </Link>
          </div>
        </div>
      </Section>

      {/* RESOURCE STATE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Changing resources</div>

          <SectionHeading>
            Hospital availability is not static either.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '830px' }}>
            <p>
              A hospital that is a valid destination for the first ambulance
              may no longer be the best option for the next one.
            </p>

            <p>
              Earlier assignments change the remaining simulated capacity, so
              later allocation decisions see an updated hospital state.
            </p>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '820px',
              marginTop: '1.75rem',
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.055), rgba(139,92,246,0.055))',
            }}
          >
            <div style={smallLabelStyle}>Example</div>

            <div
              style={{
                display: 'grid',
                gap: '0.9rem',
                marginTop: '0.5rem',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  fontWeight: 650,
                }}
              >
                Ambulance 1 is assigned to Hospital A because the required
                simulated resource is available.
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: '#38bdf8',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                }}
              >
                ↓
              </div>

              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  fontWeight: 650,
                }}
              >
                That assignment changes Hospital A's remaining simulated
                capacity.
              </div>

              <div
                style={{
                  textAlign: 'center',
                  color: '#8b5cf6',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                }}
              >
                ↓
              </div>

              <div
                style={{
                  padding: '1rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(15, 23, 42, 0.4)',
                  fontWeight: 650,
                }}
              >
                Ambulance 2 evaluates the new state rather than assuming the
                previous capacity still exists.
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* TRANSPARENCY */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Transparency</div>

          <SectionHeading>
            Every important decision leaves a reason behind.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '840px' }}>
            <p>
              RESQNET maintains a live decision record as the simulation
              progresses.
            </p>

            <p>
              Dispatches, hospital choices, deliveries, resource changes, road
              disruptions and reroutes are recorded so the response can be
              reviewed afterwards.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              marginTop: '1.75rem',
            }}
          >
            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(56, 189, 248, 0.28)',
                background: 'rgba(56, 189, 248, 0.05)',
              }}
            >
              <div style={smallLabelStyle}>The map</div>

              <h3 style={{ marginBottom: '0.65rem' }}>
                Shows what happened.
              </h3>

              <p style={{ ...bodyStyle, margin: 0 }}>
                Ambulance movement, destinations, road state and changing
                hospital resources make the current state visible.
              </p>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(139, 92, 246, 0.28)',
                background: 'rgba(139, 92, 246, 0.05)',
              }}
            >
              <div style={smallLabelStyle}>The decision record</div>

              <h3 style={{ marginBottom: '0.65rem' }}>
                Shows why it happened.
              </h3>

              <p style={{ ...bodyStyle, margin: 0 }}>
                Each important event preserves the sequence and reasoning behind
                the allocation.
              </p>
            </div>
          </div>

          <blockquote
            className="how-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #8b5cf6',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            The map tells you where the ambulance went.
            <br />
            <span style={gradientTextStyle}>
              The record tells you why.
            </span>
          </blockquote>
        </div>
      </Section>

      {/* VERIFICATION */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Verification</div>

          <SectionHeading>
            The record is chained so edits can be detected.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '830px' }}>
            <p>
              Each event includes a SHA-256 hash linked to the previous event in
              the decision sequence.
            </p>

            <p>
              When <strong>Verify Log</strong> is used, RESQNET recomputes the
              chain and checks whether the stored entries still match.
            </p>

            <p>
              If an earlier event has been altered, the verification process can
              identify where the chain becomes inconsistent.
            </p>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '850px',
              marginTop: '1.75rem',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.06)',
            }}
          >
            <div style={smallLabelStyle}>Important boundary</div>

            <h3 style={{ marginTop: 0 }}>
              Tamper-evident is not the same as immutable.
            </h3>

            <p style={bodyStyle}>
              The current MVP uses a browser-based hash chain. It does not use a
              blockchain or an independent external witness.
            </p>

            <p style={{ ...bodyStyle, marginBottom: 0 }}>
              Someone able to replace the complete record could recompute a new
              valid chain. The feature demonstrates verifiable tracking inside
              the MVP; it does not claim permanent external immutability.
            </p>
          </div>
        </div>
      </Section>

      {/* POLICY COMPARISON */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Policy comparison</div>

          <SectionHeading>
            Then we run the same scenario with a simpler policy.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '830px',
              marginBottom: '2rem',
            }}
          >
            Comparing policies helps expose the trade-offs that disappear when
            a single result is shown without context.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '1rem',
            }}
          >
            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(56, 189, 248, 0.28)',
              }}
            >
              <div style={smallLabelStyle}>Resource-aware</div>

              <h3 style={{ marginBottom: '0.75rem' }}>
                Uses more of the system state.
              </h3>

              <p style={{ ...bodyStyle, margin: 0 }}>
                Considers simulated casualty priority, road reachability and
                remaining hospital resources when making allocation decisions.
              </p>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(139, 92, 246, 0.28)',
              }}
            >
              <div style={smallLabelStyle}>Baseline</div>

              <h3 style={{ marginBottom: '0.75rem' }}>
                Uses a simpler allocation rule.
              </h3>

              <p style={{ ...bodyStyle, margin: 0 }}>
                Uses a nearest-hospital / arrival-order approach to provide a
                simpler point of comparison.
              </p>
            </div>
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            The goal is not to claim that one policy wins every metric. The
            comparison makes trade-offs between speed and resource suitability
            visible.
          </p>

          <Link
            to="/evidence"
            style={{
              ...textLinkStyle,
              display: 'inline-block',
              marginTop: '1rem',
            }}
          >
            See the supporting evidence →
          </Link>
        </div>
      </Section>

      {/* MVP SCOPE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>MVP scope</div>

          <SectionHeading>
            What the MVP does — and what it does not do.
          </SectionHeading>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
              <div style={smallLabelStyle}>Working today</div>

              <ul
                style={{
                  ...bodyStyle,
                  marginBottom: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Synthetic casualty groups and resource needs</li>
                <li>Synthetic hospital inventories</li>
                <li>Road-graph routing</li>
                <li>A* pathfinding</li>
                <li>Capacity-limited ambulance assignment</li>
                <li>Repeated ambulance trips</li>
                <li>Resource-aware hospital selection</li>
                <li>Road restriction and live rerouting</li>
                <li>Decision logging</li>
                <li>Policy comparison</li>
                <li>SHA-256 tamper-evident verification</li>
              </ul>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(244, 63, 94, 0.25)',
                background: 'rgba(244, 63, 94, 0.035)',
              }}
            >
              <div style={smallLabelStyle}>Not yet</div>

              <ul
                style={{
                  ...bodyStyle,
                  marginBottom: 0,
                  paddingLeft: '1.2rem',
                }}
              >
                <li>Live hospital inventory feeds</li>
                <li>Clinically validated triage</li>
                <li>Production emergency-dispatch integration</li>
                <li>Independent external tamper witness</li>
                <li>Global optimisation across all possible allocations</li>
                <li>Real-time fund allocation and tracking</li>
              </ul>
            </div>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            The official EL-02 challenge is broader than the current MVP. The
            MVP focuses on demonstrating dynamic physical-resource allocation
            and transparent decision tracking while clearly separating
            implemented behaviour from future work.
          </p>

          <Link
            to="/roadmap"
            style={{
              ...textLinkStyle,
              display: 'inline-block',
              marginTop: '0.75rem',
            }}
          >
            See what comes next →
          </Link>
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
          <div style={smallLabelStyle}>Try the workflow</div>

          <h2
            className="how-highlight-heading"
            style={{
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: '850px',
              margin: '0 auto 1.4rem',
            }}
          >
            The easiest way to understand RESQNET is to break it.
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            Start the simulation, block a road, watch the route change, inspect
            the decision record and compare the two allocation policies.
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
              Launch the simulation
            </Link>

            <Link to="/evidence" style={textLinkStyle}>
              See the evidence →
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
};