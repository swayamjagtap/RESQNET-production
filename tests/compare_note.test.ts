import { describe, it, expect } from 'vitest';
import { buildComparisonNote } from '../src/lib/compare-note';

describe('buildComparisonNote', () => {
  it('(a) screenshot values (RA 5:58 / 0 short / 13:14 vs Baseline 8:30 / 8 short / 11:30)', () => {
    const note = buildComparisonNote({
      ok: true,
      resource_aware: {
        meanHighPriorityDeliverySeconds: 358, // 5:58
        underResourcedCount: 0,
        simulatedSeconds: 794, // 13:14
        completedTrips: 6,
        deliveredCount: 13,
      },
      baseline: {
        meanHighPriorityDeliverySeconds: 510, // 8:30
        underResourcedCount: 8,
        simulatedSeconds: 690, // 11:30
        completedTrips: 6,
        deliveredCount: 13,
      },
    });

    expect(note.headline).toBe('The policies trade off performance across different metrics.');
    const fullText = note.lines.join(' ');
    expect(fullText).toMatch(/Resource-aware was faster for high-priority patients \(5:58 vs 8:30\)/);
    expect(fullText).toMatch(/Resource-aware delivered 0 patients short of required stock, against 8 for the baseline/);
    expect(fullText).toMatch(/Baseline finished the whole scenario sooner \(11:30 vs 13:14\)/);
    expect(fullText).toMatch(/The policies trade off:/);
    expect(note.disclosure).toMatch(/Not a general or clinical claim/);
  });

  it('(b) stress scenario values (RA 14:13 / 0 short / 23:34 vs Baseline 13:41 / 9 short / 19:26)', () => {
    const note = buildComparisonNote({
      ok: true,
      resource_aware: {
        meanHighPriorityDeliverySeconds: 853, // 14:13
        underResourcedCount: 0,
        simulatedSeconds: 1414, // 23:34
        completedTrips: 6,
        deliveredCount: 13,
      },
      baseline: {
        meanHighPriorityDeliverySeconds: 821, // 13:41
        underResourcedCount: 9,
        simulatedSeconds: 1166, // 19:26
        completedTrips: 6,
        deliveredCount: 13,
      },
    });

    expect(note.headline).toBe('The policies trade off performance across different metrics.');
    const fullText = note.lines.join(' ');
    expect(fullText).toMatch(/Baseline was faster for high-priority patients \(13:41 vs 14:13\)/);
    expect(fullText).toMatch(/Resource-aware delivered 0 patients short of required stock, against 9 for the baseline/);
    expect(fullText).toMatch(/Baseline finished the whole scenario sooner \(19:26 vs 23:34\)/);
    expect(fullText).toMatch(/The policies trade off:/);
  });

  it('(c) both equal -> no winner claimed', () => {
    const note = buildComparisonNote({
      ok: true,
      resource_aware: {
        meanHighPriorityDeliverySeconds: 600,
        underResourcedCount: 2,
        simulatedSeconds: 900,
        completedTrips: 5,
        deliveredCount: 10,
      },
      baseline: {
        meanHighPriorityDeliverySeconds: 600,
        underResourcedCount: 2,
        simulatedSeconds: 900,
        completedTrips: 5,
        deliveredCount: 10,
      },
    });

    expect(note.headline).toBe('Both policies performed identically across all evaluated metrics.');
    const fullText = note.lines.join(' ');
    expect(fullText).not.toMatch(/trade off/i);
    expect(fullText).not.toMatch(/Resource-aware was faster/i);
    expect(fullText).not.toMatch(/Baseline was faster/i);
  });

  it('(d) RA wins everything -> no trade-off sentence', () => {
    const note = buildComparisonNote({
      ok: true,
      resource_aware: {
        meanHighPriorityDeliverySeconds: 300,
        underResourcedCount: 0,
        simulatedSeconds: 600,
        completedTrips: 5,
        deliveredCount: 12,
      },
      baseline: {
        meanHighPriorityDeliverySeconds: 500,
        underResourcedCount: 4,
        simulatedSeconds: 800,
        completedTrips: 5,
        deliveredCount: 10,
      },
    });

    expect(note.headline).toBe('Resource-aware matched or outperformed the baseline across all evaluated metrics.');
    const fullText = note.lines.join(' ');
    expect(fullText).not.toMatch(/The policies trade off:/);
    expect(fullText).toMatch(/Resource-aware was faster/);
    expect(fullText).toMatch(/Resource-aware delivered 0 patients short/);
  });

  it('(e) ok: false -> neutral message', () => {
    const note = buildComparisonNote({
      ok: false,
      reason: 'Comparison timed out',
    });

    expect(note.headline).toBe('Comparison results unavailable.');
    expect(note.lines[0]).toBe('Comparison timed out');
  });

  it('(f) assert output never contains a winner name for a tie', () => {
    const note = buildComparisonNote({
      ok: true,
      resource_aware: {
        meanHighPriorityDeliverySeconds: 400,
        underResourcedCount: 0,
        simulatedSeconds: 800,
      },
      baseline: {
        meanHighPriorityDeliverySeconds: 400,
        underResourcedCount: 0,
        simulatedSeconds: 800,
      },
    });

    const fullText = (note.headline + ' ' + note.lines.join(' ')).toLowerCase();
    expect(fullText).not.toMatch(/resource-aware won/);
    expect(fullText).not.toMatch(/baseline won/);
    expect(fullText).not.toMatch(/gains/);
  });
});
