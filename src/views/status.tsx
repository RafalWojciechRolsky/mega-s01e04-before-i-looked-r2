import type { NightCounts } from '../digest/counts.js';
import type { Status } from '../status.js';

// Night name -> counts, or null when the night's file could not be read.
export type NightCount = { night: string; counts: NightCounts | null };

export function StatusBoard({ status, nights }: { status: Status; nights: NightCount[] }) {
  return (
    <>
      <h1>status</h1>
      <table>
        <tbody>
          <tr><th>adapter</th><td>{status.adapter}</td></tr>
          <tr><th>installed</th><td>{status.installed}</td></tr>
          <tr>
            <th>last beat</th>
            <td>{status.lastBeat ? `${status.lastBeat.at} · pid ${status.lastBeat.pid}` : <span class="warn">none</span>}</td>
          </tr>
        </tbody>
      </table>
      <h2>nights on disk</h2>
      {nights.length === 0 ? (
        <p class="mute">nothing in runs/</p>
      ) : (
        <ul>
          {nights.map(({ night, counts }) => (
            <li>
              <a href={`/digest/${night}`}>{night}</a>
              {' '}
              {counts ? (
                <span class="mute">ok {counts.ok} · retry {counts.retry} · fail {counts.fail}</span>
              ) : (
                <span class="mute">—</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
