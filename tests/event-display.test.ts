import { describe, it, expect } from 'vitest';
import { describeEvent, DisplayNameMaps } from '../src/lib/event-display';
import type { SimEvent } from '../src/sim/types';

describe('describeEvent formatting', () => {
  const maps: DisplayNameMaps = {
    ambulanceLabels: new Map([['a1', 'AMB-1']]),
    hospitalNames: new Map([['h1', 'HOSPITAL-1'], ['h2', 'HOSPITAL-2']]),
    roadNames: new Map([['e-1', 'Main St']]),
    nodeNames: new Map([['n1000001', 'Junction 1'], ['n1000002', 'Junction 2'], ['n1000003', 'Junction 3']]),
  };

  const createEvent = (kind: SimEvent['kind'], overrides: Record<string, any> = {}): SimEvent => ({
    id: 1,
    tick: 1,
    simSeconds: 1,
    kind,
    text: 'Raw text',
    ...overrides
  });

  it('formats dispatch events correctly', () => {
    const e = createEvent('dispatch', {
      ambulanceId: 'a1',
      reassignment: false,
      patientIds: ['p1', 'p2'],
      route: ['n1000001', 'n1000002', 'n1000003'],
      reason: 'Standard dispatch'
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('AMB-1 dispatched: 2 patients (p1, p2). Raw text. Route: Junction 1 → Junction 2 → Junction 3. Standard dispatch.');
  });

  it('formats hospital_select events with candidates', () => {
    const e = createEvent('hospital_select', {
      reason: 'Best match',
      needs: ['icu', 'blood'],
      count: 2,
      candidates: [
        { hospitalId: 'h1', reachable: true, sufficient: true, available: { icu: 3, blood: 5 }, cost: 120.5 },
        { hospitalId: 'h2', reachable: true, sufficient: false, available: { icu: 1, blood: 1 }, cost: 50.0 },
        { hospitalId: 'h3', reachable: false, sufficient: true, available: { icu: 10, blood: 10 }, cost: null }
      ]
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('Raw text. Best match. HOSPITAL-1: eligible (icu 3/2, blood 5/2; weighted route length 120.5 m); HOSPITAL-2: insufficient (icu 1/2, blood 1/2; weighted route length 50.0 m); h3: unreachable (icu 10/2, blood 10/2).');
  });

  it('formats delivery events showing stock changes', () => {
    const e = createEvent('delivery', {
      ambulanceId: 'a1',
      hospitalId: 'h1',
      count: 2,
      patientIds: ['p1', 'p2'],
      before: { icu: 5, blood: 10 },
      after: { icu: 3, blood: 8 }
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('AMB-1 delivered 2 patients to HOSPITAL-1 (p1, p2); stock icu 5 → 3, blood 10 → 8.');
  });

  it('formats reroute events with old and new paths', () => {
    const e = createEvent('reroute', {
      oldPath: ['n1000001', 'n1000002'],
      newPath: ['n1000001', 'n1000003'],
      reason: 'Road blocked'
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('Raw text. Old: Junction 1 → Junction 2. New: Junction 1 → Junction 3. Road blocked');
  });

  it('formats stuck events', () => {
    const e = createEvent('stuck', {
      reason: 'Path unreachable'
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('Raw text. Path unreachable');
  });

  it('replaces raw IDs in text for fallback formatting', () => {
    const e = createEvent('road_change', {
      text: 'Road n1000001→n1000002: clear'
    });
    const result = describeEvent(e, maps);
    expect(result).toBe('Road Junction 1→Junction 2: clear');
  });
});
