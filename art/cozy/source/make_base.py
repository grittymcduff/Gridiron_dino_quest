# Build the player base (bald, empty hands, flat key colors) into game sprites.
#   python3 make_base.py <sheet.jpg> [K]      K=1 map size (40x48 frames), K=3 battle size (120x144)
# Writes heroart.png / heroart_mask.png (or heroart_hi.* for K>1) in the current folder.
# Sheet: 3 columns x 4 rows, rows = front, back, side, side; the side rows face RIGHT (left = mirrored).
# Key colors: magenta skin, cyan shirt, green shoes, navy pants (kept as drawn), dark navy outline.
# The flat key areas become gray shading (pixel-art light from top-left), so the game's recolor
# keeps proper shading. Mask gray levels: 80 skin, 120 shirt, 200 shoes (0 = keep as drawn).
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from peel import peel

SRC = sys.argv[1]; K = int(sys.argv[2]) if len(sys.argv) > 2 else 1
STYLE = sys.argv[3] if len(sys.argv) > 3 else ''   # hair style sheet (hair painted yellow); '' = the bald base
NAME = 'heroart' + ('_' + STYLE if STYLE else '') + ('_hi' if K > 1 else '')
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hero_base_sheet.jpg')  # sets the body scale for every sheet
FW, FH = 40 * K, 48 * K
rgb = np.asarray(Image.open(SRC).convert('RGB')).astype(np.int16)
H, W = rgb.shape[:2]; ch, cw = H // 4, W // 3

def cut(cell):
    white = (cell.min(axis=2) >= 200) & ((cell.max(axis=2) - cell.min(axis=2)) < 30)
    wl, _ = ndi.label(white)
    border = set(np.unique(np.concatenate([wl[0], wl[-1], wl[:, 0], wl[:, -1]]))) - {0}
    bg = np.isin(wl, list(border))
    halo = ndi.binary_dilation(bg, iterations=2) & (cell.min(axis=2) > 175)
    a = ~bg & ~halo
    l, n = ndi.label(a)
    if n:
        s = ndi.sum(np.ones_like(l), l, range(1, n + 1)); a = np.isin(l, [i + 1 for i, v in enumerate(s) if v >= s.max() * 0.02])
    return a

def roles(cell, a):
    R, G, B = cell[..., 0], cell[..., 1], cell[..., 2]
    r = np.zeros(cell.shape[:2], np.uint8)
    r[a & (R > 95) & (B > 70) & (R > G + 45)] = 2                       # magenta skin (incl. darker ear lines)
    r[a & (B > 140) & (G > 120) & (R < 150) & (B > R + 40)] = 3          # cyan shirt
    r[a & (G > 150) & (R < 200) & (G > B + 30) & (G > R + 10)] = 5       # green shoes
    r[a & (R > 110) & (G > 70) & (R >= G - 12) & (G > B + 45) & (R > B + 70)] = 1   # yellow hair (incl. its shading)
    return r

# frames: (row, col, mirror) for down, up, left, right
SPEC = {'down': [(0, c, False) for c in range(3)], 'up': [(1, c, False) for c in range(3)],
        'left': [(2, c, True) for c in range(3)], 'right': [(2, c, False) for c in range(3)]}   # row 3 faces right on every sheet
cells = {}
hmax = 0
for d, lst in SPEC.items():
    for i, (r, c, m) in enumerate(lst):
        cell = rgb[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
        if m: cell = cell[:, ::-1]
        a = cut(cell); ys, xs = np.where(a); hmax = max(hmax, ys.max() - ys.min() + 1)
        ro = roles(cell, a)
        a &= ~((ro == 0) & (cell.mean(axis=2) > 120))   # light pixels that aren't skin/shirt/shoes = leftover background
        ys, xs = np.where(a)
        cells[(d, i)] = (cell, a, ro * a, ys.max())
# one body scale for all sheets, from the bald base (hair doesn't change the body size)
def _hmax(path):
    g = np.asarray(Image.open(path).convert('RGB')).astype(np.int16); m = 0
    for r, c in [(r, c) for r in range(4) for c in range(3)]:
        cl = g[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]; aa = cut(cl); yy = np.where(aa)[0]; m = max(m, yy.max() - yy.min() + 1)
    return m
sc = 41 * K / _hmax(REF)                # 41: leaves headroom for tall hair (spiky, puffy)
art = np.zeros((FH * 4, FW * 3, 4), np.uint8); mask = np.zeros((FH * 4, FW * 3), np.uint8)
MASKV = {1: 40, 2: 80, 3: 120, 5: 200}
for row, d in enumerate(['down', 'up', 'left', 'right']):
    for i in range(3):
        cell, a, ro, ybot = cells[(d, i)]
        nw, nh = round(cell.shape[1] * sc), round(cell.shape[0] * sc)
        # colors: premultiplied box downscale
        f = np.dstack([cell.astype(np.float32) / 255, a[..., None].astype(np.float32)])
        pm = Image.fromarray((np.dstack([f[..., :3] * f[..., 3:], f[..., 3:]]) * 255).astype(np.uint8), 'RGBA').resize((nw, nh), Image.BOX)
        p = np.asarray(pm).astype(np.float32) / 255; al = p[..., 3]; col = np.where(al[..., None] > .02, p[..., :3] / np.maximum(al[..., None], 1e-3), 0)
        A = al > .5
        # roles: majority vote per target pixel
        votes = np.stack([np.asarray(Image.fromarray(((ro == k) * 255).astype(np.uint8)).resize((nw, nh), Image.BOX)).astype(int) for k in (0, 1, 2, 3, 5)])
        rs = np.array([0, 1, 2, 3, 5])[votes.argmax(0)]
        rs[~A] = 0
        # src brightness inside each role (keeps the ear lines etc. as darker detail)
        lum = col.mean(axis=2)
        out = np.zeros((nh, nw, 4), np.uint8)
        out[..., :3] = np.clip(col * 255, 0, 255).astype(np.uint8); out[..., 3] = A * 255
        for k in (1, 2, 3, 5):
            reg = (rs == k)
            if not reg.any(): continue
            rel = lum / max(1e-3, np.median(lum[reg]))
            # pixel-art shading: light on top/left edges, shadow on bottom/right edges of each area
            up = np.roll(reg, K, 0); up[:K] = False; lf = np.roll(reg, K, 1); lf[:, :K] = False
            dn = np.roll(reg, -K, 0); dn[-K:] = False; rt = np.roll(reg, -K, 1); rt[:, -K:] = False
            shade = np.ones(reg.shape)
            shade[reg & ~up] = 1.22; shade[reg & ~lf & up] = 1.1
            shade[reg & ~dn] = 0.78; shade[reg & ~rt & dn] = 0.88
            if k == 3:  # soft top-to-bottom gradient on the shirt
                ys = np.where(reg)[0]; t = (np.arange(nh)[:, None] - ys.min()) / max(1, np.ptp(ys))
                shade = shade * (1.08 - 0.16 * np.clip(t, 0, 1))
            g = np.clip(150 * np.clip(rel, .55, 1.3) * shade, 0, 255).astype(np.uint8)
            out[reg, 0] = g[reg]; out[reg, 1] = g[reg]; out[reg, 2] = g[reg]
        # mixed pixels between a key color and the outline (purple / teal tints) become outline
        oc = out[..., :3].astype(int)
        tint = A & (rs == 0) & (((oc[..., 0] - oc[..., 1]) > 22) | ((oc[..., 1] - oc[..., 0]) > 35))
        out[tint, :3] = [30, 24, 48]
        msk = np.vectorize(lambda v: MASKV.get(v, 0))(rs).astype(np.uint8)
        # place: feet at FH-2K, horizontally centered on the body's center of mass
        cy, cx = ndi.center_of_mass(a & (ro != 1))   # center on the body, not the hair
        oy = round((FH - 2 * K) - (ybot + 1) * sc); ox = round(FW / 2 - cx * sc)
        for yy in range(nh):
            ty = oy + yy
            if not (0 <= ty < FH): continue
            for xx in range(nw):
                tx = ox + xx
                if 0 <= tx < FW and A[yy, xx]:
                    art[row * FH + ty, i * FW + tx] = out[yy, xx]; mask[row * FH + ty, i * FW + tx] = msk[yy, xx]
# fill tiny enclosed gaps in the art (a pixel or two between arm and body) with outline color
Aall = art[..., 3] > 0
holes = ndi.binary_fill_holes(Aall) & ~Aall
hl, hn = ndi.label(holes)
for i in range(1, hn + 1):
    if (hl == i).sum() <= 3 * K * K: art[hl == i] = [30, 24, 48, 255]
# 1 px dark outline around each figure
Aall = art[..., 3] > 0
ring = ndi.binary_dilation(Aall) & ~Aall
art[ring] = [36, 22, 15, 255]
# pockets the outline closed off: fill small ones with outline color
Aall = art[..., 3] > 0
hl, hn = ndi.label(ndi.binary_fill_holes(Aall) & ~Aall)
for i in range(1, hn + 1):
    if (hl == i).sum() <= 16 * K * K: art[hl == i] = [36, 22, 15, 255]
Aall = art[..., 3] > 0
Image.fromarray(art, 'RGBA').save(NAME + '.png')
Image.fromarray(np.dstack([mask, mask, mask, Aall * 255]).astype(np.uint8), 'RGBA').save(NAME + '_mask.png')
print('wrote', NAME, 'scale', round(sc, 4))
