/**
 * src/pages/GraphPreviewPage.tsx
 * Public, read-only preview component rendering the Vile Parle road network
 * as thin polylines overlaid on an interactive Leaflet map.
 */

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { RoadGraph } from '../sim/graph';
import { VILE_PARLE_CENTER } from '../lib/geo';

export const GraphPreviewPage: React.FC = () => {
  const graph = useMemo(() => new RoadGraph(), []);
  const { metadata, edges } = graph;

  return (
    <div className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>
          🛣️ Vile Parle Road Graph Preview
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
          Real drivable road graph parsed from OpenStreetMap Overpass API for disaster response simulation.
        </p>

        <div
          className="card"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(15, 23, 42, 0.6)',
            borderColor: 'var(--border-color)',
            fontSize: '0.85rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Nodes:</strong> {metadata.nodeCount.toLocaleString()} &nbsp;|&nbsp;{' '}
            <strong>Edges:</strong> {metadata.edgeCount.toLocaleString()} &nbsp;|&nbsp;{' '}
            <strong>Distance Unit:</strong> {metadata.units.distance}
          </div>
          <div>
            <strong>Source:</strong> {metadata.source} &nbsp;|&nbsp;{' '}
            <strong>Fetched:</strong> {new Date(metadata.fetchedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: '650px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <MapContainer
          center={[VILE_PARLE_CENTER.lat, VILE_PARLE_CENTER.lng]}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors (ODbL)</a>'
          />

          {edges.map((edge) => (
            <Polyline
              key={edge.id}
              positions={edge.geometry}
              pathOptions={{
                color: edge.blockage === 2 ? '#ef4444' : edge.blockage === 1 ? '#f59e0b' : '#0284c7',
                weight: 1.5,
                opacity: 0.7,
              }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default GraphPreviewPage;
