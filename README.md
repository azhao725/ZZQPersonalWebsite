# My art website — how files are organized

Everything the website shows lives in `content/`. The site code (added later) only
reads from there, so you never have to touch code to add or change artwork.

```
art-site/
├── content/                  ← everything the site displays
│   ├── site.json             ← your name, tagline, contact, social links
│   ├── series.json           ← (optional) your series/collections, in display order
│   ├── about/
│   │   ├── bio.md            ← your About text (plain text, blank line = new paragraph)
│   │   └── portrait.jpg      ← (optional) photo of you or your studio
│   ├── works/                ← ONE FOLDER PER ARTWORK
│   │   ├── 2025-tidal-memory/
│   │   │   ├── info.json     ← title, year, medium, size, description…
│   │   │   ├── main.jpg      ← the image shown in the gallery
│   │   │   ├── detail-1.jpg  ← (optional) close-ups, other angles
│   │   │   └── detail-2.jpg
│   │   └── 2024-red-hours/
│   │       └── …
│   └── works.json            ← AUTO-GENERATED — don't edit by hand
├── tools/
│   └── build_index.py        ← run after adding/changing works
└── originals/                ← your full-size masters; NOT uploaded (git-ignored)
```

## Adding a new artwork

1. Make a folder in `content/works/` named `YEAR-short-title`, lowercase with hyphens,
   e.g. `2025-tidal-memory`. That name becomes the artwork's web address.
2. Put the main image in it, named `main.jpg` (or `main.png` / `main.webp`).
3. Add any extra images: `detail-1.jpg`, `detail-2.jpg`, … (shown in that order).
4. Copy `info.json` from an existing work and edit it (fields below).
5. Run: `python3 tools/build_index.py`  — it checks everything and updates `works.json`.
6. Commit and push.

## info.json fields

| Field         | Required | Example                          | Notes |
|---------------|----------|----------------------------------|-------|
| `title`       | yes      | `"Tidal Memory"`                 | |
| `year`        | yes      | `2025`                           | number |
| `medium`      | no       | `"Oil on linen"`                 | |
| `dimensions`  | no       | `"120 × 90 cm"`                  | |
| `series`      | no       | `"coastlines"`                   | must match an `id` in `series.json` |
| `description` | no       | `"Painted over one winter…"`     | a few sentences |
| `tags`        | no       | `["painting", "blue"]`           | used for filtering |
| `featured`    | no       | `true`                           | shown big on the homepage |
| `status`      | no       | `"available"`                    | `available`, `sold`, `private`, or leave out |
| `order`       | no       | `1`                              | lower = shown first; otherwise newest first |
| `hidden`      | no       | `true`                           | keep the folder but don't show it |

> The two example works (`2025-tidal-memory`, `2024-red-hours`) use placeholder `.svg`
> images. Replace them with your own art — or delete those folders — then re-run the script.

## Image guidelines

- **Format:** JPG for paintings/photos, PNG only for flat graphics, WebP also fine.
- **Size:** long edge about **2400 px**, ideally under **1 MB** each (the build script warns
  above 2 MB). Big files make the site slow and bloat the git repo.
- **Color:** export in **sRGB**, otherwise colors look dull on the web.
- **Names:** lowercase, no spaces: `main.jpg`, `detail-1.jpg`.
- Keep your huge originals/TIFFs/PSDs in `originals/` — they stay on your computer only.
