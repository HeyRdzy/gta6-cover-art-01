// render.js — canvas cover rendering for Neon Coast Cover Studio.
// Pure drawing code: no DOM access in this file. The editor (app.js) owns
// state and the preview canvas; the exporter calls drawCover at full size.

export const LAYOUTS = {
  hero: { name: 'Hero Split', panels: 3, hint: 'One big moment, two side stories' },
  corners: { name: 'Four Corners', panels: 4, hint: 'Four faces, one night' },
  strip: { name: 'Triple Strip', panels: 3, hint: 'Three tall frames side by side' },
  spotlight: { name: 'Spotlight', panels: 1, hint: 'One photo, full bleed' },
};

export const GRADES = {
  sunset: { name: 'Sunset', hint: 'Warm Vice City dusk' },
  neon: { name: 'Neon Nights', hint: 'Magenta and cyan glow' },
  noir: { name: 'Noir', hint: 'Black, white and trouble' },
  clean: { name: 'Clean', hint: 'No grade, just the photo' },
};

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 × 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 × 1350' },
  wide: { w: 1920, h: 1080, label: '1920 × 1080' },
};

// Panel rectangles as fractions of the cover [x, y, w, h].
// A thin gutter separates panels; the numbers below already leave it.
export function layoutPanels(layoutId, W, H) {
  const g = 0.012; // gutter, as a fraction of width
  const px = (fx, fy, fw, fh) => ({ x: fx * W, y: fy * H, w: fw * W, h: fh * H });
  switch (layoutId) {
    case 'hero':
      return [
        px(0, 0, 0.62 - g / 2, 1),
        px(0.62 + g / 2, 0, 0.38 - g / 2, 0.5 - g / 2),
        px(0.62 + g / 2, 0.5 + g / 2, 0.38 - g / 2, 0.5 - g / 2),
      ];
    case 'corners':
      return [
        px(0, 0, 0.5 - g / 2, 0.5 - g / 2),
        px(0.5 + g / 2, 0, 0.5 - g / 2, 0.5 - g / 2),
        px(0, 0.5 + g / 2, 0.5 - g / 2, 0.5 - g / 2),
        px(0.5 + g / 2, 0.5 + g / 2, 0.5 - g / 2, 0.5 - g / 2),
      ];
    case 'strip':
      return [
        px(0, 0, 1 / 3 - g, 1),
        px(1 / 3 + g / 2, 0, 1 / 3 - g, 1),
        px(2 / 3 + g / 2, 0, 1 / 3 - g, 1),
      ];
    case 'spotlight':
    default:
      return [px(0, 0, 1, 1)];
  }
}

// Draw one photo cover-fit inside a panel rect, with zoom and pan offsets.
// zoom 1 = cover-fit; ox/oy are fractions of the panel size, -0.5..0.5.
export function drawPhotoInPanel(ctx, img, rect, zoom, ox, oy) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Colour grade over the whole cover. Uses composite ops the canvas
// supports in desktop Chrome; each grade is a distinct look.
export function applyGrade(ctx, W, H, gradeId) {
  if (gradeId === 'clean') return;
  ctx.save();
  if (gradeId === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255, 150, 40, 0.30)');
    g.addColorStop(0.55, 'rgba(255, 90, 60, 0.22)');
    g.addColorStop(1, 'rgba(190, 0, 110, 0.34)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const warm = ctx.createLinearGradient(0, 0, W, H);
    warm.addColorStop(0, 'rgba(255, 170, 60, 0.10)');
    warm.addColorStop(1, 'rgba(255, 60, 120, 0.12)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
  } else if (gradeId === 'neon') {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(0, 225, 255, 0.26)');
    g.addColorStop(0.5, 'rgba(120, 40, 255, 0.14)');
    g.addColorStop(1, 'rgba(255, 0, 140, 0.30)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const glow = ctx.createLinearGradient(0, 0, 0, H);
    glow.addColorStop(0, 'rgba(0, 255, 240, 0.08)');
    glow.addColorStop(1, 'rgba(255, 0, 160, 0.10)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  } else if (gradeId === 'noir') {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(40, 40, 55, 0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const top = ctx.createLinearGradient(0, 0, 0, H);
    top.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
    top.addColorStop(0.4, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

export function applyVignette(ctx, W, H) {
  const r = Math.hypot(W, H) / 2;
  const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Caption gradient per grade, so the lettering matches the colour grade.
function captionFill(ctx, W, H, gradeId) {
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.16);
  if (gradeId === 'neon') {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#8ef6ff');
    g.addColorStop(1, '#ff4fd8');
  } else if (gradeId === 'noir') {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c9c9c9');
  } else {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#ffe9a8');
    g.addColorStop(1, '#ff7a3d');
  }
  return g;
}

// Bold caption lettering, fitted to one line. Returns the font size used.
export function drawCaption(ctx, W, H, caption, gradeId) {
  const text = (caption.text || '').trim().toUpperCase();
  if (!text) return 0;
  const bandH = H * 0.17;
  let y;
  if (caption.pos === 'top') y = bandH * 0.72;
  else if (caption.pos === 'middle') y = H * 0.5 + bandH * 0.28;
  else y = H - bandH * 0.28;
  // Dark band behind the lettering so it reads on any photo.
  ctx.save();
  const band = ctx.createLinearGradient(0, y - bandH * 0.62, 0, y + bandH * 0.38);
  band.addColorStop(0, 'rgba(0, 0, 0, 0)');
  band.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
  band.addColorStop(0.65, 'rgba(0, 0, 0, 0.55)');
  band.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, y - bandH * 0.62, W, bandH);
  ctx.restore();

  const maxW = W * 0.92;
  let size = H * 0.105 * (caption.size || 1);
  const font = (s) => `900 ${s}px "Arial Black", Impact, "Helvetica Neue", Arial, sans-serif`;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(size);
  while (size > H * 0.03 && ctx.measureText(text).width > maxW) {
    size *= 0.94;
    ctx.font = font(size);
  }
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size / 11);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.88)';
  ctx.strokeText(text, W / 2, y);
  ctx.fillStyle = captionFill(ctx, W, H, gradeId);
  ctx.fillText(text, W / 2, y);
  // Thin bright underline, a poster touch.
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = caption.color || '#ffffff';
  ctx.fillRect(W / 2 - tw / 2, y + size * 0.62, tw, Math.max(2, H * 0.004));
  ctx.restore();
  return size;
}

// Draw the whole cover. state: { photos, panels, layout, grade, caption }.
// panels[i] = { photo, zoom, ox, oy }; photo is an index into state.photos.
// Missing photos draw as a dark placeholder panel with a dashed frame.
export function drawCover(ctx, W, H, state) {
  ctx.save();
  ctx.fillStyle = '#0b0b12';
  ctx.fillRect(0, 0, W, H);
  const rects = layoutPanels(state.layout, W, H);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo];
    if (photo && photo.img && photo.img.naturalWidth > 0) {
      drawPhotoInPanel(ctx, photo.img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    } else {
      ctx.fillStyle = '#181828';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.setLineDash([Math.max(4, W * 0.006), Math.max(4, W * 0.006)]);
      ctx.lineWidth = Math.max(1, W * 0.002);
      ctx.strokeRect(rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8);
      ctx.restore();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.font = `600 ${Math.max(12, H * 0.02)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    // Panel frame: dark edge plus a hairline light edge.
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = Math.max(1, W * 0.001);
    ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  });
  applyGrade(ctx, W, H, state.grade);
  applyVignette(ctx, W, H);
  drawCaption(ctx, W, H, state.caption, state.grade);
  ctx.restore();
}
