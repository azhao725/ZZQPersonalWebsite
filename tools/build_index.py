#!/usr/bin/env python3
"""Scan content/works/ and write content/data.js for the website.

Usage:  python3 tools/build_index.py
No extra installs needed. Run it after adding, editing or removing a project
or any of its images/videos.
"""
import json
import re
import shutil
import struct
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
WORKS_DIR = CONTENT / "works"
OUT = CONTENT / "data.js"

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}
VIDEO_EXT = {".mp4", ".webm"}
NOT_WEB = {".heic", ".heif", ".mov", ".tif", ".tiff", ".psd"}
MAX_IMAGE = 3 * 1024 * 1024
MAX_VIDEO = 50 * 1024 * 1024
SKIP_NAMES = {"home-poster.jpg"}

errors, warnings = [], []


def natural_key(p: Path):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]


def image_size(path: Path):
    """Return (width, height) for PNG/JPEG/GIF without extra libraries, else None."""
    try:
        with open(path, "rb") as f:
            head = f.read(26)
            if head[:8] == b"\x89PNG\r\n\x1a\n":
                return struct.unpack(">II", head[16:24])
            if head[:6] in (b"GIF87a", b"GIF89a"):
                return struct.unpack("<HH", head[6:10])
            if head[:2] == b"\xff\xd8":
                f.seek(2)
                while True:
                    marker = f.read(2)
                    if len(marker) < 2 or marker[0] != 0xFF:
                        return None
                    if marker[1] in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                                     0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                        f.read(3)
                        h, w = struct.unpack(">HH", f.read(4))
                        return (w, h)
                    seg_len = struct.unpack(">H", f.read(2))[0]
                    f.seek(seg_len - 2, 1)
    except (OSError, struct.error):
        pass
    return None


def video_size(path: Path):
    """(width, height) of a video if ffprobe is installed; otherwise None (the page adapts)."""
    if not shutil.which("ffprobe"):
        return None
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                              "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)],
                             capture_output=True, text=True, timeout=20).stdout.strip()
        w, h = out.split(",")[:2]
        return int(w), int(h)
    except (ValueError, subprocess.SubprocessError, OSError):
        return None


def video_duration(path: Path):
    """Length in whole seconds if ffprobe is installed; otherwise None."""
    if not shutil.which("ffprobe"):
        return None
    try:
        out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                              "-of", "csv=p=0", str(path)],
                             capture_output=True, text=True, timeout=20).stdout.strip()
        return round(float(out))
    except (ValueError, subprocess.SubprocessError, OSError):
        return None


def stamp_pages(version: str):
    """Add ?v=<version> to local css/js links so browsers fetch fresh copies after updates."""
    for name in [p.name for p in ROOT.glob("*.html")]:
        page = ROOT / name
        if not page.exists():
            continue
        html = page.read_text(encoding="utf-8")
        new = re.sub(r'((?:src|href)="(?:assets/(?:css|js)/[^"?]+|content/data\.js))(?:\?v=[^"]*)?"',
                     rf'\1?v={version}"', html)
        if new != html:
            page.write_text(new, encoding="utf-8")


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def build_project(folder: Path):
    where = f"works/{folder.name}"
    info_path = folder / "info.json"
    if not info_path.exists():
        errors.append(f"{where}: missing info.json")
        return None
    try:
        info = json.loads(info_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"{where}/info.json: invalid JSON at line {e.lineno} ({e.msg})")
        return None
    if info.get("hidden"):
        return None
    if not info.get("title"):
        errors.append(f"{where}: info.json needs a \"title\"")
    if "year" in info and not isinstance(info["year"], int):
        errors.append(f"{where}: \"year\" must be a number, e.g. 2025")

    exclude = set(info.get("exclude", []))
    videos = {f.stem for f in folder.iterdir() if f.suffix.lower() in VIDEO_EXT}
    posters = {v: f"{v}-poster.jpg" for v in videos if (folder / f"{v}-poster.jpg").exists()}
    exclude |= set(posters.values())
    media = []
    for p in sorted(folder.iterdir(), key=natural_key):
        ext = p.suffix.lower()
        if not p.is_file() or p.name in exclude or p.name in SKIP_NAMES or p.name == "info.json":
            continue
        if ext in NOT_WEB:
            warnings.append(f"{where}/{p.name}: {ext} doesn't display in most browsers — "
                            "export as .jpg (images) or .mp4 (video). Skipped.")
            continue
        size = p.stat().st_size
        if ext in IMAGE_EXT:
            kind = "image"
            if size > MAX_IMAGE:
                warnings.append(f"{where}/{p.name}: {size/1e6:.1f} MB — aim for under 1–2 MB")
        elif ext in VIDEO_EXT:
            kind = "video"
            if size > MAX_VIDEO:
                warnings.append(f"{where}/{p.name}: {size/1e6:.0f} MB video — compress it")
        else:
            continue
        item = {"type": kind, "src": p.relative_to(CONTENT).as_posix()}
        dims = image_size(p) if kind == "image" else video_size(p)
        if dims:
            item["w"], item["h"] = dims
        if kind == "video":
            if p.stem in posters:
                item["poster"] = f"works/{folder.name}/{posters[p.stem]}"
            if (secs := video_duration(p)):
                item["d"] = secs
        media.append(item)

    sequence = info.get("sequence") or []
    if sequence:
        rank = {name: k for k, name in enumerate(sequence)}
        media.sort(key=lambda m: rank.get(m["src"].rsplit("/", 1)[-1], len(rank)))
        missing = [n for n in sequence if not (folder / n).exists()]
        for n in missing:
            warnings.append(f"{where}: \"{n}\" is in sequence but not in the folder")

    cover = info.get("cover")
    if cover:
        cover = f"works/{folder.name}/{cover}"
    else:
        cover = next((m["src"] for m in media if m["type"] == "image"), None)

    project = {k: v for k, v in info.items() if k not in {"exclude", "hidden", "cover", "sequence"}}
    project.update({
        "slug": info.get("slug") or slugify(folder.name),
        "folder": folder.name,
        "cover": cover,
        "media": media,
    })
    if not media:
        warnings.append(f"{where}: no images/videos yet (page will say 'coming soon')")
    return project


def main():
    if not WORKS_DIR.exists():
        sys.exit(f"Can't find {WORKS_DIR}")
    try:
        site = json.loads((CONTENT / "site.json").read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as e:
        sys.exit(f"content/site.json: can't read it ({e})")

    projects = [p for f in WORKS_DIR.iterdir() if f.is_dir() if (p := build_project(f))]
    projects.sort(key=lambda p: (p.get("order", 10**9), -p.get("year", 0), p["slug"]))

    seen = set()
    for p in projects:
        if p["slug"] in seen:
            errors.append(f"two projects share the address \"{p['slug']}\" — rename a folder")
        seen.add(p["slug"])

    for w in warnings:
        print(f"  warning: {w}")
    for e in errors:
        print(f"  ERROR:   {e}")
    if errors:
        sys.exit(f"\n{len(errors)} error(s) — fix them and run again. data.js not updated.")

    data = {"site": site, "projects": projects}
    OUT.write_text("// AUTO-GENERATED by tools/build_index.py — don't edit by hand.\n"
                   "window.SITE_DATA = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n",
                   encoding="utf-8")
    stamp_pages(time.strftime("%Y%m%d%H%M%S"))
    print(f"\nOK — {len(projects)} project(s) written to content/data.js"
          + (f" ({len(warnings)} warning(s))" if warnings else ""))


if __name__ == "__main__":
    main()
