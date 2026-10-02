/**
 * src/lib/compare-note.ts
 * Computes an objective, honest note summarizing policy comparison metrics.
 * Does not make clinical claims or hardcode winners.
 */

export interface PolicyMetrics {
  meanHighPriorityDeliverySeconds?: number | null;
  underResourcedCount?: number | null;
  simulatedSeconds?: number | null;
  completedTrips?: number | null;
  deliveredCount?: number | null;
  delivered?: number | null;
}

export interface ComparisonResultInput {
  ok?: boolean;
  reason?: string;
  resource_aware?: PolicyMetrics | null;
  baseline?: PolicyMetrics | null;
}

export interface ComparisonNote {
  headline: string;
  lines: string[];
  disclosure: string;
}

export function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return 'N/A';
  const totalSeconds = Math.round(seconds);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function buildComparisonNote(result?: ComparisonResultInput | null): ComparisonNote {
  const disclosure = 'One synthetic scenario on the Vile Parle graph. Not a general or clinical claim.';

  if (!result || result.ok === false || !result.resource_aware || !result.baseline) {
    return {
      headline: 'Comparison results unavailable.',
      lines: [result?.reason || 'Comparison could not be completed for this scenario.'],
      disclosure,
    };
  }

  const ra = result.resource_aware;
  const base = result.baseline;

  const detailLines: string[] = [];
  const raGains: string[] = [];
  const baseGains: string[] = [];

  // 1. Mean High-Priority Delivery Time (Lower is better)
  const rMean = ra.meanHighPriorityDeliverySeconds;
  const bMean = base.meanHighPriorityDeliverySeconds;
  if (rMean != null && bMean != null) {
    if (rMean < bMean) {
      detailLines.push(`Resource-aware was faster for high-priority patients (${formatTime(rMean)} vs ${formatTime(bMean)}).`);
      raGains.push('faster high-priority delivery');
    } else if (bMean < rMean) {
      detailLines.push(`Baseline was faster for high-priority patients (${formatTime(bMean)} vs ${formatTime(rMean)}).`);
      baseGains.push('faster high-priority delivery');
    }
  }

  // 2. Under-resourced / Short of Stock Deliveries (Lower is better)
  const rShort = ra.underResourcedCount;
  const bShort = base.underResourcedCount;
  if (rShort != null && bShort != null) {
    if (rShort < bShort) {
      detailLines.push(`Resource-aware delivered ${rShort} patients short of required stock, against ${bShort} for the baseline.`);
      raGains.push('fewer patients delivered short of required stock');
    } else if (bShort < rShort) {
      detailLines.push(`Baseline delivered ${bShort} patients short of required stock, against ${rShort} for resource-aware.`);
      baseGains.push('fewer patients delivered short of required stock');
    }
  }

  // 3. Total Simulated Elapsed Time (Lower is better)
  const rElapsed = ra.simulatedSeconds;
  const bElapsed = base.simulatedSeconds;
  if (rElapsed != null && bElapsed != null) {
    if (rElapsed < bElapsed) {
      detailLines.push(`Resource-aware finished the whole scenario sooner (${formatTime(rElapsed)} vs ${formatTime(bElapsed)}).`);
      raGains.push('faster overall scenario completion');
    } else if (bElapsed < rElapsed) {
      detailLines.push(`Baseline finished the whole scenario sooner (${formatTime(bElapsed)} vs ${formatTime(rElapsed)}).`);
      baseGains.push('faster overall scenario completion');
    }
  }

  // 4. Total Patients Delivered (Higher is better)
  const rDelivered = ra.deliveredCount ?? ra.delivered;
  const bDelivered = base.deliveredCount ?? base.delivered;
  if (rDelivered != null && bDelivered != null) {
    if (rDelivered > bDelivered) {
      detailLines.push(`Resource-aware delivered more patients (${rDelivered} vs ${bDelivered}).`);
      raGains.push('more total patients delivered');
    } else if (bDelivered > rDelivered) {
      detailLines.push(`Baseline delivered more patients (${bDelivered} vs ${rDelivered}).`);
      baseGains.push('more total patients delivered');
    }
  }

  // Formulate headline and trade-off summary
  let headline = '';
  const lines = [...detailLines];

  if (raGains.length === 0 && baseGains.length === 0) {
    headline = 'Both policies performed identically across all evaluated metrics.';
    lines.push('Both policies produced identical outcomes for delivery time, stock matching, and scenario duration.');
  } else if (raGains.length > 0 && baseGains.length > 0) {
    headline = 'The policies trade off performance across different metrics.';
    lines.push(`The policies trade off: Resource-aware gains ${raGains.join(' and ')}, while baseline gains ${baseGains.join(' and ')}.`);
  } else if (raGains.length > 0 && baseGains.length === 0) {
    headline = 'Resource-aware matched or outperformed the baseline across all evaluated metrics.';
  } else {
    headline = 'Baseline matched or outperformed resource-aware across all evaluated metrics.';
  }

  return {
    headline,
    lines,
    disclosure,
  };
}
