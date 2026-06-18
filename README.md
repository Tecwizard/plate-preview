# Plate Preview

A dark-themed, interactive license plate previewer built with plain HTML, CSS, and JavaScript — no build step required.

## Features

- **3D view** — rotatable Three.js US-style plate with thin rounded geometry.
- **3D text in 3D mode** — extruded plate text generated from a loaded typeface asset.
- **2D view** — flat canvas preview with flat text rendering (no extrusion/shadow effects).
- **Live text update** — preview refreshes as you type.
- **Input validation** — only `A–Z`, `0–9`, and spaces are accepted; lowercase is auto-converted; max 8 characters.
- **Texture-backed plate styles** — each style reads from `textures/<Style>/texture.png` and `texture_n.png`.
- **Dark theme** — clean, modern dark UI.
- **Responsive** — works on narrow screens.

## Running Locally

No build tools needed. Open `index.html` directly in your browser:

```bash
# Option 1 — just open the file
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows

# Option 2 — serve with any static server (avoids import-map edge cases in some browsers)
npx serve .
# or
python3 -m http.server
```

Then navigate to `http://localhost:3000` (or whatever port the server reports).

## Plate Style Configuration

Plate style metadata now lives in:

- `plateConfig.js`

To add a new style:

1. Create a folder under `textures/` (for example `textures/Custom/`).
2. Add:
   - `texture.png` (diffuse/base map)
   - `texture_n.png` (normal map)
3. Add a matching entry in `PLATE_TYPES` in `plateConfig.js`.

You can also point a style directly at custom paths with optional keys:

- `diffuseTexturePath`
- `normalTexturePath`

## Custom Font Setup (3D Text)

3D text uses a Three.js typeface JSON file loaded as a web asset (no OS font install required).

1. Place your converted typeface file at:
   - `fonts/license-plate.typeface.json`
2. If you use a different filename/path, update:
   - `PLATE_FONT_CONFIG.customTypefaceUrl` in `plateConfig.js`

If no custom typeface file is found, the app falls back to Three.js' bundled helvetiker typeface.

3D defaults are configured in:

- `plateObjectConfig.js` → `PLATE_MODEL_CONFIG` (plate dimensions/thickness/corner radius)
- `plateConfig.js` → `PLATE_TEXT_3D_CONFIG` (extrusion, bevel, and placement defaults)

For 3D corner roundness specifically, adjust `PLATE_MODEL_CONFIG.cornerRadius` in `plateObjectConfig.js` (used for both the `RoundedBoxGeometry` body radius and the rounded front-face geometry in `app.js`).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D rendering | [Three.js r160](https://threejs.org/) via CDN |
| 3D controls  | `OrbitControls` (Three.js add-on) |
| 2D rendering | Canvas 2D API |
| UI | Plain HTML / CSS / ES Modules |