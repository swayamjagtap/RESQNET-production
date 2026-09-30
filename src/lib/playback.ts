export function accumulatePlayback(
  accumulatedMs: number,
  deltaMs: number,
  playbackSpeed: number, // e.g. 1, 0.1, 4
  simBaseRate: number, // 20 sim seconds per real second
  onTick: () => void
): number {
  let acc = accumulatedMs + deltaMs;
  // milliseconds per simulated tick
  const msPerTick = 1000 / (simBaseRate * playbackSpeed);
  
  // Cap max accumulated to avoid death spirals if tab is backgrounded
  if (acc > msPerTick * 200) {
    acc = msPerTick * 200;
  }

  while (acc >= msPerTick) {
    onTick();
    acc -= msPerTick;
  }
  return acc;
}
