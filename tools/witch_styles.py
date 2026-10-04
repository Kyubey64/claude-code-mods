# Witch style designs: each style is its own drawing (proportions, pose,
# detail), facing right. Rendered to a preview PNG and emitted as TypeScript.
#
# Needs Pillow (pip install pillow). From the repo root:
#   python tools/witch_styles.py preview.png mods/pixel-witch/hooks/styles.ts
# writes a preview sheet of every style in five poses, and regenerates the
# mod's style table.
import json
import sys

from PIL import Image, ImageDraw

STYLES = {}

# --- classic: my original chibi (kept as is) -------------------------------
STYLES['classic'] = dict(
    note='Round chibi: pointy purple hat, pink hair, star wand',
    colors={
        'K': '#2b1b3d', 'H': '#5b2f99', 'h': '#8a5cd6', 'd': '#3f1f73', 'B': '#ffc94d', 'b': '#d99a2b',
        '*': '#fff6a0', 'A': '#ff9fcf', 'a': '#e06aa8', 'S': '#ffe0c7', 'W': '#ffffff', 'E': '#3a2a6a',
        'P': '#ff9bb8', 'Q': '#ff4d6d', 'M': '#c4566e', 'R': '#4a2c80', 'r': '#6f48b0', 'X': '#ff6f9a',
        'T': '#fff4fa', 'F': '#3b2440', 'V': '#a0703a', 'Y': '#ffe46b',
    },
    body=[
        '..........KK....',
        '.........KhK....',
        '........KHHK....',
        '.......KHhHK....',
        '......KHHhHHK...',
        '.....KHHhHHHK...',
        '....KdBBB*BBdK..',
        'KKKdHHHHHHHHHdKK',
        '.KaAAAAAAAAAAaK.',
        '.KAAaSSSSSaAAAK.',
        '.KAaSWESSSWESaK.',
        '.KAaSEESSSEESaK.',
        '.KAAPSSSMSSSPAK.',
        '..KASSSSSSSSAK.Y',
        '...KRRRXXRRRK.V.',
        '..KRrRRRRRRRRSK.',
        '.KRRrRRRRRRRRRK.',
        '.KRRRRRRRRRRRRK.',
        '..KBbBbBbBbBbK..',
    ],
    legs={
        'stand': ['....KTK..KTK....', '....KFFK.KFFK...'],
        'walk1': ['...KTK....KTK...', '...KFFK...KFFK..'],
        'walk2': ['.....KTKKTK.....', '.....KFFKFFK....'],
        'kick1': ['....KTK...KTK...', '...KFFK....KFFK.'],
        'kick2': ['.....KTK.KTK....', '.....KFFKKFFK...'],
    },
    eyes=dict(left=(5, 10), right=(10, 10), height=2, mouth=(8, 12), blush=[(4, 12), (12, 12)]),
    wand=dict(
        raise_=[[15, 13, '.'], [14, 14, '.'], [13, 15, 'R'], [15, 8, 'Y'], [15, 9, 'V'], [15, 10, 'V'],
                [15, 11, 'V'], [15, 12, 'S']],
        none=[[15, 13, '.'], [14, 14, '.'], [13, 15, 'R']],
    ),
)

# --- starlight: after the first screenshot ---------------------------------
# An oversized floppy hat that is half the witch, a glowing star emblem on the
# cone, a cyan-rimmed brim, a cloud of wavy lavender hair wider than she is,
# a small dark coat with cyan piping. Cool, glowing, mysterious.
STYLES['starlight'] = dict(
    note='Huge floppy hat with glowing star, cloud of lavender hair, cyan glow',
    colors={
        'K': '#141529', 'H': '#262a52', 'h': '#3a4383', 'd': '#1a1d3b', 'C': '#33d6e0', 'c': '#1f8f99',
        '*': '#f08cff', '+': '#ffd6ff', 'A': '#c9a2f2', 'a': '#9a6fd0', 'L': '#e3ccff', 'S': '#fbe3d6',
        'W': '#ffffff', 'E': '#3b2f6b', 'P': '#ffb3c8', 'Q': '#ff4d6d', 'M': '#b85a7a', 'R': '#1e2f45',
        'r': '#2b4560', 'T': '#262a52', 'F': '#33d6e0', 'V': '#3a4383', 'Y': '#7ff6ff',
    },
    body=[
        '..........KKK.......',
        '........KKHHHKK.....',
        '.......KHHhHHHHKK...',
        '......KHHHhHHHHHHK..',
        '.....KHHHH+HhHKKHHK.',
        '.....KHHH***HHK..KHK',
        '....KHHH**+**HHK..K.',
        '....KHHHH***HHHK....',
        '...KdHHHHH*HHHHdK...',
        '.KKcCCCCCCCCCCCCcKK.',
        'KHHHHHHHHHHHHHHHHHHK',
        '.KCCCCCCCCCCCCCCCCK.',
        '.KLAAaAAAAAAAAaAALK.',
        'KAAAaASSSSSSSSaAAAAK',
        'KALAaSSWESSWESSaAAAK',
        'KAAASSSEESSEESSaALAK',
        'KAaAaSSPSSMSPSSAAaAK',
        'KAALAKSSSSSSSSKAALAK',
        '.KAAKRrRRCCRRrRKAAK.',
        '.KaKRRRRRCCRRRRRKaK.',
        '..KKRRrRRRRRRrRRKK..',
    ],
    legs={
        'stand': ['.....KTK..KTK.......', '.....KFK..KFK.......'],
        'walk1': ['....KTK....KTK......', '....KFK....KFK......'],
        'walk2': ['......KTKKTK........', '......KFKKFK........'],
        'kick1': ['....KTK.....KTK.....', '...KFK.......KFK....'],
        'kick2': ['......KTK.KTK.......', '......KFK.KFK.......'],
    },
    eyes=dict(left=(7, 14), right=(11, 14), height=2, mouth=(10, 16), blush=[(7, 16), (12, 16)]),
    wand=dict(
        raise_=[[18, 9, 'Y'], [19, 9, 'K'], [18, 10, 'V'], [18, 11, 'V']],
        none=[],
    ),
)

# --- moonbroom: after the second screenshot --------------------------------
# Rides side-saddle on a broom and never walks: an anime-proportioned witch
# (small head, long body), wide grey hat with a dangling gold charm, magenta
# hair streaming behind her, a long grey coat, a black cat on the broom's tip.
STYLES['moonbroom'] = dict(
    note='Side-saddle on a broom, streaming magenta hair, long coat, cat on the broom',
    floats=True,
    colors={
        'K': '#1d1828', 'H': '#4f4766', 'h': '#6f6690', 'd': '#3a3350', 'B': '#ff4fd8', 'G': '#ffc94d',
        'A': '#e85ad8', 'a': '#a8329e', 'L': '#ff9df0', 'S': '#f6d9cc', 'W': '#ffffff', 'E': '#5a2a6a',
        'P': '#ff9bb8', 'Q': '#ff4d6d', 'M': '#c4566e', 'R': '#4a4652', 'r': '#6a6674', 'g': '#a9a4b5',
        'V': '#8a5a2e', 'v': '#b07a3e', 'Z': '#c9a46a', 'z': '#8f7442', 'c': '#100c14', 'y': '#ffe14d',
        'F': '#2a2232',
    },
    body=[
        '............KK........',
        '...........KhHK.......',
        '..........KHHHK.......',
        '.........KHhHHHK......',
        '........KHHhHHHHK..K..',
        '......KKBBBBBBBBBK..G.',
        '...KKKHHHHHHHHHHHHKKG.',
        '....KKddddddddddKK....',
        '...KAAAAAAAAAAAK......',
        '..KAaAAAAAAaAAAK......',
        '.KAaAAAAKSSSSSSK......',
        'KAaAAAAAKWESWESK......',
        'KaAAaAAAKEESEESK......',
        'KAaLAaAAKPSMSPSK......',
        '.KaAAaAAAKSSSSK.......',
        '..KAaAAaKRRSSKK.......',
        '...KAaAKRRRRRRK.c..c..',
        '....KKKRRgRRRSSKcycy..',
        'zZzZzKVVVVVVVVVVvcccvK',
    ],
    legs={
        'stand': ['.zZzZ.KRRRRRRK.SSK....', '.......KRRrRRK..SSK...', '.......KKKKKK...KFFK..'],
        'walk1': ['zZzZz.KRRRRRRK.SSK....', '.......KRRrRRK..SSK...', '.......KKKKKK...KFFK..'],
        'walk2': ['.zZzZ.KRRRRRRK.SSK....', '.......KRRrRRK.SSK....', '.......KKKKKK..KFFK...'],
        'kick1': ['.zZzZ.KRRRRRRK.SS.K...', '.......KRRrRRK...SSK..', '.......KKKKKK.....KFFK'],
        'kick2': ['.zZzZ.KRRRRRRKSSK.....', '.......KRRrRRKSSK.....', '.......KKKKKKKFFK.....'],
    },
    eyes=dict(left=(9, 11), right=(12, 11), height=2, mouth=(11, 13), blush=[(9, 13), (13, 13)]),
    wand=dict(raise_=[], none=[]),
)

# --- bluebell: after the third screenshot ----------------------------------
# Super-deformed: a head as big as the rest of her, huge glossy eyes three
# pixels tall, a tall blue hat with a silver buckle bent at the tip, a violet
# bob, a black cat riding her shoulder, a twisted staff with a green gem.
STYLES['bluebell'] = dict(
    note='Super-deformed: giant head and eyes, buckled hat, cat on shoulder, gem staff',
    colors={
        'K': '#1a2340', 'H': '#2f4f9a', 'h': '#4a72c8', 'd': '#203a78', 'G': '#c8d0e0', 'g': '#8a93a8',
        'A': '#5a3f94', 'a': '#3d2a6e', 'S': '#ffe4d2', 'W': '#ffffff', 'E': '#1e2440', 'I': '#4a5a8a',
        'P': '#ffb0b8', 'Q': '#ff4d6d', 'M': '#c46a6e', 'R': '#2f4f9a', 'r': '#5a82d8', 'X': '#c8d0e0',
        'F': '#5a3a26', 'T': '#1e2440', 'V': '#6b4226', 'v': '#8f5c36', 'Y': '#3ee86b', 'y': '#b6ffcb',
        'c': '#151018', 'o': '#ffd23f',
    },
    body=[
        '..........KKKK......',
        '........KKhHHHK.....',
        '.......KHHhHHHHK....',
        '......KHHhHHHHHHK...',
        '......KHHHHHHKKHHK..',
        '.....KddGGGddK..KHK.',
        '....KHHGddGHHHK..KK.',
        '..KKHHHHHHHHHHHKK...',
        '.KHHHHHHHHHHHHHHHK..',
        'yKKAAAAAAAAAAAAKK...',
        'YKAAAaAAAAaAAAAAK...',
        'YKAaSSSSSSSSSaAAK...',
        'VKASSKKSSSSKKSaAK...',
        'vKASSEWSSSSEWSSAK...',
        'VKASSEISSSSEISSAKc.c',
        'vKAPSEESSMSEESPAKccc',
        'VKKASSSSSSSSSSAKoco.',
        'v.KKKRRXXXRRRKKccc..',
        'V..KRRrRRRRRrRRKKc..',
        'v..KRRrRRRRRrRRK....',
    ],
    legs={
        'stand': ['V...KKKKKKKKKK......', 'v....KFK..KFK.......'],
        'walk1': ['V...KKKKKKKKKK......', 'v...KFK....KFK......'],
        'walk2': ['V...KKKKKKKKKK......', 'v......KFKFK........'],
        'kick1': ['....KKKKKKKKKK......', '...KFK......KFK.....'],
        'kick2': ['....KKKKKKKKKK......', '.....KFK..KFK.......'],
    },
    eyes=dict(left=(5, 12), right=(11, 12), height=4, mouth=(9, 15), blush=[(3, 15), (14, 15)]),
    wand=dict(
        raise_=[[0, 9, '.'], [0, 10, '.'], [0, 11, '.'], [0, 12, '.'], [0, 13, '.'], [0, 14, '.'],
                [0, 15, '.'], [0, 16, '.'], [0, 17, '.'], [0, 18, '.'], [0, 19, '.'],
                [1, 2, 'y'], [1, 3, 'Y'], [1, 4, 'Y'], [1, 5, 'V'], [1, 6, 'v'], [1, 7, 'V'], [1, 8, 'v'],
                [2, 9, 'S']],
        none=[[0, 9, '.'], [0, 10, '.'], [0, 11, '.'], [0, 12, '.'], [0, 13, '.'], [0, 14, '.'],
              [0, 15, '.'], [0, 16, '.'], [0, 17, '.'], [0, 18, '.'], [0, 19, '.']],
        legs_hidden=[0],
    ),
)

# --- goldie: after the fourth screenshot -----------------------------------
# Tall and slender, realistic proportions: a small head under a slouching
# wide-brimmed hat, long golden hair to her waist, a fitted dark dress with
# a belt, long legs in dark stockings, an upright broom taller than she is.
STYLES['goldie'] = dict(
    note='Tall and slender, long golden hair, fitted dress, tall upright broom',
    colors={
        'K': '#141826', 'H': '#22405e', 'h': '#356086', 'd': '#172c44', 'B': '#101420', 'A': '#f2c46b',
        'a': '#c08a36', 'L': '#ffe3a1', 'S': '#f8dcc6', 's': '#e8b9a0', 'W': '#ffffff', 'E': '#3a6aa8',
        'P': '#f2a0a0', 'Q': '#ff4d6d', 'M': '#b8606a', 'R': '#1f2442', 'r': '#343c6c', 'X': '#8a2a3a',
        'T': '#2a2438', 'F': '#101018', 'V': '#2a1c14', 'Z': '#b07a3e', 'z': '#7a5228',
    },
    body=[
        '.............zZz',
        '.......KK....ZzZ',
        '......KHHK...zZz',
        '.....KHhHK...ZzZ',
        '....KHHhHHK...V.',
        '..KKKBBBBBKKK.V.',
        'KKHHHHHHHHHHHKV.',
        '...KAAAAAAAK..V.',
        '...KALSSSAAK..V.',
        '..KAASESESAaK.V.',
        '..KAASSMSSAaK.V.',
        '..KAAKSSSKAAK.V.',
        '..KAaKRXRKAaK.V.',
        '..KAAKRRRRKAKSV.',
        '..KAaRrRRRRKSK..',
        '...KAKRRRRRKK.V.',
        '...KaKXXXXXK..V.',
        '....KRRrRRRK..V.',
        '...KRRrRRRRRK.V.',
        '...KRRRRRRRRK.V.',
    ],
    legs={
        'stand': ['.....KsK.KsK..V.', '.....KTK.KTK..V.', '.....KTK.KTK..V.', '....KFFK.KFFK.V.'],
        'walk1': ['....KsK...KsK.V.', '....KTK...KTK.V.', '...KTK.....KTKV.', '...KFFK....KFFK.'],
        'walk2': ['.....KsKKsK...V.', '.....KTKKTK...V.', '......KTTK....V.', '.....KFFFFK...V.'],
        'kick1': ['....KsK...KsK...', '...KTK.....KTK..', '..KTK.......KTK.', '..KFFK......KFFK'],
        'kick2': ['.....KsK.KsK....', '.....KTK..KTK...', '......KTK.KTK...', '......KFFKKFFK..'],
    },
    eyes=dict(left=(6, 9), right=(8, 9), height=1, mouth=(7, 10), blush=[]),
    wand=dict(
        raise_=[],
        none=[[13, 0, '.'], [14, 0, '.'], [15, 0, '.'], [13, 1, '.'], [14, 1, '.'], [15, 1, '.'],
              [13, 2, '.'], [14, 2, '.'], [15, 2, '.'], [13, 3, '.'], [14, 3, '.'], [15, 3, '.']]
             + [[14, y, '.'] for y in range(4, 24)] + [[13, 13, 'K']],
    ),
)


def eye_patches(style, kind):
    e = style['eyes']
    h = e['height']
    out = []
    eyes = [p for p in (e['left'], e['right']) if p]
    if kind == 'open':
        return out
    for i, (x, y) in enumerate(eyes):
        w = 1 if h == 1 else 2
        cols = range(x, x + w)
        rows = range(y, y + h)
        if kind == 'blink':
            for r in rows:
                for c in cols:
                    out.append([c, r, 'K' if r == y + h - 1 else 'S'])
        elif kind == 'happy':
            for r in rows:
                for c in cols:
                    out.append([c, r, 'K' if r == y else 'S'])
            if w == 2:
                out += [[x - 1, y + 1, 'K'], [x + 2, y + 1, 'K']]
        elif kind == 'angry':
            for r in rows:
                for c in cols:
                    out.append([c, r, 'S'])
            if w == 2:
                isLeft = i == 0
                out += [[x, y, 'K'], [x + 1, y + 1, 'K']] if isLeft else [[x + 1, y, 'K'], [x, y + 1, 'K']]
                out += [[x if isLeft else x + 1, y + h - 1, 'E']]
            else:
                out += [[x, y, 'K']]
    if kind == 'angry':
        mx, my = e['mouth']
        out += [[mx - 1, my, 'K'], [mx, my, 'K'], [mx + 1, my, 'K']] if h > 1 else [[mx, my, 'K']]
        out += [[bx, by, 'Q'] for bx, by in e['blush']]
    return out


def compose(style, legs='stand', eyes='open', wand='hold'):
    rows = [list(r) for r in style['body'] + (style['legs'][legs] if legs != 'sit' else [])]
    patches = eye_patches(style, eyes)
    if wand == 'raise':
        patches += style['wand']['raise_']
    if wand == 'none':
        patches += style['wand']['none']
    for x, y, ch in patches:
        if 0 <= y < len(rows) and 0 <= x < len(rows[y]):
            rows[y][x] = ch
    return [''.join(r) for r in rows]


def check(name, style):
    w = len(style['body'][0])
    bad = [(i, len(r)) for i, r in enumerate(style['body']) if len(r) != w]
    for k, frames in style['legs'].items():
        bad += [(k, len(r)) for r in frames if len(r) != w]
    h = len(style['body']) + max(len(f) for f in style['legs'].values())
    unknown = {ch for r in style['body'] + sum(style['legs'].values(), []) for ch in r} - set(style['colors']) - {'.'}
    print(f'{name}: {w}x{h}px', 'BAD ROWS' if bad else '', bad or '', 'UNKNOWN' if unknown else '', unknown or '')
    return w, h


def preview(path, scale=10):
    poses = [('stand', 'open', 'hold'), ('walk1', 'blink', 'hold'), ('kick1', 'angry', 'none'),
             ('stand', 'happy', 'raise'), ('sit', 'blink', 'none')]
    cell_w, cell_h = 24 * scale, 26 * scale
    img = Image.new('RGB', (cell_w * len(poses), cell_h * len(STYLES)), '#1e1e24')
    draw = ImageDraw.Draw(img)
    for si, (name, style) in enumerate(STYLES.items()):
        for pi, pose in enumerate(poses):
            rows = compose(style, *pose)
            ox = pi * cell_w + scale
            oy = si * cell_h + (cell_h - len(rows) * scale) - scale
            for y, row in enumerate(rows):
                for x, ch in enumerate(row):
                    if ch == '.':
                        continue
                    color = style['colors'][ch]
                    draw.rectangle([ox + x * scale, oy + y * scale, ox + (x + 1) * scale - 1, oy + (y + 1) * scale - 1], fill=color)
        draw.text((4, si * cell_h + 4), name, fill='#888')
    img.save(path)


if __name__ == '__main__':
    for name, style in STYLES.items():
        check(name, style)
    preview(sys.argv[1] if len(sys.argv) > 1 else 'preview.png')


def emit_ts(path):
    out = ['// Generated from the witch style designs: one drawing per style, facing',
           '// right. Patches are [x, y, letter] over body + legs rows.', '',
           "import type { Skin } from '../types'", '',
           'export type Patch = [x: number, y: number, ch: string]',
           "export type LegFrame = 'stand' | 'walk1' | 'walk2' | 'kick1' | 'kick2'",
           "export type Eyes = 'open' | 'blink' | 'happy' | 'angry'", '',
           'export type StyleArt = {',
           '  width: number',
           '  colors: Record<string, string>',
           '  body: string[]',
           '  legs: Record<LegFrame, string[]>',
           '  eyes: Record<Eyes, Patch[]>',
           '  raise: Patch[]',
           '  none: Patch[]',
           '}', '',
           'export const STYLES: Record<Skin, StyleArt> = {']
    for name, st in STYLES.items():
        art = dict(
            width=len(st['body'][0]),
            colors=st['colors'],
            body=st['body'],
            legs=st['legs'],
            eyes={k: eye_patches(st, k) for k in ('open', 'blink', 'happy', 'angry')},
            raise_=st['wand']['raise_'],
            none=st['wand']['none'],
        )
        out.append(f"  // {st['note']}")
        out.append(f'  {name}: {{')
        out.append(f"    width: {art['width']},")
        out.append(f"    colors: {json.dumps(art['colors'])},")
        out.append('    body: [')
        out += [f"      '{r}'," for r in art['body']]
        out.append('    ],')
        out.append('    legs: {')
        for k, v in art['legs'].items():
            out.append(f'      {k}: {json.dumps(v)},')
        out.append('    },')
        out.append('    eyes: {')
        for k, v in art['eyes'].items():
            out.append(f'      {k}: {json.dumps(v)},')
        out.append('    },')
        out.append(f"    raise: {json.dumps(art['raise_'])},")
        out.append(f"    none: {json.dumps(art['none'])},")
        out.append('  },')
    out.append('}')
    open(path, 'w', encoding='utf-8', newline='\n').write('\n'.join(out) + '\n')


if len(sys.argv) > 2:
    emit_ts(sys.argv[2])
