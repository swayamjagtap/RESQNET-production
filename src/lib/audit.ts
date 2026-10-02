/**
 * src/lib/audit.ts
 * Cryptographic ledger functions for simulation decision logging.
 * Pure TypeScript, no React or DOM dependencies.
 */

// Format time as MM:SS
export function time(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

// Canonical JSON with sorted object keys
export function canonical(x: any): string {
  return JSON.stringify(x, (_, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .map((k) => [k, v[k]])
      );
    }
    return v;
  });
}

// SHA-256 hash using Web Crypto API
export async function hashEntry(data: any, previousHash: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('SHA-256 unavailable. Open in a secure browser context (HTTPS or localhost).');
  }
  const msg = canonical(data) + previousHash;
  const buffer = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(msg)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface LedgerEntry {
  data: any;
  previousHash: string;
  hash: string;
}

export interface VerifyOk {
  ok: true;
  count: number;
}

export interface VerifyFailed {
  ok: false;
  index: number;
  count: number;
  reason: string;
  recordedHash: string;
  recomputedHash: string;
  recordedPreviousHash?: string;
  expectedPreviousHash?: string;
}

export type VerifyResult = VerifyOk | VerifyFailed;

export function failureReport(r: VerifyFailed): string {
  let result = `Tampering detected at entry ${r.index}: ${r.reason}\nRecorded hash:\n${r.recordedHash}\nRecomputed hash:\n${r.recomputedHash}`;
  if (r.recordedPreviousHash !== undefined && r.recordedPreviousHash !== r.expectedPreviousHash) {
    result += `\nRecorded previous hash:\n${r.recordedPreviousHash}\nExpected previous hash:\n${r.expectedPreviousHash}`;
  }
  return result;
}

// Recompute hashes for the entire chain
export async function verifyChain(entries: LedgerEntry[], expectedHead?: string): Promise<VerifyResult> {
  let previous = '0'.repeat(64);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const recomputedHash = await hashEntry(e.data, previous);
    if (e.data.id !== i + 1) {
      return {
        ok: false,
        index: i + 1,
        count: entries.length,
        reason: 'Entry sequence changed',
        recordedHash: e.hash,
        recomputedHash,
        recordedPreviousHash: e.previousHash,
        expectedPreviousHash: previous,
      };
    }
    if (e.previousHash !== previous) {
      return {
        ok: false,
        index: i + 1,
        count: entries.length,
        reason: 'Previous-hash link changed',
        recordedHash: e.hash,
        recomputedHash,
        recordedPreviousHash: e.previousHash,
        expectedPreviousHash: previous,
      };
    }
    if (recomputedHash !== e.hash) {
      return {
        ok: false,
        index: i + 1,
        count: entries.length,
        reason: 'Entry hash mismatch',
        recordedHash: e.hash,
        recomputedHash,
        recordedPreviousHash: e.previousHash,
        expectedPreviousHash: previous,
      };
    }
    previous = e.hash;
  }
  if (expectedHead !== undefined && previous !== expectedHead) {
    return {
      ok: false,
      index: entries.length + 1,
      count: entries.length,
      reason: 'Chain tail changed',
      recordedHash: expectedHead,
      recomputedHash: previous,
    };
  }
  return { ok: true, count: entries.length };
}

export function createLedger(onAppend?: (entry: LedgerEntry) => void) {
  const entries: LedgerEntry[] = [];
  let queue = Promise.resolve();
  let issued = 0;
  let headHash = '0'.repeat(64);

  const clone = (x: any) => JSON.parse(JSON.stringify(x));

  return {
    append(data: any) {
      const copy = clone({ ...data, id: ++issued });
      queue = queue.then(async () => {
        const entryHash = await hashEntry(copy, headHash);
        const entry: LedgerEntry = {
          data: copy,
          previousHash: headHash,
          hash: entryHash,
        };
        entries.push(entry);
        headHash = entry.hash;
        if (onAppend) onAppend(clone(entry));
      });
      return queue;
    },
    async verify(): Promise<VerifyResult> {
      await queue;
      return verifyChain(clone(entries), headHash);
    },
    async export(): Promise<LedgerEntry[]> {
      await queue;
      return clone(entries);
    },
    async corrupt(index = 2): Promise<LedgerEntry> {
      await queue;
      if (!entries[index - 1]) {
        throw new Error(`Entry ${index} does not exist yet`);
      }
      entries[index - 1].data.text += ' [DEMO ALTERATION]';
      return clone(entries[index - 1]);
    },
    head(): string {
      return headHash;
    },
    flush(): Promise<void> {
      return queue;
    },
  };
}

export type Ledger = ReturnType<typeof createLedger>;
