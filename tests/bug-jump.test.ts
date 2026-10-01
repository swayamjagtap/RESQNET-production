import { describe, it, expect, beforeAll } from 'vitest';
import { loadVileParleGraph, haversineMetres, RoadGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine, AMBULANCE_SPEED_MPS } from '../src/sim/engine';
import { getMapPoints } from '../src/lib/map-utils';
import type { RoadGraphData, SimInput } from '../src/sim/types';

describe('Mid-run reroute jumping bug', () => {
  let graph: RoadGraphData;
  let roadGraph: RoadGraph;
  let simInput: SimInput;

  beforeAll(async () => {
    graph = await loadVileParleGraph();
    roadGraph = new RoadGraph(graph);
    const scenario = {
      id: 'test',
      title: 'Test',
      created_at: '',
      updated_at: '',
      user_id: 'test',
      incident_lat: 19.104,
      incident_lng: 72.85,
      fracture: 10,
      blood_loss: 5,
      unconscious: 5,
      limb_loss: 0
    };
    const hospitals = [
      { id: 'h1', name: 'Hosp', lat: 19.09, lng: 72.84, icu_beds: 10, blood_units: 10, ventilators: 10, general_beds: 10, scenario_id: 'test', created_at: '' }
    ];
    const ambulances = [
      { id: 'a1', label: 'A1', capacity: 3, base_lat: 19.11, base_lng: 72.86, available: true, scenario_id: 'test', created_at: '' },
      { id: 'a2', label: 'A2', capacity: 3, base_lat: 19.11, base_lng: 72.86, available: true, scenario_id: 'test', created_at: '' }
    ];
    simInput = buildSimInput(scenario as any, hospitals, ambulances, roadGraph);
  });

  const runJumpTest = (targetEdgeOffset: number, ambId: string = 'a1') => {
    const run = createRun(simInput);
    const engine = new SimEngine(run, roadGraph);
    engine.start();

    let prevPos: { lat: number, lng: number } | null = null;
    let blockApplied = false;

    for (let tick = 0; tick < 1000; tick++) {
      engine.tick();
      if (run.status === 'resolved') break;

      const a = run.ambulances.find(amb => amb.id === ambId);
      if (!a) continue;

      if (!blockApplied && a.status === 'to_incident' && a.currentPath.length > 5 && a.currentEdgeProgress && a.currentEdgeProgress.distanceTravelledOnEdge > 5) {
        // Find the target edge to block relative to the current edge
        let edgeIndex = a.currentPath.indexOf(a.currentEdgeProgress.to) - 1;
        if (edgeIndex === -2) edgeIndex = 0; // fallback if not found
        
        const targetIndex = edgeIndex + targetEdgeOffset;
        if (targetIndex >= 0 && targetIndex < a.currentPath.length - 1) {
          const from = a.currentPath[targetIndex];
          const to = a.currentPath[targetIndex + 1];
          const edge = graph.edges.find(e => (e.from === from && e.to === to) || (e.from === to && e.to === from));
          if (edge) {
            engine.setBlockage(edge.id, 2);
            blockApplied = true;
          }
        }
      }

      // Record display position
      const mapPoints = getMapPoints(simInput, run, roadGraph, 0);
      const point = mapPoints.ambulances.find(amb => amb.id === ambId)?.point;

      if (point) {
        if (prevPos) {
          const dist = haversineMetres(prevPos.lat, prevPos.lng, point.lat, point.lng);
          const maxAllowed = AMBULANCE_SPEED_MPS * 1.01 + 1; // max distance covered in 1 second
          expect(dist).toBeLessThanOrEqual(maxAllowed);
        }
        prevPos = { ...point };
      }
    }
  };

  it('does not jump when blocking an upcoming edge', () => runJumpTest(1));
  
  it('does not jump when blocking the current edge', () => runJumpTest(0));
  
  it('does not jump when blocking an edge behind', () => runJumpTest(-1));

  it('handles two ambulances routing without teleporting', () => {
    const run = createRun(simInput);
    const engine = new SimEngine(run, roadGraph);
    engine.start();

    let a1PrevPos: { lat: number, lng: number } | null = null;
    let a2PrevPos: { lat: number, lng: number } | null = null;
    let blockApplied = false;

    for (let tick = 0; tick < 1000; tick++) {
      engine.tick();
      if (run.status === 'resolved') break;

      const a1 = run.ambulances.find(a => a.id === 'a1');
      const a2 = run.ambulances.find(a => a.id === 'a2');
      
      if (!blockApplied && a1?.status === 'to_incident' && a2?.status === 'to_incident' && a1.currentEdgeProgress && a2.currentEdgeProgress) {
         if (a1.currentEdgeProgress.distanceTravelledOnEdge > 5 && a2.currentEdgeProgress.distanceTravelledOnEdge > 5) {
            const edge = graph.edges[50]; // Block a random popular edge in Vile Parle
            engine.setBlockage(edge.id, 2);
            blockApplied = true;
         }
      }

      const mapPoints = getMapPoints(simInput, run, roadGraph, 0);
      const p1 = mapPoints.ambulances.find(a => a.id === 'a1')?.point;
      const p2 = mapPoints.ambulances.find(a => a.id === 'a2')?.point;
      
      const maxAllowed = AMBULANCE_SPEED_MPS * 1.01 + 1;

      if (p1 && a1PrevPos) {
        expect(haversineMetres(a1PrevPos.lat, a1PrevPos.lng, p1.lat, p1.lng)).toBeLessThanOrEqual(maxAllowed);
      }
      if (p2 && a2PrevPos) {
        expect(haversineMetres(a2PrevPos.lat, a2PrevPos.lng, p2.lat, p2.lng)).toBeLessThanOrEqual(maxAllowed);
      }
      if (p1) a1PrevPos = { ...p1 };
      if (p2) a2PrevPos = { ...p2 };
    }
  });
});
