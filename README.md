# Vice Cover Studio — GTA 6 Cover Art Maker

[![GTA 6 Cover Art Maker — make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![GTA 6 Cover Art Maker rank on make.fun](https://make.fun/badge/gta6-cover-art-01/HeyRdzy/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![GTA 6 Cover Art Maker reward on make.fun](https://make.fun/badge/gta6-cover-art-01/HeyRdzy/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Vice Cover Studio turns your own photos and a caption into GTA-style cover
art: a multi-panel poster with bold caption lettering and a Vice City sunset
or neon colour grade, exported as a PNG to share. Everything runs offline in
your browser — photos are read on your machine and never uploaded.

## How it works

1. **Add photos** — pick images from your machine, or load the two free
   sample photos (Boulevard, Pier) to try it out.
2. **Pick a layout** — Showdown (one big panel + two stacked), Four corners
   (2×2 grid), Triple strip (three vertical panels), or Hero shot
   (one full-bleed photo).
3. **Arrange each panel** — click a panel to select it, drag inside it to pan
   the photo, use the zoom slider, or cycle which photo fills it. Click a
   thumbnail to put that photo in the selected panel.
4. **Caption & grade** — type the caption, set its size, top or bottom
   position, and colour; pick a grade: Sunset, Neon nights, Noir, or Clean.
5. **Export PNG** — 1080×1080, 1080×1350, or 1920×1080, one click.

The live preview is exactly what the export draws: the same geometry,
grades, caption lettering and grain go into the PNG.

## Run it

Serve `app/` with any static server and open `index.html`, for example:

```sh
node serve.ts
```

then open the address it prints. No build step, no network at runtime: every
script, style and sample image is a file under `app/`.

## Originality

All artwork, lettering and code in this entry are original. It uses no
Rockstar Games logo, wordmark, official artwork, character, or font file from
any game. The caption is drawn with generic system font stacks
(`Arial Black`, Impact, sans-serif) — no font file is shipped. The two
sample photos under `app/samples/` were made with an image model for make.fun
and are free to use.

## Files

- `app/index.html` — the editor page
- `app/style.css` — dark neon editor styling
- `app/src/app.js` — editor state, DOM preview, drag-to-pan, upload, export
- `app/src/render.js` — panel layouts, colour grades, cover geometry, canvas export
- `app/samples/` — the two free sample photos
- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with `buildDossier`
- `screenshots/` — 3–4 screenshots taken while building this entry
