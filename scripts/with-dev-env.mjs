/**
 * Runs an astro command with ALLOW_PLACEHOLDER=1 set.
 *
 * A plain `ALLOW_PLACEHOLDER=1 astro dev` prefix in an npm script does not work
 * on Windows shells, and the project is developed on Windows. This wrapper is
 * the cross-platform equivalent and costs no dependency.
 *
 *   node scripts/with-dev-env.mjs dev
 *   node scripts/with-dev-env.mjs build
 */
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const child = spawn('npx', ['astro', ...args], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, ALLOW_PLACEHOLDER: '1' },
});
child.on('exit', (code) => process.exit(code ?? 0));
