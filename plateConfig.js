export const TEXTURE_ROOT = './textures';

export const TEXTURE_FILES = {
  diffuse: 'texture.png',
  normal: 'texture_n.png'
};

export const PLATE_MODEL_CONFIG = {
  width: 4.4,
  height: 2.2,
  thickness: 0.045,
  cornerRadius: 0.16,
  faceInset: 0.1
};

export const PLATE_TEXT_3D_CONFIG = {
  size: 0.62,
  height: 0.03,
  curveSegments: 8,
  bevelEnabled: true,
  bevelThickness: 0.004,
  bevelSize: 0.003,
  bevelSegments: 2,
  maxWidthRatio: 0.72,
  centerYOffset: 0.02,
  meshYOffset: 0.12,
  meshZOffset: 0.004
};

export const PLATE_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    folder: 'Standard',
    // Optional overrides:
    // diffuseTexturePath: './textures/Standard/texture.png',
    // normalTexturePath: './textures/Standard/texture_n.png',
    textColor2D: '#141414',
    textColor3D: '#1a1a1a'
  },
  {
    id: 'vanity',
    name: 'Vanity',
    folder: 'Vanity',
    textColor2D: '#f6f7fb',
    textColor3D: '#f3f4f8'
  }
];

export const DEFAULT_PLATE_TYPE_ID = PLATE_TYPES[0].id;

export const PLATE_FONT_CONFIG = {
  customTypefaceUrl: './fonts/license-plate.typeface.json',
  fallbackTypefaceUrl: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'
};
