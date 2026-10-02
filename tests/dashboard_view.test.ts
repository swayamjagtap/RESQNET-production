import { describe, it, expect } from 'vitest';
import { buildDashboardView, groupCoLocatedAmbulances } from '../src/lib/dashboard-view';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';
import { loadVileParleGraph } from '../src/sim/graph';
import { demoScenario, demoHospitals, demoAmbulances, stressScenario, stressHospitals, stressAmbulances } from '../src/lib/demoScenario';

describe('dashboard-view invariants', () => {
  it('maintains invariants on a real-graph run (demo scenario)', async () => {
    const graph = await loadVileParleGraph();
    const input = buildSimInput(demoScenario, demoHospitals, demoAmbulances, graph, 'resource_aware');
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    
    engine.start();
    
    let ticks = 0;
    while (state.status === 'running' && ticks < 20000) {
      engine.tick();
      ticks++;
      
      if (ticks % 10 === 0 || (state.status as string) === 'resolved') {
        const view = buildDashboardView(state, input)!;
        expect(view).toBeDefined();
        
        // 1. Initial = remaining + reserved + consumed
        for (const h of view.hospitals) {
          const res = [h.icu, h.blood, h.vent, h.beds];
          for (const r of res) {
            expect(r.initial).toBe(r.remaining + r.reserved + r.consumed);
          }
        }
        
        // 2. delivered + waiting + in transit = total patients
        const sumPatients = view.patients.reduce((s, p) => s + p.total, 0);
        const delivered = view.patients.reduce((s, p) => s + p.delivered, 0);
        const waiting = view.patients.reduce((s, p) => s + p.waiting, 0);
        const onboard = view.patients.reduce((s, p) => s + p.onboard, 0);
        const assigned = view.patients.reduce((s, p) => s + p.assigned, 0);
        const deliveredShort = view.patients.reduce((s, p) => s + p.deliveredShort, 0);
        expect(delivered + deliveredShort + waiting + onboard + assigned).toBe(sumPatients);
        
        // 3. sum of hospital deliveries received = delivered + deliveredShort
        const sumHospDeliveries = view.hospitals.reduce((s, h) => s + h.deliveriesReceived, 0);
        expect(sumHospDeliveries).toBe(view.kpis.delivered + view.kpis.deliveredShort);
        
        // 4. reroutes counter equals the number of reroute events
        const actualReroutes = state.events.filter(e => e.kind === 'reroute').length;
        expect(view.kpis.reroutes).toBe(actualReroutes);
      }
    }
    
    // the KPI strip numbers equal the values in the completion summary at the end
    const view = buildDashboardView(state, input)!;
    expect(view.kpis.delivered).toBe(state.deliveredCount);
    expect(view.kpis.deliveredShort).toBe(state.underResourcedCount);
  });

  it('maintains invariants on a real-graph run (stress scenario)', async () => {
    const graph = await loadVileParleGraph();
    const input = buildSimInput(stressScenario, stressHospitals, stressAmbulances, graph, 'baseline_nearest_fcfs');
    const state = createRun(input);
    const engine = new SimEngine(state, graph);
    
    engine.start();
    
    let ticks = 0;
    while (state.status === 'running' && ticks < 20000) {
      engine.tick();
      ticks++;
      
      if (ticks % 10 === 0 || (state.status as string) === 'resolved') {
        const view = buildDashboardView(state, input)!;
        
        for (const h of view.hospitals) {
          const res = [h.icu, h.blood, h.vent, h.beds];
          for (const r of res) {
            expect(r.initial).toBe(r.remaining + r.reserved + r.consumed);
          }
        }
        
        const sumPatients = view.patients.reduce((s, p) => s + p.total, 0);
        const delivered = view.patients.reduce((s, p) => s + p.delivered, 0);
        const waiting = view.patients.reduce((s, p) => s + p.waiting, 0);
        const onboard = view.patients.reduce((s, p) => s + p.onboard, 0);
        const assigned = view.patients.reduce((s, p) => s + p.assigned, 0);
        const deliveredShort = view.patients.reduce((s, p) => s + p.deliveredShort, 0);
        expect(delivered + deliveredShort + waiting + onboard + assigned).toBe(sumPatients);
      }
    }
  });

  it('groupCoLocatedAmbulances groups ambulances correctly', () => {
    const amb = [
      { id: '1', point: { lat: 0, lng: 0 } },
      { id: '2', point: { lat: 0, lng: 0 } },
      { id: '3', point: { lat: 10, lng: 10 } }
    ];
    
    // Zoom 16, lat 0 lng 0 are exactly same coords
    const groups = groupCoLocatedAmbulances(amb, 16, 14);
    expect(groups.length).toBe(2);
    expect(groups[0].group.length).toBe(2);
    expect(groups[0].group[0].id).toBe('1');
    expect(groups[0].group[1].id).toBe('2');
    expect(groups[1].group.length).toBe(1);
    expect(groups[1].group[0].id).toBe('3');
  });
});
