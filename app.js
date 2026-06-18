import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import {
  PLATE_TYPES,
  DEFAULT_PLATE_TYPE_ID,
  TEXTURE_ROOT,
  PLATE_FONT_CONFIG
} from './plateConfig.js';

const PLATE_WIDTH = 4.4;
const PLATE_HEIGHT = 2.2;
const PLATE_THICKNESS = 0.045;
const PLATE_CORNER_RADIUS = 0.16;
const PLATE_FACE_INSET = 0.1;
const TEXT_GEOMETRY_CENTER_Y_OFFSET = 0.02;
const TEXT_MESH_Y_OFFSET = 0.12;
const TEXT_MESH_Z_OFFSET = 0.004;

/* ================================================================
   STATE
   ================================================================ */
let currentText = '';
let currentPlateId = DEFAULT_PLATE_TYPE_ID;
let is3D = true;
let loadedFont = null;
let textMesh = null;
let plateTypes = [];

/* ================================================================
   DOM REFERENCES
   ================================================================ */
const plateInputEl = document.getElementById('plate-input');
const charCountEl = document.getElementById('char-count');
const galleryEl = document.getElementById('plate-gallery');

const viewToggleEl = document.getElementById('view-toggle');
const toggleLabelEl = document.getElementById('toggle-label');
const toggleSubEl = document.getElementById('toggle-sub');
const modeBadgeEl = document.getElementById('mode-badge');
const view2dEl = document.getElementById('view-2d');
const hint3dEl = document.getElementById('hint-3d');
const threeMountEl = document.getElementById('three-mount');

const canvas2dEl = document.getElementById('canvas-2d');
const ctx2d = canvas2dEl.getContext('2d');
const previewEl = document.getElementById('preview-area');

/* ================================================================
   THREE.JS SCENE
   ================================================================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f17);
scene.fog = new THREE.FogExp2(0x0f0f17, 0.12);

const camera = new THREE.PerspectiveCamera(
  45,
  previewEl.clientWidth / Math.max(previewEl.clientHeight, 1),
  0.1,
  100
);
camera.position.set(0, 0.5, 5.1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(previewEl.clientWidth, previewEl.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
threeMountEl.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.6;
controls.maxDistance = 12;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.7;
controls.target.set(0, 0, 0);

controls.addEventListener('start', () => {
  controls.autoRotate = false;
  hint3dEl.style.opacity = '0';
});

scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
dirLight.position.set(4, 6, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
fillLight.position.set(-4, -2, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x6c63ff, 0.4);
rimLight.position.set(0, 4, -5);
scene.add(rimLight);

const plateGroup = new THREE.Group();
scene.add(plateGroup);

const plateBodyGeo = new RoundedBoxGeometry(
  PLATE_WIDTH,
  PLATE_HEIGHT,
  PLATE_THICKNESS,
  5,
  PLATE_CORNER_RADIUS
);
const plateBodyMat = new THREE.MeshStandardMaterial({
  color: 0xc7c9cf,
  metalness: 0.72,
  roughness: 0.36
});
const plateBodyMesh = new THREE.Mesh(plateBodyGeo, plateBodyMat);
plateBodyMesh.castShadow = true;
plateGroup.add(plateBodyMesh);

const plateFaceGeo = new THREE.PlaneGeometry(
  PLATE_WIDTH - PLATE_FACE_INSET,
  PLATE_HEIGHT - PLATE_FACE_INSET
);
const plateFaceMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.28,
  roughness: 0.74
});
const plateFaceMesh = new THREE.Mesh(plateFaceGeo, plateFaceMat);
plateFaceMesh.position.z = PLATE_THICKNESS * 0.5 + 0.001;
plateGroup.add(plateFaceMesh);

const floorGeo = new THREE.PlaneGeometry(30, 30);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a14,
  metalness: 0.05,
  roughness: 0.95
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
floor.receiveShadow = true;
scene.add(floor);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

/* ================================================================
   HELPERS
   ================================================================ */
function getDisplayText(text) {
  return text && text.trim() ? text : 'YOUR PLATE';
}

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawPlate2D(ctx, plateType, text, w, h) {
  ctx.clearRect(0, 0, w, h);

  const radius = h * 0.08;
  roundedRectPath(ctx, 0, 0, w, h, radius);
  ctx.save();
  ctx.clip();

  if (plateType?.previewImage) {
    ctx.drawImage(plateType.previewImage, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#f2f3f8';
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();

  ctx.lineWidth = Math.max(2, h * 0.02);
  ctx.strokeStyle = 'rgba(10, 12, 20, 0.5)';
  roundedRectPath(ctx, ctx.lineWidth * 0.5, ctx.lineWidth * 0.5, w - ctx.lineWidth, h - ctx.lineWidth, radius * 0.9);
  ctx.stroke();

  const boltR = h * 0.03;
  const boltY = h * 0.22;
  [w * 0.14, w * 0.86].forEach((x) => {
    ctx.beginPath();
    ctx.fillStyle = 'rgba(25,28,38,0.45)';
    ctx.arc(x, boltY, boltR, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = plateType?.textColor2D || '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const display = getDisplayText(text);
  const maxW = w * 0.76;
  let fontSize = h * 0.42;
  const fontFamily = "'Arial Black', Arial, sans-serif";
  ctx.font = `700 ${fontSize}px ${fontFamily}`;
  while (ctx.measureText(display).width > maxW && fontSize > 10) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
  }

  if (!(text && text.trim())) {
    ctx.globalAlpha = 0.35;
  }

  ctx.fillText(display, w * 0.5, h * 0.62);
  ctx.globalAlpha = 1;
}

function createPlaceholderCanvas(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const c = canvas.getContext('2d');

  c.fillStyle = '#f3f4f8';
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.lineWidth = 14;
  c.strokeStyle = '#363a48';
  roundedRectPath(c, 16, 16, canvas.width - 32, canvas.height - 32, 42);
  c.stroke();

  c.fillStyle = '#737991';
  c.font = '700 72px Arial, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label.toUpperCase(), canvas.width / 2, canvas.height * 0.27);

  return canvas;
}

function imageFromTexture(texture) {
  if (!texture?.image) {
    return null;
  }
  if (texture.image instanceof HTMLImageElement || texture.image instanceof HTMLCanvasElement) {
    return texture.image;
  }
  return null;
}

function loadTextureSafe(url, { color = false } = {}) {
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.anisotropy = maxAnisotropy;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        if (color) {
          texture.colorSpace = THREE.SRGBColorSpace;
        }
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

async function loadPlateTypeAssets(typeDef) {
  const folder = `${TEXTURE_ROOT}/${typeDef.folder}`;
  const diffusePath = `${folder}/texture.png`;
  const normalPath = `${folder}/texture_n.png`;

  const [diffuseTexture, normalTexture] = await Promise.all([
    loadTextureSafe(diffusePath, { color: true }),
    loadTextureSafe(normalPath)
  ]);

  const placeholderCanvas = createPlaceholderCanvas(typeDef.name);
  const fallbackTexture = new THREE.CanvasTexture(placeholderCanvas);
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.anisotropy = maxAnisotropy;

  return {
    ...typeDef,
    diffuseTexture: diffuseTexture || fallbackTexture,
    normalTexture,
    previewImage: imageFromTexture(diffuseTexture) || placeholderCanvas
  };
}

function getCurrentPlateType() {
  return plateTypes.find((plateType) => plateType.id === currentPlateId) || plateTypes[0] || null;
}

function applyPlateSurface() {
  const plateType = getCurrentPlateType();
  if (!plateType) return;

  plateFaceMat.map = plateType.diffuseTexture || null;
  plateFaceMat.normalMap = plateType.normalTexture || null;
  plateFaceMat.needsUpdate = true;
}

function disposeTextMesh() {
  if (!textMesh) return;
  plateGroup.remove(textMesh);
  textMesh.geometry.dispose();
  textMesh.material.dispose();
  textMesh = null;
}

function build3DText() {
  disposeTextMesh();
  if (!loadedFont) return;

  const plateType = getCurrentPlateType();
  const display = getDisplayText(currentText);
  const isPlaceholder = !(currentText && currentText.trim());

  const geometry = new TextGeometry(display, {
    font: loadedFont,
    size: 0.62,
    height: 0.03,
    curveSegments: 8,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.003,
    bevelSegments: 2
  });

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const rawWidth = bounds.max.x - bounds.min.x;
  const maxWidth = (PLATE_WIDTH - PLATE_FACE_INSET) * 0.72;

  if (rawWidth > maxWidth) {
    const scale = maxWidth / rawWidth;
    geometry.scale(scale, scale, 1);
    geometry.computeBoundingBox();
  }

  const centered = geometry.boundingBox;
  const centerX = (centered.min.x + centered.max.x) * 0.5;
  const centerY = (centered.min.y + centered.max.y) * 0.5;
  geometry.translate(-centerX, -centerY - TEXT_GEOMETRY_CENTER_Y_OFFSET, 0);

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(plateType?.textColor3D || '#161616'),
    metalness: 0.2,
    roughness: 0.6,
    transparent: isPlaceholder,
    opacity: isPlaceholder ? 0.45 : 1
  });

  textMesh = new THREE.Mesh(geometry, material);
  textMesh.position.set(0, -TEXT_MESH_Y_OFFSET, PLATE_THICKNESS * 0.5 + TEXT_MESH_Z_OFFSET);
  textMesh.castShadow = true;
  textMesh.visible = is3D;
  plateGroup.add(textMesh);
}

async function loadConfiguredFont() {
  const loader = new FontLoader();

  const loadFontAt = (url) => new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  try {
    return await loadFontAt(PLATE_FONT_CONFIG.customTypefaceUrl);
  } catch {
    try {
      return await loadFontAt(PLATE_FONT_CONFIG.fallbackTypefaceUrl);
    } catch {
      return null;
    }
  }
}

/* ================================================================
   UI UPDATE FLOWS
   ================================================================ */
function buildGallery() {
  galleryEl.innerHTML = '';

  plateTypes.forEach((plateType) => {
    const card = document.createElement('div');
    card.className = `plate-card${plateType.id === currentPlateId ? ' active' : ''}`;
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', plateType.id === currentPlateId ? 'true' : 'false');
    card.dataset.id = plateType.id;

    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 240;
    thumbCanvas.height = 120;
    drawPlate2D(thumbCanvas.getContext('2d'), plateType, 'SAMPLE', 240, 120);

    const name = document.createElement('div');
    name.className = 'plate-card-name';
    name.textContent = plateType.name;

    card.appendChild(thumbCanvas);
    card.appendChild(name);

    card.addEventListener('click', () => {
      currentPlateId = plateType.id;
      buildGallery();
      updatePreview();
    });

    galleryEl.appendChild(card);
  });
}

function draw2D() {
  const plateType = getCurrentPlateType();
  drawPlate2D(ctx2d, plateType, currentText, canvas2dEl.width, canvas2dEl.height);
}

function applyViewMode() {
  modeBadgeEl.textContent = is3D ? '3D' : '2D';
  toggleLabelEl.textContent = is3D ? '3D View' : '2D View';
  toggleSubEl.textContent = is3D ? 'Drag to rotate' : 'Flat preview';

  threeMountEl.style.display = is3D ? 'block' : 'none';
  view2dEl.classList.toggle('visible', !is3D);
  hint3dEl.style.display = is3D ? 'block' : 'none';

  if (textMesh) {
    textMesh.visible = is3D;
  }
}

function updatePreview() {
  applyPlateSurface();
  build3DText();

  if (!is3D) {
    draw2D();
  }
}

/* ================================================================
   EVENT HANDLERS
   ================================================================ */
plateInputEl.addEventListener('input', () => {
  const value = plateInputEl.value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .slice(0, 8);

  plateInputEl.value = value;
  currentText = value;
  charCountEl.textContent = `${value.length} / 8`;
  charCountEl.classList.toggle('warn', value.length >= 7);

  updatePreview();
});

viewToggleEl.addEventListener('change', () => {
  is3D = !viewToggleEl.checked;
  applyViewMode();
  updatePreview();
});

window.addEventListener('resize', () => {
  const w = previewEl.clientWidth;
  const h = Math.max(previewEl.clientHeight, 1);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

/* ================================================================
   ANIMATION
   ================================================================ */
function animate() {
  requestAnimationFrame(animate);
  if (!is3D) return;

  controls.update();
  renderer.render(scene, camera);
}

/* ================================================================
   INIT
   ================================================================ */
(async function init() {
  plateTypes = await Promise.all(PLATE_TYPES.map(loadPlateTypeAssets));

  if (!plateTypes.some((plateType) => plateType.id === currentPlateId) && plateTypes.length > 0) {
    currentPlateId = plateTypes[0].id;
  }

  loadedFont = await loadConfiguredFont();

  buildGallery();
  applyViewMode();
  updatePreview();
  animate();

  setTimeout(() => {
    hint3dEl.style.opacity = '0';
  }, 4000);
})();
