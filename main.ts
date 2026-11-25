// Dapur Kilat — Rush Kitchen: a complete cooking game (Node 22, standard library only).
// The game is this directory's game/ folder, plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library and no network request), and the
// program hands it in. It copies game/ and screenshots/ from beside this file to /output
// and writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Dapur Kilat: run a one-chef kitchen against the clock — take orders
// from the board, pick ingredients from the pantry, chop on the board or cook on the
// stove (food burns if left), assemble three prepped components on a plate and serve
// at the counter before patience runs out. Five recipes, combo tips, rush hour.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Dapur Kilat's entrypoint: the game ships exactly four real screenshots (cover, chop,
// rush, win) and the judge reads the first by name as the cover, so refuse to hand in
// a folder that lost one instead of submitting a broken entry.
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort() : [];
if (shots.length !== 4) throw new Error(`Dapur Kilat needs exactly 4 screenshots, found ${shots.length}`);
console.log(`Dapur Kilat — handing in ${shots.length} screenshots: ${shots.join(', ')}`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
