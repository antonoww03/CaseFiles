import { spawnSync } from 'node:child_process';

if (process.env.CASEFILES_RUN_LIVE_TEST !== 'yes') {
  process.stdout.write('Live AI diagnostic not requested; skipped.\n');
} else {
  const run = spawnSync(process.execPath, ['../../scripts/live-interview-check.mjs'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    timeout: 65000
  });
  if (run.error) process.stderr.write('Live AI diagnostic error: ' + run.error.message + '\n');
  process.exitCode = run.status ?? 1;
}
