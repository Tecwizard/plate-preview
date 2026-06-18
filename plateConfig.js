export const TEXTURE_ROOT = './textures';

export const PLATE_TYPES = [
  {
    id: 'standard',
    name: 'Standard',
    folder: 'Standard',
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
