/**
 * src/lib/ledger-feed.ts
 * Connects the engine's event stream to the cryptographic ledger.
 */
import { time, type Ledger } from './audit';
import type { SimEvent } from '../sim/types';

export function drainEventsToLedger(
  events: SimEvent[],
  ledger: Ledger,
  cursor: { current: number }
) {
  while (cursor.current < events.length) {
    const e = events[cursor.current++];
    
    // Convert to the ledger's expected entry format
    const entryData = {
      simTime: time(e.simSeconds || 0),
      kind: e.kind === 'dispatch' && (e as any).reassignment ? 'reassignment' : e.kind,
      text: e.text, // The engine's raw text
      details: JSON.parse(JSON.stringify(e)) // Clone to prevent mutation
    };

    ledger.append(entryData).catch(() => {});
  }
}
