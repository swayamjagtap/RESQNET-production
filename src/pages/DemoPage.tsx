import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { SimulationView } from './SimulationView';

import {
  demoScenario,
  demoHospitals,
  demoAmbulances,
  stressScenario,
  stressHospitals,
  stressAmbulances,
} from '../lib/demoScenario';

type DemoScenarioKey = 'demo' | 'stress';

const gradientTextStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 52%, #f43f5e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const DemoPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] =
    useState<DemoScenarioKey>('demo');

  const currentScenario = useMemo(
    () =>
      selectedScenario === 'demo'
        ? demoScenario
        : stressScenario,
    [selectedScenario],
  );

  const currentHospitals = useMemo(
    () =>
      selectedScenario === 'demo'
        ? demoHospitals
        : stressHospitals,
    [selectedScenario],
  );

  const currentAmbulances = useMemo(
    () =>
      selectedScenario === 'demo'
        ? demoAmbulances
        : stressAmbulances,
    [selectedScenario],
  );

  const isStress = selectedScenario === 'stress';

  return (
    <main className="demo-page">
      <style>
        {`
          .demo-page {
            min-height: 100vh;

            background:
              radial-gradient(
                circle at 10% 0%,
                rgba(56, 189, 248, 0.035),
                transparent 28rem
              ),
              radial-gradient(
                circle at 90% 8%,
                rgba(139, 92, 246, 0.035),
                transparent 30rem
              ),
              #0b1120;
          }

          .demo-intro {
            width: min(calc(100% - 3rem), 1180px);

            margin: 0 auto;

            padding:
              2.2rem 0
              1.3rem;
          }

          .demo-intro-card {
            position: relative;

            overflow: hidden;

            display: grid;

            grid-template-columns:
              minmax(0, 1fr)
              auto;

            gap: 1.5rem;

            align-items: center;

            padding: 1.35rem 1.45rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.13);

            border-radius: 16px;

            background:
              linear-gradient(
                135deg,
                rgba(15, 23, 42, 0.92),
                rgba(17, 24, 39, 0.92)
              );

            box-shadow:
              0 18px 52px
              rgba(0, 0, 0, 0.13);
          }

          .demo-intro-card::before {
            content: '';

            position: absolute;

            top: 0;
            left: 0;
            right: 0;

            height: 2px;

            background:
              linear-gradient(
                90deg,
                #38bdf8,
                #8b5cf6,
                #f43f5e
              );
          }

          .demo-eyebrow {
            margin-bottom: 0.5rem;

            color: #38bdf8;

            font-size: 0.68rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .demo-heading {
            margin: 0;

            color: #f8fafc;

            font-size: 1.45rem;
            line-height: 1.2;
            letter-spacing: -0.025em;
          }

          .demo-copy {
            max-width: 670px;

            margin: 0.55rem 0 0;

            color: #8392a8;

            font-size: 0.8rem;
            line-height: 1.6;
          }

          .demo-copy strong {
            color: #dce5f0;
          }

          .demo-actions {
            display: flex;
            align-items: center;

            gap: 0.7rem;

            flex-wrap: wrap;

            justify-content: flex-end;
          }

          .demo-selector {
            display: inline-flex;
            align-items: center;

            gap: 0.2rem;

            padding: 0.22rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            border-radius: 10px;

            background:
              rgba(7, 13, 24, 0.42);
          }

          .demo-selector-button {
            min-height: 38px;

            padding: 0 0.85rem;

            border: 0;
            border-radius: 8px;

            color: #7f8da3;

            background: transparent;

            font-family: inherit;

            font-size: 0.76rem;
            font-weight: 750;

            cursor: pointer;

            white-space: nowrap;

            transition:
              color 150ms ease,
              background 150ms ease,
              box-shadow 150ms ease;
          }

          .demo-selector-button:hover {
            color: #f8fafc;
          }

          .demo-selector-button.is-active {
            color: #ffffff;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.14),
                rgba(139, 92, 246, 0.13)
              );

            box-shadow:
              inset 0 0 0 1px
              rgba(56, 189, 248, 0.16);
          }

          .demo-workspace-link {
            min-height: 38px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            padding: 0 0.8rem;

            color: #dbeafe;

            border:
              1px solid
              rgba(56, 189, 248, 0.2);

            border-radius: 9px;

            background:
              rgba(56, 189, 248, 0.055);

            text-decoration: none;

            font-size: 0.76rem;
            font-weight: 750;
          }

          .demo-workspace-link:hover {
            background:
              rgba(56, 189, 248, 0.09);
          }

          .demo-context {
            width: min(calc(100% - 3rem), 1180px);

            margin:
              0 auto
              0.9rem;
          }

          .demo-context-card {
            display: flex;
            align-items: flex-start;

            gap: 0.75rem;

            padding: 0.85rem 1rem;

            border-radius: 11px;
          }

          .demo-context-card.balanced {
            border:
              1px solid
              rgba(56, 189, 248, 0.16);

            background:
              rgba(56, 189, 248, 0.04);
          }

          .demo-context-card.stress {
            border:
              1px solid
              rgba(244, 63, 94, 0.18);

            background:
              linear-gradient(
                135deg,
                rgba(139, 92, 246, 0.055),
                rgba(244, 63, 94, 0.045)
              );
          }

          .demo-context-icon {
            flex: 0 0 auto;

            width: 30px;
            height: 30px;

            display: inline-flex;
            align-items: center;
            justify-content: center;

            border-radius: 8px;

            color: #f8fafc;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            background:
              rgba(15, 23, 42, 0.52);

            font-size: 0.72rem;
            font-weight: 850;
          }

          .demo-context-title {
            margin: 0;

            color: #dce5f0;

            font-size: 0.78rem;
            font-weight: 750;
          }

          .demo-context-copy {
            margin: 0.2rem 0 0;

            color: #74849a;

            font-size: 0.72rem;
            line-height: 1.5;
          }

          .demo-context-copy strong {
            color: #cbd5e1;
          }

          .demo-simulator-shell {
            width: min(calc(100% - 2rem), 1440px);

            margin: 0 auto;
          }

          .demo-reference-row {
            width: min(calc(100% - 3rem), 1180px);

            margin:
              1rem auto
              0;

            display: flex;
            justify-content: flex-end;
          }

          .demo-reference-link {
            color: #64748b;

            text-decoration: none;

            font-size: 0.68rem;
            font-weight: 650;
          }

          .demo-reference-link:hover {
            color: #94a3b8;
          }

          @media (max-width: 900px) {
            .demo-intro-card {
              grid-template-columns: 1fr;
            }

            .demo-actions {
              justify-content: flex-start;
            }
          }

          @media (max-width: 680px) {
            .demo-intro,
            .demo-context,
            .demo-reference-row {
              width:
                calc(100% - 2rem);
            }

            .demo-intro {
              padding-top: 1.4rem;
            }

            .demo-intro-card {
              padding: 1.1rem;
            }

            .demo-heading {
              font-size: 1.25rem;
            }

            .demo-actions {
              align-items: stretch;
              flex-direction: column;
            }

            .demo-selector {
              width: 100%;
            }

            .demo-selector-button {
              flex: 1;
            }

            .demo-workspace-link {
              width: 100%;
              box-sizing: border-box;
            }

            .demo-simulator-shell {
              width: 100%;
            }
          }
        `}
      </style>

      <section className="demo-intro">
        <div className="demo-intro-card">
          <div>
            <div className="demo-eyebrow">
              Public demo
            </div>

            <h1 className="demo-heading">
              Explore the allocation engine with{' '}
              <span style={gradientTextStyle}>
                synthetic scenarios.
              </span>
            </h1>

            <p className="demo-copy">
              All hospitals, ambulances and patients in this demo are
              synthetic. Use the balanced scenario to understand the normal
              workflow, or switch to the resource-stress scenario to expose a
              trade-off between proximity and resource suitability.
            </p>
          </div>

          <div className="demo-actions">
            <div
              className="demo-selector"
              role="tablist"
              aria-label="Demo scenario"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedScenario === 'demo'}
                className={`demo-selector-button ${selectedScenario === 'demo'
                    ? 'is-active'
                    : ''
                  }`}
                onClick={() => setSelectedScenario('demo')}
              >
                Balanced
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={selectedScenario === 'stress'}
                className={`demo-selector-button ${selectedScenario === 'stress'
                    ? 'is-active'
                    : ''
                  }`}
                onClick={() => setSelectedScenario('stress')}
              >
                Resource stress
              </button>
            </div>

            <Link
              to="/login"
              className="demo-workspace-link"
            >
              Build your own scenario
            </Link>
          </div>
        </div>
      </section>

      <section className="demo-context">
        <div
          className={`demo-context-card ${isStress ? 'stress' : 'balanced'
            }`}
        >
          <div className="demo-context-icon">
            {isStress ? '!' : 'i'}
          </div>

          <div>
            <p className="demo-context-title">
              {isStress
                ? 'Resource-stress scenario'
                : 'Balanced scenario'}
            </p>

            <p className="demo-context-copy">
              {isStress ? (
                <>
                  The nearest hospital is intentionally given insufficient
                  critical stock. This scenario exists to make the trade-off
                  visible: a simpler policy may be faster, while the
                  resource-aware policy can avoid sending patients to a
                  destination short of required simulated resources.
                </>
              ) : (
                <>
                  Simulated resources are sufficient across the scenario. Use
                  this run to understand RESQNET’s normal dispatch, routing,
                  delivery, decision-record and verification workflow.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="demo-simulator-shell">
        <SimulationView
          key={selectedScenario}
          title={currentScenario.title}
          scenario={currentScenario}
          hospitals={currentHospitals}
          ambulances={currentAmbulances}
        />
      </section>

      <div className="demo-reference-row">
        <a
          href="https://amolewmjw.github.io/RESQNET/"
          target="_blank"
          rel="noreferrer"
          className="demo-reference-link"
        >
          View original schematic simulator ↗
        </a>
      </div>
    </main>
  );
};