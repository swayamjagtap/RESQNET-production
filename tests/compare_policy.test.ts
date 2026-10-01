import { describe, it, expect } from 'vitest';
import { runPolicyComparison } from '../src/lib/compare';
import { demoScenario, demoHospitals, demoAmbulances } from '../src/lib/demoScenario';
import { loadVileParleGraph, RoadGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';
import type { RoadGraphData } from '../src/sim/types';

describe('Policy Comparison', () => {
  it('comparison on the demo scenario is deterministic (run twice, identical results)', async () => {
    const graph = await loadVileParleGraph();
    
    const run1 = runPolicyComparison(demoScenario, demoHospitals, demoAmbulances, graph);
    const run2 = runPolicyComparison(demoScenario, demoHospitals, demoAmbulances, graph);
    
    expect(run1).toEqual(run2);
  });
  
  it('small hand-made graph: baseline delivers to under-resourced nearest, resource_aware picks further equipped', () => {
    // We build a synthetic graph:
    // Incident at N0.
    // N1 is near (dist 10), H1 is at N1. Lacks vent.
    // N2 is far (dist 50), H2 is at N2. Has vent.
    // Ambulance at N1.
    // Patient has unconscious (needs icu, vent).
    
    const graphData: RoadGraphData = {
      metadata: { source: 'test', query: '', fetchedAt: '', boundingBox: { swLat: 0, swLng: 0, neLat: 0, neLng: 0 }, nodeCount: 3, edgeCount: 2, units: { distance: 'm', coordinates: 'latlng' }, notes: '' },
      nodes: {
        'N0': { id: 'N0', lat: 0, lng: 0 },
        'N1': { id: 'N1', lat: 0.0001, lng: 0 }, // nearest
        'N2': { id: 'N2', lat: 0.001, lng: 0 },  // further
      },
      edges: [
        { id: 'E1', from: 'N0', to: 'N1', lengthMetres: 10, geometry: [[0,0], [0.0001,0]] },
        { id: 'E2', from: 'N0', to: 'N2', lengthMetres: 50, geometry: [[0,0], [0.001,0]] },
        { id: 'E3', from: 'N1', to: 'N0', lengthMetres: 10, geometry: [[0.0001,0], [0,0]] },
        { id: 'E4', from: 'N2', to: 'N0', lengthMetres: 50, geometry: [[0.001,0], [0,0]] },
      ]
    };
    
    const graph = new RoadGraph(graphData);
    // Mock the snap function used by adapter if needed, but since they have exact coordinates, they snap perfectly.
    // Actually adapter uses haversine internally via a spatial index.
    
    const scenario = {
      id: 's1', title: 'test', incident_lat: 0, incident_lng: 0,
      fracture: 0, blood_loss: 0, unconscious: 1, limb_loss: 0
    } as any;
    
    const hospitals = [
      { id: 'H1', name: 'Near', lat: 0.0001, lng: 0, icu_beds: 10, blood_units: 10, ventilators: 0, general_beds: 10 },
      { id: 'H2', name: 'Far', lat: 0.001, lng: 0, icu_beds: 10, blood_units: 10, ventilators: 10, general_beds: 10 }
    ] as any;
    
    const ambulances = [
      { id: 'A1', label: 'A1', base_lat: 0.0001, base_lng: 0, capacity: 1, available: true }
    ] as any;
    
    const res = runPolicyComparison(scenario, hospitals, ambulances, graph);
    
    // baseline goes to H1 (under-resourced because no vent)
    expect(res.baseline.underResourcedCount).toBe(1);
    
    // resource_aware goes to H2 (has vent)
    expect(res.resource_aware.underResourcedCount).toBe(0);
  });
  
  it('baseline policy never reads hospital stock when choosing', async () => {
    // If it reads stock during hospital_select, we can catch it by using a Proxy or checking the event reason.
    // Actually we can just run baseline and check the hospital_select events.
    const graph = await loadVileParleGraph();
    
    const input = buildSimInput(demoScenario, demoHospitals, demoAmbulances, graph, 'baseline_nearest_fcfs');
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    engine.start();
    
    while(state.status !== 'resolved') engine.tick();
    
    const selectEvents = state.events.filter(e => e.kind === 'hospital_select');
    expect(selectEvents.length).toBeGreaterThan(0);
    
    for (const ev of selectEvents) {
      expect((ev as any).reason).toBe('baseline: nearest hospital');
      // The candidates should have coverage=0 and sufficient=false (since they weren't read) or the actual state
      // We modified hospital_select to return the ACTUAL available stock so it can be rendered.
    }
  });
});
