import type { DigestRow } from '../digest/types.js';

// One job, one row. Retries of 3 or more and any fail are marked (plan.md § 2a).
function Row({ row }: { row: DigestRow }) {
  const marked = row.lastStatus === 'fail' || row.retries >= 3;
  return (
    <tr class={marked ? 'warn' : undefined}>
      <td>{row.job}</td>
      <td>{row.owner ?? '—'}</td>
      <td>{row.runs}</td>
      <td>{row.retries}</td>
      <td>{row.lastStatus}</td>
      <td>{row.lastError ?? '—'}</td>
      <td>{row.firstTime}</td>
      <td>{row.lastTime}</td>
    </tr>
  );
}

export function DigestPage({ night, rows }: { night: string; rows: DigestRow[] }) {
  return (
    <>
      <h1>digest · {night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first time</th>
              <th>last time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row row={row} />
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
