[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/HeyRdzy/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/HeyRdzy/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A GTA-style cover art maker that runs entirely offline in the browser. Load your own photos (or the two free samples), arrange them in multi-panel poster layouts, pick a Vice City sunset or neon colour grade, write a bold caption, and export a PNG ready to post.

## What it does

- **Any photo** — load photos from your machine (file picker or drag-and-drop) or the two free sample photos. Photos are read locally and never uploaded.
- **Multi-panel posters** — four layouts: Hero Split (one big moment, two side stories), Four Corners, Triple Strip, and Spotlight (one photo, full bleed). Fill several panels with one photo or several; click a thumbnail, then a panel, to place a photo.
- **Crop and position** — click a panel to select it, drag it to pan the photo inside, and zoom from 1× to 2.5×.
- **Bold caption lettering** — editable text, size, position (top / middle / bottom) and underline colour; the lettering fits itself to one line and its gradient matches the colour grade.
- **Colour grades** — Sunset (warm Vice City dusk), Neon Nights (magenta and cyan glow), Noir, and Clean.
- **Fast export** — one click exports a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Originality

Everything here is original: no Rockstar Games logo, wordmark, official artwork, character or font file. All lettering is drawn on canvas with system font stacks, and the two sample photos were made with an image model for make.fun and are free to use.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or serve `app/` with any static file server — the app makes no network requests.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

## Screenshots

- `1-cover.jpg` — exported wide cover (Hero Split + Sunset, 1920 × 1080)
- `2-editor.jpg` — the editor with photos loaded (Hero Split + Sunset)
- `3-cover-square.jpg` — exported square cover (Four Corners + Neon Nights, 1080 × 1080)
- `4-editor-neon.jpg` — the editor (Triple Strip + Neon Nights)
