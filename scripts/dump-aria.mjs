import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const route = process.argv[2] ?? '/monitoring/proses_instalasi';
const output = process.argv[3] ?? 'aria_proses_instalasi.txt';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const playwrightCli = path.resolve(
  scriptDirectory,
  '../node_modules/@playwright/test/cli.js'
);

const result = spawnSync(
  process.execPath,
  [
    playwrightCli,
    'test',
    'tests/dump.spec.ts',
    '--config=playwright.dump.config.ts',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DUMP_ROUTE: route,
      DUMP_OUTPUT: output,
    },
  }
);

if (result.error) {
  console.error(result.error.message);
}
process.exit(result.status ?? 1);
