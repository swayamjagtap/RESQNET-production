/**
 * src/pages/GraphPreviewPage.tsx
 *
 * Public, read-only preview of the Vile Parle road network used by RESQNET.
 * Dynamically loads the road graph dataset and renders it over OpenStreetMap.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  MapContainer,
  Polyline,
  TileLayer,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import {
  RoadGraph,
  loadVileParleGraph,
} from '../sim/graph';

import { VILE_PARLE_CENTER } from '../lib/geo';

const gradientTextStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #38bdf8 0%, #8b5cf6 52%, #f43f5e 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

export const GraphPreviewPage: React.FC = () => {
  const [graph, setGraph] =
    useState<RoadGraph | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    loadVileParleGraph()
      .then((loadedGraph) => {
        setGraph(loadedGraph);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load road graph',
        );

        setLoading(false);
      });
  }, []);

  const edgeCounts = useMemo(() => {
    if (!graph) {
      return {
        clear: 0,
        partial: 0,
        blocked: 0,
      };
    }

    return graph.edges.reduce(
      (acc, edge) => {
        if (edge.blockage === 2) {
          acc.blocked += 1;
        } else if (edge.blockage === 1) {
          acc.partial += 1;
        } else {
          acc.clear += 1;
        }

        return acc;
      },
      {
        clear: 0,
        partial: 0,
        blocked: 0,
      },
    );
  }, [graph]);

  if (loading) {
    return (
      <main className="graph-preview-page">
        <style>
          {`
            .graph-preview-page {
              min-height: 65vh;

              display: flex;
              align-items: center;
              justify-content: center;

              padding: 3rem 1rem;
            }

            .graph-loading {
              display: flex;
              flex-direction: column;
              align-items: center;

              gap: 1rem;

              color: #7f8da3;

              text-align: center;
            }

            .graph-loading .spinner {
              width: 34px;
              height: 34px;
            }
          `}
        </style>

        <div className="graph-loading">
          <div className="spinner" />

          <div>
            <strong
              style={{
                display: 'block',
                color: '#e7edf6',
                marginBottom: '0.35rem',
              }}
            >
              Loading road-network data
            </strong>

            <span>
              Preparing the Vile Parle graph preview…
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (error || !graph) {
    return (
      <main
        style={{
          width: 'min(100% - 2rem, 900px)',
          margin: '0 auto',
          padding: '4rem 0',
        }}
      >
        <div
          style={{
            padding: '1.25rem',
            border:
              '1px solid rgba(244, 63, 94, 0.24)',
            borderRadius: '12px',
            background:
              'rgba(244, 63, 94, 0.055)',
            color: '#fecdd3',
            lineHeight: 1.6,
          }}
        >
          <strong
            style={{
              display: 'block',
              marginBottom: '0.35rem',
            }}
          >
            Road graph could not be loaded
          </strong>

          <span>
            {error ??
              'The road-network dataset is unavailable.'}
          </span>
        </div>
      </main>
    );
  }

  const { metadata, edges } = graph;

  return (
    <main className="graph-preview-page">
      <style>
        {`
          .graph-preview-page {
            width: min(100% - 3rem, 1180px);

            margin: 0 auto;

            padding:
              3rem 0
              5rem;
          }

          .graph-eyebrow {
            margin-bottom: 0.7rem;

            color: #38bdf8;

            font-size: 0.72rem;
            font-weight: 800;

            letter-spacing: 0.09em;
            text-transform: uppercase;
          }

          .graph-title {
            margin: 0;

            color: #f8fafc;

            font-size: 3rem;
            line-height: 1.05;
            letter-spacing: -0.045em;

            max-width: 860px;
          }

          .graph-subtitle {
            max-width: 820px;

            margin:
              1rem 0
              0;

            color: #8fa0b6;

            font-size: 1rem;
            line-height: 1.75;
          }

          .graph-summary {
            display: grid;

            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 0.85rem;

            margin-top: 2rem;
          }

          .graph-summary-card {
            padding: 1rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.13);

            border-radius: 12px;

            background:
              rgba(15, 23, 42, 0.5);
          }

          .graph-summary-label {
            display: block;

            color: #64748b;

            font-size: 0.65rem;
            font-weight: 800;

            letter-spacing: 0.07em;
            text-transform: uppercase;
          }

          .graph-summary-value {
            display: block;

            margin-top: 0.35rem;

            color: #f8fafc;

            font-size: 1.35rem;
            font-weight: 800;
          }

          .graph-summary-note {
            display: block;

            margin-top: 0.3rem;

            color: #64748b;

            font-size: 0.68rem;
            line-height: 1.4;
          }

          .graph-context {
            display: grid;

            grid-template-columns:
              minmax(0, 1.5fr)
              minmax(260px, 0.7fr);

            gap: 1rem;

            margin-top: 1.25rem;
          }

          .graph-context-card {
            padding: 1.2rem;

            border:
              1px solid
              rgba(148, 163, 184, 0.13);

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.045),
                rgba(139, 92, 246, 0.035)
              );
          }

          .graph-context-kicker {
            margin-bottom: 0.45rem;

            color: #38bdf8;

            font-size: 0.66rem;
            font-weight: 800;

            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .graph-context-card h2 {
            margin: 0;

            color: #f8fafc;

            font-size: 1rem;
            line-height: 1.35;
          }

          .graph-context-card p {
            margin:
              0.55rem 0
              0;

            color: #75859b;

            font-size: 0.78rem;
            line-height: 1.6;
          }

          .graph-assumption-list {
            margin:
              0.7rem 0
              0;

            padding-left: 1.15rem;

            color: #7f8da3;

            font-size: 0.74rem;
            line-height: 1.65;
          }

          .graph-map-shell {
            margin-top: 1.25rem;

            overflow: hidden;

            border:
              1px solid
              rgba(148, 163, 184, 0.14);

            border-radius: 16px;

            background: #0f172a;

            box-shadow:
              0 20px 60px
              rgba(0, 0, 0, 0.14);
          }

          .graph-map-header {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 1rem;

            padding: 1rem 1.15rem;

            border-bottom:
              1px solid
              rgba(148, 163, 184, 0.1);

            background:
              rgba(15, 23, 42, 0.76);
          }

          .graph-map-title {
            margin: 0;

            color: #e7edf6;

            font-size: 0.9rem;
            font-weight: 750;
          }

          .graph-map-meta {
            display: flex;
            align-items: center;

            gap: 0.75rem;

            flex-wrap: wrap;

            color: #66768d;

            font-size: 0.68rem;
          }

          .graph-map-legend {
            display: flex;
            align-items: center;

            gap: 0.8rem;

            flex-wrap: wrap;
          }

          .graph-legend-item {
            display: inline-flex;
            align-items: center;

            gap: 0.35rem;

            color: #7f8da3;

            font-size: 0.68rem;
            font-weight: 650;
          }

          .graph-legend-line {
            width: 18px;
            height: 2px;

            border-radius: 999px;
          }

          .graph-map {
            height: 650px;

            position: relative;
          }

          .graph-map .leaflet-container {
            width: 100%;
            height: 100%;
          }

          .graph-source-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 1rem;

            flex-wrap: wrap;

            padding: 0.85rem 1.15rem;

            border-top:
              1px solid
              rgba(148, 163, 184, 0.1);

            background:
              rgba(9, 14, 25, 0.55);

            color: #5f6f85;

            font-size: 0.68rem;
            line-height: 1.5;
          }

          .graph-source-row strong {
            color: #94a3b8;
          }

          .graph-note {
            margin-top: 1.25rem;

            padding: 1rem 1.1rem;

            border:
              1px solid
              rgba(139, 92, 246, 0.17);

            border-radius: 11px;

            background:
              linear-gradient(
                135deg,
                rgba(56, 189, 248, 0.04),
                rgba(139, 92, 246, 0.045),
                rgba(244, 63, 94, 0.025)
              );

            color: #7f8da3;

            font-size: 0.75rem;
            line-height: 1.65;
          }

          .graph-note strong {
            color: #dce5f0;
          }

          @media (max-width: 900px) {
            .graph-summary {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .graph-context {
              grid-template-columns: 1fr;
            }

            .graph-map {
              height: 560px;
            }
          }

          @media (max-width: 620px) {
            .graph-preview-page {
              width:
                calc(100% - 2rem);

              padding-top: 2.2rem;
            }

            .graph-title {
              font-size: 2.2rem;
            }

            .graph-summary {
              grid-template-columns: 1fr 1fr;
            }

            .graph-map-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .graph-map {
              height: 430px;
            }

            .graph-source-row {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}
      </style>

      {/* HERO */}
      <header>
        <div className="graph-eyebrow">
          Road-network evidence
        </div>

        <h1 className="graph-title">
          The simulator routes on a real road graph,
          <br />
          <span style={gradientTextStyle}>
            not straight-line distance.
          </span>
        </h1>

        <p className="graph-subtitle">
          This page exposes the road-network dataset used by RESQNET for
          routing around Vile Parle and the surrounding area. The graph was
          derived from OpenStreetMap road data and is rendered here as a
          read-only preview.
        </p>
      </header>

      {/* SUMMARY */}
      <section className="graph-summary">
        <div className="graph-summary-card">
          <span className="graph-summary-label">
            Nodes
          </span>

          <strong className="graph-summary-value">
            {metadata.nodeCount.toLocaleString()}
          </strong>

          <span className="graph-summary-note">
            Road-network points
          </span>
        </div>

        <div className="graph-summary-card">
          <span className="graph-summary-label">
            Edges
          </span>

          <strong className="graph-summary-value">
            {metadata.edgeCount.toLocaleString()}
          </strong>

          <span className="graph-summary-note">
            Connected road segments
          </span>
        </div>

        <div className="graph-summary-card">
          <span className="graph-summary-label">
            Clear edges
          </span>

          <strong className="graph-summary-value">
            {edgeCounts.clear.toLocaleString()}
          </strong>

          <span className="graph-summary-note">
            Normal road state
          </span>
        </div>

        <div className="graph-summary-card">
          <span className="graph-summary-label">
            Distance unit
          </span>

          <strong className="graph-summary-value">
            {metadata.units.distance}
          </strong>

          <span className="graph-summary-note">
            Used by routing calculations
          </span>
        </div>
      </section>

      {/* CONTEXT */}
      <section className="graph-context">
        <div className="graph-context-card">
          <div className="graph-context-kicker">
            Why this matters
          </div>

          <h2>
            Routing decisions follow the available network.
          </h2>

          <p>
            A straight-line route can ignore real streets, junctions and
            barriers. RESQNET instead uses the graph structure when calculating
            paths and when reacting to simulated road restrictions.
          </p>
        </div>

        <div className="graph-context-card">
          <div className="graph-context-kicker">
            MVP assumptions
          </div>

          <h2>
            The graph is realistic, but simplified.
          </h2>

          <ul className="graph-assumption-list">
            <li>One-way tags are currently ignored.</li>
            <li>Parallel edges may be merged.</li>
            <li>Ambulance speed is an explicit simulation assumption.</li>
            <li>
              This is a hackathon routing model, not a production navigation
              service.
            </li>
          </ul>
        </div>
      </section>

      {/* MAP */}
      <section className="graph-map-shell">
        <div className="graph-map-header">
          <div>
            <p className="graph-map-title">
              Vile Parle road graph
            </p>

            <div className="graph-map-meta">
              <span>
                Source: {metadata.source}
              </span>

              <span>•</span>

              <span>
                Fetched{' '}
                {new Date(
                  metadata.fetchedAt,
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <div
            className="graph-map-legend"
            aria-label="Road-state legend"
          >
            <span className="graph-legend-item">
              <span
                className="graph-legend-line"
                style={{
                  background: '#38bdf8',
                }}
              />
              Clear
            </span>

            <span className="graph-legend-item">
              <span
                className="graph-legend-line"
                style={{
                  background: '#f59e0b',
                }}
              />
              Partial
            </span>

            <span className="graph-legend-item">
              <span
                className="graph-legend-line"
                style={{
                  background: '#ef4444',
                }}
              />
              Blocked
            </span>
          </div>
        </div>

        <div className="graph-map">
          <MapContainer
            center={[
              VILE_PARLE_CENTER.lat,
              VILE_PARLE_CENTER.lng,
            ]}
            zoom={14}
            style={{
              width: '100%',
              height: '100%',
            }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
            />

            {edges.map((edge) => (
              <Polyline
                key={edge.id}
                positions={edge.geometry}
                pathOptions={{
                  color:
                    edge.blockage === 2
                      ? '#ef4444'
                      : edge.blockage === 1
                        ? '#f59e0b'
                        : '#38bdf8',
                  weight: 1.5,
                  opacity: 0.68,
                }}
              />
            ))}
          </MapContainer>
        </div>

        <div className="graph-source-row">
          <span>
            <strong>
              Current edge state:
            </strong>{' '}
            {edgeCounts.clear.toLocaleString()} clear ·{' '}
            {edgeCounts.partial.toLocaleString()} partial ·{' '}
            {edgeCounts.blocked.toLocaleString()} blocked
          </span>

          <span>
            OpenStreetMap-derived road graph · read-only preview
          </span>
        </div>
      </section>

      {/* NOTE */}
      <section className="graph-note">
        <strong>Scope boundary:</strong>{' '}
        this preview demonstrates the network RESQNET routes across. It does
        not claim turn-by-turn navigation accuracy, live traffic awareness or
        production emergency-routing validation.
      </section>
    </main>
  );
};

export default GraphPreviewPage;