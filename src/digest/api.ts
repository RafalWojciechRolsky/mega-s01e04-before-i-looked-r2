import { Hono } from 'hono';
import type { ReadNight } from './types.js';

// GET /api/digest/:night - the same rows the page shows, as JSON (plan.md § 2b, ADR 0001).
// The reader is injected so this module never depends on how nights are read.
export function digestApi(runsDir: string, readNight: ReadNight): Hono {
  const api = new Hono();

  api.get('/:night', (c) => {
    const night = c.req.param('night');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return c.json({ error: 'not found' }, 404);
    let rows;
    try {
      rows = readNight(runsDir, night);
    } catch {
      return c.json({ error: 'not found' }, 404);
    }
    return c.json(rows);
  });

  return api;
}
