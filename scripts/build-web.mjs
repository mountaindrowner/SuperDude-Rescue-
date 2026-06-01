// Assemble a clean ./www directory containing ONLY the shippable web
// game, for Capacitor's webDir. The repo root has dev files (.git,
// node_modules, tests/, tools/, ios/, the editor scripts) that must NOT
// go into the native app bundle, so we copy an explicit allow-list.
//
// Run: npm run build:web   (or it runs automatically before cap sync)
//
// No game code changes - this is purely a packaging step. The same
// files still serve directly as a PWA from the repo root.
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'www');

// Files + directories that make up the playable game.
const INCLUDE = [
  'index.html',
  'manifest.webmanifest',
  'service-worker.js',
  'privacy.html',
  'css',
  'js',
  'assets'
];

console.log('build-web: assembling', out);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of INCLUDE) {
  const src = join(root, entry);
  if (!existsSync(src)) { console.warn('  skip (missing):', entry); continue; }
  cpSync(src, join(out, entry), { recursive: true });
  console.log('  +', entry);
}
console.log('build-web: done. webDir =', out);
