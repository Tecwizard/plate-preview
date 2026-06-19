import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import {
  PLATE_TYPES,
  DEFAULT_PLATE_TYPE_ID,
  TEXTURE_ROOT,
  TEXTURE_FILES,
  PLATE_TEXT_3D_CONFIG,
  PLATE_FONT_CONFIG
} from './plateConfig.js';
import { PLATE_MODEL_CONFIG } from './plateObjectConfig.js';

const PLATE_WIDTH = PLATE_MODEL_CONFIG.width;
const PLATE_HEIGHT = PLATE_MODEL_CONFIG.height;
const PLATE_THICKNESS = PLATE_MODEL_CONFIG.thickness;
const PLATE_CORNER_RADIUS_MIN = 0;
const PLATE_CORNER_RADIUS_MAX = Math.min(PLATE_WIDTH, PLATE_HEIGHT) / 2;
const PLATE_CORNER_RADIUS = THREE.MathUtils.clamp(
  PLATE_MODEL_CONFIG.cornerRadius,
  PLATE_CORNER_RADIUS_MIN,
  PLATE_CORNER_RADIUS_MAX
);
const PLATE_FACE_INSET_MIN = 0;
const PLATE_FACE_INSET_MAX = Math.min(PLATE_WIDTH, PLATE_HEIGHT) - 0.001;
const PLATE_FACE_INSET = THREE.MathUtils.clamp(
  PLATE_MODEL_CONFIG.faceInset,
  PLATE_FACE_INSET_MIN,
  PLATE_FACE_INSET_MAX
);
const PLATE_FACE_WIDTH = PLATE_WIDTH - PLATE_FACE_INSET;
const PLATE_FACE_HEIGHT = PLATE_HEIGHT - PLATE_FACE_INSET;
const PLATE_FACE_CORNER_RADIUS = THREE.MathUtils.clamp(
  PLATE_CORNER_RADIUS - (PLATE_FACE_INSET * 0.5),
  0,
  Math.min(PLATE_FACE_WIDTH, PLATE_FACE_HEIGHT) / 2
);
const UV_MIN_DIMENSION = 1e-6;
const TEXT_GEOMETRY_CENTER_Y_OFFSET = PLATE_TEXT_3D_CONFIG.centerYOffset;
const TEXT_MESH_Y_OFFSET = PLATE_TEXT_3D_CONFIG.meshYOffset;
const TEXT_MESH_Z_OFFSET = PLATE_TEXT_3D_CONFIG.meshZOffset;
const SURFACE_TEXTURE_ROOT = `${TEXTURE_ROOT}/surface`;
const SURFACE_OVERLAY_OPACITY = 0.15;
const SURFACE_BUMP_SCALE = 0.5;
const PLATE_FACE_ENV_INTENSITY = 2.2;
const SURFACE_TEXTURE_ALIASES = {
  overlay: ['overlay', 'color', 'albedo', 'basecolor', 'diffuse', 'Metal032_2K-PNG_Color', 'Metal032'],
  roughness: ['roughness', 'Metal032_2K-PNG_Roughness'],
  metalness: ['metalness', 'metallic', 'Metal032_2K-PNG_Metalness'],
  normal: ['normal', 'normalgl', 'Metal032_2K-PNG_NormalGL', 'normaldx', 'Metal032_2K-PNG_NormalDX'],
  height: ['height', 'displacement', 'Metal032_2K-PNG_Displacement']
};

/* ================================================================
   STATE
   ================================================================ */
let currentText = '';
let currentPlateId = DEFAULT_PLATE_TYPE_ID;
let is3D = true;
let loadedFont = null;
let textMesh = null;
let plateTypes = [];
let surfaceMaterialMaps = null;

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
scene.background = new THREE.Color(0x000000);

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
threeMountEl.appendChild(renderer.domElement);

function createSoftEnvironmentTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#33435a');
  gradient.addColorStop(0.52, '#1f2b3f');
  gradient.addColorStop(1, '#0f141f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const softKey = ctx.createRadialGradient(
    canvas.width * 0.58,
    canvas.height * 0.44,
    canvas.width * 0.02,
    canvas.width * 0.58,
    canvas.height * 0.44,
    canvas.width * 0.35
  );
  softKey.addColorStop(0, 'rgba(230, 236, 245, 0.28)');
  softKey.addColorStop(1, 'rgba(230, 236, 245, 0)');
  ctx.fillStyle = softKey;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const softFill = ctx.createRadialGradient(
    canvas.width * 0.25,
    canvas.height * 0.58,
    canvas.width * 0.02,
    canvas.width * 0.25,
    canvas.height * 0.58,
    canvas.width * 0.28
  );
  softFill.addColorStop(0, 'rgba(176, 198, 230, 0.16)');
  softFill.addColorStop(1, 'rgba(176, 198, 230, 0)');
  ctx.fillStyle = softFill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const envTexture = new THREE.CanvasTexture(canvas);
  envTexture.colorSpace = THREE.SRGBColorSpace;
  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  return envTexture;
}

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const softEnvironmentTexture = createSoftEnvironmentTexture();
scene.environment = pmremGenerator.fromEquirectangular(softEnvironmentTexture).texture;
softEnvironmentTexture.dispose();
pmremGenerator.dispose();

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

scene.add(new THREE.AmbientLight(0xffffff, 1.6));

const dirLight = new THREE.DirectionalLight(0xffffff, 2.1);
dirLight.position.set(4, 6, 6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xd9e8ff, 0.7);
fillLight.position.set(-5, 1, 3);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.75);
rimLight.position.set(0, 3, -5);
scene.add(rimLight);

const plateGroup = new THREE.Group();
scene.add(plateGroup);

function createRoundedRectShape(width, height, radius) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;
  const r = Math.min(Math.max(radius, 0), halfW, halfH);
  const shape = new THREE.Shape();

  shape.moveTo(-halfW + r, -halfH);
  shape.lineTo(halfW - r, -halfH);
  shape.absarc(halfW - r, -halfH + r, r, -Math.PI / 2, 0);
  shape.lineTo(halfW, halfH - r);
  shape.absarc(halfW - r, halfH - r, r, 0, Math.PI / 2);
  shape.lineTo(-halfW + r, halfH);
  shape.absarc(-halfW + r, halfH - r, r, Math.PI / 2, Math.PI);
  shape.lineTo(-halfW, -halfH + r);
  shape.absarc(-halfW + r, -halfH + r, r, Math.PI, (Math.PI * 3) / 2);

  return shape;
}

function fitGeometryUvToBounds(geometry) {
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) return;

  const sizeX = Math.max(bounds.max.x - bounds.min.x, UV_MIN_DIMENSION);
  const sizeY = Math.max(bounds.max.y - bounds.min.y, UV_MIN_DIMENSION);
  const positions = geometry.attributes.position;
  const uv = new Float32Array(positions.count * 2);

  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    uv[i * 2] = (x - bounds.min.x) / sizeX;
    uv[i * 2 + 1] = (y - bounds.min.y) / sizeY;
  }

  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

const plateBodyGeo = new THREE.ExtrudeGeometry(
  createRoundedRectShape(PLATE_WIDTH, PLATE_HEIGHT, PLATE_CORNER_RADIUS),
  {
    depth: PLATE_THICKNESS,
    steps: 1,
    curveSegments: 24,
    bevelEnabled: false
  }
);
plateBodyGeo.translate(0, 0, -PLATE_THICKNESS * 0.5);
const plateBodyMat = new THREE.MeshStandardMaterial({
  color: 0xc7c9cf,
  metalness: 0.9,
  roughness: 0.22,
  envMapIntensity: 1.1
});
const plateBodyMesh = new THREE.Mesh(plateBodyGeo, plateBodyMat);
plateBodyMesh.castShadow = true;
plateGroup.add(plateBodyMesh);

const plateFaceGeo = new THREE.ShapeGeometry(
  createRoundedRectShape(PLATE_FACE_WIDTH, PLATE_FACE_HEIGHT, PLATE_FACE_CORNER_RADIUS)
);
fitGeometryUvToBounds(plateFaceGeo);
const plateFaceMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.84,
  roughness: 0.08,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: PLATE_FACE_ENV_INTENSITY
});
const plateFaceMesh = new THREE.Mesh(plateFaceGeo, plateFaceMat);
plateFaceMesh.position.z = PLATE_THICKNESS * 0.5 + 0.001;
plateGroup.add(plateFaceMesh);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

function createSurfaceOverlayTexture(baseTexture, overlayTexture, opacity = SURFACE_OVERLAY_OPACITY) {
  const baseImage = baseTexture?.image;
  const overlayImage = overlayTexture?.image;
  if (!baseImage) return baseTexture;
  if (!overlayImage) return baseTexture;

  const w = baseImage.width || 1024;
  const h = baseImage.height || 512;
  const blendCanvas = document.createElement('canvas');
  blendCanvas.width = w;
  blendCanvas.height = h;
  const blendCtx = blendCanvas.getContext('2d');

  blendCtx.drawImage(baseImage, 0, 0, w, h);
  blendCtx.globalAlpha = THREE.MathUtils.clamp(opacity, 0, 1);
  blendCtx.globalCompositeOperation = 'soft-light';
  blendCtx.drawImage(overlayImage, 0, 0, w, h);
  blendCtx.globalCompositeOperation = 'screen';
  blendCtx.globalAlpha = THREE.MathUtils.clamp(opacity * 0.4, 0, 1);
  blendCtx.drawImage(overlayImage, 0, 0, w, h);
  blendCtx.globalCompositeOperation = 'source-over';
  blendCtx.globalAlpha = 1;

  const blendedTexture = new THREE.CanvasTexture(blendCanvas);
  blendedTexture.anisotropy = maxAnisotropy;
  blendedTexture.wrapS = baseTexture.wrapS;
  blendedTexture.wrapT = baseTexture.wrapT;
  blendedTexture.colorSpace = THREE.SRGBColorSpace;
  return blendedTexture;
}

function getSurfaceTextureAttemptPaths(kind) {
  const extensions = ['png', 'jpg', 'jpeg', 'webp'];
  const names = SURFACE_TEXTURE_ALIASES[kind] || [kind];
  const attempts = [];

  for (const name of names) {
    for (const extension of extensions) {
      attempts.push(`${SURFACE_TEXTURE_ROOT}/${name}.${extension}`);
    }
  }

  return attempts;
}

async function loadSurfaceTextureVariants(kind, options) {
  const attempts = getSurfaceTextureAttemptPaths(kind);

  for (const path of attempts) {
    const texture = await loadTextureSafe(path, options);
    if (texture) {
      return texture;
    }
  }

  return null;
}

async function loadSurfaceMaterialMaps() {
  const [overlayMap, roughnessMap, metalnessMap, normalMap, heightMap] = await Promise.all([
    loadSurfaceTextureVariants('overlay', { color: true }),
    loadSurfaceTextureVariants('roughness'),
    loadSurfaceTextureVariants('metalness'),
    loadSurfaceTextureVariants('normal'),
    loadSurfaceTextureVariants('height')
  ]);

  if (!overlayMap && !roughnessMap && !metalnessMap && !normalMap && !heightMap) {
    return null;
  }

  return {
    overlayMap,
    roughnessMap,
    metalnessMap,
    normalMap,
    heightMap
  };
}

plateFaceMat.roughness = 0.18;
plateFaceMat.metalness = 0.82;
plateFaceMat.envMapIntensity = PLATE_FACE_ENV_INTENSITY;
plateFaceMat.clearcoat = 1;
plateFaceMat.clearcoatRoughness = 0.06;

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

function getTexturePaths(typeDef) {
  const folder = typeDef.folder ?? typeDef.textureFolder ?? typeDef.name;
  const diffusePath = typeDef.diffuseTexturePath
    ?? typeDef.texturePath
    ?? `${TEXTURE_ROOT}/${folder}/${TEXTURE_FILES.diffuse}`;
  const normalPath = typeDef.normalTexturePath
    ?? typeDef.normalMapPath
    ?? `${TEXTURE_ROOT}/${folder}/${TEXTURE_FILES.normal}`;
  return { diffusePath, normalPath };
}

async function loadPlateTypeAssets(typeDef) {
  const { diffusePath, normalPath } = getTexturePaths(typeDef);

  const [diffuseTexture, normalTexture] = await Promise.all([
    loadTextureSafe(diffusePath, { color: true }),
    loadTextureSafe(normalPath)
  ]);

  const placeholderCanvas = createPlaceholderCanvas(typeDef.name);
  const fallbackTexture = new THREE.CanvasTexture(placeholderCanvas);
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.anisotropy = maxAnisotropy;
  const sourceDiffuseTexture = diffuseTexture || fallbackTexture;
  const finalDiffuseTexture = surfaceMaterialMaps?.overlayMap
    ? createSurfaceOverlayTexture(sourceDiffuseTexture, surfaceMaterialMaps.overlayMap)
    : sourceDiffuseTexture;

  return {
    ...typeDef,
    diffuseTexture: finalDiffuseTexture,
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

  const plateNormalMap = plateType.normalTexture || null;
  const surfaceNormalMap = surfaceMaterialMaps?.normalMap || null;

  plateFaceMat.map = plateType.diffuseTexture || null;
  plateFaceMat.normalMap = plateNormalMap || surfaceNormalMap;
  plateFaceMat.clearcoatNormalMap = plateNormalMap ? surfaceNormalMap : null;
  plateFaceMat.clearcoatNormalScale.set(0.35, 0.35);
  plateFaceMat.roughnessMap = surfaceMaterialMaps?.roughnessMap || null;
  plateFaceMat.metalnessMap = surfaceMaterialMaps?.metalnessMap || null;
  plateFaceMat.bumpMap = surfaceMaterialMaps?.heightMap || null;
  plateFaceMat.bumpScale = surfaceMaterialMaps?.heightMap ? SURFACE_BUMP_SCALE : 0;
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
    size: PLATE_TEXT_3D_CONFIG.size,
    height: PLATE_TEXT_3D_CONFIG.height,
    curveSegments: PLATE_TEXT_3D_CONFIG.curveSegments,
    bevelEnabled: PLATE_TEXT_3D_CONFIG.bevelEnabled,
    bevelThickness: PLATE_TEXT_3D_CONFIG.bevelThickness,
    bevelSize: PLATE_TEXT_3D_CONFIG.bevelSize,
    bevelOffset: PLATE_TEXT_3D_CONFIG.bevelOffset || 0,
    bevelSegments: PLATE_TEXT_3D_CONFIG.bevelSegments
  });

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;

  const centered = geometry.boundingBox;
  const centerX = (centered.min.x + centered.max.x) * 0.5;
  const centerY = (centered.min.y + centered.max.y) * 0.5;
  geometry.translate(-centerX, -centerY - TEXT_GEOMETRY_CENTER_Y_OFFSET, 0);

  const textColor = new THREE.Color(plateType?.textColor3D || '#161616');
  const material = new THREE.MeshPhysicalMaterial({
    color: textColor,
    metalness: 0.25,
    roughness: 0.28,
    clearcoat: 0.35,
    clearcoatRoughness: 0.2,
    envMapIntensity: 1.2,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    transparent: isPlaceholder,
    opacity: isPlaceholder ? 0.45 : 1
  });

  // Keep text shading clean so embossed bevel highlights remain readable.
  material.normalMap = null;
  material.bumpMap = null;
  material.roughnessMap = null;
  material.metalnessMap = null;
  material.map = null;

  textMesh = new THREE.Mesh(geometry, material);
  // Allow slight negative offsets so text can sit into the plate surface.
  const surfaceLift = TEXT_MESH_Z_OFFSET;
  textMesh.position.set(0, -TEXT_MESH_Y_OFFSET, PLATE_THICKNESS * 0.5 + surfaceLift);
  textMesh.castShadow = false;
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
  surfaceMaterialMaps = await loadSurfaceMaterialMaps();
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
