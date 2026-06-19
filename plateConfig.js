export const TEXTURE_ROOT = './textures';

export const TEXTURE_FILES = {
  diffuse: 'texture.png',
  normal: 'texture_n.png'
};

export const PLATE_TEXT_3D_CONFIG = {
  size: 0.825,
  height: 0.013,
  curveSegments: 14,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.035,
  bevelOffset: 0,
  bevelSegments: 10,
  maxWidthRatio: 0.9,
  centerYOffset: 0.02,
  meshYOffset: 0.12,
  meshZOffset: -0.0275
};

export const PLATE_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    folder: 'Standard',
    // Optional overrides:
    diffuseTexturePath: './textures/Standard/SA_1.png',
    normalTexturePath: './textures/Standard/Normal.png',
    // texture: 'SA_1.png',
    // normalMap: 'SA_1_N.png',
    textColor2D: '#141414',
    textColor3D: '#1a1a1a'
  },
  {
    id: 'vanity',
    name: 'Vanity',
    folder: 'Vanity',
    // Optional overrides:
    diffuseTexturePath: './textures/Vanity/SA_2.png',
    normalTexturePath: './textures/Vanity/Normal.png',
    // texture: 'SA_2.png',
    // normalMap: 'Normal.png',
    textColor2D: '#f6f7fb',
    textColor3D: '#f3f4f8'
  },
  {
    id: 'test',
    name: 'Test',
    folder: 'Test',
    // Optional overrides:
    diffuseTexturePath: './textures/Test/Test.png',
    normalTexturePath: './textures/Test/Normal.png',
    // texture: 'SA_3.png',
    // normalMap: 'Normal.png',
    textColor2D: '#ffffff',
    textColor3D: '#f0f0f0'
  }
];

export const DEFAULT_PLATE_TYPE_ID = PLATE_TYPES[0].id;

export const PLATE_FONT_CONFIG = {
  customTypefaceUrl: './fonts/Dealerplate_California.json',
  fallbackTypefaceUrl: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'
};
