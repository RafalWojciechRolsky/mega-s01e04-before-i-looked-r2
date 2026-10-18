import type { DigestRow } from './types.js';

export type NightCounts = { ok: number; retry: number; fail: number };

// Jobs per night by their last status.
export function countNight(rows: DigestRow[]): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const row of rows) counts[row.lastStatus] += 1;
  return counts;
}
