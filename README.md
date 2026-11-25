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
| `src/cozy_duel.js` | Online duels: same 10 questions for both players, server-scored (see `server/duels.sql`), optional coin stake. |
| `server/duels_watch.sql` | Adds `dq_duel_watch` for spectators (already included in `duels.sql`). |
| `server/duels.sql` | Supabase setup for duels: tables, the `dq_duel_*` functions and the question bank. Re-run after editing questions. |
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


## Stats (GoatCounter)

Anonymous, cookie-free event counts go to [grittymcduff.goatcounter.com](https://grittymcduff.goatcounter.com) from the GitHub Pages site only (`track()` in `src/game.js`). Only event names are sent. A small per-browser note (`localStorage` key `bradyDinoQuest_stats`, separate from the save) decides which events to send; it never leaves the device.

| Event | Fires | Use it for |
|---|---|---|
| `visit-first` / `visit-first-existing-player` | first visit from a browser (the second if a save already existed) | new players |
| `visit-return` | once per later day the game is opened | returning visits per day |
| `retained-1-day`, `retained-2-week`, `retained-3-month` | once per browser, when it comes back 1, 7 or 30+ days after its first visit | retention |
| `play-days-3`, `-5`, `-10`, `-20` | once per browser, after playing on that many different days | loyal players |
| `funnel-1-new-game` … `funnel-7-champion` | once per browser at each step: new game, first answer, first win, first coach, 3 coaches, all 6 coaches, champion | completion funnel |
| `answers-25` … `answers-1000` | once per browser, after that many answers | how much people learn |
| `daily-first`, `daily-complete` | first and every Daily Challenge finished | Daily Challenge use |
| `new-game-<difficulty>`, `coach-<town>`, `champion-<difficulty>`, `legend-<id>`, `goat-beaten`, `sanctum-found`, `level-<n>` | per save, as before | difficulty mix and late-game progress |

Players who already had a save before these events existed won't fire `funnel-1-new-game`, so read early funnel numbers with that in mind.

## Music

Battles and outdoor travel use recorded songs (`audio/*.m4a`, streamed from GitHub Pages); the title, towns, volcano, secret island and Daily Challenge keep the chiptune.
Battles play "Rise of the Horizon" on a loop. Outdoors alternates "Map of Wonder" and "Pathfinder Playtime".
Each song is turned down in `CZ_SONGS` (`src/cozy_ui.js`, `trim`) to sit at the chiptune's loudness, then goes through the Music level (default 5%) and the fade-out (90 s of music, then a 20 s fade, again on the next area or battle; "Keep music playing" in Options turns the fade off).
If a song can't load, or the game is opened as a local file, the chiptune plays instead.
