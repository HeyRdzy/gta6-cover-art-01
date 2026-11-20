// app.js — editor for Neon Coast Cover Studio.
// Owns the state, the live preview canvas, photo upload, panel picking,
// drag-to-pan, and the PNG export. Drawing lives in render.js.

import { LAYOUTS, GRADES, SIZES, layoutPanels, drawCover } from './render.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  photos: [], // { id, name, img, src }
  panels: [0, 1, 2, 3].map(() => ({ photo: 0, zoom: 1, ox: 0, oy: 0 })),
  layout: 'hero',
  grade: 'sunset',
  size: 'square',
  caption: { text: 'VICE NIGHTS', size: 1, pos: 'bottom', color: '#ffffff' },
  selectedPhoto: 0,
  selectedPanel: 0,
};

let nextPhotoId = 1;
const preview = $('#previewCanvas');
const pctx = preview.getContext('2d');

function currentSize() {
  return SIZES[state.size];
}

// Fit the preview canvas to the chosen export aspect, capped for the page.
function fitPreview() {
  const s = currentSize();
  const maxW = 620;
  const scale = Math.min(1, maxW / s.w);
  preview.width = Math.round(s.w * scale);
  preview.height = Math.round(s.h * scale);
  preview.style.aspectRatio = `${s.w} / ${s.h}`;
}

export function renderPreview() {
  fitPreview();
  drawCover(pctx, preview.width, preview.height, state);
  updatePanelHint();
}

function updatePanelHint() {
  const n = LAYOUTS[state.layout].panels;
  $('#panelHint').textContent =
    `Panel ${state.selectedPanel + 1} of ${n} selected — drag a panel to pan its photo, ` +
    `click a thumbnail, then a panel, to place a photo.`;
}

function refreshChoices(rowSel, value) {
  $$(rowSel + ' .choice').forEach((el) => {
    el.classList.toggle('active', el.dataset.value === value);
  });
}

function refreshThumbs() {
  const row = $('#thumbRow');
  row.innerHTML = '';
  state.photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (i === state.selectedPhoto ? ' active' : '');
    b.title = p.name;
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.name;
    b.appendChild(img);
    b.addEventListener('click', () => {
      state.selectedPhoto = i;
      refreshThumbs();
    });
    row.appendChild(b);
  });
  $('#photoCount').textContent =
    state.photos.length === 0
      ? 'No photos yet — load a sample or your own.'
      : `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded.`;
}

function spreadPhotos() {
  // Spread the loaded photos across the panels, in order.
  const n = LAYOUTS[state.layout].panels;
  for (let i = 0; i < 4; i++) {
    if (state.photos.length > 0) state.panels[i].photo = i % state.photos.length;
  }
  state.selectedPanel = 0;
}

function addPhoto(img, src, name) {
  state.photos.push({ id: nextPhotoId++, name, img, src });
  state.selectedPhoto = state.photos.length - 1;
  spreadPhotos();
  refreshThumbs();
  renderPreview();
}

function loadSample(url, name) {
  const img = new Image();
  img.onload = () => addPhoto(img, url, name);
  img.onerror = () => {
    $('#photoCount').textContent = `Could not load ${name}.`;
  };
  img.src = url;
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => addPhoto(img, url, file.name);
  img.src = url;
}

// Hit-test the preview canvas: which panel is at (x, y) in canvas pixels?
function panelAt(x, y) {
  const rects = layoutPanels(state.layout, preview.width, preview.height);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function canvasPos(evt) {
  const r = preview.getBoundingClientRect();
  return {
    x: ((evt.clientX - r.left) / r.width) * preview.width,
    y: ((evt.clientY - r.top) / r.height) * preview.height,
  };
}

let drag = null;
let dragMoved = false;
preview.addEventListener('pointerdown', (evt) => {
  const p = canvasPos(evt);
  const i = panelAt(p.x, p.y);
  if (i < 0) return;
  state.selectedPanel = i;
  const panel = state.panels[i];
  drag = { panel: i, startX: p.x, startY: p.y, ox: panel.ox, oy: panel.oy };
  dragMoved = false;
  preview.setPointerCapture(evt.pointerId);
  preview.classList.add('dragging');
  renderPreview();
});
preview.addEventListener('pointermove', (evt) => {
  if (!drag) return;
  const p = canvasPos(evt);
  if (Math.abs(p.x - drag.startX) + Math.abs(p.y - drag.startY) > 5) dragMoved = true;
  const rects = layoutPanels(state.layout, preview.width, preview.height);
  const r = rects[drag.panel];
  const panel = state.panels[drag.panel];
  const zoom = panel.zoom || 1;
  panel.ox = clamp(drag.ox + ((p.x - drag.startX) / r.w) * 2 * zoom, -0.5, 0.5);
  panel.oy = clamp(drag.oy + ((p.y - drag.startY) / r.h) * 2 * zoom, -0.5, 0.5);
  renderPreview();
});
preview.addEventListener('pointerup', () => {
  drag = null;
  preview.classList.remove('dragging');
});
preview.addEventListener('click', (evt) => {
  // A drag-pan ends with a click too; ignore it so panning never reassigns.
  if (dragMoved) {
    dragMoved = false;
    return;
  }
  // A plain click (no drag) places the selected photo into the panel.
  if (drag) return;
  const p = canvasPos(evt);
  const i = panelAt(p.x, p.y);
  if (i >= 0 && state.photos.length > 0) {
    state.panels[i].photo = state.selectedPhoto;
    state.selectedPanel = i;
    renderPreview();
  }
});

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function bindChoices(rowSel, key, onChange) {
  $$(rowSel + ' .choice').forEach((el) => {
    el.addEventListener('click', () => {
      state[key] = el.dataset.value;
      refreshChoices(rowSel, state[key]);
      if (key === 'layout') spreadPhotos();
      if (onChange) onChange();
      renderPreview();
    });
  });
}

bindChoices('#layoutRow', 'layout');
bindChoices('#gradeRow', 'grade');
bindChoices('#sizeRow', 'size');

$$('#layoutRow .choice').forEach((el) => {
  el.title = LAYOUTS[el.dataset.value].hint;
});
$$('#gradeRow .choice').forEach((el) => {
  el.title = GRADES[el.dataset.value].hint;
});

$$('#photoRow [data-sample]').forEach((btn) => {
  btn.addEventListener('click', () => {
    loadSample(btn.dataset.sample, btn.dataset.sample.split('/').pop());
  });
});

$('#photoInput').addEventListener('change', (evt) => {
  Array.from(evt.target.files || []).forEach(loadFile);
  evt.target.value = '';
});

// Drag-and-drop photos onto the stage.
['dragover', 'dragenter'].forEach((name) =>
  preview.addEventListener(name, (evt) => {
    evt.preventDefault();
    preview.classList.add('dropping');
  }),
);
['dragleave', 'drop'].forEach((name) =>
  preview.addEventListener(name, (evt) => {
    evt.preventDefault();
    preview.classList.remove('dropping');
  }),
);
preview.addEventListener('drop', (evt) => {
  Array.from(evt.dataTransfer.files || []).forEach(loadFile);
});

$('#fillAllBtn').addEventListener('click', () => {
  for (let i = 0; i < 4; i++) state.panels[i].photo = state.selectedPhoto;
  renderPreview();
});

$('#zoomRange').addEventListener('input', (evt) => {
  const z = parseFloat(evt.target.value);
  state.panels[state.selectedPanel].zoom = z;
  $('#zoomLabel').textContent = `${z.toFixed(1)}×`;
  renderPreview();
});

$('#captionText').addEventListener('input', (evt) => {
  state.caption.text = evt.target.value;
  renderPreview();
});
$('#captionSize').addEventListener('input', (evt) => {
  state.caption.size = parseFloat(evt.target.value);
  renderPreview();
});
$('#captionPos').addEventListener('change', (evt) => {
  state.caption.pos = evt.target.value;
  renderPreview();
});
$('#captionColor').addEventListener('input', (evt) => {
  state.caption.color = evt.target.value;
  renderPreview();
});

// Export the cover at full size. Returns a PNG Blob for the playtest too.
export async function exportPng() {
  const s = currentSize();
  const canvas = document.createElement('canvas');
  canvas.width = s.w;
  canvas.height = s.h;
  const ctx = canvas.getContext('2d');
  drawCover(ctx, s.w, s.h, state);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

$('#exportBtn').addEventListener('click', async () => {
  const btn = $('#exportBtn');
  btn.disabled = true;
  btn.textContent = 'Exporting…';
  try {
    const blob = await exportPng();
    const s = currentSize();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-coast-${s.w}x${s.h}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('#exportNote').textContent = `Exported ${s.label} PNG — ${(blob.size / 1048576).toFixed(2)} MB.`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Export PNG';
  }
});

// Progress steps: 1 photos, 2 layout, 3 caption, 4 export.
function refreshSteps() {
  const donePhotos = state.photos.length > 0;
  const doneCaption = state.caption.text.trim().length > 0;
  $('#step1').classList.toggle('done', donePhotos);
  $('#step2').classList.toggle('done', true);
  $('#step3').classList.toggle('done', doneCaption);
  $('#step4').classList.toggle('done', donePhotos && doneCaption);
}
setInterval(refreshSteps, 500);

// Test hook: the playtest drives the app through this object.
window.__coverMaker = { state, exportPng, renderPreview, loadSample, SIZES };

refreshChoices('#layoutRow', state.layout);
refreshChoices('#gradeRow', state.grade);
refreshChoices('#sizeRow', state.size);
refreshThumbs();
renderPreview();
refreshSteps();
