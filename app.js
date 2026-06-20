import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  PLATE_TYPES,
  DEFAULT_PLATE_TYPE_ID,
  TEXTURE_ROOT,
  TEXTURE_FILES,
  PLATE_UI_CONFIG,
  PLATE_TEXT_2D_CONFIG,
  PLATE_TEXT_3D_CONFIG,
  PLATE_FONT_CONFIG
} from './plateConfig.js';
import { PLATE_MODEL_CONFIG } from './plateObjectConfig.js';

const PLATE_WIDTH = PLATE_MODEL_CONFIG.width;
const PLATE_HEIGHT = PLATE_MODEL_CONFIG.height;
const PLATE_THICKNESS = PLATE_MODEL_CONFIG.thickness;
const PLATE_GLTF_CONFIG = PLATE_MODEL_CONFIG.model || {};
const PLATE_MODEL_URL = PLATE_GLTF_CONFIG.url || `${TEXTURE_ROOT}/plate.glb`;
const PLATE_FACE_MATERIAL_NAME = (PLATE_GLTF_CONFIG.faceMaterialName || '').trim();
const PLATE_FACE_MESH_NAME = (PLATE_GLTF_CONFIG.faceMeshName || '').trim();
const PLATE_FRONT_FACE_SIDE = (PLATE_GLTF_CONFIG.frontFaceSide || 'max').toLowerCase();
const PLATE_INPUT_SLOT_CHAR = 'X';
const PLATE_INPUT_DEFAULT_MAX_CHARACTERS = 8;
const UI_2D_ZOOM_MIN = Math.max(0.1, Number(PLATE_UI_CONFIG.twoDZoomMin ?? 0.7));
const UI_2D_ZOOM_MAX = Math.max(UI_2D_ZOOM_MIN, Number(PLATE_UI_CONFIG.twoDZoomMax ?? 2.4));
const UI_2D_ZOOM_STEP = Math.max(0.01, Number(PLATE_UI_CONFIG.twoDZoomStep ?? 0.1));
const UI_2D_ZOOM_DEFAULT = THREE.MathUtils.clamp(Number(PLATE_UI_CONFIG.twoDZoomDefault ?? 1), UI_2D_ZOOM_MIN, UI_2D_ZOOM_MAX);
const PLATE_MODEL_POSITION = PLATE_GLTF_CONFIG.position || { x: 0, y: 0, z: 0 };
const PLATE_MODEL_ROTATION = PLATE_GLTF_CONFIG.rotation || { x: 0, y: 0, z: 0 };
const PLATE_MODEL_SCALE = PLATE_GLTF_CONFIG.scale || { x: 1, y: 1, z: 1 };
const PLATE_TEXTURE_TRANSFORM = PLATE_GLTF_CONFIG.textureTransform || {};
const PLATE_TEXTURE_REPEAT = PLATE_TEXTURE_TRANSFORM.repeat || { x: 1, y: 1 };
const PLATE_TEXTURE_OFFSET = PLATE_TEXTURE_TRANSFORM.offset || { x: 0, y: 0 };
const PLATE_TEXTURE_CENTER = PLATE_TEXTURE_TRANSFORM.center || { x: 0.5, y: 0.5 };
const PLATE_TEXTURE_ROTATION = Number(PLATE_TEXTURE_TRANSFORM.rotation || 0);
const PLATE_TEXTURE_FLIP_Y = PLATE_TEXTURE_TRANSFORM.flipY ?? false;
const PLATE_MODEL_AUTO_FIT = PLATE_GLTF_CONFIG.autoFitToPlate !== false;
const PLATE_MODEL_AUTO_FIT_PADDING = THREE.MathUtils.clamp(
  Number(PLATE_GLTF_CONFIG.autoFitPadding ?? 0.98),
  0.1,
  2
);
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
const TEXT_2D_SIZE_RATIO = Number(PLATE_TEXT_2D_CONFIG.sizeRatio ?? 0.42);
const TEXT_2D_MAX_WIDTH_RATIO = Number(PLATE_TEXT_2D_CONFIG.maxWidthRatio ?? 0.76);
const TEXT_2D_AUTO_FIT_TO_WIDTH = PLATE_TEXT_2D_CONFIG.autoFitToWidth !== false;
const TEXT_2D_MIN_FONT_SIZE_PX = Math.max(1, Number(PLATE_TEXT_2D_CONFIG.minFontSizePx ?? 10));
const TEXT_2D_CENTER_Y_RATIO = Number(PLATE_TEXT_2D_CONFIG.centerYRatio ?? 0.62);
const TEXT_2D_LETTER_SPACING = Number(PLATE_TEXT_2D_CONFIG.letterSpacing ?? 0);
const TEXT_2D_SPACE_WIDTH = PLATE_TEXT_2D_CONFIG.spaceWidth != null ? Number(PLATE_TEXT_2D_CONFIG.spaceWidth) : null;
const TEXT_2D_USE_STAMP_FONT = PLATE_TEXT_2D_CONFIG.useStampFont !== false;
const TEXT_2D_FONT_FAMILY = PLATE_TEXT_2D_CONFIG.fontFamily || "'Arial Black', Arial, sans-serif";
const TEXT_2D_FONT_WEIGHT = Number(PLATE_TEXT_2D_CONFIG.fontWeight ?? 700);
const TEXT_GEOMETRY_CENTER_Y_OFFSET = PLATE_TEXT_3D_CONFIG.centerYOffset;
const TEXT_MESH_Y_OFFSET = PLATE_TEXT_3D_CONFIG.meshYOffset;
const TEXT_MESH_Z_OFFSET = PLATE_TEXT_3D_CONFIG.meshZOffset;
const TEXT_3D_MODE = PLATE_TEXT_3D_CONFIG.mode || 'stamped';
const TEXT_STAMP_CONFIG = PLATE_TEXT_3D_CONFIG.stamp || {};
const TEXT_STAMP_WIDTH = Math.max(256, Number(TEXT_STAMP_CONFIG.width || 2048));
const TEXT_STAMP_HEIGHT = Math.max(128, Number(TEXT_STAMP_CONFIG.height || 1024));
const TEXT_STAMP_MAX_WIDTH_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_CONFIG.maxWidthRatio ?? 0.76), 0.2, 0.98);
const TEXT_STAMP_CENTER_X_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_CONFIG.centerXRatio ?? 0.5), 0.05, 0.95);
const TEXT_STAMP_CENTER_Y_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_CONFIG.centerYRatio ?? 0.62), 0.05, 0.95);
const TEXT_STAMP_EDGE_BLUR = Math.max(0, Number(TEXT_STAMP_CONFIG.edgeBlurPx ?? 6));
const TEXT_STAMP_INSET = Math.max(0, Number(TEXT_STAMP_CONFIG.insetPx ?? 36));
const TEXT_STAMP_SCALE_X = Math.max(0.2, Number(TEXT_STAMP_CONFIG.scaleX ?? 1));
const TEXT_STAMP_SCALE_Y = Math.max(0.2, Number(TEXT_STAMP_CONFIG.scaleY ?? 1));
const TEXT_STAMP_OVERLAY_CONFIG = TEXT_STAMP_CONFIG.overlay2D || {};
const TEXT_STAMP_OVERLAY_ENABLED = TEXT_STAMP_OVERLAY_CONFIG.enabled !== false;
const TEXT_STAMP_OVERLAY_OPACITY = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.opacity ?? 0.85), 0, 1);
const TEXT_STAMP_OVERLAY_LIFT = Number(TEXT_STAMP_OVERLAY_CONFIG.lift ?? 0.0025);
const TEXT_STAMP_OVERLAY_MAX_WIDTH_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.maxWidthRatio ?? 0.76), 0.2, 0.98);
const TEXT_STAMP_OVERLAY_LETTER_SPACING = Number(TEXT_STAMP_OVERLAY_CONFIG.letterSpacing ?? TEXT_2D_LETTER_SPACING);
const TEXT_STAMP_OVERLAY_SPACE_WIDTH = TEXT_STAMP_OVERLAY_CONFIG.spaceWidth != null ? Number(TEXT_STAMP_OVERLAY_CONFIG.spaceWidth) : TEXT_2D_SPACE_WIDTH;
const TEXT_STAMP_OVERLAY_FONT_WEIGHT = Number(TEXT_STAMP_OVERLAY_CONFIG.fontWeight ?? TEXT_STAMP_CONFIG.fontWeight ?? 800);
const TEXT_STAMP_OVERLAY_REFLECTIVE = TEXT_STAMP_OVERLAY_CONFIG.reflective === true;
const TEXT_STAMP_OVERLAY_USE_SURFACE_MAPS = TEXT_STAMP_OVERLAY_CONFIG.useSurfaceMaps !== false;
const TEXT_STAMP_OVERLAY_SURFACE_BUMP_SCALE = Number(TEXT_STAMP_OVERLAY_CONFIG.surfaceBumpScale ?? 0.25);
const TEXT_STAMP_OVERLAY_USE_STAMP_BUMP = TEXT_STAMP_OVERLAY_CONFIG.useStampBump === true;
const TEXT_STAMP_OVERLAY_STAMP_BUMP_SCALE = Number(TEXT_STAMP_OVERLAY_CONFIG.stampBumpScale ?? 0.2);
const TEXT_STAMP_OVERLAY_METALNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.metalness ?? 0.9), 0, 1);
const TEXT_STAMP_OVERLAY_ROUGHNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.roughness ?? 0.18), 0, 1);
const TEXT_STAMP_OVERLAY_CLEARCOAT = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.clearcoat ?? 1), 0, 1);
const TEXT_STAMP_OVERLAY_CLEARCOAT_ROUGHNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_OVERLAY_CONFIG.clearcoatRoughness ?? 0.12), 0, 1);
const TEXT_STAMP_OVERLAY_ENV_INTENSITY = Number(TEXT_STAMP_OVERLAY_CONFIG.envMapIntensity ?? 1.8);
const TEXT_STAMP_OVERLAY_ROTATION = Number(TEXT_STAMP_OVERLAY_CONFIG.rotation ?? Math.PI);
const TEXT_STAMP_OVERLAY_MIRROR_X = TEXT_STAMP_OVERLAY_CONFIG.mirrorX === true;
const TEXT_STAMP_OVERLAY_MIRROR_Y = TEXT_STAMP_OVERLAY_CONFIG.mirrorY === true;
const TEXT_STAMP_BACK_CONFIG = TEXT_STAMP_CONFIG.back || {};
const TEXT_STAMP_BACK_ENABLED = TEXT_STAMP_BACK_CONFIG.enabled === true;
const TEXT_STAMP_BACK_MIRROR_FRONT = TEXT_STAMP_BACK_CONFIG.mirrorFront !== false;
const TEXT_STAMP_BACK_OVERLAY_ENABLED = TEXT_STAMP_BACK_CONFIG.overlay2DEnabled === true;
const TEXT_STAMP_BACK_CENTER_X_RATIO = THREE.MathUtils.clamp(Number(
  TEXT_STAMP_BACK_CONFIG.centerXRatio ?? TEXT_STAMP_CONFIG.bump?.centerXRatio ?? TEXT_STAMP_CENTER_X_RATIO
), 0.05, 0.95);
const TEXT_STAMP_BACK_CENTER_Y_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.centerYRatio ?? TEXT_STAMP_CENTER_Y_RATIO), 0.05, 0.95);
const TEXT_STAMP_BACK_SCALE_X = Math.max(0.2, Number(TEXT_STAMP_BACK_CONFIG.scaleX ?? TEXT_STAMP_SCALE_X));
const TEXT_STAMP_BACK_SCALE_Y = Math.max(0.2, Number(TEXT_STAMP_BACK_CONFIG.scaleY ?? TEXT_STAMP_SCALE_Y));
const TEXT_STAMP_BACK_EDGE_BLUR = Math.max(0, Number(TEXT_STAMP_BACK_CONFIG.edgeBlurPx ?? TEXT_STAMP_EDGE_BLUR));
const TEXT_STAMP_BACK_FONT_WEIGHT = Number(TEXT_STAMP_BACK_CONFIG.fontWeight ?? TEXT_STAMP_FONT_WEIGHT);
const TEXT_STAMP_BACK_OVERLAY_LIFT = Number(TEXT_STAMP_BACK_CONFIG.lift ?? TEXT_STAMP_OVERLAY_LIFT);
const TEXT_STAMP_BACK_STAMP_LIFT = Number(TEXT_STAMP_BACK_CONFIG.stampLift ?? 0.0008);
const TEXT_STAMP_BACK_OVERLAY_OPACITY = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.opacity ?? TEXT_STAMP_OVERLAY_OPACITY), 0, 1);
const TEXT_STAMP_BACK_OVERLAY_MAX_WIDTH_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.maxWidthRatio ?? TEXT_STAMP_OVERLAY_MAX_WIDTH_RATIO), 0.2, 0.98);
const TEXT_STAMP_BACK_OVERLAY_LETTER_SPACING = Number(TEXT_STAMP_BACK_CONFIG.letterSpacing ?? TEXT_STAMP_OVERLAY_LETTER_SPACING);
const TEXT_STAMP_BACK_OVERLAY_FONT_WEIGHT = Number(TEXT_STAMP_BACK_CONFIG.fontWeight ?? TEXT_STAMP_OVERLAY_FONT_WEIGHT);
const TEXT_STAMP_BACK_OVERLAY_ROTATION = Number(TEXT_STAMP_BACK_CONFIG.rotation ?? TEXT_STAMP_OVERLAY_ROTATION);
const TEXT_STAMP_BACK_OVERLAY_MIRROR_X = TEXT_STAMP_BACK_CONFIG.mirrorX === true || (TEXT_STAMP_BACK_MIRROR_FRONT && !TEXT_STAMP_OVERLAY_MIRROR_X);
const TEXT_STAMP_BACK_OVERLAY_MIRROR_Y = TEXT_STAMP_BACK_CONFIG.mirrorY === true || (TEXT_STAMP_BACK_MIRROR_FRONT && TEXT_STAMP_OVERLAY_MIRROR_Y);
const TEXT_STAMP_BACK_REFLECTIVE = TEXT_STAMP_BACK_CONFIG.reflective ?? TEXT_STAMP_OVERLAY_REFLECTIVE;
const TEXT_STAMP_BACK_USE_SURFACE_MAPS = TEXT_STAMP_BACK_CONFIG.useSurfaceMaps ?? TEXT_STAMP_OVERLAY_USE_SURFACE_MAPS;
const TEXT_STAMP_BACK_SURFACE_BUMP_SCALE = Number(TEXT_STAMP_BACK_CONFIG.surfaceBumpScale ?? TEXT_STAMP_OVERLAY_SURFACE_BUMP_SCALE);
const TEXT_STAMP_BACK_USE_STAMP_BUMP = TEXT_STAMP_BACK_CONFIG.useStampBump ?? TEXT_STAMP_OVERLAY_USE_STAMP_BUMP;
const TEXT_STAMP_BACK_STAMP_BUMP_SCALE = Number(TEXT_STAMP_BACK_CONFIG.stampBumpScale ?? TEXT_STAMP_OVERLAY_STAMP_BUMP_SCALE);
const TEXT_STAMP_BACK_METALNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.metalness ?? TEXT_STAMP_OVERLAY_METALNESS), 0, 1);
const TEXT_STAMP_BACK_ROUGHNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.roughness ?? TEXT_STAMP_OVERLAY_ROUGHNESS), 0, 1);
const TEXT_STAMP_BACK_CLEARCOAT = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.clearcoat ?? TEXT_STAMP_OVERLAY_CLEARCOAT), 0, 1);
const TEXT_STAMP_BACK_CLEARCOAT_ROUGHNESS = THREE.MathUtils.clamp(Number(TEXT_STAMP_BACK_CONFIG.clearcoatRoughness ?? TEXT_STAMP_OVERLAY_CLEARCOAT_ROUGHNESS), 0, 1);
const TEXT_STAMP_BACK_ENV_INTENSITY = Number(TEXT_STAMP_BACK_CONFIG.envMapIntensity ?? TEXT_STAMP_OVERLAY_ENV_INTENSITY);
const TEXT_STAMP_BUMP_CONFIG = TEXT_STAMP_CONFIG.bump || {};
const TEXT_STAMP_EMBOSS_CONFIG = TEXT_STAMP_CONFIG.emboss || {};
const TEXT_STAMP_EMBOSS_NEUTRAL = THREE.MathUtils.clamp(Number(TEXT_STAMP_EMBOSS_CONFIG.neutral ?? 0.5), 0, 1);
const TEXT_STAMP_EMBOSS_FRONT_STRENGTH = Math.max(0, Number(TEXT_STAMP_EMBOSS_CONFIG.frontStrength ?? 1));
const TEXT_STAMP_EMBOSS_BACK_STRENGTH = Math.max(0, Number(TEXT_STAMP_EMBOSS_CONFIG.backStrength ?? 1));
const TEXT_STAMP_EMBOSS_INVERT_BACK = TEXT_STAMP_EMBOSS_CONFIG.invertBack !== false;
const TEXT_STAMP_BUMP_CENTER_X_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_BUMP_CONFIG.centerXRatio ?? TEXT_STAMP_CENTER_X_RATIO), 0.05, 0.95);
const TEXT_STAMP_BUMP_CENTER_Y_RATIO = THREE.MathUtils.clamp(Number(TEXT_STAMP_BUMP_CONFIG.centerYRatio ?? 0.71), 0.05, 0.95);
const TEXT_STAMP_BUMP_SCALE_X = Math.max(0.2, Number(TEXT_STAMP_BUMP_CONFIG.scaleX ?? 0.94));
const TEXT_STAMP_BUMP_SCALE_Y = Math.max(0.2, Number(TEXT_STAMP_BUMP_CONFIG.scaleY ?? 0.94));
const TEXT_STAMP_BUMP_EDGE_BLUR = Math.max(0, Number(TEXT_STAMP_BUMP_CONFIG.edgeBlurPx ?? 2));
const TEXT_STAMP_BUMP_SPACE_WIDTH = TEXT_STAMP_BUMP_CONFIG.spaceWidth != null ? Number(TEXT_STAMP_BUMP_CONFIG.spaceWidth) : TEXT_STAMP_OVERLAY_SPACE_WIDTH;
const TEXT_STAMP_BACK_BUMP_SPACE_WIDTH = TEXT_STAMP_BACK_CONFIG.spaceWidth != null ? Number(TEXT_STAMP_BACK_CONFIG.spaceWidth) : TEXT_STAMP_BUMP_SPACE_WIDTH;
const TEXT_STAMP_DEPTH = Number(TEXT_STAMP_CONFIG.depth ?? -0.08);
const TEXT_STAMP_MIN_VISIBLE_DEPTH = Math.max(0, Number(TEXT_STAMP_CONFIG.minVisibleDepth ?? 0.35));
const TEXT_STAMP_DISABLE_SURFACE_NORMALS = TEXT_STAMP_CONFIG.disableSurfaceNormals !== false;
const TEXT_STAMP_FONT_URL = TEXT_STAMP_CONFIG.fontUrl || '';
const TEXT_STAMP_FONT_FACE_NAME = (TEXT_STAMP_CONFIG.fontFaceName || 'PlateStamp').trim();
const TEXT_STAMP_FONT_FALLBACK_FAMILY = TEXT_STAMP_CONFIG.fontFamily || "'Arial Black', Arial, sans-serif";
const TEXT_STAMP_FONT_WEIGHT = Number(TEXT_STAMP_CONFIG.fontWeight || 800);
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
let plateFrontZ = PLATE_THICKNESS * 0.5;
let plateBackZ = -PLATE_THICKNESS * 0.5;
let plateFaceTargetMesh = null;
let plateFaceTargetMaterialIndex = 0;
let textStampTexture = null;
let textBackStampTexture = null;
let textOverlayMesh = null;
let textBackOverlayMesh = null;
let activeStampFontFamily = TEXT_STAMP_FONT_FALLBACK_FAMILY;
let active2DFontFamily = TEXT_2D_FONT_FAMILY;
let formatBypassEnabled = false;
let zoom2DLevel = UI_2D_ZOOM_DEFAULT;

function getModelFrontZ(bounds) {
  return PLATE_FRONT_FACE_SIDE === 'min' ? bounds.min.z : bounds.max.z;
}

function getModelBackZ(bounds) {
  return PLATE_FRONT_FACE_SIDE === 'min' ? bounds.max.z : bounds.min.z;
}

/* ================================================================
   DOM REFERENCES
   ================================================================ */
const plateInputEl = document.getElementById('plate-input');
const charCountEl = document.getElementById('char-count');
const galleryEl = document.getElementById('plate-gallery');

const viewToggleEl = document.getElementById('view-toggle');
const formatBypassToggleEl = document.getElementById('format-bypass-toggle');
const formatBypassRowEl = document.getElementById('format-bypass-row');
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

const fallbackPlateBodyMat = new THREE.MeshStandardMaterial({
  color: 0xc7c9cf,
  metalness: 0.9,
  roughness: 0.22,
  envMapIntensity: 1.1
});

let plateFaceMat = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.84,
  roughness: 0.08,
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  envMapIntensity: PLATE_FACE_ENV_INTENSITY
});

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
const plateFaceGeo = new THREE.ShapeGeometry(
  createRoundedRectShape(PLATE_FACE_WIDTH, PLATE_FACE_HEIGHT, PLATE_FACE_CORNER_RADIUS)
);
fitGeometryUvToBounds(plateFaceGeo);

function applyPlateFaceMaterialDefaults(material) {
  material.roughness = 0.18;
  material.metalness = 0.82;
  material.envMapIntensity = PLATE_FACE_ENV_INTENSITY;
  material.clearcoat = 1;
  material.clearcoatRoughness = 0.06;
}

applyPlateFaceMaterialDefaults(plateFaceMat);

function bindPlateFaceMaterial(material, mesh, materialIndex) {
  plateFaceMat = material;
  plateFaceTargetMesh = mesh;
  plateFaceTargetMaterialIndex = materialIndex;
}

function createProceduralFallbackPlate() {
  const plateBodyMesh = new THREE.Mesh(plateBodyGeo, fallbackPlateBodyMat);
  plateBodyMesh.castShadow = true;
  plateGroup.add(plateBodyMesh);

  const fallbackFaceMaterial = plateFaceMat.clone();
  applyPlateFaceMaterialDefaults(fallbackFaceMaterial);
  const plateFaceMesh = new THREE.Mesh(plateFaceGeo, fallbackFaceMaterial);
  plateFaceMesh.position.z = PLATE_THICKNESS * 0.5 + 0.001;
  plateGroup.add(plateFaceMesh);
  bindPlateFaceMaterial(fallbackFaceMaterial, plateFaceMesh, 0);

  plateFrontZ = PLATE_THICKNESS * 0.5;
  plateBackZ = -PLATE_THICKNESS * 0.5;
}

function getMaterialArray(material) {
  if (!material) return [];
  return Array.isArray(material) ? material : [material];
}

function fitModelToPlateBounds(modelRoot) {
  modelRoot.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(modelRoot);
  if (bounds.isEmpty()) return;

  const size = bounds.getSize(new THREE.Vector3());
  const safeWidth = Math.max(size.x, 1e-6);
  const safeHeight = Math.max(size.y, 1e-6);
  const fitScale = Math.min(PLATE_WIDTH / safeWidth, PLATE_HEIGHT / safeHeight) * PLATE_MODEL_AUTO_FIT_PADDING;

  modelRoot.scale.multiplyScalar(fitScale);
  modelRoot.updateMatrixWorld(true);

  // Keep the model centered on XY so camera/orbit defaults remain stable.
  const fittedBounds = new THREE.Box3().setFromObject(modelRoot);
  const center = fittedBounds.getCenter(new THREE.Vector3());
  modelRoot.position.x -= center.x;
  modelRoot.position.y -= center.y;
}

function pickFaceTargetFromModel(meshes, modelBounds) {
  if (meshes.length === 0) {
    return null;
  }

  if (PLATE_FACE_MESH_NAME) {
    const configuredMesh = meshes.find((mesh) => mesh.name === PLATE_FACE_MESH_NAME);
    if (configuredMesh) {
      const configuredMaterials = getMaterialArray(configuredMesh.material);
      let configuredMaterialIndex = 0;
      if (PLATE_FACE_MATERIAL_NAME) {
        const foundIndex = configuredMaterials.findIndex((material) => (material?.name || '') === PLATE_FACE_MATERIAL_NAME);
        if (foundIndex >= 0) {
          configuredMaterialIndex = foundIndex;
        }
      }

      return {
        mesh: configuredMesh,
        materialIndex: configuredMaterialIndex,
        material: configuredMaterials[configuredMaterialIndex] || new THREE.MeshPhysicalMaterial({ color: 0xffffff }),
        frontZ: getModelFrontZ(new THREE.Box3().setFromObject(configuredMesh))
      };
    }

    console.warn(`[Plate Preview] Configured face mesh not found: "${PLATE_FACE_MESH_NAME}". Falling back to auto-detection.`);
  }

  const zRange = Math.max(modelBounds.max.z - modelBounds.min.z, 1e-6);
  const meshScores = meshes.map((mesh) => {
    const bounds = new THREE.Box3().setFromObject(mesh);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const areaXY = Math.max(size.x * size.y, 1e-9);
    const frontBias = THREE.MathUtils.clamp((center.z - modelBounds.min.z) / zRange, 0, 1);
    const nameBonus = /front|face|plate/i.test(mesh.name || '') ? areaXY * 0.5 : 0;
    const score = areaXY * (1 + frontBias * 0.35) + nameBonus;
    return { mesh, bounds, score };
  });

  meshScores.sort((a, b) => b.score - a.score);
  const picked = meshScores[0];
  const materials = getMaterialArray(picked.mesh.material);

  let materialIndex = 0;
  if (PLATE_FACE_MATERIAL_NAME) {
    const exactOnMesh = materials.findIndex((material) => (material?.name || '') === PLATE_FACE_MATERIAL_NAME);
    if (exactOnMesh >= 0) {
      materialIndex = exactOnMesh;
    }
  }

  if (!materials[materialIndex]) {
    materialIndex = 0;
  }

  return {
    mesh: picked.mesh,
    materialIndex,
    material: materials[materialIndex] || new THREE.MeshPhysicalMaterial({ color: 0xffffff }),
    frontZ: getModelFrontZ(picked.bounds)
  };
}

function assignClonedTargetMaterial(target) {
  const cloned = target.material.clone();
  applyPlateFaceMaterialDefaults(cloned);

  if (Array.isArray(target.mesh.material)) {
    const materialList = [...target.mesh.material];
    materialList[target.materialIndex] = cloned;
    target.mesh.material = materialList;
  } else {
    target.mesh.material = cloned;
  }

  bindPlateFaceMaterial(cloned, target.mesh, target.materialIndex);
}

function loadPlateModel() {
  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(PLATE_MODEL_URL, resolve, undefined, reject);
  });
}

async function setupPlateGeometry() {
  try {
    if (window.location.protocol === 'file:') {
      console.warn('[Plate Preview] GLB loading may fail from file:// URLs. Start a local server (for example: npx serve .) and open http://localhost:3000.');
    }

    const gltf = await loadPlateModel();
    const modelRoot = gltf.scene;
    const meshes = [];

    modelRoot.rotation.set(
      Number(PLATE_MODEL_ROTATION.x || 0),
      Number(PLATE_MODEL_ROTATION.y || 0),
      Number(PLATE_MODEL_ROTATION.z || 0)
    );
    modelRoot.scale.set(
      Number(PLATE_MODEL_SCALE.x || 1),
      Number(PLATE_MODEL_SCALE.y || 1),
      Number(PLATE_MODEL_SCALE.z || 1)
    );

    if (PLATE_MODEL_AUTO_FIT) {
      fitModelToPlateBounds(modelRoot);
    }

    modelRoot.position.add(new THREE.Vector3(
      Number(PLATE_MODEL_POSITION.x || 0),
      Number(PLATE_MODEL_POSITION.y || 0),
      Number(PLATE_MODEL_POSITION.z || 0)
    ));

    modelRoot.traverse((node) => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      meshes.push(node);
    });

    if (meshes.length === 0) {
      console.warn('[Plate Preview] plate.glb loaded, but no mesh nodes were found. Using procedural fallback plate.');
      createProceduralFallbackPlate();
      return;
    }

    modelRoot.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(modelRoot);
    if (!bounds.isEmpty()) {
      plateBackZ = getModelBackZ(bounds);
      const target = pickFaceTargetFromModel(meshes, bounds);
      if (target) {
        plateFrontZ = target.frontZ;
        assignClonedTargetMaterial(target);
      } else {
        plateFrontZ = getModelFrontZ(bounds);
      }
    }

    plateGroup.add(modelRoot);

    const materialNames = [];
    const meshNames = [];
    meshes.forEach((mesh) => {
      meshNames.push(mesh.name || '(unnamed-mesh)');
      getMaterialArray(mesh.material).forEach((material) => {
        if (!materialNames.includes(material.name || '(unnamed)')) {
          materialNames.push(material.name || '(unnamed)');
        }
      });
    });
    console.info(`[Plate Preview] Loaded model from ${PLATE_MODEL_URL}. Meshes: ${meshes.length}. Face mesh: ${plateFaceTargetMesh?.name || '(auto)'}; Face material: ${plateFaceMat.name || '(unnamed)'} `);
    console.info('[Plate Preview] Model mesh list:', meshNames.join(', '));
    console.info('[Plate Preview] Model material list:', materialNames.join(', '));
  } catch (error) {
    console.error(`[Plate Preview] Failed to load model at ${PLATE_MODEL_URL}. Using procedural fallback plate.`, error);
    createProceduralFallbackPlate();
  }
}

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

/* ================================================================
   HELPERS
   ================================================================ */
function getDisplayText(text) {
  return text && text.trim() ? text : 'SAMPLE';
}

function getPlateInputRules(plateType = getCurrentPlateType()) {
  if (formatBypassEnabled) {
    return { availableCharacters: PLATE_INPUT_DEFAULT_MAX_CHARACTERS, format: '' };
  }

  const parsedMax = Number.parseInt(plateType?.availableCharacters ?? PLATE_INPUT_DEFAULT_MAX_CHARACTERS, 10);
  const availableCharacters = Number.isFinite(parsedMax) && parsedMax > 0
    ? parsedMax
    : PLATE_INPUT_DEFAULT_MAX_CHARACTERS;
  const format = typeof plateType?.format === 'string' && plateType.format.includes(PLATE_INPUT_SLOT_CHAR)
    ? plateType.format
    : '';

  return { availableCharacters, format };
}

function normalizePlateRawText(value) {
  return (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function applyPlateFormat(rawText, format) {
  if (!format) return rawText;

  let rawIndex = 0;
  let formatted = '';

  for (const token of format) {
    if (token === PLATE_INPUT_SLOT_CHAR) {
      if (rawIndex >= rawText.length) break;
      formatted += rawText[rawIndex];
      rawIndex += 1;
      continue;
    }

    if (rawIndex < rawText.length) {
      formatted += token;
    }
  }

  return formatted;
}

function syncPlateInputWithCurrentType() {
  const { availableCharacters, format } = getPlateInputRules();
  const rawValue = normalizePlateRawText(currentText).slice(0, availableCharacters);
  const formattedValue = applyPlateFormat(rawValue, format);

  currentText = formattedValue;
  plateInputEl.value = formattedValue;
  charCountEl.textContent = `${rawValue.length} / ${availableCharacters}`;
  charCountEl.classList.toggle('warn', rawValue.length >= Math.max(availableCharacters - 1, 1));
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

function resolveGlyphWidth(ctx, glyph, spaceWidth) {
  if (glyph === ' ' && spaceWidth != null) return spaceWidth;
  return ctx.measureText(glyph).width;
}

function measureSpacedTextWidth(ctx, text, letterSpacing, spaceWidth) {
  if (!text) return 0;
  const glyphs = [...text];
  const glyphWidth = glyphs.reduce((total, glyph) => total + resolveGlyphWidth(ctx, glyph, spaceWidth), 0);
  const spacingWidth = Math.max(glyphs.length - 1, 0) * letterSpacing;
  return glyphWidth + spacingWidth;
}

function drawCenteredSpacedText(ctx, text, centerX, centerY, letterSpacing, spaceWidth) {
  const glyphs = [...text];
  const totalWidth = measureSpacedTextWidth(ctx, text, letterSpacing, spaceWidth);
  let cursorX = centerX - (totalWidth * 0.5);

  glyphs.forEach((glyph) => {
    const glyphWidth = resolveGlyphWidth(ctx, glyph, spaceWidth);
    if (glyph !== ' ') {
      ctx.fillText(glyph, cursorX + (glyphWidth * 0.5), centerY);
    }
    cursorX += glyphWidth + letterSpacing;
  });
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

  ctx.fillStyle = plateType?.textColor2D || plateType?.textColor3D || '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const display = getDisplayText(text);
  const maxW = w * TEXT_2D_MAX_WIDTH_RATIO;
  let fontSize = h * TEXT_2D_SIZE_RATIO;
  ctx.font = `${TEXT_2D_FONT_WEIGHT} ${fontSize}px ${active2DFontFamily}`;
  if (TEXT_2D_AUTO_FIT_TO_WIDTH) {
    while (measureSpacedTextWidth(ctx, display, TEXT_2D_LETTER_SPACING, TEXT_2D_SPACE_WIDTH) > maxW && fontSize > TEXT_2D_MIN_FONT_SIZE_PX) {
      fontSize -= 1;
      ctx.font = `${TEXT_2D_FONT_WEIGHT} ${fontSize}px ${active2DFontFamily}`;
    }
  }

  if (!(text && text.trim())) {
    ctx.globalAlpha = 0.35;
  }

  drawCenteredSpacedText(ctx, display, w * 0.5, h * TEXT_2D_CENTER_Y_RATIO, TEXT_2D_LETTER_SPACING, TEXT_2D_SPACE_WIDTH);
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

function apply3DPlateTextureTransform(texture) {
  if (!texture) return;

  texture.flipY = Boolean(PLATE_TEXTURE_FLIP_Y);
  texture.repeat.set(
    Number(PLATE_TEXTURE_REPEAT.x ?? 1),
    Number(PLATE_TEXTURE_REPEAT.y ?? 1)
  );
  texture.offset.set(
    Number(PLATE_TEXTURE_OFFSET.x ?? 0),
    Number(PLATE_TEXTURE_OFFSET.y ?? 0)
  );
  texture.center.set(
    Number(PLATE_TEXTURE_CENTER.x ?? 0.5),
    Number(PLATE_TEXTURE_CENTER.y ?? 0.5)
  );
  texture.rotation = PLATE_TEXTURE_ROTATION;
  texture.needsUpdate = true;
}

function getTexturePaths(typeDef) {
  const folder = typeDef.folder ?? typeDef.textureFolder ?? typeDef.name;
  const baseDiffusePath = typeDef.diffuseTexturePath
    ?? typeDef.texturePath
    ?? `${TEXTURE_ROOT}/${folder}/${TEXTURE_FILES.diffuse}`;
  const diffusePath2D = typeDef.diffuseTexturePath2D
    ?? baseDiffusePath;
  const diffusePath3D = typeDef.diffuseTexturePath3D
    ?? baseDiffusePath.replace(/(\.[^./]+)$/, '_3D$1');
  return { diffusePath2D, diffusePath3D };
}

async function loadPlateTypeAssets(typeDef) {
  const { diffusePath2D, diffusePath3D } = getTexturePaths(typeDef);

  const [diffuseTexture2D, diffuseTexture3D] = await Promise.all([
    loadTextureSafe(diffusePath2D, { color: true }),
    loadTextureSafe(diffusePath3D, { color: true })
  ]);

  const placeholderCanvas = createPlaceholderCanvas(typeDef.name);
  const fallbackTexture = new THREE.CanvasTexture(placeholderCanvas);
  fallbackTexture.colorSpace = THREE.SRGBColorSpace;
  fallbackTexture.anisotropy = maxAnisotropy;
  const resolved2DTexture = diffuseTexture2D || fallbackTexture;
  const source3DTexture = diffuseTexture3D || diffuseTexture2D || fallbackTexture;
  const final3DTexture = surfaceMaterialMaps?.overlayMap
    ? createSurfaceOverlayTexture(source3DTexture, surfaceMaterialMaps.overlayMap)
    : source3DTexture;
  apply3DPlateTextureTransform(final3DTexture);

  return {
    ...typeDef,
    diffuseTexture2D: resolved2DTexture,
    diffuseTexture3D: final3DTexture,
    previewImage: imageFromTexture(resolved2DTexture) || placeholderCanvas
  };
}

function getCurrentPlateType() {
  return plateTypes.find((plateType) => plateType.id === currentPlateId) || plateTypes[0] || null;
}

function applyPlateSurface() {
  const plateType = getCurrentPlateType();
  if (!plateType) return;

  const surfaceNormalMap = surfaceMaterialMaps?.normalMap || null;

  plateFaceMat.map = plateType.diffuseTexture3D || null;
  plateFaceMat.normalMap = surfaceNormalMap;

  if ('clearcoatNormalMap' in plateFaceMat) {
    plateFaceMat.clearcoatNormalMap = surfaceNormalMap;
  }

  if (plateFaceMat.clearcoatNormalScale?.set) {
    plateFaceMat.clearcoatNormalScale.set(0.35, 0.35);
  }

  if ('roughnessMap' in plateFaceMat) {
    plateFaceMat.roughnessMap = surfaceMaterialMaps?.roughnessMap || null;
  }

  if ('metalnessMap' in plateFaceMat) {
    plateFaceMat.metalnessMap = surfaceMaterialMaps?.metalnessMap || null;
  }

  if ('bumpMap' in plateFaceMat) {
    if (TEXT_3D_MODE !== 'stamped') {
      plateFaceMat.bumpMap = surfaceMaterialMaps?.heightMap || null;
      plateFaceMat.bumpScale = surfaceMaterialMaps?.heightMap ? SURFACE_BUMP_SCALE : 0;
    }
  }

  plateFaceMat.needsUpdate = true;
}

function disposeTextMesh() {
  if (!textMesh) return;
  plateGroup.remove(textMesh);
  textMesh.geometry.dispose();
  textMesh.material.dispose();
  textMesh = null;
}

function disposeTextStampTexture() {
  if (!textStampTexture) return;
  textStampTexture.dispose();
  textStampTexture = null;
}

function disposeBackTextStampTexture() {
  if (!textBackStampTexture) return;
  textBackStampTexture.dispose();
  textBackStampTexture = null;
}

function disposeTextOverlayMesh() {
  if (!textOverlayMesh) return;
  plateGroup.remove(textOverlayMesh);
  textOverlayMesh.geometry.dispose();
  textOverlayMesh.material.map?.dispose();
  textOverlayMesh.material.dispose();
  textOverlayMesh = null;
}

function disposeBackTextOverlayMesh() {
  if (!textBackOverlayMesh) return;
  plateGroup.remove(textBackOverlayMesh);
  textBackOverlayMesh.geometry.dispose();
  textBackOverlayMesh.material.map?.dispose();
  textBackOverlayMesh.material.dispose();
  textBackOverlayMesh = null;
}

function applyStampTextureTransform(texture) {
  texture.center.set(0.5, 0.5);
  texture.rotation = TEXT_STAMP_OVERLAY_ROTATION;
  texture.repeat.set(TEXT_STAMP_OVERLAY_MIRROR_X ? -1 : 1, TEXT_STAMP_OVERLAY_MIRROR_Y ? -1 : 1);
  texture.needsUpdate = true;
}

function applyBackStampTextureTransform(texture) {
  texture.center.set(0.5, 0.5);
  texture.rotation = TEXT_STAMP_BACK_OVERLAY_ROTATION;
  texture.repeat.set(TEXT_STAMP_BACK_OVERLAY_MIRROR_X ? -1 : 1, TEXT_STAMP_BACK_OVERLAY_MIRROR_Y ? -1 : 1);
  texture.needsUpdate = true;
}

function applyStampBumpTextureTransform(texture) {
  const rotation = Number(TEXT_STAMP_BUMP_CONFIG.rotation ?? 0);
  const mirrorX = TEXT_STAMP_BUMP_CONFIG.mirrorX === true;
  const mirrorY = TEXT_STAMP_BUMP_CONFIG.mirrorY === true;

  texture.center.set(0.5, 0.5);
  texture.rotation = rotation;
  texture.repeat.set(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
  texture.needsUpdate = true;
}

function applyBackStampBumpTextureTransform(texture) {
  const rotation = Number(TEXT_STAMP_BACK_CONFIG.bumpRotation ?? TEXT_STAMP_BUMP_CONFIG.rotation ?? 0);
  const mirrorX = (TEXT_STAMP_BACK_CONFIG.bumpMirrorX ?? TEXT_STAMP_BACK_CONFIG.mirrorX ?? TEXT_STAMP_BUMP_CONFIG.mirrorX ?? false) === true;
  const mirrorY = (TEXT_STAMP_BACK_CONFIG.bumpMirrorY ?? TEXT_STAMP_BACK_CONFIG.mirrorY ?? TEXT_STAMP_BUMP_CONFIG.mirrorY ?? false) === true;

  texture.center.set(0.5, 0.5);
  texture.rotation = rotation;
  texture.repeat.set(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
  texture.needsUpdate = true;
}

function buildStampedTextOverlayMesh() {
  disposeTextOverlayMesh();

  if (!TEXT_STAMP_OVERLAY_ENABLED) return;

  const plateType = getCurrentPlateType();
  const display = getDisplayText(currentText);
  const isPlaceholder = !(currentText && currentText.trim());

  const canvas = document.createElement('canvas');
  canvas.width = TEXT_STAMP_WIDTH;
  canvas.height = TEXT_STAMP_HEIGHT;
  const ctx = canvas.getContext('2d');

  const maxW = canvas.width * TEXT_STAMP_OVERLAY_MAX_WIDTH_RATIO;
  let fontSize = canvas.height * 0.42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${TEXT_STAMP_OVERLAY_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;

  while ((measureSpacedTextWidth(ctx, display, TEXT_STAMP_OVERLAY_LETTER_SPACING, TEXT_STAMP_OVERLAY_SPACE_WIDTH) * TEXT_STAMP_SCALE_X) > maxW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${TEXT_STAMP_OVERLAY_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;
  }

  const y = canvas.height * TEXT_STAMP_CENTER_Y_RATIO;
  const x = canvas.width * TEXT_STAMP_CENTER_X_RATIO;
  const textColor = plateType?.textColor3D || '#1a1a1a';
  const alpha = isPlaceholder ? TEXT_STAMP_OVERLAY_OPACITY * 0.5 : TEXT_STAMP_OVERLAY_OPACITY;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(TEXT_STAMP_SCALE_X, TEXT_STAMP_SCALE_Y);
  ctx.fillStyle = textColor;
  ctx.globalAlpha = alpha;
  drawCenteredSpacedText(ctx, display, 0, 0, TEXT_STAMP_OVERLAY_LETTER_SPACING, TEXT_STAMP_OVERLAY_SPACE_WIDTH);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  applyStampTextureTransform(texture);

  const material = TEXT_STAMP_OVERLAY_REFLECTIVE
    ? new THREE.MeshPhysicalMaterial({
      map: texture,
      transparent: true,
      metalness: TEXT_STAMP_OVERLAY_METALNESS,
      roughness: TEXT_STAMP_OVERLAY_ROUGHNESS,
      clearcoat: TEXT_STAMP_OVERLAY_CLEARCOAT,
      clearcoatRoughness: TEXT_STAMP_OVERLAY_CLEARCOAT_ROUGHNESS,
      envMapIntensity: TEXT_STAMP_OVERLAY_ENV_INTENSITY,
      toneMapped: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })
    : new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

  if (TEXT_STAMP_OVERLAY_REFLECTIVE && TEXT_STAMP_OVERLAY_USE_SURFACE_MAPS && material.isMeshPhysicalMaterial) {
    material.roughnessMap = surfaceMaterialMaps?.roughnessMap || null;
    material.metalnessMap = surfaceMaterialMaps?.metalnessMap || null;
    material.normalMap = surfaceMaterialMaps?.normalMap || null;
    material.bumpMap = surfaceMaterialMaps?.heightMap || null;
    material.bumpScale = surfaceMaterialMaps?.heightMap ? TEXT_STAMP_OVERLAY_SURFACE_BUMP_SCALE : 0;
    material.clearcoatNormalMap = surfaceMaterialMaps?.normalMap || null;
  }

  if (TEXT_STAMP_OVERLAY_REFLECTIVE && TEXT_STAMP_OVERLAY_USE_STAMP_BUMP && material.isMeshPhysicalMaterial) {
    // Reuse the generated stamp bump so overlay highlights/shadows follow the same emboss effect.
    material.bumpMap = textStampTexture || null;
    material.bumpScale = textStampTexture ? TEXT_STAMP_OVERLAY_STAMP_BUMP_SCALE : material.bumpScale;
  }

  const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_HEIGHT), material);
  overlayMesh.position.set(0, 0, plateFrontZ + TEXT_STAMP_OVERLAY_LIFT);
  overlayMesh.renderOrder = 4;
  overlayMesh.visible = is3D;
  plateGroup.add(overlayMesh);
  textOverlayMesh = overlayMesh;
}

function buildBackStampedTextOverlayMesh() {
  disposeBackTextOverlayMesh();

  if (!TEXT_STAMP_BACK_ENABLED || !TEXT_STAMP_BACK_OVERLAY_ENABLED) return;

  const plateType = getCurrentPlateType();
  const display = getDisplayText(currentText);
  const isPlaceholder = !(currentText && currentText.trim());

  const canvas = document.createElement('canvas');
  canvas.width = TEXT_STAMP_WIDTH;
  canvas.height = TEXT_STAMP_HEIGHT;
  const ctx = canvas.getContext('2d');

  const maxW = canvas.width * TEXT_STAMP_BACK_OVERLAY_MAX_WIDTH_RATIO;
  let fontSize = canvas.height * 0.42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${TEXT_STAMP_BACK_OVERLAY_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;

  while ((measureSpacedTextWidth(ctx, display, TEXT_STAMP_BACK_OVERLAY_LETTER_SPACING) * TEXT_STAMP_BACK_SCALE_X) > maxW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${TEXT_STAMP_BACK_OVERLAY_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;
  }

  const y = canvas.height * TEXT_STAMP_BACK_CENTER_Y_RATIO;
  const x = canvas.width * TEXT_STAMP_BACK_CENTER_X_RATIO;
  const textColor = plateType?.textColor3D || '#1a1a1a';
  const alpha = isPlaceholder ? TEXT_STAMP_BACK_OVERLAY_OPACITY * 0.5 : TEXT_STAMP_BACK_OVERLAY_OPACITY;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(TEXT_STAMP_BACK_SCALE_X, TEXT_STAMP_BACK_SCALE_Y);
  ctx.fillStyle = textColor;
  ctx.globalAlpha = alpha;
  drawCenteredSpacedText(ctx, display, 0, 0, TEXT_STAMP_BACK_OVERLAY_LETTER_SPACING);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  applyBackStampTextureTransform(texture);

  const material = TEXT_STAMP_BACK_REFLECTIVE
    ? new THREE.MeshPhysicalMaterial({
      map: texture,
      transparent: true,
      metalness: TEXT_STAMP_BACK_METALNESS,
      roughness: TEXT_STAMP_BACK_ROUGHNESS,
      clearcoat: TEXT_STAMP_BACK_CLEARCOAT,
      clearcoatRoughness: TEXT_STAMP_BACK_CLEARCOAT_ROUGHNESS,
      envMapIntensity: TEXT_STAMP_BACK_ENV_INTENSITY,
      toneMapped: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    })
    : new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      toneMapped: false,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

  if (TEXT_STAMP_BACK_REFLECTIVE && TEXT_STAMP_BACK_USE_SURFACE_MAPS && material.isMeshPhysicalMaterial) {
    material.roughnessMap = surfaceMaterialMaps?.roughnessMap || null;
    material.metalnessMap = surfaceMaterialMaps?.metalnessMap || null;
    material.normalMap = surfaceMaterialMaps?.normalMap || null;
    material.bumpMap = surfaceMaterialMaps?.heightMap || null;
    material.bumpScale = surfaceMaterialMaps?.heightMap ? TEXT_STAMP_BACK_SURFACE_BUMP_SCALE : 0;
    material.clearcoatNormalMap = surfaceMaterialMaps?.normalMap || null;
  }

  if (TEXT_STAMP_BACK_REFLECTIVE && TEXT_STAMP_BACK_USE_STAMP_BUMP && material.isMeshPhysicalMaterial) {
    material.bumpMap = textBackStampTexture || null;
    material.bumpScale = textBackStampTexture ? TEXT_STAMP_BACK_STAMP_BUMP_SCALE : material.bumpScale;
  }

  // Back text should remain visible regardless of winding/culling on mirrored UVs.
  material.side = THREE.DoubleSide;

  const backDirection = plateBackZ <= plateFrontZ ? -1 : 1;
  const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_HEIGHT), material);
  overlayMesh.position.set(0, 0, plateBackZ + (backDirection * TEXT_STAMP_BACK_OVERLAY_LIFT));
  // Face the rear outward normal so the text reads from the back camera angle.
  overlayMesh.rotation.y = backDirection < 0 ? Math.PI : 0;
  overlayMesh.renderOrder = 4;
  overlayMesh.visible = is3D;
  plateGroup.add(overlayMesh);
  textBackOverlayMesh = overlayMesh;
}

function buildStampedTextBumpTexture() {
  const display = getDisplayText(currentText);
  const isPlaceholder = !(currentText && currentText.trim());

  const canvas = document.createElement('canvas');
  canvas.width = TEXT_STAMP_WIDTH;
  canvas.height = TEXT_STAMP_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxW = canvas.width * TEXT_STAMP_MAX_WIDTH_RATIO;
  let fontSize = canvas.height * 0.42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${TEXT_STAMP_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;

  while ((measureSpacedTextWidth(ctx, display, 0, TEXT_STAMP_BUMP_SPACE_WIDTH) * TEXT_STAMP_BUMP_SCALE_X) > maxW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${TEXT_STAMP_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;
  }

  const y = canvas.height * TEXT_STAMP_BUMP_CENTER_Y_RATIO;
  const x = canvas.width * TEXT_STAMP_BUMP_CENTER_X_RATIO;

  ctx.save();
  ctx.filter = `blur(${TEXT_STAMP_BUMP_EDGE_BLUR}px)`;
  ctx.fillStyle = isPlaceholder ? 'rgba(255,255,255,0.45)' : '#ffffff';
  ctx.translate(x, y);
  ctx.scale(TEXT_STAMP_BUMP_SCALE_X, TEXT_STAMP_BUMP_SCALE_Y);
  drawCenteredSpacedText(ctx, display, 0, 0, 0, TEXT_STAMP_BUMP_SPACE_WIDTH);
  ctx.restore();

  if (TEXT_STAMP_INSET > 0) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, TEXT_STAMP_INSET);
    ctx.fillRect(0, canvas.height - TEXT_STAMP_INSET, canvas.width, TEXT_STAMP_INSET);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  applyStampBumpTextureTransform(texture);
  return texture;
}

function buildBackStampedTextBumpTexture() {
  const display = getDisplayText(currentText);
  const isPlaceholder = !(currentText && currentText.trim());
  const backRotation = Number(TEXT_STAMP_BACK_CONFIG.bumpRotation ?? TEXT_STAMP_BUMP_CONFIG.rotation ?? 0);
  const backMirrorX = (TEXT_STAMP_BACK_CONFIG.bumpMirrorX ?? TEXT_STAMP_BACK_CONFIG.mirrorX ?? TEXT_STAMP_BUMP_CONFIG.mirrorX ?? false) === true;
  const backMirrorY = (TEXT_STAMP_BACK_CONFIG.bumpMirrorY ?? TEXT_STAMP_BACK_CONFIG.mirrorY ?? TEXT_STAMP_BUMP_CONFIG.mirrorY ?? false) === true;

  const canvas = document.createElement('canvas');
  canvas.width = TEXT_STAMP_WIDTH;
  canvas.height = TEXT_STAMP_HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxW = canvas.width * TEXT_STAMP_BACK_OVERLAY_MAX_WIDTH_RATIO;
  let fontSize = canvas.height * 0.42;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${TEXT_STAMP_BACK_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;

  while ((measureSpacedTextWidth(ctx, display, 0, TEXT_STAMP_BACK_BUMP_SPACE_WIDTH) * TEXT_STAMP_BACK_SCALE_X) > maxW && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${TEXT_STAMP_BACK_FONT_WEIGHT} ${fontSize}px ${activeStampFontFamily}`;
  }

  // Duplicate front stamp/bump settings and allow back X/Y placement overrides.
  const y = canvas.height * TEXT_STAMP_BACK_CENTER_Y_RATIO;
  const x = canvas.width * TEXT_STAMP_BACK_CENTER_X_RATIO;

  ctx.save();
  ctx.filter = `blur(${TEXT_STAMP_BACK_EDGE_BLUR}px)`;
  ctx.fillStyle = isPlaceholder ? 'rgba(255,255,255,0.45)' : '#ffffff';
  ctx.translate(x, y);
  if (backRotation !== 0) {
    ctx.rotate(backRotation);
  }
  ctx.scale(
    TEXT_STAMP_BACK_SCALE_X * (backMirrorX ? -1 : 1),
    TEXT_STAMP_BACK_SCALE_Y * (backMirrorY ? -1 : 1)
  );
  drawCenteredSpacedText(ctx, display, 0, 0, 0, TEXT_STAMP_BACK_BUMP_SPACE_WIDTH);
  ctx.restore();

  if (TEXT_STAMP_INSET > 0) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, TEXT_STAMP_INSET);
    ctx.fillRect(0, canvas.height - TEXT_STAMP_INSET, canvas.width, TEXT_STAMP_INSET);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  applyBackStampBumpTextureTransform(texture);
  return texture;
}

function composeFrontAndBackStampBumpTextures(frontTexture, backTexture) {
  if (!frontTexture && !backTexture) return null;
  if (!frontTexture) return backTexture;
  if (!backTexture) return frontTexture;

  const frontImage = frontTexture.image;
  const backImage = backTexture.image;
  if (!frontImage || !backImage) return frontTexture;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(frontImage.width || TEXT_STAMP_WIDTH, backImage.width || TEXT_STAMP_WIDTH);
  canvas.height = Math.max(frontImage.height || TEXT_STAMP_HEIGHT, backImage.height || TEXT_STAMP_HEIGHT);
  const ctx = canvas.getContext('2d');

  const frontCanvas = document.createElement('canvas');
  frontCanvas.width = canvas.width;
  frontCanvas.height = canvas.height;
  const frontCtx = frontCanvas.getContext('2d');
  frontCtx.drawImage(frontImage, 0, 0, canvas.width, canvas.height);
  const frontPixels = frontCtx.getImageData(0, 0, canvas.width, canvas.height);

  const backCanvas = document.createElement('canvas');
  backCanvas.width = canvas.width;
  backCanvas.height = canvas.height;
  const backCtx = backCanvas.getContext('2d');
  backCtx.drawImage(backImage, 0, 0, canvas.width, canvas.height);
  const backPixels = backCtx.getImageData(0, 0, canvas.width, canvas.height);

  const mergedPixels = ctx.createImageData(canvas.width, canvas.height);
  const backDirection = TEXT_STAMP_EMBOSS_INVERT_BACK ? -1 : 1;

  for (let i = 0; i < mergedPixels.data.length; i += 4) {
    const frontValue = frontPixels.data[i] / 255;
    const backValue = backPixels.data[i] / 255;
    const heightValue = THREE.MathUtils.clamp(
      TEXT_STAMP_EMBOSS_NEUTRAL
        + (frontValue * 0.5 * TEXT_STAMP_EMBOSS_FRONT_STRENGTH)
        + (backValue * 0.5 * TEXT_STAMP_EMBOSS_BACK_STRENGTH * backDirection),
      0,
      1
    );
    const channel = Math.round(heightValue * 255);

    mergedPixels.data[i] = channel;
    mergedPixels.data[i + 1] = channel;
    mergedPixels.data[i + 2] = channel;
    mergedPixels.data[i + 3] = 255;
  }

  ctx.putImageData(mergedPixels, 0, 0);

  const merged = new THREE.CanvasTexture(canvas);
  merged.wrapS = THREE.ClampToEdgeWrapping;
  merged.wrapT = THREE.ClampToEdgeWrapping;
  merged.flipY = false;
  return merged;
}

function applyStampedTextToPlateMaterial() {
  if (!('bumpMap' in plateFaceMat)) return false;

  disposeTextStampTexture();
  textStampTexture = buildStampedTextBumpTexture();
  disposeBackTextStampTexture();
  textBackStampTexture = TEXT_STAMP_BACK_ENABLED ? buildBackStampedTextBumpTexture() : null;

  const combinedStampTexture = composeFrontAndBackStampBumpTextures(textStampTexture, textBackStampTexture) || textStampTexture;

  if (plateFaceMat.map) {
    combinedStampTexture.repeat.copy(plateFaceMat.map.repeat);
    combinedStampTexture.offset.copy(plateFaceMat.map.offset);
    combinedStampTexture.center.copy(plateFaceMat.map.center);
    combinedStampTexture.flipY = plateFaceMat.map.flipY;
  }

  applyStampBumpTextureTransform(combinedStampTexture);

  plateFaceMat.bumpMap = combinedStampTexture;
  const requestedDepth = Math.abs(TEXT_STAMP_DEPTH);
  const signedDepth = TEXT_STAMP_DEPTH < 0 ? -1 : 1;
  plateFaceMat.bumpScale = signedDepth * Math.max(requestedDepth, TEXT_STAMP_MIN_VISIBLE_DEPTH);
  plateFaceMat.side = TEXT_STAMP_BACK_ENABLED ? THREE.DoubleSide : THREE.FrontSide;

  if (TEXT_STAMP_DISABLE_SURFACE_NORMALS) {
    plateFaceMat.normalMap = null;
    if ('clearcoatNormalMap' in plateFaceMat) {
      plateFaceMat.clearcoatNormalMap = null;
    }
  }

  return true;
}

function build3DText() {
  if (TEXT_3D_MODE === 'stamped') {
    disposeTextMesh();
    const appliedStamp = applyStampedTextToPlateMaterial();

    buildStampedTextOverlayMesh();
    disposeBackTextOverlayMesh();
    if (appliedStamp) {
      plateFaceMat.needsUpdate = true;
      return;
    }

    console.warn('[Plate Preview] Stamped text requires a bump-capable material. Falling back to mesh text.');
  }

  disposeTextOverlayMesh();
  disposeBackTextOverlayMesh();
  disposeTextStampTexture();
  disposeBackTextStampTexture();
  if ('bumpMap' in plateFaceMat) {
    plateFaceMat.bumpMap = surfaceMaterialMaps?.heightMap || null;
    plateFaceMat.bumpScale = surfaceMaterialMaps?.heightMap ? SURFACE_BUMP_SCALE : 0;
    plateFaceMat.side = THREE.FrontSide;
    plateFaceMat.needsUpdate = true;
  }

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
  textMesh.position.set(0, -TEXT_MESH_Y_OFFSET, plateFrontZ + surfaceLift);
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

async function loadConfiguredStampFont() {
  if (!TEXT_STAMP_FONT_URL || !('FontFace' in window) || !document.fonts) {
    return false;
  }

  try {
    const fontFace = new FontFace(TEXT_STAMP_FONT_FACE_NAME, `url(${TEXT_STAMP_FONT_URL})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    activeStampFontFamily = `'${TEXT_STAMP_FONT_FACE_NAME}', ${TEXT_STAMP_FONT_FALLBACK_FAMILY}`;
    if (TEXT_2D_USE_STAMP_FONT) {
      active2DFontFamily = activeStampFontFamily;
    }
    return true;
  } catch {
    return false;
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
    drawPlate2D(thumbCanvas.getContext('2d'), plateType, '', 240, 120);

    const name = document.createElement('div');
    name.className = 'plate-card-name';
    name.textContent = plateType.name;

    card.appendChild(thumbCanvas);
    card.appendChild(name);

    card.addEventListener('click', () => {
      currentPlateId = plateType.id;
      buildGallery();
      syncPlateInputWithCurrentType();
      updatePreview();
    });

    galleryEl.appendChild(card);
  });
}

function draw2D() {
  const plateType = getCurrentPlateType();
  drawPlate2D(ctx2d, plateType, currentText, canvas2dEl.width, canvas2dEl.height);
}

function apply2DZoom() {
  canvas2dEl.style.transformOrigin = 'center center';
  canvas2dEl.style.transform = `scale(${zoom2DLevel})`;
}

function applyViewMode() {
  viewToggleEl.checked = is3D;
  modeBadgeEl.textContent = is3D ? '3D' : '2D';
  toggleLabelEl.textContent = is3D ? '3D View' : '2D View';
  toggleSubEl.textContent = is3D ? 'Drag to rotate, Scroll to zoom' : 'Scroll to zoom';

  threeMountEl.style.display = is3D ? 'block' : 'none';
  view2dEl.classList.toggle('visible', !is3D);
  hint3dEl.style.display = is3D ? 'block' : 'none';

  if (textMesh) {
    textMesh.visible = is3D;
  }

  if (textOverlayMesh) {
    textOverlayMesh.visible = is3D;
  }

  if (textBackOverlayMesh) {
    textBackOverlayMesh.visible = is3D;
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
  const { availableCharacters, format } = getPlateInputRules();
  const rawValue = normalizePlateRawText(plateInputEl.value).slice(0, availableCharacters);
  const value = applyPlateFormat(rawValue, format);

  plateInputEl.value = value;
  currentText = value;
  charCountEl.textContent = `${rawValue.length} / ${availableCharacters}`;
  charCountEl.classList.toggle('warn', rawValue.length >= Math.max(availableCharacters - 1, 1));

  updatePreview();
});

viewToggleEl.addEventListener('change', () => {
  is3D = viewToggleEl.checked;
  applyViewMode();
  updatePreview();
});

formatBypassToggleEl?.addEventListener('change', () => {
  formatBypassEnabled = formatBypassToggleEl.checked;
  syncPlateInputWithCurrentType();
  updatePreview();
});

view2dEl.addEventListener('wheel', (event) => {
  if (is3D) return;

  event.preventDefault();
  const direction = Math.sign(event.deltaY);
  if (direction === 0) return;

  zoom2DLevel = THREE.MathUtils.clamp(
    zoom2DLevel - (direction * UI_2D_ZOOM_STEP),
    UI_2D_ZOOM_MIN,
    UI_2D_ZOOM_MAX
  );
  apply2DZoom();
}, { passive: false });

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
  await setupPlateGeometry();
  surfaceMaterialMaps = await loadSurfaceMaterialMaps();
  plateTypes = await Promise.all(PLATE_TYPES.map(loadPlateTypeAssets));

  if (!plateTypes.some((plateType) => plateType.id === currentPlateId) && plateTypes.length > 0) {
    currentPlateId = plateTypes[0].id;
  }

  loadedFont = await loadConfiguredFont();
  await loadConfiguredStampFont();

  if (formatBypassRowEl) {
    formatBypassRowEl.style.display = PLATE_UI_CONFIG.showFormatBypassToggle === false ? 'none' : 'flex';
  }
  if (formatBypassToggleEl) {
    formatBypassToggleEl.checked = false;
  }
  formatBypassEnabled = false;
  apply2DZoom();

  buildGallery();
  syncPlateInputWithCurrentType();
  applyViewMode();
  updatePreview();
  animate();

  setTimeout(() => {
    hint3dEl.style.opacity = '0';
  }, 4000);
})();
