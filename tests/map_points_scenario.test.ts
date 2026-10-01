import { describe, it, expect } from 'vitest';
import { getMapPoints } from '../src/lib/map-utils';
import { RoadGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';
import roadData from '../src/data/vileparle-roads.json';

describe('Scenario e84f9240-2329-4b38-81ec-e1087618a7ae map points validation', () => {
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

  it('validates all Leaflet coordinates are finite and within bounding box', () => {
    const simInput = buildSimInput(scenario, hospitals, ambulances, graph);
    const state = createRun(simInput);
    const engine = new SimEngine(state, graph);

    // Initial check (tick 0)
    const points0 = getMapPoints(simInput, state, graph);

    expect(points0.incident).not.toBeNull();
    expect(points0.hospitals.length).toBe(1);
    expect(points0.ambulances.length).toBe(1);
    expect(points0.warnings.length).toBe(0);

    const checkPoint = (lat: number, lng: number) => {
      expect(Number.isFinite(lat)).toBe(true);
      expect(Number.isFinite(lng)).toBe(true);
      expect(lat).toBeGreaterThanOrEqual(19.0);
      expect(lat).toBeLessThanOrEqual(19.2);
      expect(lng).toBeGreaterThanOrEqual(72.7);
      expect(lng).toBeLessThanOrEqual(72.95);
    };

    checkPoint(points0.incident!.lat, points0.incident!.lng);
    checkPoint(points0.hospitals[0].point.lat, points0.hospitals[0].point.lng);
    checkPoint(points0.ambulances[0].point.lat, points0.ambulances[0].point.lng);

    // Position after 0 ticks
    const ambPos0 = points0.ambulances[0].point;
    checkPoint(ambPos0.lat, ambPos0.lng);

    // Position after 1 tick
    engine.start();
    engine.tick();
    const points1 = getMapPoints(simInput, state, graph);
    const ambPos1 = points1.ambulances[0].point;
    checkPoint(ambPos1.lat, ambPos1.lng);

    // Position after 30 ticks
    for (let i = 0; i < 29; i++) {
      engine.tick();
    }
    const points30 = getMapPoints(simInput, state, graph);
    const ambPos30 = points30.ambulances[0].point;
    checkPoint(ambPos30.lat, ambPos30.lng);
  });
});
