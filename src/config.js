/**
 * @file Central configuration for BloomCode — ASCII Lily Studio.
 * All tunable constants live here so the rest of the app stays declarative.
 * @module config
 */

/** @typedef {'red'|'purple'|'yellow'|'white'} FlowerColorName */

/** Palette used by the colour renderer. Values are CSS hex colours. */
export const PALETTE = Object.freeze({
  red: '#FF4D4D',
  purple: '#A855F7',
  yellow: '#FACC15',
  white: '#FFFFFF',
  green: '#22C55E',
  stem: '#22C55E',
  leaf: '#16A34A',
  accent: '#FDE68A',
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

  /** How long the overlay waits after a successful audio init before hiding. */
  START_DELAY_MS: 250,

  /** Audio sources, tried in order. */
  AUDIO: Object.freeze({
    LOCAL_URL: '/public/audio/angel-radio-edit.mp3',
    // Placeholder CDN source. Replace with any CORS-enabled, royalty-free MP3.
    CDN_URL: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1b3d0c2e5f.mp3',
    // NOTE: 14.8.59 was never published to npm; 14.8.49 is the last 14.8.x.
    // The UMD build is loaded by a classic <script> in index.html; the ESM
    // URLs below are secondary fallbacks for environments that prefer them.
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
  SWAY_AMPLITUDE: 0.45, // in character cells

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
 * Flower placement. Coordinates are framebuffer cells (x: 0-79, y: 0-39).
 * `delay` staggers the bloom so lilies open one after another.
 * @type {ReadonlyArray<{x:number,y:number,color:FlowerColorName,delay:number,scale:number}>}
 */
export const FLOWERS = Object.freeze([
  Object.freeze({ x: 40, y: 8,  color: 'red',    delay: 0.00, scale: 1.15 }),
  Object.freeze({ x: 22, y: 14, color: 'purple', delay: 0.12, scale: 0.95 }),
  Object.freeze({ x: 58, y: 14, color: 'yellow', delay: 0.22, scale: 0.95 }),
  Object.freeze({ x: 16, y: 22, color: 'white',  delay: 0.34, scale: 0.85 }),
  Object.freeze({ x: 64, y: 22, color: 'red',    delay: 0.44, scale: 0.85 }),
]);

/** Characters used by the renderer, kept in one place for easy customisation. */
export const GLYPHS = Object.freeze({
  stem: '|',
  stemSlant: '/',
  leaf: '\\//',
  bud: '*',
  petalTip: '*',
  petalEdge: '/',
  petalFold: '\\',
  petalFill: '#',
  pistil: 'oOOo',
  stigma: ':::',
  wrap: '_',
  ribbon: '@',
  sparkle: '.',
});

/**
 * Six petals of a lily. `angle` is in degrees in screen space (y grows down).
 * `spine` is the glyph drawn along the petal axis; `left`/`right` form the fold.
 */
export const PETALS = Object.freeze([
  Object.freeze({ angle: -90, spine: '|', left: '\\', right: '/' }),
  Object.freeze({ angle: -30, spine: '/', left: '|', right: '\\' }),
  Object.freeze({ angle: 30,  spine: '\\', left: '-', right: '|' }),
  Object.freeze({ angle: 90,  spine: '|', left: '/', right: '\\' }),
  Object.freeze({ angle: 150, spine: '/', left: '-', right: '|' }),
  Object.freeze({ angle: 210, spine: '\\', left: '|', right: '-' }),
]);
