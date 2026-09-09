/**
 * Content gate.
 *
 * Two jobs:
 *   1. Placeholder content can never reach the deployed site. Any file carrying
 *      `placeholder: true` fails the build unless ALLOW_PLACEHOLDER=1.
 *   2. Open TODO fields are reported with file and line. They are warnings by
 *      default so the build is not blocked today; STRICT_TODO=1 makes them fail.
 *
 * Dev-only routes under src/pages/test/ are gated the same way as placeholder
 * content, so an isolated component test page cannot ship either.
 *
 * Registered as an Astro integration (see astro.config.mjs) rather than an npm
 * `prebuild` hook, because a prebuild hook is bypassed whenever something runs
 * `astro build` directly instead of `npm run build`. As an integration it runs
 * on every build however that build was started.
 *
 * Frontmatter is read with a small scanner rather than a YAML library. The keys
 * this gate needs are top-level scalars, and js-yaml is only present as a
 * transitive dependency of Astro — reaching into another package's dependency
 * tree is the kind of thing that breaks silently on a minor upgrade. Full type
 * validation is the Zod schema's job, in src/content.config.ts.
 *
 *   node scripts/check-content.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const DEV_ROUTES_DIR = path.join(ROOT, 'src', 'pages', 'test');

const CONTENT_EXT = new Set(['.md', '.mdx', '.json', '.yaml', '.yml']);

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (CONTENT_EXT.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

/** Extract the leading `---` frontmatter block, if there is one. */
function frontmatter(source) {
  if (!source.startsWith('---')) return null;
  const end = source.indexOf('\n---', 3);
  if (end === -1) return null;
  return source.slice(source.indexOf('\n') + 1, end);
}

/** Read one top-level scalar key out of a frontmatter block. */
function scalar(fm, key) {
  const m = fm.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, 'm'));
  if (!m) return undefined;
  return m[1].trim().replace(/^['"]|['"]$/g, '');
}

export async function checkContent({ log = console } = {}) {
  const allowPlaceholder = process.env.ALLOW_PLACEHOLDER === '1';
  const strictTodo = process.env.STRICT_TODO === '1';

  const files = await walk(CONTENT_DIR);
  const placeholders = [];
  const todos = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');

    const fm = frontmatter(source);
    if (fm && scalar(fm, 'placeholder') === 'true') placeholders.push(rel);

    source.split('\n').forEach((line, i) => {
      if (/\bTODO\b/.test(line)) {
        todos.push(`${rel}:${i + 1}  ${line.trim().slice(0, 96)}`);
      }
    });
  }

  let devRoutes = false;
  try {
    devRoutes = (await stat(DEV_ROUTES_DIR)).isDirectory();
  } catch {
    devRoutes = false;
  }

  const errors = [];

  if (placeholders.length && !allowPlaceholder) {
    errors.push(
      `${placeholders.length} file(s) still marked placeholder: true\n` +
        placeholders.map((f) => `    ${f}`).join('\n') +
        `\n  Set ALLOW_PLACEHOLDER=1 to build anyway (npm run build:local does this).`
    );
  }

  if (devRoutes && !allowPlaceholder) {
    errors.push(
      `src/pages/test/ exists — dev-only component test routes must not ship.\n` +
        `    Delete it, or set ALLOW_PLACEHOLDER=1 for a local build.`
    );
  }

  if (todos.length) {
    const head = `${todos.length} open TODO field(s):`;
    const body = todos.map((t) => `    ${t}`).join('\n');
    if (strictTodo) {
      errors.push(`${head}\n${body}\n  STRICT_TODO=1 is set, so these fail the build.`);
    } else {
      log.warn(`\n[check-content] ${head}\n${body}\n`);
    }
  }

  if (errors.length) {
    const message =
      `\n[check-content] Content gate failed:\n\n` +
      errors.map((e) => `  - ${e}`).join('\n\n') +
      `\n`;
    throw new Error(message);
  }

  log.info(
    `[check-content] ${files.length} content file(s) checked, ` +
      `${placeholders.length} placeholder, ${todos.length} TODO` +
      (allowPlaceholder ? ' (ALLOW_PLACEHOLDER=1)' : '')
  );
}

// Standalone: node scripts/check-content.mjs
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('check-content.mjs')) {
  checkContent().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
