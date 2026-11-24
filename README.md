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
| `src/cozy.js` | The cozy art layer: tiles, palette, tall trees, buildings, lamps, day/night lighting, particles, denser scenery, UI skin. |
| `src/cozy_chars.js` | Character drawing helpers and function patching (`ccPatch`). |
| `src/cozy_dinos.js` | Dinos and bosses from the drawn sprites, color variants, Dome-type family. |
| `src/cozy_items.js` | Item icons, map chests and the thrown items in battle. |
| `src/cozy_hero.js` | Player and townspeople from the drawn base + hairstyle sheets: recoloring, gear, helmets, carried items, Sail-type Dex card. |
| `src/cozy_season.js` | The saved day/night clock (Day N), the Season Goals awards (Two-Minute Drill, One-Week Season, Perfect Season) and the difficulty coach that suggests moving up or down. |
| `src/cozy_world2.js` | World polish: hidden gold chests with clues (golden dragonflies, golden flowers, riddles), shorelines, town props, ambient life, weather. |
| `src/cozy_online.js` | Online rooms: friends with the same room code see each other (Supabase Realtime broadcast + presence) and send emotes/preset phrases. Opt-in; solo play is unchanged. |
| `art/cozy/sprites/` | Every drawn sprite (embedded into `index.html` by the build). See `art/cozy/README.md`. |
| `build.py` | Combines all of the above into `index.html`. |

```
python3 build.py
```

Always commit both the changed `src/` files and the rebuilt `index.html`.

## Rules for changes

- Don't change `WORLD_SEED`, map size, or the order of world generation: saved games rely on item and NPC ids staying stable.
- Keep the save format (`localStorage` key `bradyDinoQuest_v1`) backward compatible: add new fields with defaults in `startGame()`.
- Append new questions to the end of the banks; question ids are their position, and the Film Room and Daily Challenge depend on them.
- Picture questions are excluded from the Daily Challenge so everyone's daily questions stay identical.

## HD art

The game logic works in 16-unit tiles, but the canvas draws at 2 pixels per unit (`RS=2`).
Map tiles and objects are double resolution (32×32); characters (16×16) and dinosaurs (56×48) use the original art drawn at 2×.
Art canvases can carry `.hd = 2` (made with `hdCanvas()`); draw sprites with `blit()` or size them with `spW()`/`spH()` so they land in world units.

### Referee art

The 15 referee signals use hand-drawn pixel art (`art/referee/`, embedded as `SIG_ART`), shown at exactly 2x.
Touchdown, First down, Offside, Pass interference, False start, Delay of game, Face mask and Unsportsmanlike conduct are cut straight from the artwork.
The other seven reuse the Touchdown referee with new arm poses drawn in the art's palette (`art/referee/make_missing_poses.py`).

