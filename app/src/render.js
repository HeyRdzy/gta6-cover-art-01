// Vice Cover Studio — shared cover geometry, colour grades and canvas export.
// The DOM preview (app.js) and the PNG export both use these helpers, so what
// you see in the editor is exactly what the exported PNG holds.

export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

// Each layout is a list of panel slots as fractions [x, y, w, h] of the cover.
// The gaps between slots are the dark gutters, part of the poster look.
export const LAYOUTS = [
  {
    id: 'showdown',
    label: 'Showdown',
    slots: [
      [0, 0, 0.615, 1],
      [0.627, 0, 0.373, 0.494],
      [0.627, 0.506, 0.373, 0.494],
    ],
  },
  {
    id: 'four',
    label: 'Four corners',
    slots: [
      [0, 0, 0.494, 0.494],
      [0.506, 0, 0.494, 0.494],
      [0, 0.506, 0.494, 0.494],
      [0.506, 0.506, 0.494, 0.494],
    ],
  },
  {
    id: 'strip',
    label: 'Triple strip',
    slots: [
      [0, 0, 0.327, 1],
      [0.3365, 0, 0.327, 1],
      [0.673, 0, 0.327, 1],
    ],
  },
  { id: 'hero', label: 'Hero shot', slots: [[0, 0, 1, 1]] },
];

export const GRADES = [
  {
    id: 'sunset',
    label: 'Sunset',
    cssFilter: 'saturate(1.28) contrast(1.06) sepia(0.16)',
    overlay:
      'linear-gradient(180deg, rgba(255,120,40,0) 40%, rgba(255,60,20,0.22) 100%), linear-gradient(180deg, rgba(255,150,50,0.06), rgba(255,150,50,0.06))',
  },
  {
    id: 'neon',
    label: 'Neon nights',
    cssFilter: 'saturate(1.65) contrast(1.12) hue-rotate(-14deg)',
    overlay:
      'linear-gradient(135deg, rgba(255,46,136,0.20), rgba(255,46,136,0) 55%), linear-gradient(315deg, rgba(46,230,214,0.20), rgba(46,230,214,0) 55%)',
  },
  {
    id: 'noir',
    label: 'Noir',
    cssFilter: 'grayscale(1) contrast(1.18) brightness(1.04)',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.05))',
  },
  {
    id: 'clean',
    label: 'Clean',
    cssFilter: 'none',
    overlay: 'linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0))',
  },
];

export const CAPTION_COLORS = [
  { id: 'sunset', label: 'Sunset', stops: ['#ffd23f', '#ff5e7a'] },
  { id: 'white', label: 'White', stops: ['#ffffff', '#ddd2ff'] },
  { id: 'pink', label: 'Hot pink', stops: ['#ff7ad9', '#ff2e88'] },
  { id: 'cyan', label: 'Neon cyan', stops: ['#a5fff4', '#2ee6d6'] },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function captionColorById(id) {
  return CAPTION_COLORS.find((c) => c.id === id) ?? CAPTION_COLORS[0];
}

const CAPTION_FONT = (px) =>
  `italic 900 ${px}px "Arial Black", "Archivo Black", Impact, "Helvetica Neue", sans-serif`;

/** Shrink a caption until it fits one line inside maxWidth (shared by preview and export). */
export function fitCaptionFontSize(text, sizePx, maxWidth) {
  const measurer = fitCaptionFontSize.canvas ?? (fitCaptionFontSize.canvas = document.createElement('canvas'));
  const ctx = measurer.getContext('2d');
  let size = sizePx;
  ctx.font = CAPTION_FONT(size);
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 4;
    ctx.font = CAPTION_FONT(size);
  }
  return size;
}

/** A slot's pixel rectangle inside a W×H cover. */
export function panelRect(slot, W, H) {
  return { x: slot[0] * W, y: slot[1] * H, w: slot[2] * W, h: slot[3] * H };
}

/**
 * Where an image lands inside a panel, cover-fit with a zoom and a pan.
 * zoom 1 fills the panel; ox/oy in [-1, 1] slide the photo across the
 * overflow the zoom creates. The DOM preview and the export share this.
 */
export function coverTransform(imgW, imgH, pw, ph, zoom, ox, oy) {
  const base = Math.max(pw / imgW, ph / imgH);
  const dw = imgW * base * zoom;
  const dh = imgH * base * zoom;
  const dx = (pw - dw) / 2 + ox * Math.max(0, (dw - pw) / 2);
  const dy = (ph - dh) / 2 + oy * Math.max(0, (dh - ph) / 2);
  return { dx, dy, dw, dh };
}

/** Small deterministic pseudo-random stream, so the grain is stable. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPanelPhoto(ctx, photo, rect, panel, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.img && photo.img.naturalWidth > 0) {
    if (grade.id === 'noir') ctx.filter = 'grayscale(1) contrast(1.18) brightness(1.04)';
    const t = coverTransform(
      photo.img.naturalWidth,
      photo.img.naturalHeight,
      rect.w,
      rect.h,
      panel.zoom,
      panel.ox,
      panel.oy,
    );
    ctx.drawImage(photo.img, rect.x + t.dx, rect.y + t.dy, t.dw, t.dh);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#120b1e';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    for (let i = -rect.h; i < rect.w; i += 26) {
      ctx.beginPath();
      ctx.moveTo(rect.x + i, rect.y + rect.h);
      ctx.lineTo(rect.x + i + rect.h, rect.y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(245,239,230,0.75)';
    ctx.font = `800 ${Math.max(14, rect.w * 0.045)}px "Segoe UI", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = Math.max(2, rect.w * 0.004);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function drawGradeWash(ctx, W, H, grade) {
  if (grade.id === 'sunset') {
    const warm = ctx.createLinearGradient(0, 0, 0, H);
    warm.addColorStop(0, 'rgba(255,120,40,0)');
    warm.addColorStop(1, 'rgba(255,60,20,0.26)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,150,50,0.07)';
    ctx.fillRect(0, 0, W, H);
    const sun = ctx.createRadialGradient(W * 0.82, H * 0.15, 0, W * 0.82, H * 0.15, W * 0.11);
    sun.addColorStop(0, 'rgba(255,210,63,0.85)');
    sun.addColorStop(0.6, 'rgba(255,120,60,0.35)');
    sun.addColorStop(1, 'rgba(255,120,60,0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.15, W * 0.11, 0, Math.PI * 2);
    ctx.fill();
  } else if (grade.id === 'neon') {
    const mag = ctx.createLinearGradient(0, 0, W, H);
    mag.addColorStop(0, 'rgba(255,46,136,0.22)');
    mag.addColorStop(0.55, 'rgba(255,46,136,0)');
    mag.addColorStop(1, 'rgba(46,230,214,0.20)');
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * 0.92);
    ctx.lineTo(W * 0.92, H * 0.08);
    ctx.stroke();
  }
  const vignette = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

function drawGrain(ctx, W, H) {
  const rnd = mulberry32(7);
  const count = Math.round((W * H) / 1400);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rnd() * W, rnd() * H, 1.6, 1.6);
  }
  ctx.restore();
}

function drawCaption(ctx, W, H, caption) {
  const text = (caption.text || '').trim() || 'SUNSET DRIVE';
  const scale = W / 1080;
  const size = fitCaptionFontSize(text, caption.size * scale, W * 0.92);
  const color = captionColorById(caption.color);
  const fontFor = (px) => CAPTION_FONT(px);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try {
    ctx.letterSpacing = `${Math.max(1, size * 0.02)}px`;
  } catch {
    /* letterSpacing is Chrome-only; the caption still draws without it. */
  }
  ctx.font = fontFor(size);
  const bandH = size * 1.7;
  const bandY = caption.position === 'top' ? 0 : H - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (caption.position === 'top') {
    band.addColorStop(0, 'rgba(8,3,16,0.62)');
    band.addColorStop(1, 'rgba(8,3,16,0)');
  } else {
    band.addColorStop(0, 'rgba(8,3,16,0)');
    band.addColorStop(1, 'rgba(8,3,16,0.62)');
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
  const baseline = caption.position === 'top' ? bandY + size * 1.15 : H - size * 0.32;
  const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline);
  grad.addColorStop(0, color.stops[0]);
  grad.addColorStop(1, color.stops[1]);
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.1;
  ctx.shadowOffsetY = size * 0.05;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(18,4,12,0.92)';
  ctx.lineWidth = Math.max(2, size / 13);
  ctx.strokeText(text, W / 2, baseline);
  ctx.fillStyle = grad;
  ctx.fillText(text, W / 2, baseline);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  try {
    ctx.letterSpacing = '0px';
  } catch {
    /* ignore */
  }
}

function drawStudioTag(ctx, W, H, caption) {
  const size = Math.max(14, W * 0.016);
  ctx.font = `800 ${size}px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  try {
    ctx.letterSpacing = '3px';
  } catch {
    /* ignore */
  }
  ctx.fillStyle = 'rgba(245,239,230,0.88)';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 6;
  const y = caption.position === 'top' ? H - size * 1.4 : size * 2.1;
  ctx.fillText('VICE COVER STUDIO', W * 0.97, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  try {
    ctx.letterSpacing = '0px';
  } catch {
    /* ignore */
  }
}

/** Paint the whole cover onto a 2d context of a W×H canvas. */
export function drawCover(ctx, W, H, state, photos) {
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  ctx.fillStyle = '#050308';
  ctx.fillRect(0, 0, W, H);
  layout.slots.forEach((slot, i) => {
    const rect = panelRect(slot, W, H);
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = photos[panel.photo] ?? null;
    drawPanelPhoto(ctx, photo, rect, panel, grade);
  });
  drawGradeWash(ctx, W, H, grade);
  drawGrain(ctx, W, H);
  drawCaption(ctx, W, H, state.caption);
  drawStudioTag(ctx, W, H, state.caption);
}

/** Render the current cover to a fresh canvas at the chosen export size. */
export function exportCover(state, photos) {
  const size = sizeById(state.size);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, size.w, size.h, state, photos);
  return canvas;
}
