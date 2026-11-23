# Making your own Cozy Harvest characters

The cozy build draws every character in code (`src/cozy_chars.js`). You can replace
them with hand-drawn sprite sheets. No coding is needed: drop a PNG in a folder and rebuild.

## Sheet layout

One PNG per character. It is a 3 × 4 grid of frames, and **each frame is 40 × 48 pixels**,
so the whole sheet is **120 × 192 px**.

|        | Column 1 | Column 2 | Column 3 |
|--------|----------|----------|----------|
| Row 1  | Facing down, standing | Facing down, step A | Facing down, step B |
| Row 2  | Facing up, standing   | Facing up, step A   | Facing up, step B   |
| Row 3  | Facing left, standing | Facing left, step A | Facing left, step B |
| Row 4  | Facing right, standing| Facing right, step A| Facing right, step B|

- Draw at 1 pixel = 1 pixel. The game shows each pixel at the same size as the map's tile pixels
  (one tile = 32 × 32 px), so a frame is a bit wider than one tile and 1.5 tiles tall.
- Feet touch the **bottom 2 pixels** of each frame and are centered horizontally.
- Use a transparent background. Use a dark warm outline (`#24160f`) and light from the top-left
  to match the rest of the art.
- `templates/hero_template.png` and `templates/npc_template.png` are the built-in models
  exported in this exact layout. Open one in Aseprite, LibreSprite, Piskel or Photoshop and
  paint over it. The `_preview_8x.png` files are enlarged copies with the frame grid drawn on.

## Where to put them

Save finished sheets in `art/cozy/sprites/`, then run `python3 build.py`.

| File name | What it replaces |
|---|---|
| `hero.png` | The player |
| `npc1.png`, `npc2.png`, … `npcN.png` | Townspeople. Each NPC is assigned one of these sheets (the same one every visit). |

If no sheet is found, the built-in model is used. A custom `hero.png` replaces the gear
look (helmets, uniforms and cleats no longer change how the player looks), because a
drawn sheet has a single outfit.

## Other things you can tune (in `src/cozy.js`)

- `COZY.cycle`: length of a full day/night cycle (default 8 minutes).
- `TREE_SCHEMES`: tree color sets. More autumn rows means more fall color.
- `CZ`: the main palette (grass, dirt, logs, roofs, water, window glow).
- The **N** key (or the 🌗 button) cycles Auto / Day / Sunset / Night.

---

# Making your own dinos

Each of the 8 dino families has one body shape, seen from the side, and every dino gets its own
colors and pattern at random. So dino art is painted in **key colors**, and the game recolors it.

## File and size

One PNG per family, **116 × 100 px**, transparent background, saved in `art/cozy/sprites/`:

| File | Family (as shown in game) |
|---|---|
| `dino_rex.png` | Rex-type |
| `dino_raptor.png` | Raptor-type |
| `dino_sauro.png` | Longneck-type |
| `dino_trike.png` | Horned-type |
| `dino_stego.png` | Plated-type |
| `dino_ankylo.png` | Armored-type |
| `dino_ptero.png` | Flyer-type |
| `dino_spino.png` | Sail-type |

- **Face left**, like the templates (the game flips the dino when it needs it to face right).
- Feet on the bottom rows. In battle the frame's bottom edge sits on the platform.
- One pose only: battles bob the dino up and down and flyers float, so don't draw animation frames.
- Leave out the shadow.
- Scale: in battle each of your pixels is drawn 2 × 2 screen pixels (with a light smoothing pass).
  The Dino-Dex, Team tab and the dino that follows you use a half-size copy.

## Key colors

| Paint with | Means | Becomes |
|---|---|---|
| Red `#c00000` (lighter/darker reds for shading) | Body | the dino's body color |
| Green `#00c000` | Belly, throat, light underside | its light color |
| Blue `#0000c0` | Accents: plates, sails, crests, frills, wing membranes | its accent color |
| Yellow `#c0c000` | Claws, horns, teeth, tail club, spikes | its claw/horn color |

- Shade with lighter and darker versions of the same key hue (e.g. `#ff4040` highlight,
  `#800000` shadow). How light or dark you paint becomes how light or dark the final color is.
- **Anything that isn't one of those hues stays exactly as painted:** the dark outline
  (`#24160f` matches the rest of the art), eyes, eye shine, white teeth, scars, gray stone, etc.
  Avoid pinks, oranges, purples and teal inside the dino; they'd land in a key by accident.
- Stripes, spots and the GOAT's vertical stripes are painted on top of the red (body) pixels
  automatically, so don't paint patterns yourself.

## Templates

`templates/dino_<family>_template.png` are the built-in dinos exported at 116 × 100 in key colors.
`dino_templates_preview_3x.png` shows all eight enlarged. Paint over them, save into
`sprites/` with the names above, and run `python3 build.py`. Any family without a file keeps
the built-in art, so you can do them one at a time.

---

# One-of-a-kind boss art

Bosses normally use their family's dino art in fixed colors. To give a boss its own look,
save `art/cozy/sprites/boss_<name>.png` (116 × 100 px, facing left), painted in **final
colors**. Boss art is used exactly as drawn: no key-color recoloring, and no automatic patterns.
`<name>` is the boss's name in lower case with underscores, e.g. `boss_captain_longneck.png`.
The same picture is used in battle and, for bosses that stand on the map, on the map.

`templates/boss_<name>_template.png` are all 15 named dinos exported as they look now;
`boss_templates_preview_2x.png` shows them together. Bosses without a file keep using their family art.

**Boss art can also be 232 × 200** (double detail). It's shown 1:1 in battle, so nothing gets
smoothed away. Either size fills the same space in the game.

**Leave the top ~12% of the frame empty** (about 24 px at 232 × 200, 12 px at 116 × 100).
The battle screen has no room above a full-height frame, so a tall sail or neck would be cut off.
Keep the feet on the bottom row and the art centered.

---

# Full-color dino art with role masks (how the current dinos are done)

The 7 dino families now in `sprites/` (all but Sail-type) are full-color art, not key colors.
Each has two files:

- `dino_<family>.png`: the art, 232 × 200, facing left, top ~12% empty.
- `dino_<family>_mask.png`: the same size, gray levels marking what may be recolored:
  60 = body, 120 = belly, 180 = accent (plates, frill, wings), 240 = claws/horns/spikes/dome,
  0 = keep as drawn (gear, eyes, outline, teeth).

For each wild dino the game swaps in its random colors on the masked pixels, keeping your
shading (each pixel's brightness against the average of its role), adds stripes or spots on the body,
and leaves everything unmasked exactly as drawn. Shiny (golden) dinos and bosses
that use family art work the same way.

**Redoing a family:** `source/cutgrid.py` cuts the 12 poses out of a 3 × 4 sheet image;
`source/dinos.py` picks the battle pose, sizes it, and builds the mask from color rules
(one line per family in `RULES`). All 96 cut poses are in `source/dino_frames/`
(`<family>_r<row>c<col>.png`; row 1 front, 2 back, 3 facing left, 4 facing right). The original
sheets are in `source/dino_sheets/`. You can also paint a mask by hand in the gray levels above.

**The spino slot is now the dome-headed dino.** `sprites/dino_spino.png` (and its mask) is the
dome-headed dino, shown in game as **Dome-type** with names like Blitzocephalus or Snapdome
(set at the end of `src/cozy_dinos.js`). Commissioner Spino keeps his own boss sprite.
The original cut is also kept as `source/dino_pachy.png`.

---

# Item art

All in `art/cozy/sprites/` (cut from the sheets in `source/item_sheets/` by `source/cut_items.py`):

| Files | Size | Where it shows |
|---|---|---|
| `icon_<consumable>.png` (water, orange, sports, icepack, hint, timeout, horn, pep, guard, bar, film, coin) | 48 × 48 | Bag, shop, battle bag |
| `icon_<gear id>.png` for helmets, uniforms, cleats (e.g. `icon_prohelm`, `icon_goldjacket`, `icon_speed`) | 48 × 48 | Gear tab, equipped slots, shop, sell list |
| `icon_<throw type>.png` (ball, bottle, yflag, rflag, whistle, cooler, gold) | 48 × 48 | Icons for all 15 equipment pieces (they share these 7 looks) |
| `held_<throw type>.png` | 32 × 32 | The item thrown in battle, and the item the player carries on the map |
| `map_chest.png`, `map_chestgold.png`, `map_chestopen.png` | 32 × 32 (one tile), bottom-aligned | Treasure chests on the map |
| `map_sparkle.png` | 32 × 32 | Pickup sparkles on the map (they twinkle) |

Anything without a file keeps its emoji or built-in drawing. Emoji in messages and toasts
(e.g. "Found 🍊 Orange Slices!") stay emoji; only the menu cards use the art.

Not used yet: the helmet sheet's front/side/back views, the uniform bodies and the cleat views
are meant for dressing the player itself, which needs the layered player system
(see the Player Customization doc). They're kept in `source/item_sheets/`.

---

# The player (hand-drawn, with customization)

The player now comes from your art: `sprites/heroart.png` (120 × 192, 3 × 4 frames of 40 × 48,
same layout as `hero.png`) plus `sprites/heroart_mask.png`. The mask's gray levels mark
40 = hair, 80 = skin, 120 = shirt, 160 = shorts (kept), 200 = shoes. The game recolors those
from the player's settings, keeping your shading:

| Setting | How it shows |
|---|---|
| Hair color, skin tone | Recolored hair / skin |
| Freckles | A few dots across the cheeks (not on the back view) |
| Uniform | Shirt takes the uniform color; Mesh / Rib / Pro Bowl / Gold Jacket add sleeve stripes; Dino-Scale adds a scale pattern |
| Cleats | Shoes take the cleat color |
| Helmet | `sprites/helm_<helmet>_<down\|up\|left>.png` fitted over the head (right = mirrored left) |
| Hair style | One sheet per style: `heroart_<style>.png` + `_mask`. Without one, the style uses `heroart.png` |

The football and clipboard are part of the drawing, so the separate held-item sprite isn't drawn
next to this player. (A complete `hero.png`, if present, still overrides all of this.)

**Adding a hairstyle:** generate the same 3 × 4 sheet with that hair (shaggy, buzz, spiky, long,
puffy, ponytail), then run
`python3 art/cozy/source/make_hero.py <sheet.jpg> <style>` from `art/cozy/sprites/`,
and rebuild. It cuts the frames, sizes them, outlines them and writes the mask.

---

# The player base (current)

The player is now built from a **bald, empty-handed, key-color base sheet**
(`source/hero_base_sheet.jpg`): magenta skin, cyan shirt, green shoes, navy pants, dark outline.
Rows: front, back, side, side. Both side rows face **right**; the left-facing frames are mirrored.

`python3 source/make_base.py <sheet> ` (map size) and `... <sheet> 3` (battle size), run from `sprites/`,
write `heroart.png` / `heroart_hi.png` and their masks. The flat key colors become gray pixel-art
shading (light top-left, shadow bottom-right), so recoloring keeps depth. Mask: 80 skin, 120 shirt,
200 shoes; pants, outline and eyes stay as drawn.

The game draws on top of it (`src/cozy_hero.js`):
- **Hair:** all 6 styles (shaggy, buzz, spiky, long, puffy, ponytail) in every direction, in the
  chosen color, with highlights and an outline. Styles are tuned in `CZ_HAIR`.
- **Eyes on side views** (the base only has them on the front), and **freckles**.
- **Uniform, cleats, helmets** as before.
- **Held item:** the equipped item's `held_*.png` in the hand of each frame (behind the body when
  walking away), on the map and in battle until it's thrown.

## Hairstyle sheets (current)

`source/hair_<style>.jpg` are the six drawn hairstyles (shaggy, buzz, spiky, long, puffy, ponytail):
the base character with hair painted yellow. Build each at both sizes from `sprites/`:
`python3 ../source/make_base.py ../source/hair_long.jpg 1 long` and `... 3 long`.
They write `heroart_<style>.png` (+ `_hi`, + masks; mask 40 = hair). Every sheet uses the bald
base's body scale, so all styles line up; row 3 (facing right) is used for both side directions.

- **Bald** is a hairstyle option that uses the base sheet as is.
- Under a helmet (not the crown) the bald head is used, so hair never pokes out or leaves gaps;
  long hair and ponytails keep the part that hangs below the helmet.
- The code-drawn hair is now only a fallback for a style that has no sheet.

## Source sheets

The original uploaded sheets (JPEGs) and the cut dino frames that the scripts in `source/` read are
not kept in this repo, to keep it small. They live in the local working copy. The scripts are here so the
steps stay documented; point them at the sheets to re-cut a sprite.
