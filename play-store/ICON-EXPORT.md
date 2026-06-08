# Export Play Store icon (512×512)

Source: [`public/icon.svg`](../public/icon.svg)

Save the output as **`play-store/icon-512.png`** (required for Play Console).

## Option A — Browser

1. Open `public/icon.svg` in Chrome or Edge.
2. Right-click → Save as / screenshot, or use an online SVG→PNG tool at 512×512.
3. Ensure the canvas is exactly **512×512** with no extra padding unless you want it.

## Option B — ImageMagick

```powershell
magick -background "#1b3022" -resize 512x512 public/icon.svg play-store/icon-512.png
```

## Option C — Inkscape (CLI)

```powershell
inkscape public/icon.svg --export-type=png --export-width=512 --export-filename=play-store/icon-512.png
```

Play requires a **32-bit PNG** with **no alpha** for the store icon (flatten on green background).
