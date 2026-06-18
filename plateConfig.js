export const TEXTURE_ROOT = './textures';

export const PLATE_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    folder: 'Standard',
    texture: 'SA_1.png',
    normalMap: 'SA_1_N.png',
    textColor2D: '#141414',
    textColor3D: '#1a1a1a'
  },
  {
    id: 'vanity',
    name: 'Vanity',
    folder: 'Vanity',
    texture: 'SA_2.png',
    normalMap: 'Normal.png',
    textColor2D: '#f6f7fb',
    textColor3D: '#f3f4f8'
  }
];

export const DEFAULT_PLATE_TYPE_ID = PLATE_TYPES[0].id;

export const PLATE_FONT_CONFIG = {
  customTypefaceUrl: './fonts/LicensePlate.ttf',
  fallbackTypefaceUrl: 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json'
};
