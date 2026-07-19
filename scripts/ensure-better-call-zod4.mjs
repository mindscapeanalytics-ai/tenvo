/**
 * better-call@1.3.5 declares peerOptional zod@^4, but npm hoists it next to
 * the app's zod@3 so `import "zod"` resolves to v3. better-auth already nests
 * zod@4; this script mirrors that copy under better-call so OpenAPI / instanceof
 * checks use Zod 4 without upgrading the app root to Zod 4.
 *
 * Safe no-op when packages are missing (e.g. partial installs).
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readVersion(pkgDir) {
  try {
    const pkg = JSON.parse(readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

function findZod4Sources() {
  const candidates = [
    path.join(root, 'node_modules', 'better-auth', 'node_modules', 'zod'),
    path.join(root, 'node_modules', '@better-auth', 'core', 'node_modules', 'zod'),
  ];
  return candidates.filter((dir) => {
    const version = readVersion(dir);
    return version && version.startsWith('4.');
  });
}

function ensureNestedZod4() {
  const betterCallDir = path.join(root, 'node_modules', 'better-call');
  if (!existsSync(betterCallDir)) {
    return { status: 'skip', reason: 'better-call not installed' };
  }

  const sources = findZod4Sources();
  if (sources.length === 0) {
    return { status: 'skip', reason: 'no nested zod@4 from better-auth' };
  }

  const source = sources[0];
  const target = path.join(betterCallDir, 'node_modules', 'zod');
  const sourceVersion = readVersion(source);
  const targetVersion = readVersion(target);

  if (targetVersion && targetVersion.startsWith('4.')) {
    return { status: 'ok', reason: `already nested zod@${targetVersion}` };
  }

  mkdirSync(path.dirname(target), { recursive: true });
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
  cpSync(source, target, { recursive: true });

  return {
    status: 'ok',
    reason: `nested zod@${sourceVersion} under better-call (was ${targetVersion || 'missing'})`,
  };
}

const result = ensureNestedZod4();
if (result.status === 'ok') {
  console.log(`[ensure-better-call-zod4] ${result.reason}`);
} else {
  console.warn(`[ensure-better-call-zod4] ${result.reason}`);
}
