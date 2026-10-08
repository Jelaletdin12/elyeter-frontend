import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

// lint-staged passes every staged file as CLI arguments. On Windows the
// combined command line is capped at 8191 chars (cmd.exe), which a large
// commit easily exceeds — so we re-invoke prettier in bounded chunks here.
const files = process.argv.slice(2);
const prettierBin = join('node_modules', 'prettier', 'bin', 'prettier.cjs');
const CHUNK_SIZE = 40;

let exitCode = 0;
for (let i = 0; i < files.length; i += CHUNK_SIZE) {
  const chunk = files.slice(i, i + CHUNK_SIZE);
  const result = spawnSync(process.execPath, [prettierBin, '--write', ...chunk], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  if (result.status !== 0 && exitCode === 0) {
    exitCode = result.status ?? 1;
  }
}
process.exit(exitCode);
