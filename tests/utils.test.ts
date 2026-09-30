import { describe, it, expect } from 'vitest';
import { accumulatePlayback } from '../src/lib/playback';
import { computeCollocationOffset } from '../src/lib/map-utils';

describe('Playback accumulator', () => {
  it('triggers onTick correctly based on speed and base rate', () => {
    let ticks = 0;
    const onTick = () => ticks++;
    
    // Base rate 20 sim seconds / real second. 
    // Playback speed 1x.
    // msPerTick = 1000 / 20 = 50ms.
    let acc = accumulatePlayback(0, 100, 1, 20, onTick);
    expect(ticks).toBe(2);
    expect(acc).toBe(0);

    // Speed 4x, so 80 ticks per real second (12.5ms per tick)
    ticks = 0;
    acc = accumulatePlayback(10, 20, 4, 20, onTick); // total 30ms. 30 / 12.5 = 2.4 ticks
    expect(ticks).toBe(2); // 25ms consumed
    expect(acc).toBe(5); // 5ms leftover
  });
});

describe('Map Utils', () => {
  it('caps the collocation offset at 6px', () => {
    // index 0 -> 0
    expect(computeCollocationOffset(0, 1, 0)).toEqual({ dx: 0, dy: 0 });
    
    // index 1 -> magnitude 3, sign 1, perpendicular to (1, 0) is (0, 1) -> dx:0, dy:3
    expect(computeCollocationOffset(1, 1, 0)).toEqual({ dx: 0, dy: 3 });
    
    // index 2 -> magnitude 3, sign -1 -> dx:0, dy:-3
    expect(computeCollocationOffset(2, 1, 0)).toEqual({ dx: 0, dy: -3 });
    
    // index 3 -> magnitude 6, sign 1 -> dx:0, dy:6
    expect(computeCollocationOffset(3, 1, 0)).toEqual({ dx: 0, dy: 6 });
    
    // index 4 -> magnitude 6, sign -1 -> dx:0, dy:-6
    expect(computeCollocationOffset(4, 1, 0)).toEqual({ dx: 0, dy: -6 });
    
    // index 5 -> magnitude 6 (cap), sign 1 -> dx:0, dy:6
    expect(computeCollocationOffset(5, 1, 0)).toEqual({ dx: 0, dy: 6 });
  });
});
