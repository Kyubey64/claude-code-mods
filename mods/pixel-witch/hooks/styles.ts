// Generated from the witch style designs: one drawing per style, facing
// right. Patches are [x, y, letter] over body + legs rows.

import type { Skin } from '../types'

export type Patch = [x: number, y: number, ch: string]
export type LegFrame = 'stand' | 'walk1' | 'walk2' | 'kick1' | 'kick2'
export type Eyes = 'open' | 'blink' | 'happy' | 'angry'

export type StyleArt = {
  width: number
  colors: Record<string, string>
  body: string[]
  legs: Record<LegFrame, string[]>
  eyes: Record<Eyes, Patch[]>
  raise: Patch[]
  none: Patch[]
}

export const STYLES: Record<Skin, StyleArt> = {
  // Round chibi: pointy purple hat, pink hair, star wand
  classic: {
    width: 16,
    colors: {"K": "#2b1b3d", "H": "#5b2f99", "h": "#8a5cd6", "d": "#3f1f73", "B": "#ffc94d", "b": "#d99a2b", "*": "#fff6a0", "A": "#ff9fcf", "a": "#e06aa8", "S": "#ffe0c7", "W": "#ffffff", "E": "#3a2a6a", "P": "#ff9bb8", "Q": "#ff4d6d", "M": "#c4566e", "R": "#4a2c80", "r": "#6f48b0", "X": "#ff6f9a", "T": "#fff4fa", "F": "#3b2440", "V": "#a0703a", "Y": "#ffe46b"},
    body: [
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
    legs: {
      stand: ["....KTK..KTK....", "....KFFK.KFFK..."],
      walk1: ["...KTK....KTK...", "...KFFK...KFFK.."],
      walk2: [".....KTKKTK.....", ".....KFFKFFK...."],
      kick1: ["....KTK...KTK...", "...KFFK....KFFK."],
      kick2: [".....KTK.KTK....", ".....KFFKKFFK..."],
    },
    eyes: {
      open: [],
      blink: [[5, 10, "S"], [6, 10, "S"], [5, 11, "K"], [6, 11, "K"], [10, 10, "S"], [11, 10, "S"], [10, 11, "K"], [11, 11, "K"]],
      happy: [[5, 10, "K"], [6, 10, "K"], [5, 11, "S"], [6, 11, "S"], [4, 11, "K"], [7, 11, "K"], [10, 10, "K"], [11, 10, "K"], [10, 11, "S"], [11, 11, "S"], [9, 11, "K"], [12, 11, "K"]],
      angry: [[5, 10, "S"], [6, 10, "S"], [5, 11, "S"], [6, 11, "S"], [5, 10, "K"], [6, 11, "K"], [5, 11, "E"], [10, 10, "S"], [11, 10, "S"], [10, 11, "S"], [11, 11, "S"], [11, 10, "K"], [10, 11, "K"], [11, 11, "E"], [7, 12, "K"], [8, 12, "K"], [9, 12, "K"], [4, 12, "Q"], [12, 12, "Q"]],
    },
    raise: [[15, 13, "."], [14, 14, "."], [13, 15, "R"], [15, 8, "Y"], [15, 9, "V"], [15, 10, "V"], [15, 11, "V"], [15, 12, "S"]],
    none: [[15, 13, "."], [14, 14, "."], [13, 15, "R"]],
  },
  // Huge floppy hat with glowing star, cloud of lavender hair, cyan glow
  starlight: {
    width: 20,
    colors: {"K": "#141529", "H": "#262a52", "h": "#3a4383", "d": "#1a1d3b", "C": "#33d6e0", "c": "#1f8f99", "*": "#f08cff", "+": "#ffd6ff", "A": "#c9a2f2", "a": "#9a6fd0", "L": "#e3ccff", "S": "#fbe3d6", "W": "#ffffff", "E": "#3b2f6b", "P": "#ffb3c8", "Q": "#ff4d6d", "M": "#b85a7a", "R": "#1e2f45", "r": "#2b4560", "T": "#262a52", "F": "#33d6e0", "V": "#3a4383", "Y": "#7ff6ff"},
    body: [
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
    legs: {
      stand: [".....KTK..KTK.......", ".....KFK..KFK......."],
      walk1: ["....KTK....KTK......", "....KFK....KFK......"],
      walk2: ["......KTKKTK........", "......KFKKFK........"],
      kick1: ["....KTK.....KTK.....", "...KFK.......KFK...."],
      kick2: ["......KTK.KTK.......", "......KFK.KFK......."],
    },
    eyes: {
      open: [],
      blink: [[7, 14, "S"], [8, 14, "S"], [7, 15, "K"], [8, 15, "K"], [11, 14, "S"], [12, 14, "S"], [11, 15, "K"], [12, 15, "K"]],
      happy: [[7, 14, "K"], [8, 14, "K"], [7, 15, "S"], [8, 15, "S"], [6, 15, "K"], [9, 15, "K"], [11, 14, "K"], [12, 14, "K"], [11, 15, "S"], [12, 15, "S"], [10, 15, "K"], [13, 15, "K"]],
      angry: [[7, 14, "S"], [8, 14, "S"], [7, 15, "S"], [8, 15, "S"], [7, 14, "K"], [8, 15, "K"], [7, 15, "E"], [11, 14, "S"], [12, 14, "S"], [11, 15, "S"], [12, 15, "S"], [12, 14, "K"], [11, 15, "K"], [12, 15, "E"], [9, 16, "K"], [10, 16, "K"], [11, 16, "K"], [7, 16, "Q"], [12, 16, "Q"]],
    },
    raise: [[18, 9, "Y"], [19, 9, "K"], [18, 10, "V"], [18, 11, "V"]],
    none: [],
  },
  // Side-saddle on a broom, streaming magenta hair, long coat, cat on the broom
  moonbroom: {
    width: 22,
    colors: {"K": "#1d1828", "H": "#4f4766", "h": "#6f6690", "d": "#3a3350", "B": "#ff4fd8", "G": "#ffc94d", "A": "#e85ad8", "a": "#a8329e", "L": "#ff9df0", "S": "#f6d9cc", "W": "#ffffff", "E": "#5a2a6a", "P": "#ff9bb8", "Q": "#ff4d6d", "M": "#c4566e", "R": "#4a4652", "r": "#6a6674", "g": "#a9a4b5", "V": "#8a5a2e", "v": "#b07a3e", "Z": "#c9a46a", "z": "#8f7442", "c": "#100c14", "y": "#ffe14d", "F": "#2a2232"},
    body: [
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
    legs: {
      stand: [".zZzZ.KRRRRRRK.SSK....", ".......KRRrRRK..SSK...", ".......KKKKKK...KFFK.."],
      walk1: ["zZzZz.KRRRRRRK.SSK....", ".......KRRrRRK..SSK...", ".......KKKKKK...KFFK.."],
      walk2: [".zZzZ.KRRRRRRK.SSK....", ".......KRRrRRK.SSK....", ".......KKKKKK..KFFK..."],
      kick1: [".zZzZ.KRRRRRRK.SS.K...", ".......KRRrRRK...SSK..", ".......KKKKKK.....KFFK"],
      kick2: [".zZzZ.KRRRRRRKSSK.....", ".......KRRrRRKSSK.....", ".......KKKKKKKFFK....."],
    },
    eyes: {
      open: [],
      blink: [[9, 11, "S"], [10, 11, "S"], [9, 12, "K"], [10, 12, "K"], [12, 11, "S"], [13, 11, "S"], [12, 12, "K"], [13, 12, "K"]],
      happy: [[9, 11, "K"], [10, 11, "K"], [9, 12, "S"], [10, 12, "S"], [8, 12, "K"], [11, 12, "K"], [12, 11, "K"], [13, 11, "K"], [12, 12, "S"], [13, 12, "S"], [11, 12, "K"], [14, 12, "K"]],
      angry: [[9, 11, "S"], [10, 11, "S"], [9, 12, "S"], [10, 12, "S"], [9, 11, "K"], [10, 12, "K"], [9, 12, "E"], [12, 11, "S"], [13, 11, "S"], [12, 12, "S"], [13, 12, "S"], [13, 11, "K"], [12, 12, "K"], [13, 12, "E"], [10, 13, "K"], [11, 13, "K"], [12, 13, "K"], [9, 13, "Q"], [13, 13, "Q"]],
    },
    raise: [],
    none: [],
  },
  // Super-deformed: giant head and eyes, buckled hat, cat on shoulder, gem staff
  bluebell: {
    width: 20,
    colors: {"K": "#1a2340", "H": "#2f4f9a", "h": "#4a72c8", "d": "#203a78", "G": "#c8d0e0", "g": "#8a93a8", "A": "#5a3f94", "a": "#3d2a6e", "S": "#ffe4d2", "W": "#ffffff", "E": "#1e2440", "I": "#4a5a8a", "P": "#ffb0b8", "Q": "#ff4d6d", "M": "#c46a6e", "R": "#2f4f9a", "r": "#5a82d8", "X": "#c8d0e0", "F": "#5a3a26", "T": "#1e2440", "V": "#6b4226", "v": "#8f5c36", "Y": "#3ee86b", "y": "#b6ffcb", "c": "#151018", "o": "#ffd23f"},
    body: [
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
    legs: {
      stand: ["V...KKKKKKKKKK......", "v....KFK..KFK......."],
      walk1: ["V...KKKKKKKKKK......", "v...KFK....KFK......"],
      walk2: ["V...KKKKKKKKKK......", "v......KFKFK........"],
      kick1: ["....KKKKKKKKKK......", "...KFK......KFK....."],
      kick2: ["....KKKKKKKKKK......", ".....KFK..KFK......."],
    },
    eyes: {
      open: [],
      blink: [[5, 12, "S"], [6, 12, "S"], [5, 13, "S"], [6, 13, "S"], [5, 14, "S"], [6, 14, "S"], [5, 15, "K"], [6, 15, "K"], [11, 12, "S"], [12, 12, "S"], [11, 13, "S"], [12, 13, "S"], [11, 14, "S"], [12, 14, "S"], [11, 15, "K"], [12, 15, "K"]],
      happy: [[5, 12, "K"], [6, 12, "K"], [5, 13, "S"], [6, 13, "S"], [5, 14, "S"], [6, 14, "S"], [5, 15, "S"], [6, 15, "S"], [4, 13, "K"], [7, 13, "K"], [11, 12, "K"], [12, 12, "K"], [11, 13, "S"], [12, 13, "S"], [11, 14, "S"], [12, 14, "S"], [11, 15, "S"], [12, 15, "S"], [10, 13, "K"], [13, 13, "K"]],
      angry: [[5, 12, "S"], [6, 12, "S"], [5, 13, "S"], [6, 13, "S"], [5, 14, "S"], [6, 14, "S"], [5, 15, "S"], [6, 15, "S"], [5, 12, "K"], [6, 13, "K"], [5, 15, "E"], [11, 12, "S"], [12, 12, "S"], [11, 13, "S"], [12, 13, "S"], [11, 14, "S"], [12, 14, "S"], [11, 15, "S"], [12, 15, "S"], [12, 12, "K"], [11, 13, "K"], [12, 15, "E"], [8, 15, "K"], [9, 15, "K"], [10, 15, "K"], [3, 15, "Q"], [14, 15, "Q"]],
    },
    raise: [[0, 9, "."], [0, 10, "."], [0, 11, "."], [0, 12, "."], [0, 13, "."], [0, 14, "."], [0, 15, "."], [0, 16, "."], [0, 17, "."], [0, 18, "."], [0, 19, "."], [1, 2, "y"], [1, 3, "Y"], [1, 4, "Y"], [1, 5, "V"], [1, 6, "v"], [1, 7, "V"], [1, 8, "v"], [2, 9, "S"]],
    none: [[0, 9, "."], [0, 10, "."], [0, 11, "."], [0, 12, "."], [0, 13, "."], [0, 14, "."], [0, 15, "."], [0, 16, "."], [0, 17, "."], [0, 18, "."], [0, 19, "."]],
  },
  // Tall and slender, long golden hair, fitted dress, tall upright broom
  goldie: {
    width: 16,
    colors: {"K": "#141826", "H": "#22405e", "h": "#356086", "d": "#172c44", "B": "#101420", "A": "#f2c46b", "a": "#c08a36", "L": "#ffe3a1", "S": "#f8dcc6", "s": "#e8b9a0", "W": "#ffffff", "E": "#3a6aa8", "P": "#f2a0a0", "Q": "#ff4d6d", "M": "#b8606a", "R": "#1f2442", "r": "#343c6c", "X": "#8a2a3a", "T": "#2a2438", "F": "#101018", "V": "#2a1c14", "Z": "#b07a3e", "z": "#7a5228"},
    body: [
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
    legs: {
      stand: [".....KsK.KsK..V.", ".....KTK.KTK..V.", ".....KTK.KTK..V.", "....KFFK.KFFK.V."],
      walk1: ["....KsK...KsK.V.", "....KTK...KTK.V.", "...KTK.....KTKV.", "...KFFK....KFFK."],
      walk2: [".....KsKKsK...V.", ".....KTKKTK...V.", "......KTTK....V.", ".....KFFFFK...V."],
      kick1: ["....KsK...KsK...", "...KTK.....KTK..", "..KTK.......KTK.", "..KFFK......KFFK"],
      kick2: [".....KsK.KsK....", ".....KTK..KTK...", "......KTK.KTK...", "......KFFKKFFK.."],
    },
    eyes: {
      open: [],
      blink: [[6, 9, "K"], [8, 9, "K"]],
      happy: [[6, 9, "K"], [8, 9, "K"]],
      angry: [[6, 9, "S"], [6, 9, "K"], [8, 9, "S"], [8, 9, "K"], [7, 10, "K"]],
    },
    raise: [],
    none: [[13, 0, "."], [14, 0, "."], [15, 0, "."], [13, 1, "."], [14, 1, "."], [15, 1, "."], [13, 2, "."], [14, 2, "."], [15, 2, "."], [13, 3, "."], [14, 3, "."], [15, 3, "."], [14, 4, "."], [14, 5, "."], [14, 6, "."], [14, 7, "."], [14, 8, "."], [14, 9, "."], [14, 10, "."], [14, 11, "."], [14, 12, "."], [14, 13, "."], [14, 14, "."], [14, 15, "."], [14, 16, "."], [14, 17, "."], [14, 18, "."], [14, 19, "."], [14, 20, "."], [14, 21, "."], [14, 22, "."], [14, 23, "."], [13, 13, "K"]],
  },
}
