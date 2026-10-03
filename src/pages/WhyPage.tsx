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
    className="why-section-heading"
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

const QuestionCard: React.FC<{
  number: string;
  children: React.ReactNode;
}> = ({ number, children }) => (
  <div style={cardStyle}>
    <div style={smallLabelStyle}>{number}</div>
    <div
      style={{
        fontSize: '1.08rem',
        fontWeight: 700,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  </div>
);

export const WhyPage: React.FC = () => {
  return (
    <PageShell title="Why RESQNET">
      <style>
        {`
          .why-hero-heading {
            font-size: 3.35rem;
          }

          .why-section-heading {
            font-size: 2.35rem;
          }

          .why-case-heading {
            font-size: 1.85rem;
          }

          .why-pull-quote {
            font-size: 1.75rem;
          }

          .why-final-heading {
            font-size: 2.8rem;
          }

          @media (max-width: 800px) {
            .why-hero-heading {
              font-size: 2.7rem;
            }

            .why-section-heading {
              font-size: 2.05rem;
            }

            .why-case-heading {
              font-size: 1.65rem;
            }

            .why-pull-quote {
              font-size: 1.5rem;
            }

            .why-final-heading {
              font-size: 2.3rem;
            }
          }

          @media (max-width: 520px) {
            .why-hero-heading {
              font-size: 2.2rem;
              line-height: 1.08 !important;
            }

            .why-section-heading {
              font-size: 1.8rem;
            }

            .why-case-heading {
              font-size: 1.5rem;
            }

            .why-pull-quote {
              font-size: 1.3rem;
            }

            .why-final-heading {
              font-size: 2rem;
            }
          }
        `}
      </style>

      {/* HERO */}
      <section
        aria-labelledby="why-hero-title"
        style={{
          paddingTop: '2rem',
          paddingBottom: '2rem',
          maxWidth: '980px',
        }}
      >
        <div style={eyebrowStyle}>Why RESQNET</div>

        <h1
          id="why-hero-title"
          className="hero-title why-hero-heading"
          style={{
            marginBottom: '1.75rem',
            lineHeight: 1.04,
            letterSpacing: '-0.045em',
            maxWidth: '940px',
          }}
        >
          In a disaster, the hardest question isn't whether help is needed.
          <br />
          <span style={gradientTextStyle}>
            It's where limited help should go next.
          </span>
        </h1>

        <div
          style={{
            ...bodyStyle,
            maxWidth: '830px',
            fontSize: '1.15rem',
          }}
        >
          <p>
            Ambulances, hospital capacity and road access are all limited.
          </p>

          <p>
            When several people need help at once, every decision affects the
            next one — who is transported first, which hospital receives them,
            and whether the route still works by the time the ambulance gets
            there.
          </p>

          <p>
            Public reporting can tell us that ambulances responded, people were
            rescued and hospitals received casualties.
          </p>

          <p>
            <strong style={{ color: 'var(--text-primary, #f8fafc)' }}>
              What is often harder to see is the operational decision in
              between:
            </strong>{' '}
            why this patient, this ambulance, this hospital, at this moment.
          </p>
        </div>
      </section>

      {/* OFFICIAL CHALLENGE ALIGNMENT */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>The allocation problem</div>

          <SectionHeading>
            Emergency response is a chain of connected constraints.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '820px',
              marginBottom: '2rem',
            }}
          >
            The challenge isn't simply to find the shortest route. A useful
            allocation decision may need to consider the severity of the
            casualty, ambulance capacity, hospital capacity, remaining medical
            resources and whether the road network is still usable.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <QuestionCard number="01">
              Who needs help first?
            </QuestionCard>

            <QuestionCard number="02">
              Which available vehicle can move them?
            </QuestionCard>

            <QuestionCard number="03">
              Which reachable hospital can still support their needs?
            </QuestionCard>

            <QuestionCard number="04">
              What happens when the situation changes before the next decision?
            </QuestionCard>
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
            Treating each of those questions separately can miss the fact that
            one answer changes the options available for the next.
          </p>
        </div>
      </Section>

      {/* DELHI CASE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 01 · Structural collapse · Delhi
          </div>

          <h2
            className="why-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.4rem',
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
              gap: '1.25rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>What the record tells us</div>

              <p style={bodyStyle}>
                At about 1:30 p.m., the Hostel Daze boys' paying-guest building
                in Satya Niketan collapsed during a period of basement
                repair/modification work.
              </p>

              <p style={bodyStyle}>
                Delhi Police, Delhi Fire Service, NDRF, district authorities,
                MCD, Civil Defence and CATS ambulances were involved in the
                response.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                The final reported operational figures were{' '}
                <strong>seven deaths</strong> and{' '}
                <strong>12 people rescued or recovered</strong>, after a rescue
                operation lasting more than 27 hours.
              </p>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(56, 189, 248, 0.28)',
                background: 'rgba(56, 189, 248, 0.055)',
              }}
            >
              <div style={smallLabelStyle}>
                What is harder to reconstruct publicly
              </div>

              <p style={bodyStyle}>
                CATS ambulances were documented at the site. AIIMS Trauma Centre
                became the main receiving facility, while Safdarjung Hospital
                also treated casualties.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                But the reviewed public record does not provide a complete
                formal account of the exact ambulance count, on-site triage
                categories, trauma-bed capacity, detailed treatment protocols,
                or the reasoning behind each individual hospital allocation.
              </p>
            </div>
          </div>

          <blockquote
            className="why-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            The response is visible. The complete allocation logic is much
            harder to reconstruct.
          </blockquote>

          <p
            style={{
              ...bodyStyle,
              fontSize: '0.88rem',
              maxWidth: '850px',
              marginTop: '1.25rem',
            }}
          >
            Source basis: public reporting and official-response material
            reviewed through 2 October 2026, including The Hindu, New Indian
            Express, NDRF-linked reporting and subsequent official/legal
            developments.
          </p>
        </div>
      </Section>

      {/* BOISAR CASE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 02 · Industrial gas release · Maharashtra
          </div>

          <h2
            className="why-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.4rem',
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
              gap: '1.25rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>What the record tells us</div>

              <p style={bodyStyle}>
                Nitrogen gas escaped from a reaction tank during production at
                Medley Pharmaceuticals in the Boisar-Tarapur industrial area.
              </p>

              <p style={bodyStyle}>
                Six workers were directly affected. All six were taken to
                Shinde Hospital in Boisar. Four died and two were admitted to
                intensive care.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                Police, district authorities, the Palghar Disaster Management
                Cell and the Directorate of Industrial Safety and Health became
                involved in the response and investigation.
              </p>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(139, 92, 246, 0.3)',
                background: 'rgba(139, 92, 246, 0.055)',
              }}
            >
              <div style={smallLabelStyle}>
                What remains incomplete in the public record
              </div>

              <p style={bodyStyle}>
                The available reporting identifies the receiving hospital, but
                does not document the specific ambulance service used or a
                detailed ambulance-to-hospital allocation process.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                The nitrogen leak from the reaction tank is established in the
                reporting. A defective valve and alleged continuation of
                production despite knowledge of that issue were reported as
                allegations under investigation, not as final technical
                findings.
              </p>
            </div>
          </div>

          <blockquote
            className="why-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #8b5cf6',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            Even when an emergency is confined to one site, several critical
            casualties can turn medical transport into a resource-allocation
            problem immediately.
          </blockquote>

          <p
            style={{
              ...bodyStyle,
              fontSize: '0.88rem',
              maxWidth: '850px',
              marginTop: '1.25rem',
            }}
          >
            Source basis: official and established reporting including NHRC,
            DISH-related reporting, The Hindu, Indian Express, Hindustan Times
            and other contemporaneous sources.
          </p>
        </div>
      </Section>

      {/* KERALA CASE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>
            Case 03 · Multi-district monsoon emergency · Kerala
          </div>

          <h2
            className="why-case-heading"
            style={{
              lineHeight: 1.2,
              letterSpacing: '-0.025em',
              marginBottom: '0.4rem',
            }}
          >
            Kerala floods, flash floods and landslide risk
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>What changed continuously</div>

              <p style={bodyStyle}>
                Kerala's early-monsoon emergency was not one incident at one
                location.
              </p>

              <p style={bodyStyle}>
                Heavy rainfall, river flooding, flash floods, landslide risk,
                dam releases, wind damage, transport disruption and power
                failures affected multiple districts while response and
                restoration were already underway.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                Conditions, affected locations and operational figures changed
                from one reporting period to the next.
              </p>
            </div>

            <div
              style={{
                ...cardStyle,
                borderColor: 'rgba(244, 63, 94, 0.28)',
                background: 'rgba(244, 63, 94, 0.05)',
              }}
            >
              <div style={smallLabelStyle}>A moving emergency</div>

              <p style={bodyStyle}>
                On 29 May, reporting cited about{' '}
                <strong>1,200 people in 59 relief camps</strong>.
              </p>

              <p style={bodyStyle}>
                A 30 May situation report recorded{' '}
                <strong>1,329 people from 395 families in 51 camps</strong>.
              </p>

              <p style={{ ...bodyStyle, marginBottom: 0 }}>
                On 31 May, a separate report described{' '}
                <strong>1,894 people shifted to 66 camps</strong>.
              </p>
            </div>
          </div>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginTop: '1.5rem',
            }}
          >
            These figures are dated operational snapshots. They should not be
            merged into a single final total. The reviewed sources also do not
            provide a statewide total for ambulances deployed, patients
            treated, emergency beds added or medical camps established.
          </p>

          <blockquote
            className="why-pull-quote"
            style={{
              margin: '2rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #f43f5e',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            This is what “dynamic” really means: the state of the emergency can
            change before the previous decision has finished playing out.
          </blockquote>

          <p
            style={{
              ...bodyStyle,
              fontSize: '0.88rem',
              maxWidth: '850px',
              marginTop: '1.25rem',
            }}
          >
            Source basis: IMD warnings, Kerala government material, Sphere India
            situation reports, NDRF material and contemporaneous established
            reporting.
          </p>
        </div>
      </Section>

      {/* CONVERGENCE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>What connects them</div>

          <SectionHeading>
            Three emergencies. Three scales. One recurring decision problem.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '850px',
              marginBottom: '2rem',
            }}
          >
            These incidents are not equivalent, and RESQNET does not claim they
            had the same operational failures.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>Delhi</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                One collapsed building
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Multiple casualties, emergency vehicles, rescue agencies and
                receiving hospitals.
              </p>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>Boisar</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                One industrial site
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Several critically affected workers requiring immediate medical
                transport and hospital care.
              </p>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>Kerala</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                Multiple districts
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Changing infrastructure, evacuations, relief operations and
                information across a distributed emergency.
              </p>
            </div>
          </div>

          <p
            style={{
              marginTop: '1.75rem',
              maxWidth: '880px',
              fontSize: '1.2rem',
              lineHeight: 1.6,
              fontWeight: 700,
            }}
          >
            What they demonstrate is how quickly emergency response becomes a
            problem of limited resources, changing conditions and sequential
            decisions.
          </p>
        </div>
      </Section>

      {/* CORE QUESTION */}
      <Section>
        <div
          style={{
            ...sectionSpacing,
            padding: '2.25rem',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius)',
            background:
              'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(139,92,246,0.08), rgba(244,63,94,0.06))',
          }}
        >
          <div style={smallLabelStyle}>The question behind RESQNET</div>

          <SectionHeading maxWidth="920px">
            What if every allocation decision carried its context with it?
          </SectionHeading>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '0.85rem',
              marginTop: '1.75rem',
            }}
          >
            {[
              'Which patients were waiting?',
              'Which ambulance was available?',
              'What could it carry?',
              'Which hospitals were reachable?',
              'What resources remained there?',
              'Which roads were usable?',
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
              marginTop: '2rem',
              marginBottom: 0,
              fontSize: '1.35rem',
              lineHeight: 1.5,
              fontWeight: 800,
            }}
          >
            And why did the system choose one option over another?
          </p>

          <p
            style={{
              marginTop: '1rem',
              marginBottom: 0,
              fontSize: '1.3rem',
              fontWeight: 800,
              ...gradientTextStyle,
            }}
          >
            That question became RESQNET.
          </p>
        </div>
      </Section>

      {/* OUR RESPONSE */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>Our response</div>

          <SectionHeading>
            Make the decision itself part of the system.
          </SectionHeading>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '830px',
              marginBottom: '2rem',
            }}
          >
            The RESQNET MVP brings casualty priority, ambulance capacity,
            hospital resources and road access into one evolving simulation.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            <div style={cardStyle}>
              <div style={smallLabelStyle}>01 · Make it explicit</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                Put the decision inputs in the open.
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Patient priority, vehicle capacity, reachability and remaining
                hospital resources become visible parts of the allocation.
              </p>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>02 · Let it change</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                Re-evaluate as the situation evolves.
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Earlier assignments affect remaining capacity, ambulances can
                make repeated trips, and road disruption can change a route
                during the run.
              </p>
            </div>

            <div style={cardStyle}>
              <div style={smallLabelStyle}>03 · Leave a record</div>
              <h3 style={{ marginBottom: '0.65rem' }}>
                Preserve the reasoning afterwards.
              </h3>
              <p style={{ ...bodyStyle, margin: 0 }}>
                Dispatches, hospital choices, deliveries and reroutes become
                part of a reviewable decision record.
              </p>
            </div>
          </div>

          <blockquote
            className="why-pull-quote"
            style={{
              margin: '2.25rem 0 0',
              padding: '1.4rem 0 1.4rem 1.5rem',
              borderLeft: '3px solid #38bdf8',
              lineHeight: 1.35,
              fontWeight: 750,
              maxWidth: '900px',
            }}
          >
            Not just: “Where did the ambulance go?”
            <br />
            <span style={gradientTextStyle}>
              But: “Why did it go there?”
            </span>
          </blockquote>
        </div>
      </Section>

      {/* HONEST BOUNDARY */}
      <Section>
        <div style={sectionSpacing}>
          <div style={smallLabelStyle}>What the evidence means</div>

          <SectionHeading>
            The case studies motivate the question. They don't validate the
            answer.
          </SectionHeading>

          <div style={{ ...bodyStyle, maxWidth: '850px' }}>
            <p>
              These incidents are not evidence that RESQNET would have
              prevented a death, improved a clinical outcome or changed the
              result of any historical emergency.
            </p>

            <p>
              The MVP uses synthetic casualty, ambulance and hospital-resource
              data to demonstrate one possible approach to transparent,
              adaptive allocation.
            </p>

            <p>
              It is not a reconstruction of these incidents, a clinical model,
              or an evaluation of the responders involved.
            </p>
          </div>

          <div
            style={{
              ...cardStyle,
              maxWidth: '850px',
              marginTop: '1.75rem',
              borderColor: 'rgba(139, 92, 246, 0.28)',
              background:
                'linear-gradient(135deg, rgba(56,189,248,0.055), rgba(139,92,246,0.065))',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: '1.25rem',
                lineHeight: 1.55,
                fontWeight: 750,
              }}
            >
              Real events reveal the coordination problem.
              <br />
              <span style={gradientTextStyle}>
                The simulation lets us explore the decision layer.
              </span>
            </p>
          </div>

          <Link
            to="/evidence"
            style={{
              ...textLinkStyle,
              display: 'inline-block',
              marginTop: '1.25rem',
            }}
          >
            Explore the research and sources →
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
          <div style={smallLabelStyle}>See the idea in motion</div>

          <h2
            className="why-final-heading"
            style={{
              lineHeight: 1.08,
              letterSpacing: '-0.04em',
              maxWidth: '820px',
              margin: '0 auto 1.4rem',
            }}
          >
            Now watch the decision happen.
          </h2>

          <p
            style={{
              ...bodyStyle,
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            See how RESQNET moves from casualty priority to ambulance
            assignment, hospital selection, rerouting and a verifiable decision
            record.
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

            <Link to="/how-it-works" style={textLinkStyle}>
              See how RESQNET decides →
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
};