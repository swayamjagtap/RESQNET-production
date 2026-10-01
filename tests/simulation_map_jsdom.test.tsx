// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { getMapPoints } from '../src/lib/map-utils';
import { RoadGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import roadData from '../src/data/vileparle-roads.json';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';

describe('react-leaflet ready-mode map content in jsdom', () => {
  const graph = new RoadGraph(roadData as any);

  const scenario: Scenario = {
    id: 'e84f9240-2329-4b38-81ec-e1087618a7ae',
    owner_id: 'test-user',
    title: 'Lilavati Scenario',
    disaster_type: 'building_collapse',
    incident_lat: 19.104616,
    incident_lng: 72.850184,
    fracture: 20,
    blood_loss: 10,
    unconscious: 10,
    limb_loss: 2,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const hospitals: Hospital[] = [
    {
      id: 'LILAVATI',
      scenario_id: 'e84f9240-2329-4b38-81ec-e1087618a7ae',
      name: 'LILAVATI',
      lat: 19.0982,
      lng: 72.8497,
      icu_beds: 5,
      blood_units: 5,
      ventilators: 5,
      general_beds: 10,
      created_at: '2026-01-01',
    },
  ];

  const ambulances: Ambulance[] = [
    {
      id: '001',
      scenario_id: 'e84f9240-2329-4b38-81ec-e1087618a7ae',
      label: 'Amb 001',
      base_lat: 19.0979,
      base_lng: 72.8481,
      capacity: 3,
      available: true,
      created_at: '2026-01-01',
    },
  ];

  it('renders react-leaflet map elements with valid coordinates in jsdom without throwing Invalid LatLng object', () => {
    const simInput = buildSimInput(scenario, hospitals, ambulances, graph);
    const state = createRun(simInput);
    const mapPoints = getMapPoints(simInput, state, graph);

    expect(() => {
      render(
        <div style={{ width: '800px', height: '600px' }}>
          <MapContainer
            bounds={mapPoints.bounds || undefined}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mapPoints.incident && (
              <Marker
                position={[mapPoints.incident.lat, mapPoints.incident.lng]}
                icon={L.divIcon({ html: '🔥', className: '', iconSize: [24, 24] })}
              />
            )}
            {mapPoints.hospitals.map((h) => (
              <Marker
                key={h.id}
                position={[h.point.lat, h.point.lng]}
                icon={L.divIcon({ html: h.name, className: '', iconSize: [40, 20] })}
              />
            ))}
            {mapPoints.ambulances.map((a) => (
              <Marker
                key={a.id}
                position={[a.point.lat, a.point.lng]}
                icon={L.divIcon({ html: a.label, className: '', iconSize: [40, 20] })}
              />
            ))}
          </MapContainer>
        </div>
      );
    }).not.toThrow();
  });
});
