// Vice Cover Studio — entrypoint: hand the app in.
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes the dossier buildDossier builds from them.
//
// The output directory itself is never removed: in the grader it is a
// Docker mount point, and deleting a mount point fails (EBUSY). Only its
// contents are cleared, then the fresh files go in.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the output directory exists, then empty it without removing it.
mkdirSync(outDir, { recursive: true });
for (const child of readdirSync(outDir)) {
  rmSync(join(outDir, child), { recursive: true, force: true });
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(appDir)) throw new Error('app/: no such directory in the repository');
if (!existsSync(shotsDir)) throw new Error('screenshots/: no such directory in the repository');
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`dossier written: ${dossier.length} bytes`);
