import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { readNight } from '../src/digest/reader.js';
import type { RigConfig } from '../src/config.js';

let tempDir: string | null = null;

// Temp runs dir with fixtures - runs/ is read-only, tests never touch it.
function tempRuns(night: string, lines: string[]): RigConfig {
  tempDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  writeFileSync(join(tempDir, `${night}.jsonl`), lines.join('\n'));
  return { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: tempDir };
}

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true });
    tempDir = null;
  }
});

const GOOD = '2030-01-01';
const goodLines = [
  '{"at":"2030-01-01T01:00:00+01:00","job":"zeta/build","status":"ok","owner":"rook"}',
  '{"at":"2030-01-01T02:00:00+01:00","job":"alpha/test","status":"retry","owner":null,"error":"flaky"}',
  '{"at":"2030-01-01T03:00:00+01:00","job":"alpha/test","status":"ok","owner":"rook"}',
];

describe('digest routes (page and JSON, real reader over a temp runs dir)', () => {
  it('page answers 200 and renders a night with data, sorted by job', async () => {
    const config = tempRuns(GOOD, goodLines);
    const res = await createApp(config, readNight).request(`/digest/${GOOD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain(`digest · ${GOOD}`);
    // sorted by job: alpha/test before zeta/build
    expect(html.indexOf('alpha/test')).toBeLessThan(html.indexOf('zeta/build'));
    expect(html).not.toContain('nothing ran');
  });

  it('JSON answers 200 with the same jobs in the same order as the page', async () => {
    const config = tempRuns(GOOD, goodLines);
    const res = await createApp(config, readNight).request(`/api/digest/${GOOD}`);
    const rows = await res.json();
    expect(res.status).toBe(200);
    expect(rows.map((r: { job: string }) => r.job)).toEqual(['alpha/test', 'zeta/build']);
    const page = await (await createApp(config, readNight).request(`/digest/${GOOD}`)).text();
    const index = page.indexOf(rows.map((r: { job: string }) => r.job)[0]);
    expect(page.indexOf('zeta/build')).toBeGreaterThan(index);
  });

  it('page answers 404 when the night file is missing', async () => {
    const config = tempRuns(GOOD, goodLines);
    const res = await createApp(config, readNight).request('/digest/2030-02-02');
    expect(res.status).toBe(404);
  });

  it('JSON answers 404 when the night file is missing', async () => {
    const config = tempRuns(GOOD, goodLines);
    const res = await createApp(config, readNight).request('/api/digest/2030-02-02');
    expect(res.status).toBe(404);
  });

  it('page renders an empty night as "nothing ran"', async () => {
    const config = tempRuns(GOOD, []);
    const res = await createApp(config, readNight).request(`/digest/${GOOD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
  });

  it('JSON answers 200 with an empty list for an empty night', async () => {
    const config = tempRuns(GOOD, []);
    const res = await createApp(config, readNight).request(`/api/digest/${GOOD}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('page tolerates a bad line: renders, counts the row, never throws', async () => {
    const config = tempRuns(GOOD, ['{"at":"2030-01-01T01:0', 'not json', ...goodLines]);
    const res = await createApp(config, readNight).request(`/digest/${GOOD}`);
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('alpha/test');
    expect(html).toContain('zeta/build');
  });

  it('JSON tolerates a bad line: rows are returned, the bad line is counted out', async () => {
    const config = tempRuns(GOOD, ['{"at":"2030-01-01T01:0', 'not json', ...goodLines]);
    const res = await createApp(config, readNight).request(`/api/digest/${GOOD}`);
    expect(res.status).toBe(200);
    const rows = await res.json();
    expect(rows.map((r: { job: string }) => r.job)).toEqual(['alpha/test', 'zeta/build']);
  });
});
