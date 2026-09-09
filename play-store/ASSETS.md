# Play Store listing assets

## Required graphics

| Asset | Size | Format | Notes |
|-------|------|--------|-------|
| **App icon** | 512 × 512 px | 32-bit PNG | No transparency. Use `icon-512.png` in this folder. |
| **Feature graphic** | 1024 × 500 px | PNG or JPEG | Banner at top of store listing. |
| **Phone screenshots** | Min 1080 × 1920 px | PNG or JPEG | 2–8 shots: home, shop dashboard, order, bill, profile. |
| **7-inch tablet** (optional) | Min 1200 × 1920 | PNG or JPEG | |
| **10-inch tablet** (optional) | Min 1600 × 2560 | PNG or JPEG | |

## App icon from repo

Source: [`public/brand-logo-source.jpg`](../public/brand-logo-source.jpg) (brand green `#1b3022`, gold sewing machine).

Regenerate web + Android launcher icons:

```bash
node scripts/generate-app-logo.mjs
```

This writes `play-store/icon-512.png`, `public/logo.png`, and Android `ic_launcher*` assets.

## Text files in this folder

- `short-description-en.txt` — max 80 characters
- `full-description-en.txt` — up to 4000 characters

## URLs for Play Console

| Field | URL |
|-------|-----|
| Privacy policy | https://lk-studio-1.onrender.com/privacy |
| Website (optional) | https://lk-studio-1.onrender.com |

## Contact

- Email: lkstudio.support@gmail.com
