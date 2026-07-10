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
// games/element-lab is copied piecewise (v2.0): its test/ suite and
// README are dev-only and must not ship in the app bundle.
const INCLUDE = [
  'index.html',
  'manifest.webmanifest',
  'service-worker.js',
  'privacy.html',
  'css',
  'js',
  'assets',
  'games/element-lab/index.html',
  'games/element-lab/src',
  'games/element-lab/vendor',
  'games/element-lab/assets'
];

console.log('build-web: assembling', out);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const entry of INCLUDE) {
  const src = join(root, entry);
  if (!existsSync(src)) { console.warn('  skip (missing):', entry); continue; }
  const dest = join(out, entry);
  mkdirSync(dirname(dest), { recursive: true });   // nested entries (games/...)
  cpSync(src, dest, { recursive: true });
  console.log('  +', entry);
}
console.log('build-web: done. webDir =', out);
