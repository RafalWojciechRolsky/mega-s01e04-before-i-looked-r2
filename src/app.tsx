import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';
import { DigestPage } from './views/digest.js';
import { byJob } from './digest/sort.js';
import type { DigestRow, ReadNight } from './digest/types.js';

// The reader is injected (issue #2 implements it); until it is merged, the digest route is
// not served.
export function createApp(config: RigConfig = loadConfig(), reader?: ReadNight) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  // GET /digest/:night. A reader that cannot open the night's file throws, and the night
  // renders as 404.
  app.get('/digest/:night', (c) => {
    if (!reader) return c.notFound();
    const night = c.req.param('night');
    let rows: DigestRow[];
    try {
      rows = reader(config.runsDir, night);
    } catch {
      return c.notFound();
    }
    return c.html(
      <Layout title={`digest ${night}`} lane={lane()}>
        <DigestPage night={night} rows={[...rows].sort(byJob)} />
      </Layout>,
    );
  });

  return app;
}
