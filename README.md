# Plate Preview

A dark-themed, interactive license plate previewer built with plain HTML, CSS, and JavaScript — no build step required.

## Features

- **3D view** — rotatable Three.js license plate; drag to orbit, scroll to zoom.
- **2D view** — flat canvas rendering for browsers with WebGL trouble.
- **Live text update** — preview refreshes as you type.
- **Input validation** — only `A–Z`, `0–9`, and spaces are accepted; lowercase is auto-converted; max 8 characters.
- **4 built-in plate styles** — Standard, California, Classic, Vintage.
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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D rendering | [Three.js r160](https://threejs.org/) via CDN |
| 3D controls  | `OrbitControls` (Three.js add-on) |
| 2D rendering | Canvas 2D API |
| UI | Plain HTML / CSS / ES Modules |