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

const sectionSpacing: React.CSSProperties = {
  marginTop: '5rem',
};

const cardStyle: React.CSSProperties = {
  padding: '1.4rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  background: 'var(--surface, rgba(15, 23, 42, 0.55))',
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

const textLinkStyle: React.CSSProperties = {
  color: '#38bdf8',
  fontWeight: 700,
  textDecoration: 'none',
};

const SectionHeading: React.FC<{
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ children, maxWidth = '850px' }) => (
  <h2
    className="overview-section-heading"
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

const StoryCard: React.FC<{
  label: string;
  title: string;
  children: React.ReactNode;
}> = ({ label, title, children }) => (
  <div style={cardStyle}>
    <div style={smallLabelStyle}>{label}</div>
    <h3 style={{ marginBottom: '0.65rem' }}>{title}</h3>
    <div style={{ ...bodyStyle, margin: 0 }}>{children}</div>
  </div>
);

export const HomePage: React.FC = () => {
  return (
    <PageShell title="Overview">
      {/*
        Typography is intentionally controlled with REM-based sizes rather than
        large VW values. This lets browser zoom behave naturally.
      */}
      <style>
        {`
          .overview-hero-heading {
            font-size: 3.45rem;
          }

          .overview-section-heading {
            font-size: 2.35rem;
          }

          .overview-demo-heading {
            font-size: 2.8rem;
          }

          .overview-pull-quote {
            font-size: 1.75rem;
          }

          @media (max-width: 800px) {
            .overview-hero-heading {
              font-size: 2.75rem;
            }

            .overview-section-heading {
              font-size: 2.05rem;
            }

            .overview-demo-heading {
              font-size: 2.35rem;
            }

            .overview-pull-quote {
              font-size: 1.55rem;
            }
          }

          @media (max-width: 520px) {
            .overview-hero-heading {
              font-size: 2.25rem;
              line-height: 1.08 !important;
            }

            .overview-section-heading {
              font-size: 1.8rem;
            }

            .overview-demo-heading {
              font-size: 2rem;
            }

            .overview-pull-quote {
              font-size: 1.35rem;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        aria-labelledby="overview-hero-title"
        style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxWidth: '980px',
        }}
      >
        <div style={eyebrowStyle}>
          EL-02 · Intelligent & Transparent Disaster Relief Resource Allocation
        </div>

        <h1
          id="overview-hero-title"
          className="hero-title overview-hero-heading"
          style={{
            marginBottom: '1.75rem',
            lineHeight: 1.03,
            letterSpacing: '-0.045em',
            maxWidth: '950px',
          }}
        >
          The nearest hospital isn't always the right hospital.
          <br />
          <span style={gradientTextStyle}>
            RESQNET makes the decision visible.
          </span>
        </h1>

        <div
          style={{
            ...bodyStyle,
            maxWidth: '820px',
            fontSize: '1.15rem',
          }}
        >
          <p>
            During a disaster, the challenge isn't just finding an ambulance or
            the shortest route.
          </p>

          <p>
            Patients need different kinds of care. Ambulances have limited
            capacity. Hospital beds, blood and ventilators can run out. Roads
            can change while a response is already underway.
          </p>

          <p>
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              RESQNET coordinates these constraints together
            </strong>{' '}
            — deciding who moves first, where they should go, how to adapt when
            conditions change, and recording why every decision was made.
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

          <Link to="/how-it-works" style={textLinkStyle}>
            See how RESQNET decides →
          </Link>
        </div>
      </section>

      {/* THE PROBLEM */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>The problem</div>

          <SectionHeading>
            A disaster creates more than a routing problem.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '820px' }}>
            <p>Imagine several people are injured at the same time.</p>

            <p>
              One needs blood. Another needs intensive care and a ventilator.
              Another needs a general bed.
            </p>

            <p>
              The closest hospital may have beds but no blood. Another hospital
              may have the right resources but require a different route.
              Meanwhile, an ambulance can carry only a limited number of
              patients, so one trip may not be enough.
            </p>

            <p
              style={{
                color: 'var(--text-primary, #f8fafc)',
                fontSize: '1.25rem',
                fontWeight: 700,
                marginTop: '2rem',
              }}
            >
              Every allocation changes what becomes possible for the next
              patient.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '2rem',
            }}
          >
            <StoryCard label="01" title="Who should move first?">
              Different casualties can require different levels of urgency and
              care.
            </StoryCard>

            <StoryCard
              label="02"
              title="Which hospital can actually receive them?"
            >
              Distance alone does not tell us whether the required resources
              are available.
            </StoryCard>

            <StoryCard label="03" title="Can we still reach it?">
              A route that worked moments ago may change after a road
              disruption.
            </StoryCard>
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              fontSize: '1.2rem',
              fontWeight: 700,
            }}
          >
            RESQNET treats those questions as one connected decision.
          </p>
        </div>
      </Section>

      {/* DECISION FLOW */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>How the decision evolves</div>

          <SectionHeading>One decision affects the next.</SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '760px',
              marginBottom: '2rem',
            }}
          >
            RESQNET doesn't calculate a route once and stop. It keeps track of
            the patients still waiting, ambulance capacity, hospital resources
            and the condition of the road network as the simulation progresses.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <StoryCard
              label="01 · Prioritise"
              title="Start with the people who need help most."
            >
              Casualties are grouped by their needs and priority. Ambulances
              take only as many patients as they can actually carry.
            </StoryCard>

            <StoryCard
              label="02 · Match"
              title="Don't send a patient somewhere that can't support them."
            >
              Reachable hospitals are checked against the resources required by
              the patients being transported.
            </StoryCard>

            <StoryCard
              label="03 · Reserve"
              title="A resource can't be promised twice."
            >
              Capacity is reserved as decisions are made, preventing two
              ambulances from relying on the same remaining hospital stock.
            </StoryCard>

            <StoryCard
              label="04 · Repeat"
              title="One ambulance trip may not be enough."
            >
              After a delivery, ambulances can be reassigned while casualties
              remain, creating repeated dispatch cycles rather than a single
              one-way journey.
            </StoryCard>
          </div>
        </div>
      </Section>

      {/* LIVE DISRUPTION */}
      <Section>
        <div
          style={{
            ...sectionSpacing,
            padding: '2rem',
            border: '1px solid rgba(56, 189, 248, 0.24)',
            borderRadius: 'var(--radius)',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08), rgba(244,63,94,0.06))',
          }}
        >
          <div style={smallLabelStyle}>Live adaptation</div>

          <SectionHeading>
            Then change the road while they're moving.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '800px' }}>
            <p>Disaster conditions don't stay fixed.</p>

            <p>
              During the simulation, you can partially restrict or completely
              block a road being used by an ambulance.
            </p>

            <p>
              RESQNET reacts to the changed network, recalculates the affected
              route and continues from the ambulance's current position rather
              than restarting the journey.
            </p>
          </div>

          <p
            style={{
              fontSize: '1.3rem',
              lineHeight: 1.4,
              fontWeight: 800,
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            No teleporting. No reset. The response changes while the incident is
            still unfolding.
          </p>

          <Link to="/demo" style={textLinkStyle}>
            Try disrupting a route →
          </Link>
        </div>
      </Section>

      {/* TRANSPARENCY */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Transparency</div>

          <SectionHeading>
            The map shows what happened.
            <br />
            <span style={gradientTextStyle}>
              The decision record shows why.
            </span>
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '800px' }}>
            <p>A route alone doesn't explain a decision.</p>

            <p>
              RESQNET records dispatches, hospital choices, deliveries,
              resource changes, road disruptions and reroutes as the simulation
              unfolds.
            </p>

            <p>
              Instead of simply showing that an ambulance went to a particular
              hospital, the system preserves the reasoning and state that led
              to that choice.
            </p>
          </div>
        </div>
      </Section>

      {/* VERIFICATION */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Verification</div>

          <SectionHeading>
            And the record can check itself.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '820px' }}>
            <p>
              Each event in the decision record is connected to the previous
              one using a SHA-256 hash.
            </p>

            <p>
              Press <strong>Verify Log</strong> and RESQNET recomputes the
              chain. If an earlier entry has been altered, verification
              identifies where the chain stops matching.
            </p>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '820px',
              marginTop: '1.5rem',
              borderColor: 'rgba(244, 63, 94, 0.3)',
              background: 'rgba(244, 63, 94, 0.07)',
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Tamper-evident does not mean immutable.
            </h3>

            <p style={bodyStyle}>
              The current MVP stores the chain in the browser and has no
              independent external witness. Someone able to replace the entire
              record could recompute a new valid chain.
            </p>

            <p
              style={{
                marginBottom: 0,
                fontWeight: 700,
              }}
            >
              It is not a blockchain.
            </p>
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <Link to="/how-it-works" style={textLinkStyle}>
              How verification works →
            </Link>
          </div>
        </div>
      </Section>

      {/* POLICY COMPARISON */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Policy comparison</div>

          <SectionHeading>
            What happens if we just choose the nearest hospital?
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '820px',
              marginBottom: '2rem',
            }}
          >
            We run the same synthetic scenario under two policies:
            resource-aware allocation and a simpler nearest-hospital,
            arrival-order baseline.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>Balanced scenario</div>

              <h3>When resources are sufficient</h3>

              <p style={bodyStyle}>
                Resource-aware reached high-priority patients sooner.
              </p>

              <p
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  margin: '1.25rem 0 0.35rem',
                }}
              >
                11:11{' '}
                <span style={{ color: 'var(--text-muted)' }}>vs</span>{' '}
                13:41
              </p>

              <p style={{ ...bodyStyle, marginTop: 0 }}>
                Mean time to hospital for high-priority patients.
              </p>

              <p style={bodyStyle}>
                Both policies delivered all patients without a resource
                shortfall, and their overall simulated completion time tied.
              </p>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>Resource-stress scenario</div>

              <h3>When the nearest option lacks critical stock</h3>

              <p style={bodyStyle}>The baseline moved faster.</p>

              <p
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  marginBottom: '0.35rem',
                }}
              >
                13:41 vs 14:13
              </p>

              <p style={{ ...bodyStyle, marginTop: 0 }}>
                Mean high-priority delivery time.
              </p>

              <p
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  marginBottom: '0.35rem',
                }}
              >
                17:52 vs 23:34
              </p>

              <p style={{ ...bodyStyle, marginTop: 0 }}>
                Overall simulated completion time.
              </p>

              <p style={bodyStyle}>
                But the baseline delivered <strong>9 patients</strong> to a
                hospital short of the required stock. Resource-aware delivered{' '}
                <strong>0</strong> patients short of required stock.
              </p>
            </div>
          </div>

          <p
            style={{
              marginTop: '1.5rem',
              maxWidth: '850px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            There isn't one winner on every metric. There is a trade-off — and
            RESQNET makes that trade-off visible instead of hiding it.
          </p>

          <p
            style={{
              ...bodyStyle,
              fontSize: '0.9rem',
              maxWidth: '820px',
            }}
          >
            Results are from individual synthetic simulation runs on the Vile
            Parle road graph. They are not clinical results or claims of
            general performance.
          </p>
        </div>
      </Section>

      {/* REAL-WORLD MOTIVATION */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Why we explored this problem</div>

          <SectionHeading>
            Real emergencies leave difficult questions behind.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '820px' }}>
            <p>
              We reviewed public reporting from three different emergencies: a
              building collapse, an industrial gas leak and a major
              multi-district weather emergency.
            </p>

            <p>
              The reporting describes casualties, rescue operations, responding
              agencies and hospitals.
            </p>

            <p>
              But details such as exactly how many ambulances were available,
              how casualties were prioritised, what hospital capacity was
              available at that moment, and why individual patients were sent
              to particular facilities were often incomplete or absent from
              the public record.
            </p>
          </div>

          <blockquote
            className="overview-pull-quote"
            style={{
              margin: '2rem 0',
              padding: '1.5rem 0 1.5rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.3,
              fontWeight: 700,
              maxWidth: '850px',
            }}
          >
            What if the allocation decision itself left a record?
          </blockquote>

          <p style={{ ...bodyStyle, maxWidth: '820px' }}>
            RESQNET is our exploration of that question.
          </p>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '820px',
              fontWeight: 700,
            }}
          >
            RESQNET does not claim that it would have changed the outcome of any
            historical disaster.
          </p>

          <Link
            to="/evidence"
            style={{
              ...textLinkStyle,
              display: 'inline-block',
              marginTop: '1rem',
            }}
          >
            Read the evidence →
          </Link>
        </div>
      </Section>

      {/* DEMO CTA */}
      <Section>
        <div
          style={{
            ...sectionSpacing,
            textAlign: 'center',
            padding: '3rem 1.5rem',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08), rgba(244,63,94,0.08))',
          }}
        >
          <div style={smallLabelStyle}>Try it yourself</div>

          <h2
            className="overview-demo-heading"
            style={{
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              maxWidth: '850px',
              margin: '0 auto 1.5rem',
            }}
          >
            Don't take our word for it.
            <br />
            <span style={gradientTextStyle}>Break the simulation.</span>
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            Start a run. Watch hospital resources change. Block a road while an
            ambulance is moving. Compare the two allocation policies. Open the
            decision log. Verify the hash chain.
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
              Launch RESQNET
            </Link>

            <Link to="/how-it-works" style={textLinkStyle}>
              First, show me how it works →
            </Link>
          </div>
        </div>
      </Section>

      {/* MVP BOUNDARY */}
      <Section>
        <div style={{ ...sectionSpacing, marginBottom: '4rem' }}>
          <div style={smallLabelStyle}>Where the MVP stands today</div>

          <SectionHeading maxWidth="900px">
            A working MVP built to demonstrate the idea — not to pretend the
            system is finished.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              RESQNET is a <strong>Minimum Viable Product (MVP)</strong> for
              demonstrating transparent, resource-aware disaster allocation.
            </p>

            <p>
              The patients, ambulances and hospital inventories used by the
              simulation are synthetic. Ambulance speed is an assumption. The
              road network is derived from OpenStreetMap data for Vile Parle
              and its surroundings.
            </p>

            <p>
              The MVP demonstrates resource-aware allocation, repeated ambulance
              trips, dynamic road disruption, rerouting, decision logging,
              policy comparison and tamper-evident verification.
            </p>

            <p>
              It is <strong>not clinically validated</strong>,{' '}
              <strong>not connected to live hospital inventories</strong>, and{' '}
              <strong>not a production emergency-dispatch system</strong>.
            </p>
          </div>

          <Link
            to="/roadmap"
            style={{
              ...textLinkStyle,
              display: 'inline-block',
              marginTop: '1rem',
            }}
          >
            See what's built and what's next →
          </Link>
        </div>
      </Section>

      {/* CLOSING LINE */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '2rem 0 0.5rem',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          Every allocation has a reason. Make the reason visible.
        </p>
      </div>
    </PageShell>
  );
};