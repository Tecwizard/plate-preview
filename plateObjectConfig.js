export const PLATE_MODEL_CONFIG = {
  width: 4.4,
  height: 2.2,
  thickness: 0.045,
  // Corner roundness value used by 3D plate body/face rounded geometry.
  // Min: 0
  // Max: min(width, height) / 2 (values above this are clamped)
  cornerRadius: 0.16,
  // Inset used for the front face plane dimensions.
  // Min: 0
  // Max: min(width, height) - 0.001 (keeps face width/height positive)
  faceInset: 0.1
};
