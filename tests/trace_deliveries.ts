import { demoScenario, demoHospitals, demoAmbulances } from '../src/lib/demoScenario';
import { loadVileParleGraph } from '../src/sim/graph';
import { buildSimInput, createRun } from '../src/sim/adapter';
import { SimEngine } from '../src/sim/engine';

async function traceDeliveries(policy: 'resource_aware' | 'baseline_nearest_fcfs') {
  console.log(`\n=== POLICY: ${policy} ===`);
  const graph = await loadVileParleGraph();
  const input = buildSimInput(demoScenario, demoHospitals, demoAmbulances, graph, policy);
  const state = createRun(input);
  const engine = new SimEngine(state, graph);
  engine.start();

  while (state.status !== 'resolved') {
    engine.tick();
  }

  const deliveries = state.events.filter(e => e.kind === 'delivery');
  for (const ev of deliveries) {
    const details = (ev as any);
    const h = details.hospitalId;
    const group = state.victimGroups.find((g: any) => g.patientIds.includes(details.patientIds[0]));
    const type = group ? group.type : 'unknown';
    const before = details.before;
    const after = details.after;
    console.log(`${type}, ${details.count} patients, ${h}, stock before: ${JSON.stringify(before)} -> after: ${JSON.stringify(after)}, underResourced: ${details.underResourced}, time: ${ev.simSeconds}`);
  }
}

async function run() {
  await traceDeliveries('resource_aware');
  await traceDeliveries('baseline_nearest_fcfs');
}
run();
