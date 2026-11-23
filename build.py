#!/usr/bin/env python3
"""Build index.html from the source files in src/.

Usage: python3 build.py
Combines src/shell.html (page layout + CSS), src/questions.js (question bank),
src/game.js (game engine), the cozy art layer (src/cozy*.js) and every sprite in
art/cozy/sprites/*.png (embedded as COZY_ART) into one self-contained index.html.
"""
import base64, json
from pathlib import Path

root = Path(__file__).parent
src = root / "src"
shell = (src / "shell.html").read_text(encoding="utf-8")
game = (src / "game.js").read_text(encoding="utf-8")
cozy = (src / "cozy.js").read_text(encoding="utf-8") + "\n" + (src / "cozy_chars.js").read_text(encoding="utf-8") + "\n" + (src / "cozy_dinos.js").read_text(encoding="utf-8") + "\n" + (src / "cozy_items.js").read_text(encoding="utf-8") + "\n" + (src / "cozy_hero.js").read_text(encoding="utf-8")

art = {}
sheets = root / "art" / "cozy" / "sprites"
if sheets.is_dir():
    for p in sorted(sheets.glob("*.png")):
        art[p.stem] = "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()
cozy = f"const COZY_ART={json.dumps(art)};\n" + cozy

BOOT = "loadSigArt().then(boot);"
assert BOOT in game, "boot line not found in game.js"
game = game.replace(BOOT, cozy + "\n" + BOOT)

out = shell.replace("/*QUESTIONS*/", (src / "questions.js").read_text(encoding="utf-8"))
out = out.replace("/*GAME*/", game)
(root / "index.html").write_text(out, encoding="utf-8")
print(f"Built index.html ({len(out):,} bytes) with {len(art)} custom sprite sheet(s)")
