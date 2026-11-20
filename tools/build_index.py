#!/usr/bin/env python3
"""Scan content/works/ and write content/works.json for the website.

Usage:  python3 tools/build_index.py
No extra installs needed. Run it after adding, editing or removing an artwork.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
WORKS_DIR = CONTENT / "works"
OUT = CONTENT / "works.json"

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}
SLUG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_BYTES = 2 * 1024 * 1024
STATUSES = {"available", "sold", "private", "on-loan"}

errors, warnings = [], []


def detail_key(p: Path):
    m = re.search(r"(\d+)", p.stem)
    return (int(m.group(1)) if m else 10**9, p.name)


def load_series_ids():
    path = CONTENT / "series.json"
    if not path.exists():
        return None
    try:
        return {s["id"] for s in json.loads(path.read_text(encoding="utf-8"))}
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        errors.append(f"series.json: can't read it ({e})")
        return None


def build():
    series_ids = load_series_ids()
    works = []
    for folder in sorted(p for p in WORKS_DIR.iterdir() if p.is_dir()):
        slug = folder.name
        where = f"works/{slug}"
        if not SLUG_RE.match(slug):
            warnings.append(f"{where}: folder name should be lowercase-with-hyphens")

        info_path = folder / "info.json"
        if not info_path.exists():
            errors.append(f"{where}: missing info.json")
            continue
        try:
            info = json.loads(info_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            errors.append(f"{where}/info.json: invalid JSON at line {e.lineno} ({e.msg})")
            continue

        if info.get("hidden"):
            continue
        if not info.get("title"):
            errors.append(f"{where}: info.json needs a \"title\"")
        if not isinstance(info.get("year"), int):
            errors.append(f"{where}: info.json needs a \"year\" as a number, e.g. 2025")
        if series_ids is not None and info.get("series") and info["series"] not in series_ids:
            warnings.append(f"{where}: series \"{info['series']}\" isn't listed in series.json")
        if info.get("status") and info["status"] not in STATUSES:
            warnings.append(f"{where}: status should be one of {sorted(STATUSES)}")

        images = [p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXT]
        for p in images:
            if " " in p.name or p.name != p.name.lower():
                warnings.append(f"{where}/{p.name}: use lowercase names without spaces")
            if p.stat().st_size > MAX_BYTES:
                mb = p.stat().st_size / 1024 / 1024
                warnings.append(f"{where}/{p.name}: {mb:.1f} MB — resize to ~2400px / under 1 MB")
        main = [p for p in images if p.stem.lower() == "main"]
        if not main:
            errors.append(f"{where}: no main image (name it main.jpg)")
            continue
        if len(main) > 1:
            warnings.append(f"{where}: more than one main image ({', '.join(p.name for p in main)}) — keep just one")
        details = sorted((p for p in images if p not in main), key=detail_key)

        rel = lambda p: p.relative_to(CONTENT).as_posix()
        works.append({
            "slug": slug,
            **{k: v for k, v in info.items() if k != "hidden"},
            "image": rel(main[0]),
            "details": [rel(p) for p in details],
        })

    works.sort(key=lambda w: (w.get("order", 10**9), -w.get("year", 0), w["slug"]))
    return works


def main():
    if not WORKS_DIR.exists():
        sys.exit(f"Can't find {WORKS_DIR}")
    works = build()
    for w in warnings:
        print(f"  warning: {w}")
    for e in errors:
        print(f"  ERROR:   {e}")
    if errors:
        sys.exit(f"\n{len(errors)} error(s) — fix them and run again. works.json not updated.")
    OUT.write_text(json.dumps(works, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nOK — {len(works)} artwork(s) written to content/works.json"
          + (f" ({len(warnings)} warning(s))" if warnings else ""))


if __name__ == "__main__":
    main()
