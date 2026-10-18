// One row per job, as read from runs/<night>.jsonl (plan.md § 1).
export type DigestStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: DigestStatus;
  lastError: string | null;
  firstTime: string;
  lastTime: string;
};

// Reads a night's log into one row per job. Implemented in issue #2.
export type ReadNight = (runsDir: string, night: string) => DigestRow[];
