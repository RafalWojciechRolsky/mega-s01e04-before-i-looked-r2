import type { DigestRow } from './types.js';

// Rows sorted by job, the way both the page and the JSON (issue #4) must show them.
export function byJob(a: DigestRow, b: DigestRow): number {
  return a.job < b.job ? -1 : a.job > b.job ? 1 : 0;
}
