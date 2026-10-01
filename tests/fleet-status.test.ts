import { describe, it, expect } from 'vitest';
import { getAmbulanceStatus } from '../src/lib/fleet-status';
import type { LiveAmbulance } from '../src/lib/live-view';
import type { DisplayNameMaps } from '../src/lib/event-display';

describe('fleet-status helper', () => {
  const maps: DisplayNameMaps = {
    ambulanceLabels: new Map([['a1', 'AMB-1']]),
    hospitalNames: new Map([['h1', 'HOSPITAL-1']]),
    roadNames: new Map([['e-1', 'Main St']]),
    nodeNames: new Map([['n1', 'junction of Main St']]),
    edgeLengths: new Map()
  };

  const createAmb = (overrides: Partial<LiveAmbulance>): LiveAmbulance => ({
    id: 'a1',
    label: 'AMB-1',
    status: 'idle',
    onboard: 0,
    capacity: 3,
    destinationName: 'none',
    destinationId: null,
    currentNode: 'n1',
    stuckReason: null,
    trips: 0,
    ...overrides
  });

  it('formats idle before start', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'idle' }), false, maps);
    expect(res.text).toBe(': ready at junction of Main St');
    expect(res.icon).toBe('⏸️');
  });

  it('formats idle after start', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'idle' }), true, maps);
    expect(res.text).toBe(': idle at junction of Main St');
  });

  it('formats to_incident', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'to_incident' }), true, maps);
    expect(res.text).toBe('→ Incident');
    expect(res.icon).toBe('🚨');
  });

  it('formats loading', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'loading' }), true, maps);
    expect(res.text).toBe(': loading patients at incident');
  });

  it('formats hospital_select', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'hospital_select' }), true, maps);
    expect(res.text).toBe(': selecting a destination hospital');
  });

  it('formats to_hospital with hospital match and correct plural', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'to_hospital', destinationId: 'h1', onboard: 2 }), true, maps);
    expect(res.text).toBe('→ HOSPITAL-1 (carrying 2 patients)');
    expect(res.icon).toBe('🏥');
  });

  it('formats to_hospital with 1 patient', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'to_hospital', destinationId: 'h1', onboard: 1 }), true, maps);
    expect(res.text).toBe('→ HOSPITAL-1 (carrying 1 patient)');
  });

  it('formats to_hospital when no hospital matches (junction)', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'to_hospital', destinationId: 'n1', onboard: 0 }), true, maps);
    expect(res.text).toBe('→ junction of Main St (carrying 0 patients)');
  });

  it('formats delivering', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'delivering' }), true, maps);
    expect(res.text).toBe(': unloading patients at hospital');
  });

  it('formats stuck with reason', () => {
    const res = getAmbulanceStatus(createAmb({ status: 'stuck', stuckReason: 'Road blocked' }), true, maps);
    expect(res.text).toBe(': stuck — Road blocked');
    expect(res.icon).toBe('⚠️');
  });
});
