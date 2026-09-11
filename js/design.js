document.addEventListener('DOMContentLoaded', function () {
  var canvas = document.getElementById('design-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;

  var els = {
    text: document.getElementById('d-text'),
    font: document.getElementById('d-font'),
    height: document.getElementById('d-height'),
    heightLabel: document.getElementById('d-height-label'),
    material: document.getElementById('d-material'),
    color: document.getElementById('d-color'),
    swatches: document.querySelectorAll('[data-swatch]'),
    zoomIn: document.getElementById('d-zoom-in'),
    zoomOut: document.getElementById('d-zoom-out'),
    zoomReset: document.getElementById('d-zoom-reset'),
    zoomLabel: document.getElementById('d-zoom-label'),
    send: document.getElementById('d-send'),
    materialDesc: document.getElementById('d-material-desc'),
  };

  var state = {
    text: 'YOUR BUSINESS',
    font: "'Barlow Condensed', sans-serif",
    fontLabel: 'Industrial (Barlow Condensed)',
    heightInches: 36,
    unit: 'ft',
    material: 'metal',
    materialLabel: 'Aluminum / Metal',
    color: '#1c5a8c',
    zoom: 1,
    panX: 0,
    panY: 0,
  };

  var PPF = 50; // base pixels per foot at zoom 1
  var logicalW = 0, logicalH = 0;
  var dragging = false, dragMoved = false, lastX = 0, lastY = 0;
  var texCache = {};

  var materialDescriptions = {
    metal: 'Brushed metal finish with a beveled, dimensional edge.',
    acrylic: 'Translucent acrylic with visible edge depth and a soft gloss highlight.',
    led: 'Illuminated face with a layered glow &mdash; bright core, soft outer halo.',
    vinyl: 'Flat matte printed vinyl with a subtle print texture, no shine.',
  };

  function getBrushedPattern() {
    if (texCache.brushed) return texCache.brushed;
    var pc = document.createElement('canvas');
    pc.width = 48; pc.height = 48;
    var pctx = pc.getContext('2d');
    for (var i = -48; i < 96; i += 4) {
      pctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + Math.random() * 0.12).toFixed(2) + ')';
      pctx.lineWidth = 1;
      pctx.beginPath();
      pctx.moveTo(i, 0);
      pctx.lineTo(i - 48, 48);
      pctx.stroke();
    }
    texCache.brushed = ctx.createPattern(pc, 'repeat');
    return texCache.brushed;
  }

  function getGrainPattern() {
    if (texCache.grain) return texCache.grain;
    var pc = document.createElement('canvas');
    pc.width = 40; pc.height = 40;
    var pctx = pc.getContext('2d');
    for (var i = 0; i < 260; i++) {
      var x = Math.random() * 40, y = Math.random() * 40;
      pctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
      pctx.fillRect(x, y, 1, 1);
    }
    texCache.grain = ctx.createPattern(pc, 'repeat');
    return texCache.grain;
  }

  function fitCanvas() {
    var ratio = window.devicePixelRatio || 1;
    logicalW = wrap.clientWidth;
    logicalH = wrap.clientHeight;
    canvas.width = logicalW * ratio;
    canvas.height = logicalH * ratio;
    canvas.style.width = logicalW + 'px';
    canvas.style.height = logicalH + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex, percent) {
    var f = parseInt(hex.slice(1), 16);
    var t = percent < 0 ? 0 : 255;
    var p = Math.abs(percent) / 100;
    var R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
    return '#' + (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    ).toString(16).slice(1);
  }

  function renderMaterialText(text, cx, cy, fontPx) {
    var textWidth = ctx.measureText(text).width;
    var bx = cx - textWidth / 2 - fontPx * 0.2, by = cy - fontPx * 0.65;
    var bw = textWidth + fontPx * 0.4, bh = fontPx * 1.3;

    ctx.save();

    if (state.material === 'metal') {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = fontPx * 0.14;
      ctx.shadowOffsetX = fontPx * 0.015;
      ctx.shadowOffsetY = fontPx * 0.06;
      ctx.fillStyle = shade(state.color, -40);
      ctx.fillText(text, cx, cy);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = shade(state.color, 60);
      ctx.fillText(text, cx - fontPx * 0.012, cy - fontPx * 0.018);
      ctx.restore();

      var grad = ctx.createLinearGradient(0, cy - fontPx * 0.55, 0, cy + fontPx * 0.55);
      grad.addColorStop(0, shade(state.color, 45));
      grad.addColorStop(0.48, state.color);
      grad.addColorStop(0.52, shade(state.color, -8));
      grad.addColorStop(1, shade(state.color, -35));
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = Math.max(1, fontPx * 0.02);
      ctx.strokeText(text, cx, cy);
      ctx.fillText(text, cx, cy);

      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = getBrushedPattern();
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();

    } else if (state.material === 'acrylic') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = shade(state.color, -55);
      ctx.fillText(text, cx + fontPx * 0.03, cy + fontPx * 0.05);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = fontPx * 0.16;
      ctx.shadowOffsetY = fontPx * 0.04;
      ctx.globalAlpha = 0.02;
      ctx.fillStyle = '#000';
      ctx.fillText(text, cx, cy);
      ctx.restore();

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      var gloss = ctx.createLinearGradient(0, cy - fontPx * 0.6, 0, cy + fontPx * 0.6);
      gloss.addColorStop(0, 'rgba(255,255,255,0.55)');
      gloss.addColorStop(0.4, 'rgba(255,255,255,0.08)');
      gloss.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gloss;
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();

    } else if (state.material === 'led') {
      ctx.save();
      ctx.shadowColor = state.color;
      ctx.shadowBlur = fontPx * 0.55;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = state.color;
      ctx.shadowBlur = fontPx * 0.28;
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = fontPx * 0.1;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy);
      ctx.restore();

      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);

    } else {
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);

      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = getGrainPattern();
      ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawRuler() {
    var footPx = PPF * state.zoom;
    var x0 = 24, y0 = logicalH - 24;
    ctx.save();
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + footPx, y0);
    ctx.moveTo(x0, y0 - 6);
    ctx.lineTo(x0, y0 + 6);
    ctx.moveTo(x0 + footPx, y0 - 6);
    ctx.lineTo(x0 + footPx, y0 + 6);
    ctx.stroke();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = '600 12px Barlow, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('1 ft reference', x0 + footPx / 2, y0 - 10);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, logicalW, logicalH);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, logicalW, logicalH);
    ctx.strokeStyle = 'rgba(15,23,42,0.07)';
    ctx.lineWidth = 1;
    var gridSize = Math.max(10, 20 * state.zoom);
    var offsetX = (logicalW / 2 + state.panX) % gridSize;
    var offsetY = (logicalH / 2 + state.panY) % gridSize;
    for (var x = offsetX; x < logicalW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, logicalH);
      ctx.stroke();
    }
    for (var y = offsetY; y < logicalH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(logicalW, y);
      ctx.stroke();
    }

    var centerX = logicalW / 2 + state.panX;
    var centerY = logicalH / 2 + state.panY;

    var fontPx = Math.max(6, (state.heightInches / 12) * PPF * state.zoom);
    ctx.font = "700 " + fontPx + "px " + state.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var displayText = state.text || 'YOUR SIGN';
    var textWidth = ctx.measureText(displayText).width;

    var padX = fontPx * 0.5;
    var padY = fontPx * 0.35;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#0a0a0a';
    roundRect(centerX - textWidth / 2 - padX, centerY - fontPx / 2 - padY, textWidth + padX * 2, fontPx + padY * 2, 10);
    ctx.fill();
    ctx.restore();

    renderMaterialText(displayText, centerX, centerY, fontPx);
    drawRuler();

    if (window.updateDesign3D) {
      window.updateDesign3D({
        text: displayText,
        material: state.material,
        color: state.color,
        heightInches: state.heightInches,
      });
    }
  }

  function updateHeightLabel() {
    if (state.unit === 'ft') {
      els.heightLabel.textContent = (Math.round((state.heightInches / 12) * 10) / 10) + ' ft';
    } else {
      els.heightLabel.textContent = Math.round(state.heightInches) + ' in';
    }
  }

  function setZoom(z) {
    state.zoom = Math.min(3, Math.max(0.3, z));
    els.zoomLabel.textContent = Math.round(state.zoom * 100) + '%';
    draw();
  }

  els.text.addEventListener('input', function () {
    state.text = els.text.value.toUpperCase().slice(0, 40);
    draw();
  });

  els.font.addEventListener('change', function () {
    var opt = els.font.selectedOptions[0];
    state.font = opt.value;
    state.fontLabel = opt.textContent;
    draw();
  });

  els.height.addEventListener('input', function () {
    var val = parseFloat(els.height.value) || 0;
    state.heightInches = state.unit === 'ft' ? val * 12 : val;
    updateHeightLabel();
    draw();
  });

  var unitRadios = document.querySelectorAll('input[name="d-unit"]');
  unitRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (!this.checked) return;
      state.unit = this.value;
      if (state.unit === 'ft') {
        els.height.value = Math.round((state.heightInches / 12) * 10) / 10;
        els.height.step = '0.5';
        els.height.min = '0.5';
      } else {
        els.height.value = Math.round(state.heightInches);
        els.height.step = '1';
        els.height.min = '1';
      }
      updateHeightLabel();
    });
  });

  els.material.addEventListener('change', function () {
    var opt = els.material.selectedOptions[0];
    state.material = opt.value;
    state.materialLabel = opt.textContent;
    if (els.materialDesc) {
      els.materialDesc.innerHTML = materialDescriptions[state.material] || '';
    }
    draw();
  });

  els.color.addEventListener('input', function () {
    state.color = els.color.value;
    draw();
  });

  els.swatches.forEach(function (sw) {
    sw.addEventListener('click', function () {
      state.color = sw.getAttribute('data-swatch');
      els.color.value = state.color;
      draw();
    });
  });

  els.zoomIn.addEventListener('click', function () { setZoom(state.zoom + 0.2); });
  els.zoomOut.addEventListener('click', function () { setZoom(state.zoom - 0.2); });
  els.zoomReset.addEventListener('click', function () {
    state.panX = 0;
    state.panY = 0;
    setZoom(1);
  });

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    setZoom(state.zoom + (e.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  canvas.addEventListener('mousedown', function (e) {
    dragging = true;
    dragMoved = false;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function () {
    dragging = false;
    canvas.style.cursor = 'grab';
  });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    dragMoved = true;
    state.panX += (e.clientX - lastX);
    state.panY += (e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    draw();
  });

  canvas.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    dragging = true;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    if (!dragging || e.touches.length !== 1) return;
    state.panX += (e.touches[0].clientX - lastX);
    state.panY += (e.touches[0].clientY - lastY);
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
    draw();
  }, { passive: true });
  canvas.addEventListener('touchend', function () { dragging = false; });

  els.send.addEventListener('click', function () {
    var dataUrl = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'signco-design.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    var heightDisplay = state.unit === 'ft'
      ? (Math.round((state.heightInches / 12) * 10) / 10) + ' ft'
      : Math.round(state.heightInches) + ' in';

    var summary = 'Custom Sign Design (from Design Now tool)\n' +
      '- Text: "' + (state.text || 'YOUR SIGN') + '"\n' +
      '- Font: ' + state.fontLabel + '\n' +
      '- Letter Height: ' + heightDisplay + '\n' +
      '- Material: ' + state.materialLabel + '\n' +
      '- Color: ' + state.color;

    try { localStorage.setItem('signcoDesignSummary', summary); } catch (e) { /* ignore */ }
    window.location.href = 'contact.html?design=1';
  });

  window.addEventListener('resize', function () {
    fitCanvas();
    draw();
  });

  fitCanvas();
  updateHeightLabel();
  canvas.style.cursor = 'grab';

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(draw);
  }
  draw();

  // ---- 2D / 3D view toggle ----
  var view2dBtn = document.getElementById('d-view-2d');
  var view3dBtn = document.getElementById('d-view-3d');
  var controls2d = document.getElementById('d-controls-2d');
  var controls3d = document.getElementById('d-controls-3d');
  var wrap2d = document.getElementById('d-canvas-2d-wrap');
  var wrap3d = document.getElementById('d-canvas-3d-wrap');
  var reset3dBtn = document.getElementById('d-3d-reset');
  var view3dInitialized = false;

  function showView(view) {
    var is3d = view === '3d';
    wrap2d.classList.toggle('hidden', is3d);
    wrap3d.classList.toggle('hidden', !is3d);
    controls2d.classList.toggle('hidden', is3d);
    controls3d.classList.toggle('hidden', !is3d);

    view2dBtn.classList.toggle('bg-steel', !is3d);
    view2dBtn.classList.toggle('text-white', !is3d);
    view2dBtn.classList.toggle('text-navy', is3d);
    view2dBtn.setAttribute('aria-pressed', String(!is3d));

    view3dBtn.classList.toggle('bg-steel', is3d);
    view3dBtn.classList.toggle('text-white', is3d);
    view3dBtn.classList.toggle('text-navy', !is3d);
    view3dBtn.setAttribute('aria-pressed', String(is3d));

    if (is3d) {
      if (!view3dInitialized && window.initDesign3D) {
        window.initDesign3D(wrap3d);
        view3dInitialized = true;
      }
      if (window.resizeDesign3D) window.resizeDesign3D();
      draw();
    }
  }

  if (view2dBtn && view3dBtn) {
    view2dBtn.addEventListener('click', function () { showView('2d'); });
    view3dBtn.addEventListener('click', function () { showView('3d'); });
  }
  if (reset3dBtn) {
    reset3dBtn.addEventListener('click', function () {
      if (window.resetDesign3DView) window.resetDesign3DView();
    });
  }
});
