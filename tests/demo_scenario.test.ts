import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { demoScenario, demoHospitals, demoAmbulances } from '../src/lib/demoScenario';
import { buildSimInput } from '../src/sim/adapter';
import { astar } from '../src/sim/astar';
import roadData from '../src/data/vileparle-roads.json';
import { RoadGraph } from '../src/sim/graph';
import type { RoadGraphData } from '../src/sim/types';

describe('Demo Scenario', () => {
  it('does not import supabase on public routes', () => {
    const demoPage = fs.readFileSync(path.join(__dirname, '../src/pages/DemoPage.tsx'), 'utf-8');
    expect(demoPage).not.toMatch(/['"]\.\.\/lib\/supabase['"]/);
    
    const simView = fs.readFileSync(path.join(__dirname, '../src/pages/SimulationView.tsx'), 'utf-8');
    expect(simView).not.toMatch(/['"]\.\.\/lib\/supabase['"]/);
  });

  it('snaps all points within 300m, reaches incident, and incident reaches all hospitals', () => {
    const graph = new RoadGraph(roadData as unknown as RoadGraphData);
    const input = buildSimInput(demoScenario, demoHospitals, demoAmbulances, graph);
    
    expect(input.incidentSnap.distanceMetres).toBeLessThan(300);
    
    for (const h of input.hospitals) {
      expect(h.snap.distanceMetres).toBeLessThan(300);
    }
    for (const a of input.ambulances) {
      expect(a.snap.distanceMetres).toBeLessThan(300);
    }

    const incidentNode = input.incidentSnap.nodeId;
    
    for (const a of input.ambulances) {
      const route = astar(graph, a.snap.nodeId, incidentNode);
      expect(route).not.toBeNull();
      expect(route!.path.length).toBeGreaterThan(0);
    }

    for (const h of input.hospitals) {
      const route = astar(graph, incidentNode, h.snap.nodeId);
      expect(route).not.toBeNull();
      expect(route!.path.length).toBeGreaterThan(0);
    }
  });
});
