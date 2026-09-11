(function () {
  var scene, camera, renderer, controls, signMesh, canvasTexture, container;
  var faceCanvas, faceCtx;
  var initialized = false;

  function hexToInt(hex) {
    return parseInt(hex.replace('#', '0x'), 16);
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

  function fitRendererToContainer() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  function init(containerEl) {
    if (initialized) return;
    container = containerEl;

    faceCanvas = document.createElement('canvas');
    faceCanvas.width = 1024;
    faceCanvas.height = 512;
    faceCtx = faceCanvas.getContext('2d');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe2e8f0);

    var w = container.clientWidth || 800;
    var h = container.clientHeight || 520;
    camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(1.1, 1.5, 8.2);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    var key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(3, 5, 4);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    var groundGeo = new THREE.PlaneGeometry(30, 30);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 1 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);

    canvasTexture = new THREE.CanvasTexture(faceCanvas);
    canvasTexture.minFilter = THREE.LinearFilter;

    var geo = new THREE.BoxGeometry(4, 2, 0.4);
    var sideMat = new THREE.MeshStandardMaterial({ color: 0x1c5a8c, metalness: 0.4, roughness: 0.5 });
    var edgeMat = sideMat.clone();
    var frontMat = new THREE.MeshStandardMaterial({ map: canvasTexture, metalness: 0.1, roughness: 0.6 });
    var backMat = sideMat.clone();
    // BoxGeometry face material order: [+X, -X, +Y, -Y, +Z, -Z]
    signMesh = new THREE.Mesh(geo, [sideMat, sideMat, edgeMat, edgeMat, frontMat, backMat]);
    scene.add(signMesh);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 14;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.target.set(0, 0, 0);

    window.addEventListener('resize', fitRendererToContainer);

    initialized = true;
    animate();
  }

  window.initDesign3D = function (containerEl) {
    init(containerEl);
  };

  window.resizeDesign3D = function () {
    if (initialized) fitRendererToContainer();
  };

  window.resetDesign3DView = function () {
    if (!initialized) return;
    camera.position.set(1.1, 1.5, 8.2);
    controls.target.set(0, 0, 0);
    controls.update();
  };

  function renderFaceTexture(state) {
    var w = faceCanvas.width, h = faceCanvas.height;
    faceCtx.clearRect(0, 0, w, h);
    faceCtx.fillStyle = '#0a0a0a';
    faceCtx.fillRect(0, 0, w, h);

    var text = (state.text || 'YOUR SIGN').toUpperCase();
    var fontPx = 140;
    faceCtx.textAlign = 'center';
    faceCtx.textBaseline = 'middle';
    faceCtx.font = "700 " + fontPx + "px 'Barlow Condensed', sans-serif";
    var maxW = w * 0.86;
    var textWidth = faceCtx.measureText(text).width;
    while (textWidth > maxW && fontPx > 20) {
      fontPx -= 4;
      faceCtx.font = "700 " + fontPx + "px 'Barlow Condensed', sans-serif";
      textWidth = faceCtx.measureText(text).width;
    }

    var cx = w / 2, cy = h / 2;
    faceCtx.save();
    if (state.material === 'metal') {
      var grad = faceCtx.createLinearGradient(0, cy - fontPx / 2, 0, cy + fontPx / 2);
      grad.addColorStop(0, shade(state.color, 45));
      grad.addColorStop(0.5, state.color);
      grad.addColorStop(1, shade(state.color, -30));
      faceCtx.fillStyle = grad;
      faceCtx.strokeStyle = 'rgba(0,0,0,0.55)';
      faceCtx.lineWidth = Math.max(1, fontPx * 0.02);
      faceCtx.strokeText(text, cx, cy);
      faceCtx.fillText(text, cx, cy);
    } else if (state.material === 'acrylic') {
      faceCtx.globalAlpha = 0.9;
      faceCtx.fillStyle = state.color;
      faceCtx.fillText(text, cx, cy);
      faceCtx.globalAlpha = 0.35;
      faceCtx.fillStyle = '#ffffff';
      faceCtx.fillText(text, cx, cy - fontPx * 0.06);
    } else if (state.material === 'led') {
      faceCtx.shadowColor = state.color;
      faceCtx.shadowBlur = fontPx * 0.4;
      faceCtx.fillStyle = state.color;
      faceCtx.fillText(text, cx, cy);
      faceCtx.shadowBlur = fontPx * 0.18;
      faceCtx.globalAlpha = 0.65;
      faceCtx.fillStyle = '#ffffff';
      faceCtx.fillText(text, cx, cy);
    } else {
      faceCtx.fillStyle = state.color;
      faceCtx.fillText(text, cx, cy);
    }
    faceCtx.restore();
  }

  window.updateDesign3D = function (state) {
    if (!initialized) return;
    renderFaceTexture(state);
    canvasTexture.needsUpdate = true;

    var colorInt = hexToInt(state.color);
    var mats = signMesh.material;
    var frontMat = mats[4];
    var sideMat = mats[0];
    var edgeMat = mats[2];
    var backMat = mats[5];

    [frontMat, sideMat, edgeMat, backMat].forEach(function (m) {
      m.emissive.setHex(0x000000);
      m.emissiveIntensity = 0;
      m.transparent = false;
      m.opacity = 1;
    });

    if (state.material === 'metal') {
      frontMat.metalness = 0.7; frontMat.roughness = 0.3;
      [sideMat, edgeMat, backMat].forEach(function (m) {
        m.color.setHex(colorInt); m.metalness = 0.75; m.roughness = 0.3;
      });
    } else if (state.material === 'acrylic') {
      frontMat.metalness = 0.05; frontMat.roughness = 0.15;
      frontMat.transparent = true; frontMat.opacity = 0.94;
      [sideMat, edgeMat, backMat].forEach(function (m) {
        m.color.setHex(colorInt); m.transparent = true; m.opacity = 0.82; m.roughness = 0.2; m.metalness = 0.05;
      });
    } else if (state.material === 'led') {
      frontMat.metalness = 0; frontMat.roughness = 0.4;
      frontMat.emissive.setHex(colorInt); frontMat.emissiveIntensity = 0.85;
      [sideMat, edgeMat, backMat].forEach(function (m) {
        m.color.setHex(colorInt); m.emissive.setHex(colorInt); m.emissiveIntensity = 0.35; m.metalness = 0; m.roughness = 0.5;
      });
    } else {
      frontMat.metalness = 0; frontMat.roughness = 0.9;
      [sideMat, edgeMat, backMat].forEach(function (m) {
        m.color.setHex(0x111111); m.metalness = 0; m.roughness = 0.9;
      });
    }

    var heightScale = Math.max(0.65, Math.min(1.7, (state.heightInches || 36) / 40));
    signMesh.scale.set(heightScale, heightScale, 1);
  };
})();
