import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/reader.js';

let tempDir: string | null = null;

function tempNight(night: string, lines: string[]): string {
  tempDir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  writeFileSync(join(tempDir, `${night}.jsonl`), lines.join('\n'));
  return tempDir;
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true });
    tempDir = null;
  }
});

describe('readNight', () => {
  it('reads the real night into 5 job rows, bad line skipped', () => {
    const rows = readNight('runs', '2026-10-28');
    expect(rows.map((r) => r.job)).toEqual([
      'rig/rotate-logs',
      'lane/sync',
      'fixtures/refresh',
      'notes/backup',
      'digest/render',
    ]);
  });

  it('aggregates runs, retries and last state per job', () => {
    const rows = readNight('runs', '2026-10-28');
    const lane = rows.find((r) => r.job === 'lane/sync');
    expect(lane).toEqual({
      job: 'lane/sync',
      owner: 'rook',
      runs: 8,
      retries: 1,
      lastStatus: 'ok',
      lastError: null,
      firstTime: '2026-10-28T23:00:06+01:00',
      lastTime: '2026-10-29T05:00:04+01:00',
    });
  });

  it('keeps the last error and the failing status', () => {
    const rows = readNight('runs', '2026-10-28');
    const notes = rows.find((r) => r.job === 'notes/backup');
    expect(notes).toMatchObject({ runs: 1, retries: 0, lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps a row with a null owner', () => {
    const rows = readNight('runs', '2026-10-28');
    const digest = rows.find((r) => r.job === 'digest/render');
    expect(digest).toMatchObject({ owner: null, runs: 1, lastStatus: 'ok' });
  });

  it('returns an empty list for an empty file', () => {
    const dir = tempNight('2030-01-01', []);
    expect(readNight(dir, '2030-01-01')).toEqual([]);
  });

  it('counts a bad line as skipped, the night still renders', () => {
    const dir = tempNight('2030-01-02', [
      '{"at":"2030-01-02T01:00:00+01:00","job":"a/b","status":"ok","owner":"rook"}',
      '{"at":"2030-01-02T01:0',
      'not json at all',
      '[]',
    ]);
    expect(readNight(dir, '2030-01-02')).toEqual([
      {
        job: 'a/b',
        owner: 'rook',
        runs: 1,
        retries: 0,
        lastStatus: 'ok',
        lastError: null,
        firstTime: '2030-01-02T01:00:00+01:00',
        lastTime: '2030-01-02T01:00:00+01:00',
      },
    ]);
  });
});
