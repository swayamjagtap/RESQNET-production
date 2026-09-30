import { describe, it, expect } from 'vitest';
import { RoadGraph } from '../src/sim/graph';
import { SimEngine } from '../src/sim/engine';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { canonicalizeEvent } from '../src/sim/events';
import type { RoadGraphData } from '../src/sim/types';
import type { Scenario, Hospital, Ambulance } from '../src/lib/types';
import roadData from '../src/data/vileparle-roads.json';

const scenario: Scenario = {
  id: 'real-graph-block', owner_id: 'test', title: 'Vile Parle Block Run',
  disaster_type: 'building_collapse', incident_lat: 19.0985, incident_lng: 72.8500,
  updated_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z',
  fracture: 4, blood_loss: 4, unconscious: 3, limb_loss: 2,
};

const hospitals: Hospital[] = [
  { id: 'H1', scenario_id: 'real-graph-block', name: 'North', lat: 19.115, lng: 72.840, icu_beds: 3, blood_units: 2, ventilators: 2, general_beds: 3, created_at: '2026-01-01' },
  { id: 'H2', scenario_id: 'real-graph-block', name: 'East', lat: 19.105, lng: 72.865, icu_beds: 1, blood_units: 2, ventilators: 1, general_beds: 4, created_at: '2026-01-01' },
];

const ambulances: Ambulance[] = [
  { id: 'A1', scenario_id: 'real-graph-block', label: 'Amb 1', base_lat: 19.115, base_lng: 72.840, capacity: 2, available: true, created_at: '2026-01-01' },
];

function setupRun() {
  const graph = new RoadGraph(roadData as unknown as RoadGraphData);
  const input = buildSimInput(scenario, hospitals, ambulances, graph);
  const state = createRun(input);
  const engine = new SimEngine(state, graph);
  engine.start();
  return { state, engine, graph };
}

describe('Real Vile Parle graph dynamic blocking', () => {
  it('reroutes safely and deterministically when an upcoming edge is blocked', () => {
    const doRun = () => {
      const { state, engine } = setupRun();
      let blocked = false;
      while (state.status === 'running') {
        engine.tick();

        if (!blocked && state.tick > 20) { // wait for it to get moving
          const amb = state.ambulances[0];
          if (amb && amb.status === 'to_incident' && amb.currentPath.length > 2) {
            // Find an edge ahead on the path
            const targetNode = amb.currentPath[amb.currentPath.length - 2];
            const nextNode = amb.currentPath[amb.currentPath.length - 1];
            // We don't have direct access to roadId from nodes easily without looking up.
            // Let's just find the edge id by looking at the graph
            const graphEdges = (roadData as unknown as RoadGraphData).edges;
            const edgeToBlock = graphEdges.find(e => 
              (e.from === targetNode && e.to === nextNode) || 
              (e.to === targetNode && e.from === nextNode)
            );
            
            // Just block it if found (since it is at the end of the path, it is not the current edge yet)
            if (edgeToBlock) {
              engine.setBlockage(edgeToBlock.id, 2);
              blocked = true;
            }
          }
        }
      }

      return state;
    };

    const state1 = doRun();
    const state2 = doRun();

    expect(['resolved', 'stuck']).toContain(state1.status);
    
    const reroutes = state1.events.filter(e => e.kind === 'reroute');
    expect(reroutes.length).toBeGreaterThan(0);
    expect(reroutes[0].oldPath).toBeDefined();
    expect(reroutes[0].newPath).toBeDefined();

    expect(state1.events.length).toBe(state2.events.length);
    for (let i = 0; i < state1.events.length; i++) {
      expect(canonicalizeEvent(state1.events[i])).toBe(canonicalizeEvent(state2.events[i]));
    }
  });
});
