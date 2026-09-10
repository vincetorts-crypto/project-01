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
    ctx.save();
    if (state.material === 'metal') {
      var grad = ctx.createLinearGradient(0, cy - fontPx / 2, 0, cy + fontPx / 2);
      grad.addColorStop(0, shade(state.color, 40));
      grad.addColorStop(0.5, state.color);
      grad.addColorStop(1, shade(state.color, -30));
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = Math.max(1, fontPx * 0.02);
      ctx.strokeText(text, cx, cy);
      ctx.fillText(text, cx, cy);
    } else if (state.material === 'acrylic') {
      ctx.globalAlpha = 0.88;
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy - fontPx * 0.06);
    } else if (state.material === 'led') {
      ctx.shadowColor = state.color;
      ctx.shadowBlur = fontPx * 0.35;
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
      ctx.shadowBlur = fontPx * 0.15;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, cx, cy);
    } else {
      ctx.fillStyle = state.color;
      ctx.fillText(text, cx, cy);
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
});
