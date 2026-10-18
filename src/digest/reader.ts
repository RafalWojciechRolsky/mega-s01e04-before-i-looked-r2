import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, DigestStatus, ReadNight } from './types.js';

type Event = {
  at: string;
  job: string;
  status: DigestStatus;
  owner: string | null;
  error: string | null;
};

// One JSON object per line; anything that doesn't shape into an event is a bad
// line: skipped, never thrown.
function parseEvent(line: string): Event | null {
  let raw: unknown;
  try {
    raw = JSON.parse(line);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const rec = raw as Record<string, unknown>;
  const { at, job, status, owner, error } = rec;
  if (typeof at !== 'string' || typeof job !== 'string') return null;
  if (status !== 'ok' && status !== 'retry' && status !== 'fail') return null;
  if (owner !== undefined && owner !== null && typeof owner !== 'string') return null;
  if (error !== undefined && error !== null && typeof error !== 'string') return null;
  return { at, job, status, owner: owner ?? null, error: error ?? null };
}

export const readNight: ReadNight = (runsDir, night) => {
  const lines = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8').split('\n');
  const byJob = new Map<string, DigestRow>();
  for (const line of lines) {
    const event = parseEvent(line.trim());
    if (!event) continue;
    const row = byJob.get(event.job);
    if (!row) {
      byJob.set(event.job, {
        job: event.job,
        owner: event.owner,
        runs: 1,
        retries: event.status === 'retry' ? 1 : 0,
        lastStatus: event.status,
        lastError: event.error,
        firstTime: event.at,
        lastTime: event.at,
      });
      continue;
    }
    row.runs += 1;
    if (event.status === 'retry') row.retries += 1;
    row.owner = event.owner;
    row.lastStatus = event.status;
    row.lastError = event.error;
    row.lastTime = event.at;
  }
  return [...byJob.values()];
};
