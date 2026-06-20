export const TEXTURE_ROOT = './textures';

export const TEXTURE_FILES = {
  diffuse: 'texture.png',
  normal: 'texture_n.png'
};

export const PLATE_UI_CONFIG = {
  showFormatBypassToggle: true,
  twoDZoomMin: 0.7,
  twoDZoomMax: 2.4,
  twoDZoomStep: 0.1,
  twoDZoomDefault: 1
};

export const PLATE_TEXT_2D_CONFIG = {
  sizeRatio: 0.6,
  maxWidthRatio: 0.9,
  autoFitToWidth: false,
  minFontSizePx: 2,
  centerYRatio: 0.62,
  letterSpacing: 0.0,
  spaceWidth: 90,
  useStampFont: true,
  fontFamily: "'Arial Black', Arial, sans-serif",
  fontWeight: 100
};

export const PLATE_TEXT_3D_CONFIG = {
  mode: 'stamped',
  size: 0.825,
  height: 0.013,
  curveSegments: 14,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.35,
  bevelOffset: 0,
  bevelSegments: 20,
  maxWidthRatio: 1.5,
  centerYOffset: 0.02,
  meshYOffset: 0.12,
  meshZOffset: -0.0275,
  stamp: {
    width: 2048,
    height: 1024,
    maxWidthRatio: 1.0,
    centerXRatio: 0.5,
    centerYRatio: 0.595,
    edgeBlurPx: 6,
    insetPx: 36,
    depth: 15.0,
    scaleX: 1.4,
    scaleY: 1.4,
    bump: {
      centerXRatio: 0.518,
      centerYRatio: 0.825,
      scaleX: 1.2,
      scaleY: 0.6,
      edgeBlurPx: 2,
      rotation: 0,
      mirrorX: false,
      mirrorY: false,
      spaceWidth: 160
    },
    emboss: {
      neutral: 0.5,
      frontStrength: 1.0,
      backStrength: 1.0,
      invertBack: true
    },
    overlay2D: {
      enabled: true,
      opacity: 1,
      fontWeight: 100,
      lift: 0.0025,
      maxWidthRatio: 1.0,
      letterSpacing: 0.0,
      spaceWidth: 160,
      reflective: true,
      useSurfaceMaps: true,
      surfaceBumpScale: 0.25,
      useStampBump: true,
      stampBumpScale: 0.2,
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.8,
      rotation: 3.141592653589793,
      mirrorX: true,
      mirrorY: false
    },
    back: {
      enabled: true,
      mirrorFront: false,
      overlay2DEnabled: false,
      centerXRatio: 0.5765,
      centerYRatio: 0.385,
      scaleX: 1.15,
      scaleY: 0.6,
      edgeBlurPx: 2,
      spaceWidth: 160,
      mirrorX: true,
      mirrorY: false,
      opacity: 0.9,
      lift: 0.0025,
      maxWidthRatio: 1.0,
      letterSpacing: 0.0,
      fontWeight: 600,
      reflective: true,
      useSurfaceMaps: true,
      surfaceBumpScale: 0.2,
      useStampBump: true,
      stampBumpScale: 0.18,
      metalness: 0.88,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.6
    },
    minVisibleDepth: 0.35,
    disableSurfaceNormals: true,
    fontUrl: './fonts/dealerplate_california.otf',
    fontFaceName: 'DealerplateCalifornia-Regular',
    fontFamily: "'Arial Black', Arial, sans-serif",
    fontWeight: 600
  }
};

export const PLATE_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    folder: 'Standard',
    format: 'XXX  XXX',
    availableCharacters: 6,
    // Optional overrides:
    diffuseTexturePath2D: './textures/Standard/SA_1.png',
    diffuseTexturePath3D: './textures/Standard/SA_1_3D.png',
    textColor2D: '#2C317E',
    textColor3D: '#232762'
  },
  {
    id: 'vanity',
    name: 'Vanity',
    folder: 'Vanity',
    format: null,
    availableCharacters: 8,
    // Optional overrides:
    diffuseTexturePath2D: './textures/Vanity/SA_2.png',
    diffuseTexturePath3D: './textures/Vanity/SA_2_3D.png',
    textColor2D: '#f6f7fb',
    textColor3D: '#f3f4f8'
  },
  {
    id: 'test',
    name: 'Test',
    folder: 'Test',
    format: null,
    availableCharacters: 8,
    // Optional overrides:
    diffuseTexturePath2D: './textures/Test/Test.png',
    diffuseTexturePath3D: './textures/Test/Test_3D.png',
    textColor2D: '#2C317E',
    textColor3D: '#232762'
  }
];

export const DEFAULT_PLATE_TYPE_ID = PLATE_TYPES[0].id;

export const PLATE_FONT_CONFIG = {
  customTypefaceUrl: './fonts/License_Plate.json',
  fallbackTypefaceUrl: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'
};
