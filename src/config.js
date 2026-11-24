/**
 * @file Central configuration for BloomCode — ASCII Lily Studio.
 * All tunable constants live here so the rest of the app stays declarative.
 * @module config
 */

/** @typedef {'red'|'purple'|'yellow'|'white'} FlowerColorName */

/** Palette used by the colour renderer. Values are CSS hex colours. */
export const PALETTE = Object.freeze({
  red: '#FF2D55',
  purple: '#A855F7',
  yellow: '#FACC15',
  white: '#FFFFFF',
  green: '#22C55E',
  stem: '#22C55E',
  leaf: '#22C55E',
  accent: '#FACC15',
});

/** App-wide constants. */
export const CONFIG = Object.freeze({
  /** Fixed ASCII framebuffer — 80 x 40 = 3,200 cells, cheap enough for 60fps. */
  GRID: Object.freeze({ COLS: 80, ROWS: 40 }),

  /** Musical timing. */
  BPM: 120,

  /** Playback speed bounds exposed by the UI slider. */
  SPEED: Object.freeze({ MIN: 0.5, MAX: 2, DEFAULT: 1, STEP: 0.1 }),

  /** Milliseconds for a full bloom at 1x speed. */
  BLOOM_DURATION_MS: 9000,

  /** Audio sources, tried in order. */
  AUDIO: Object.freeze({
    LOCAL_URL: '/public/audio/angel-radio-edit.mp3',
    // Placeholder CDN source. Replace with any CORS-enabled, royalty-free MP3.
    CDN_URL: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1b3d0c2e5f.mp3',
    // NOTE: the requested 14.8.59 was never published to npm. The import map
    // declares it for compatibility; the UMD build below is the working
    // primary source because Tone's ESM files need a bundler.
    TONE_UMD: 'https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js',
    TONE_ESM: 'https://cdn.jsdelivr.net/npm/tone@14.8.49/build/esm/index.js',
    TONE_ESM_FALLBACK: 'https://cdn.jsdelivr.net/npm/tone@14.9.17/build/esm/index.js',
  }),

  /** Terminal styling. */
  MONOCHROME_COLOR: '#00ff41',
  FONT: Object.freeze({
    FAMILY: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
    SIZE_MIN: 5,
    SIZE_MAX: 15,
    ASPECT: 0.62, // character width / line-height ratio for JetBrains Mono
  }),

  /** Idle motion. */
  SWAY_PERIOD_MS: 4200,
  SWAY_AMPLITUDE: 0.2, // in character cells

  /** localStorage keys. */
  STORAGE: Object.freeze({
    MUTED: 'bloomcode.muted',
    VOLUME: 'bloomcode.volume',
    COLOR: 'bloomcode.color',
    BACKGROUND: 'bloomcode.background',
    SPEED: 'bloomcode.speed',
  }),
});

/**
 * Fixed bouquet layout in framebuffer cells (x: 0-79, y: 0-39).
 * Every flower's lowest petal touches the end of its stem.
 * @type {ReadonlyArray<{x:number,y:number,color:FlowerColorName,delay:number,scale:number,tilt:number}>}
 */
export const FLOWERS = Object.freeze([
  Object.freeze({ x: 40, y: 12, color: 'red',    delay: 0.00, scale: 1.2, tilt: 0 }),
  Object.freeze({ x: 25, y: 18, color: 'purple', delay: 0.14, scale: 1.0, tilt: -15 }),
  Object.freeze({ x: 55, y: 18, color: 'yellow', delay: 0.26, scale: 1.0, tilt: 15 }),
  Object.freeze({ x: 18, y: 26, color: 'white',  delay: 0.38, scale: 1.0, tilt: -8 }),
  Object.freeze({ x: 62, y: 26, color: 'red',    delay: 0.50, scale: 1.0, tilt: 8 }),
]);

/**
 * Six pointed petals, revealed in this order: vertical pair, upper diagonals,
 * lower diagonals. Angles are degrees in screen space (y grows downward).
 * @type {ReadonlyArray<{angle:number,glyph:string}>}
 */
export const PETALS = Object.freeze([
  Object.freeze({ angle: -90,  glyph: '|' }), // up
  Object.freeze({ angle: 90,   glyph: '|' }), // down
  Object.freeze({ angle: -135, glyph: '\\' }), // upper-left
  Object.freeze({ angle: -45,  glyph: '/' }),  // upper-right
  Object.freeze({ angle: 135,  glyph: '/' }),  // lower-left
  Object.freeze({ angle: 45,   glyph: '\\' }), // lower-right
]);

/** Glyphs used by the pointed-lily renderer. */
export const GLYPHS = Object.freeze({
  stem: '|',
  stemSlant: '/',
  stemFold: '\\',
  budLeft: '(',
  budRight: ')',
  centerLeft: '(',
  centerRight: ')',
  center: 'o',
  pollen: '.',
  fill: ['@', '#', '%'],
});
