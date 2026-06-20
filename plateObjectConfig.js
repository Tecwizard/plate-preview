export const PLATE_MODEL_CONFIG = {
  width: 4.4,
  height: 2.2,
  thickness: 0.01,
  // Corner roundness value used by 3D plate body/face rounded geometry.
  // Min: 0
  // Max: min(width, height) / 2 (values above this are clamped)
  cornerRadius: 0.23,
  // Inset used for the front face plane dimensions.
  // Min: 0
  // Max: min(width, height) - 0.001 (keeps face width/height positive)
  faceInset: 0.0,
  // Optional GLB model settings.
  model: {
    // Path is relative to the app root.
    url: './textures/plate.glb',
    // Optional explicit material name for the textured plate face.
    // Leave empty to use automatic detection.
    faceMaterialName: 'Material.003',
    // Optional explicit mesh name for the textured plate face.
    // Leave empty to use automatic detection.
    faceMeshName: 'License_Plate_v2',
    // Which side of the model is the visible front face.
    // Use 'max' when the front surface is at the upper Z bounds.
    frontFaceSide: 'max',
    // Auto-fit model bounds to PLATE_MODEL_CONFIG width/height.
    autoFitToPlate: true,
    // Uniform multiplier applied to auto-fit result.
    autoFitPadding: 0.98,
    // UV transform for 3D plate texture on the selected face material.
    // Values are in normalized UV space.
    textureTransform: {
      repeat: { x: 1, y: 1 },
      offset: { x: 0, y: 0 },
      center: { x: 0.5, y: 0.5 },
      rotation: 0,
      // glTF materials usually expect external textures with flipY disabled.
      flipY: false
    },
    // Optional model transform offsets.
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
};
