#!/usr/bin/env python3
"""Build index.html from the source files in src/.

Usage: python3 build.py
Combines src/shell.html (page layout + CSS) with src/questions.js (question bank)
and src/game.js (game engine) into a single self-contained index.html.
"""
from pathlib import Path

root = Path(__file__).parent
src = root / "src"
shell = (src / "shell.html").read_text(encoding="utf-8")
out = shell.replace("/*QUESTIONS*/", (src / "questions.js").read_text(encoding="utf-8"))
out = out.replace("/*GAME*/", (src / "game.js").read_text(encoding="utf-8"))
(root / "index.html").write_text(out, encoding="utf-8")
print(f"Built index.html ({len(out):,} bytes)")
