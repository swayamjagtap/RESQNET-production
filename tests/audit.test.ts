import { describe, it, expect } from 'vitest';
import { createLedger, time, canonical, hashEntry, failureReport, verifyChain } from '../src/lib/audit';
import { drainEventsToLedger } from '../src/lib/ledger-feed';
import { loadVileParleGraph } from '../src/sim/graph';
import { SimEngine } from '../src/sim/engine';
import { createRun, buildSimInput } from '../src/sim/adapter';

describe('audit ledger', () => {
  it('formats time correctly', () => {
    expect(time(0)).toBe('00:00');
    expect(time(65)).toBe('01:05');
    expect(time(3600)).toBe('60:00');
  });

  it('canonicalizes objects consistently', () => {
    const a = { z: 1, a: 2, c: { b: 3, a: 4 } };
    const b = { a: 2, c: { a: 4, b: 3 }, z: 1 };
    expect(canonical(a)).toBe(canonical(b));
    expect(canonical(a)).toBe('{"a":2,"c":{"a":4,"b":3},"z":1}');
  });

  it('identical inputs give identical hashes', async () => {
    const h1 = await hashEntry({ a: 1 }, '0'.repeat(64));
    const h2 = await hashEntry({ a: 1 }, '0'.repeat(64));
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64); // SHA-256 hex length
  });

  it('verifies a valid chain of 10 entries', async () => {
    const ledger = createLedger();
    for (let i = 0; i < 10; i++) {
      ledger.append({ msg: `entry ${i}` });
    }
    const result = await ledger.verify();
    expect(result.ok).toBe(true);
    expect(result.count).toBe(10);
  });

  it('reports tampering if text is corrupted', async () => {
    const ledger = createLedger();
    for (let i = 0; i < 5; i++) {
      ledger.append({ text: `entry ${i}` });
    }
    
    // Deliberately corrupt entry 3
    const corrupted = await ledger.corrupt(3);
    expect(corrupted.data.text).toContain('DEMO ALTERATION');

    const result = await ledger.verify();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.index).toBe(3);
      expect(result.reason).toBe('Entry hash mismatch');
      
      const report = failureReport(result);
      expect(report).toContain('Tampering detected at entry 3');
      expect(report).toContain('Entry hash mismatch');
    }
  });

  it('reports tampering if previous-hash link is changed', async () => {
    const ledger = createLedger();
    ledger.append({ text: '1' });
    ledger.append({ text: '2' });
    const entries = await ledger.export();
    entries[1].previousHash = '0'.repeat(64); // Modify the link
    const head = ledger.head();
    const result = await verifyChain(entries, head);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Previous-hash link changed');
      expect(result.index).toBe(2);
    }
  });

  it('reports tampering if entries are reordered', async () => {
    const ledger = createLedger();
    ledger.append({ text: '1' });
    ledger.append({ text: '2' });
    const entries = await ledger.export();
    
    // Swap entries
    const temp = entries[0];
    entries[0] = entries[1];
    entries[1] = temp;
    
    const head = ledger.head();
    const result = await verifyChain(entries, head);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Entry sequence changed');
      expect(result.index).toBe(1); // Fails at the first swapped entry since id sequence is broken
    }
  });

  it('reports tampering if last entry is deleted when head is supplied', async () => {
    const ledger = createLedger();
    ledger.append({ text: '1' });
    ledger.append({ text: '2' });
    const entries = await ledger.export();
    const head = ledger.head();
    
    entries.pop(); // Delete last entry
    
    const result = await verifyChain(entries, head);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('Chain tail changed');
      expect(result.index).toBe(2);
    }
  });

  it('handles 20 concurrent append() calls keeping sequential ids and valid chain', async () => {
    const ledger = createLedger();
    const appends = Array.from({ length: 20 }, (_, i) => ledger.append({ concurrent: i }));
    await Promise.all(appends);
    const result = await ledger.verify();
    expect(result.ok).toBe(true);
    expect(result.count).toBe(20);
    const exported = await ledger.export();
    expect(exported[19].data.id).toBe(20);
  });
});

describe('real-graph engine run with ledger', () => {
  it('gives entries equal to the number of engine events and verifies OK', async () => {
    const graph = await loadVileParleGraph();
    const simInput = buildSimInput({
      id: 'test', title: 'Test', owner_id: 'u1', disaster_type: 'other', updated_at: '',
      incident_lat: 19.10, incident_lng: 72.84,
      blood_loss: 2, fracture: 0, limb_loss: 0, unconscious: 0, created_at: ''
    }, [
      { id: 'H1', name: 'Hosp', scenario_id: 'test', lat: 19.102, lng: 72.842, icu_beds: 10, blood_units: 10, ventilators: 10, general_beds: 10, created_at: '' }
    ], [
      { id: 'A1', label: 'Amb', scenario_id: 'test', capacity: 2, base_lat: 19.101, base_lng: 72.841, available: true, created_at: '' }
    ], graph);

    const run = createRun(simInput);
    const engine = new SimEngine(run, graph);
    const ledger = createLedger();
    const cursor = { current: 0 };

    engine.start();
    while (run.status === 'running') {
      engine.tick();
      drainEventsToLedger(run.events, ledger, cursor);
    }

    await ledger.flush();
    const result = await ledger.verify();
    expect(result.ok).toBe(true);
    expect(result.count).toBe(run.events.length);
  });

  it('reports failure on a tampered real-graph run', async () => {
    const graph = await loadVileParleGraph();
    const simInput = buildSimInput({
      id: 'test', title: 'Test', owner_id: 'u1', disaster_type: 'other', updated_at: '',
      incident_lat: 19.10, incident_lng: 72.84,
      blood_loss: 2, fracture: 0, limb_loss: 0, unconscious: 0, created_at: ''
    }, [
      { id: 'H1', name: 'Hosp', scenario_id: 'test', lat: 19.102, lng: 72.842, icu_beds: 10, blood_units: 10, ventilators: 10, general_beds: 10, created_at: '' }
    ], [
      { id: 'A1', label: 'Amb', scenario_id: 'test', capacity: 2, base_lat: 19.101, base_lng: 72.841, available: true, created_at: '' }
    ], graph);

    const run = createRun(simInput);
    const engine = new SimEngine(run, graph);
    const ledger = createLedger();
    const cursor = { current: 0 };

    engine.start();
    while (run.status === 'running') {
      engine.tick();
      drainEventsToLedger(run.events, ledger, cursor);
    }

    await ledger.flush();
    const corrupted = await ledger.corrupt(2);
    expect(corrupted.data.text).toContain('DEMO ALTERATION');
    const result = await ledger.verify();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.index).toBe(2);
      expect(result.reason).toBe('Entry hash mismatch');
    }
  });
});
