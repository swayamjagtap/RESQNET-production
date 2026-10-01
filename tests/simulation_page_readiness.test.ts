// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getSimulationRenderMode } from '../src/pages/SimulationView';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';
import { RoadGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';
import roadData from '../src/data/vileparle-roads.json';

describe('SimulationPage Readiness & Null Safety Logic', () => {
  const mockGraph = new RoadGraph(roadData as any);

  const validScenario: Scenario = {
    id: 'test-scenario',
    owner_id: 'test-owner',
    title: 'Test',
    disaster_type: 'building_collapse',
    incident_lat: 19.1,
    incident_lng: 72.85,
    fracture: 1,
    blood_loss: 0,
    unconscious: 0,
    limb_loss: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  };

  const validHospital: Hospital = {
    id: 'H1',
    scenario_id: 'test-scenario',
    name: 'H1',
    lat: 19.105,
    lng: 72.855,
    icu_beds: 10,
    blood_units: 10,
    ventilators: 10,
    general_beds: 10,
    created_at: '2026-01-01',
  };

  const validAmbulance: Ambulance = {
    id: 'A1',
    scenario_id: 'test-scenario',
    label: 'A1',
    base_lat: 19.105,
    base_lng: 72.855,
    capacity: 2,
    available: true,
    created_at: '2026-01-01',
  };

  it('(a) no data yet (initializing state)', () => {
    expect(() => {
      const result = getSimulationRenderMode({
        error: null,
        scenario: validScenario,
        hospitals: [validHospital],
        ambulances: [validAmbulance],
        roadGraph: null,
        simInput: null,
        state: null,
        engine: null,
      });
      expect(result.mode).toBe('initializing');
      expect(result.missingItems).toEqual([]);
    }).not.toThrow();
  });

  it('(b) an incident missing', () => {
    expect(() => {
      const scenarioNoIncident: Scenario = {
        ...validScenario,
        incident_lat: null,
        incident_lng: null,
      };
      const result = getSimulationRenderMode({
        error: null,
        scenario: scenarioNoIncident,
        hospitals: [validHospital],
        ambulances: [validAmbulance],
        roadGraph: mockGraph,
        simInput: null,
        state: null,
        engine: null,
      });
      expect(result.mode).toBe('not_ready');
      expect(result.missingItems).toContain('Missing incident location.');
    }).not.toThrow();
  });

  it('(c) no hospitals', () => {
    expect(() => {
      const result = getSimulationRenderMode({
        error: null,
        scenario: validScenario,
        hospitals: [],
        ambulances: [validAmbulance],
        roadGraph: mockGraph,
        simInput: null,
        state: null,
        engine: null,
      });
      expect(result.mode).toBe('not_ready');
      expect(result.missingItems).toContain('Missing hospitals (need at least 1).');
    }).not.toThrow();
  });

  it('(d) a ready scenario', () => {
    expect(() => {
      const simInput = buildSimInput(validScenario, [validHospital], [validAmbulance], mockGraph);
      const state = createRun(simInput);
      const engine = new SimEngine(state, mockGraph);

      const result = getSimulationRenderMode({
        error: null,
        scenario: validScenario,
        hospitals: [validHospital],
        ambulances: [validAmbulance],
        roadGraph: mockGraph,
        simInput,
        state,
        engine,
      });
      expect(result.mode).toBe('ready');
      expect(result.missingItems).toEqual([]);
    }).not.toThrow();
  });

  it('evaluates exact scenario 27f3cdd2-1a98-41ed-8dfe-81f69bfd6180 when incident is missing', () => {
    const scenario27f3: Scenario = {
      id: '27f3cdd2-1a98-41ed-8dfe-81f69bfd6180',
      owner_id: 'user-1',
      title: 'Scenario 27f3',
      disaster_type: 'building_collapse',
      incident_lat: null,
      incident_lng: null,
      fracture: 4,
      blood_loss: 4,
      unconscious: 3,
      limb_loss: 2,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };

    const result = getSimulationRenderMode({
      error: null,
      scenario: scenario27f3,
      hospitals: [validHospital],
      ambulances: [validAmbulance],
      roadGraph: mockGraph,
      simInput: null,
      state: null,
      engine: null,
    });

    expect(result.mode).toBe('not_ready');
    expect(result.missingItems).toEqual(['Missing incident location.']);
  });
});
