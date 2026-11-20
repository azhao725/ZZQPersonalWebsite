# Ziqi Zhao — portfolio website

```
index.html              ← home screen (video background + project list)
project.html            ← one page per project (project.html?p=corridor)
assets/                 ← site code: css/, js/, fonts/
content/                ← everything the site displays
├── site.json           ← your name, homepage video
├── works/              ← ONE FOLDER PER PROJECT
│   ├── InfantTower/
│   │   ├── info.json   ← title, year, medium, order
│   │   ├── still1.png  ← images and videos, shown in name order
│   │   └── Fly.mp4
│   ├── Corridor/  Chair/  Sunny/  3DModels/  Paintings/
└── data.js             ← AUTO-GENERATED — don't edit by hand
tools/build_index.py    ← run after any change in content/
originals/              ← full-size masters; NOT uploaded (git-ignored)
```

## Adding or changing a project

1. Put images/videos in the project's folder in `content/works/`.
2. Edit its `info.json`:

   ```json
   { "title": "Corridor", "year": 2025, "medium": "Blender-Arduino environmental experience", "order": 2 }
   ```

   | Field     | Notes |
   |-----------|-------|
   | `title`   | required — shown big on the home screen |
   | `year`    | optional number |
   | `medium`  | optional — small text next to the title |
   | `order`   | position in the list (1 = top) |
   | `cover`   | optional file name of the cover image (default: first image) |
   | `exclude` | optional list of file names in the folder to leave off the page |
   | `hidden`  | `true` hides the whole project |
   | `titleLocal` | optional title in another language, shown big on the project page (e.g. `"阳阳"`) |
   | `descriptionZh` / `description` | optional Chinese / English text under the title; `\n` = new line |
   | `headerImage` | optional file name of an illustration shown to the right of the description |
   | `layout`  | `"fullwidth"` = images fill the page width with no gaps (manga, comics); `"grid"` = rows of 2–4 pieces that fill a box, click to enlarge |
   | `titleBoth` | `true` = show the English title and `titleLocal` on two lines |
   | `sequence` | optional list of file names in the order to show them (others go at the end) |

3. Run `python3 tools/build_index.py` — it checks everything and rebuilds `content/data.js`.
   (Or ask Claude to run it.)
4. Commit and push.

Files appear on the project page in name order — prefix with numbers to control it:
`01-overview.jpg`, `02-detail.jpg`, `03-demo.mp4`.

## File guidelines

- **Images:** JPG (or PNG for flat graphics), long edge ~2400 px, under ~1–2 MB, sRGB.
- **Videos:** MP4 (H.264), ideally under ~20 MB. GitHub refuses any file over 100 MB.
- **Not supported by browsers:** `.HEIC` (iPhone photos) and `.MOV` — export as JPG / MP4.
  The build script skips them and tells you which ones.
- Keep huge originals in `originals/` — they stay on your computer only.

## Previewing locally

Open `index.html` directly in a browser, or run `python3 -m http.server` in this folder
and visit http://localhost:8000.
