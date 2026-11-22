# Brady's Gridiron Dino Quest

A Pokémon-style pixel-art RPG where you challenge dinosaurs by answering NFL trivia.

**Play:** https://grittymcduff.github.io/Gridiron_dino_quest/

## How the code is organized

The game ships as one self-contained `index.html` (served by GitHub Pages). Edit the source files in `src/`, then rebuild:

| File | What it holds |
|---|---|
| `src/shell.html` | Page layout, HTML overlays (HUD, battle panel, menus) and all CSS. Contains `/*QUESTIONS*/` and `/*GAME*/` placeholders. |
| `src/questions.js` | The trivia bank (`RAW_Q`, `SUPER_Q`), NPC tips (`TIPS`), and the combined `QB` list. |
| `src/game.js` | The game engine: world generation, sprites, tiles, battles, menus, achievements, music, Daily Challenge, picture questions, saving. |
| `build.py` | Combines the three files into `index.html`. |

```
python3 build.py
```

Always commit both the changed `src/` files and the rebuilt `index.html`.

## Rules for changes

- Don't change `WORLD_SEED`, map size, or the order of world generation: saved games rely on item and NPC ids staying stable.
- Keep the save format (`localStorage` key `bradyDinoQuest_v1`) backward compatible: add new fields with defaults in `startGame()`.
- Append new questions to the end of the banks; question ids are their position, and the Film Room and Daily Challenge depend on them.
- Picture questions are excluded from the Daily Challenge so everyone's daily questions stay identical.
