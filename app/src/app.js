// Vice Cover Studio — editor state, DOM preview and export wiring.
// Photos are read on this machine with FileReader / object URLs and never
// leave it. The preview reuses render.js geometry, so it matches the PNG.

import {
  SIZES,
  LAYOUTS,
  GRADES,
  CAPTION_COLORS,
  sizeById,
  layoutById,
  gradeById,
  panelRect,
  coverTransform,
  fitCaptionFontSize,
  exportCover,
} from './render.js';

const stage = document.getElementById('stage');
const thumbsEl = document.getElementById('thumbs');
const photoCountEl = document.getElementById('photoCount');
const sizeLabelEl = document.getElementById('sizeLabel');
const exportStatusEl = document.getElementById('exportStatus');

const state = {
  photos: [],
  layout: 'showdown',
  size: 'square',
  grade: 'sunset',
  caption: { text: 'SUNSET DRIVE', size: 120, position: 'bottom', color: 'sunset' },
  panels: [],
  selected: 0,
  exported: false,
  captionTouched: false,
  layoutTouched: false,
};

function freshPanels(layoutId) {
  const layout = layoutById(layoutId);
  return layout.slots.map((_, i) => ({
    photo: state.photos.length > 0 ? i % state.photos.length : 0,
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
}

state.panels = freshPanels(state.layout);

function photoName(photo) {
  return photo.name || 'Photo';
}

function addPhoto(img, name) {
  state.photos.push({ img, name });
  // Spread the loaded photos across the panels, so a second photo fills
  // panels instead of hiding behind the first one.
  state.panels.forEach((panel, i) => {
    panel.photo = i % state.photos.length;
  });
  renderThumbs();
  renderStage();
  updateSteps();
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, name: file.name });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    img.src = url;
  });
}

function loadSample(path) {
  const img = new Image();
  img.onload = () => {
    if (!state.photos.some((p) => p.name === path)) addPhoto(img, path.split('/').pop());
    else renderStage();
  };
  img.onerror = () => {
    exportStatusEl.textContent = `Could not load ${path}.`;
  };
  img.src = path;
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.src = photo.img.src;
    thumb.alt = photoName(photo);
    thumb.title = photoName(photo);
    if (state.panels[state.selected] && state.panels[state.selected].photo === i) {
      thumb.classList.add('active');
    }
    thumb.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      renderThumbs();
      renderStage();
    });
    thumbsEl.appendChild(thumb);
  });
  photoCountEl.textContent =
    state.photos.length === 0
      ? 'No photos yet — load a sample or your own below.'
      : `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} loaded.`;
}

function renderStage() {
  const size = sizeById(state.size);
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const stageW = stage.clientWidth || 600;
  const scale = stageW / size.w;
  const stageH = size.h * scale;
  stage.style.aspectRatio = `${size.w} / ${size.h}`;
  stage.innerHTML = '';

  layout.slots.forEach((slot, i) => {
    const rect = panelRect(slot, size.w, size.h);
    const panel = state.panels[i];
    const div = document.createElement('div');
    div.className = 'panel' + (i === state.selected ? ' selected' : '');
    div.style.left = `${rect.x * scale}px`;
    div.style.top = `${rect.y * scale}px`;
    div.style.width = `${rect.w * scale}px`;
    div.style.height = `${rect.h * scale}px`;
    div.dataset.index = String(i);
    const photo = state.photos[panel.photo];
    if (photo && photo.img.naturalWidth > 0) {
      const t = coverTransform(
        photo.img.naturalWidth,
        photo.img.naturalHeight,
        rect.w,
        rect.h,
        panel.zoom,
        panel.ox,
        panel.oy,
      );
      const img = document.createElement('img');
      img.src = photo.img.src;
      img.alt = photoName(photo);
      img.style.left = `${t.dx * scale}px`;
      img.style.top = `${t.dy * scale}px`;
      img.style.width = `${t.dw * scale}px`;
      img.style.height = `${t.dh * scale}px`;
      img.style.filter = grade.cssFilter;
      div.appendChild(img);
    } else {
      const empty = document.createElement('div');
      empty.className = 'panel-empty';
      empty.textContent = 'Add a photo';
      div.appendChild(empty);
    }
    div.addEventListener('pointerdown', (event) => startPan(event, i));
    stage.appendChild(div);
  });

  const overlay = document.createElement('div');
  overlay.className = 'grade-overlay';
  overlay.style.background = grade.overlay;
  stage.appendChild(overlay);

  const caption = document.createElement('div');
  caption.className = `caption-layer ${state.caption.position}`;
  const color = CAPTION_COLORS.find((c) => c.id === state.caption.color) ?? CAPTION_COLORS[0];
  const captionText = (state.caption.text || '').trim() || 'SUNSET DRIVE';
  caption.textContent = captionText;
  const fittedSize = fitCaptionFontSize(captionText, state.caption.size * scale, stageW * 0.92);
  caption.style.fontSize = `${fittedSize}px`;
  caption.style.background = `linear-gradient(180deg, ${color.stops[0]}, ${color.stops[1]})`;
  caption.style.webkitBackgroundClip = 'text';
  caption.style.backgroundClip = 'text';
  caption.style.color = 'transparent';
  caption.style.webkitTextStroke = `${Math.max(1, state.caption.size * scale * 0.06)}px rgba(18,4,12,0.9)`;
  caption.style.textShadow = `0 ${Math.max(2, state.caption.size * scale * 0.05)}px ${Math.max(4, state.caption.size * scale * 0.1)}px rgba(0,0,0,0.55)`;
  stage.appendChild(caption);

  const tag = document.createElement('div');
  tag.className = 'tag-layer';
  tag.textContent = 'Vice Cover Studio';
  tag.style.right = '3%';
  tag.style.top = state.caption.position === 'top' ? 'auto' : '3%';
  tag.style.bottom = state.caption.position === 'top' ? '3%' : 'auto';
  stage.appendChild(tag);

  sizeLabelEl.textContent = `${size.w} × ${size.h}`;
  const zoomRange = document.getElementById('zoomRange');
  const panel = state.panels[state.selected];
  zoomRange.value = String(panel.zoom);
  document.getElementById('zoomValue').textContent = `${panel.zoom.toFixed(2)}×`;
}

function startPan(event, index) {
  state.selected = index;
  renderThumbs();
  document.querySelectorAll('.stage .panel').forEach((el) => {
    el.classList.toggle('selected', Number(el.dataset.index) === index);
  });
  const panel = state.panels[index];
  const rect = stage.getBoundingClientRect();
  const size = sizeById(state.size);
  const scale = rect.width / size.w;
  const layout = layoutById(state.layout);
  const slotRect = panelRect(layout.slots[index], size.w, size.h);
  const photo = state.photos[panel.photo];
  if (!photo || photo.img.naturalWidth === 0) return;
  const startX = event.clientX;
  const startY = event.clientY;
  const startOx = panel.ox;
  const startOy = panel.oy;
  const base = Math.max(slotRect.w / photo.img.naturalWidth, slotRect.h / photo.img.naturalHeight);
  const overflowX = Math.max(0, (photo.img.naturalWidth * base * panel.zoom - slotRect.w) / 2);
  const overflowY = Math.max(0, (photo.img.naturalHeight * base * panel.zoom - slotRect.h) / 2);
  const move = (moveEvent) => {
    if (overflowX > 0) {
      panel.ox = Math.max(-1, Math.min(1, startOx + ((moveEvent.clientX - startX) / scale) / overflowX));
    }
    if (overflowY > 0) {
      panel.oy = Math.max(-1, Math.min(1, startOy + ((moveEvent.clientY - startY) / scale) / overflowY));
    }
    renderStage();
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  event.preventDefault();
}

function updateSteps() {
  const steps = {
    photos: state.photos.length > 0,
    layout: state.layoutTouched || state.photos.length > 0,
    caption: state.captionTouched,
    export: state.exported,
  };
  document.querySelectorAll('#steps li').forEach((li) => {
    li.classList.toggle('done', Boolean(steps[li.dataset.step]));
  });
}

function buildChoiceRow(el, items, activeId, onPick) {
  el.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice' + (item.id === activeId ? ' active' : '');
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      onPick(item.id);
      buildChoiceRow(el, items, item.id, onPick);
    });
    el.appendChild(btn);
  });
}

function initControls() {
  buildChoiceRow(document.getElementById('layoutRow'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    state.layoutTouched = true;
    const old = state.panels;
    state.panels = freshPanels(id);
    state.panels.forEach((panel, i) => {
      if (old[i]) panel.photo = old[i].photo;
    });
    state.selected = 0;
    renderStage();
    updateSteps();
  });
  buildChoiceRow(document.getElementById('gradeRow'), GRADES, state.grade, (id) => {
    state.grade = id;
    renderStage();
  });
  buildChoiceRow(document.getElementById('sizeRow'), SIZES, state.size, (id) => {
    state.size = id;
    renderStage();
  });
  buildChoiceRow(document.getElementById('captionColorRow'), CAPTION_COLORS, state.caption.color, (id) => {
    state.caption.color = id;
    state.captionTouched = true;
    renderStage();
    updateSteps();
  });
  document.querySelectorAll('#captionPosRow .choice').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.caption.position = btn.dataset.pos;
      state.captionTouched = true;
      document.querySelectorAll('#captionPosRow .choice').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      renderStage();
      updateSteps();
    });
  });

  document.getElementById('photoInput').addEventListener('change', async (event) => {
    const files = [...event.target.files];
    for (const file of files) {
      try {
        const { img, name } = await loadImageFile(file);
        addPhoto(img, name);
      } catch (err) {
        exportStatusEl.textContent = err.message;
      }
    }
    event.target.value = '';
  });

  document.querySelectorAll('.sample-btn').forEach((btn) => {
    btn.addEventListener('click', () => loadSample(btn.dataset.sample));
  });

  document.getElementById('cyclePhoto').addEventListener('click', () => {
    if (state.photos.length === 0) return;
    const panel = state.panels[state.selected];
    panel.photo = (panel.photo + 1) % state.photos.length;
    renderThumbs();
    renderStage();
  });

  document.getElementById('zoomRange').addEventListener('input', (event) => {
    state.panels[state.selected].zoom = Number(event.target.value);
    renderStage();
  });

  document.getElementById('captionText').addEventListener('input', (event) => {
    state.caption.text = event.target.value.toUpperCase();
    state.captionTouched = true;
    renderStage();
    updateSteps();
  });

  document.getElementById('captionSize').addEventListener('input', (event) => {
    state.caption.size = Number(event.target.value);
    document.getElementById('captionSizeValue').textContent = String(state.caption.size);
    state.captionTouched = true;
    renderStage();
    updateSteps();
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    const size = sizeById(state.size);
    const canvas = exportCover(state, state.photos);
    canvas.toBlob((blob) => {
      if (!blob) {
        exportStatusEl.textContent = 'Export failed in this browser.';
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vice-cover-${size.w}x${size.h}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      state.exported = true;
      exportStatusEl.textContent = `Exported ${size.w} × ${size.h} PNG — check your downloads.`;
      updateSteps();
    }, 'image/png');
  });

  window.addEventListener('resize', () => renderStage());
}

initControls();
renderThumbs();
renderStage();
updateSteps();

// Test handle: the playtest drives the app through this, never the network.
window.__coverMaker = {
  state,
  loadSample,
  addPhoto,
  exportPng: () =>
    new Promise((resolve) => {
      exportCover(state, state.photos).toBlob((blob) => resolve(blob));
    }),
};
