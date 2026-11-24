/**
 * @file Central configuration for BloomCode — ASCII Lily Studio.
 * @module config
 */

/** Palette used by the UI and the solid stem renderer. */
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
  GRID: Object.freeze({ COLS: 80, ROWS: 40 }),
  BPM: 120,
  SPEED: Object.freeze({ MIN: 0.5, MAX: 2, DEFAULT: 1, STEP: 0.1 }),
  BLOOM_DURATION_MS: 11000,
  AUDIO: Object.freeze({
    LOCAL_URL: '/public/audio/angel-radio-edit.mp3',
    CDN_URL: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_1b3d0c2e5f.mp3',
    TONE_UMD: 'https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js',
    TONE_ESM: 'https://cdn.jsdelivr.net/npm/tone@14.8.49/build/esm/index.js',
    TONE_ESM_FALLBACK: 'https://cdn.jsdelivr.net/npm/tone@14.9.17/build/esm/index.js',
  }),
  MONOCHROME_COLOR: '#00ff41',
  FONT: Object.freeze({
    FAMILY: "'JetBrains Mono', 'Courier New', ui-monospace, monospace",
    SIZE_MIN: 5,
    SIZE_MAX: 15,
    ASPECT: 0.62,
  }),
  SWAY_PERIOD_MS: 4200,
  SWAY_AMPLITUDE: 0.35,
  STORAGE: Object.freeze({
    MUTED: 'bloomcode.muted',
    VOLUME: 'bloomcode.volume',
    COLOR: 'bloomcode.color',
    BACKGROUND: 'bloomcode.background',
    SPEED: 'bloomcode.speed',
  }),
});

/**
 * Three-tone gradients for the shaded petals. Modelled on the reference
 * bouquet's deep/mid/tip shading so the ASCII density ramp reads as volume.
 */
export const SHADED_PALETTES = Object.freeze({
  pink:   { deep: '#8C1038', mid: '#F2478C', tip: '#FFD9E8', anther: '#F26B2C' },
  white:  { deep: '#7FA36A', mid: '#F4F4EA', tip: '#FFFFFF', anther: '#B86A22' },
  yellow: { deep: '#B36A05', mid: '#FFD62E', tip: '#FFF2A0', anther: '#F26B2C' },
  orange: { deep: '#A32E05', mid: '#FF7A15', tip: '#FFB07A', anther: '#F26B2C' },
  coral:  { deep: '#A83A32', mid: '#FF8873', tip: '#FFD6C7', anther: '#F26B2C' },
  red:    { deep: '#4D020F', mid: '#C40A24', tip: '#F05266', anther: '#F26B2C' },
  purple: { deep: '#4A126E', mid: '#A855F7', tip: '#DFC0FF', anther: '#F26B2C' },
});

/**
 * Eleven open lilies, mapped from the reference arrangement into the 80x40 grid.
 * `delay` is the fraction of the animation timeline at which blooming starts.
 * @type {ReadonlyArray<{x:number,y:number,size:number,palette:string,delay:number,bright:number,tilt:number}>}
 */
export const SHADED_FLOWERS = Object.freeze([
  Object.freeze({ x: 26, y: 8,  size: 3.6, palette: 'white',  delay: 0.42, bright: 0.78, tilt: -0.3 }),
  Object.freeze({ x: 54, y: 8,  size: 3.6, palette: 'yellow', delay: 0.45, bright: 0.78, tilt: 0.3 }),
  Object.freeze({ x: 22, y: 17, size: 4.2, palette: 'orange', delay: 0.35, bright: 0.90, tilt: -0.5 }),
  Object.freeze({ x: 58, y: 17, size: 4.2, palette: 'pink',   delay: 0.38, bright: 0.90, tilt: 0.5 }),
  Object.freeze({ x: 40, y: 12, size: 4.4, palette: 'red',    delay: 0.30, bright: 0.90, tilt: 0.0 }),
  Object.freeze({ x: 31, y: 25, size: 4.6, palette: 'pink',   delay: 0.24, bright: 1.00, tilt: -0.2 }),
  Object.freeze({ x: 50, y: 25, size: 4.6, palette: 'white',  delay: 0.27, bright: 1.00, tilt: 0.2 }),
  Object.freeze({ x: 41, y: 32, size: 4.2, palette: 'coral',  delay: 0.33, bright: 1.00, tilt: 0.0 }),
]);

/** Five unopened buds placed around the arrangement. */
export const SHADED_BUDS = Object.freeze([
  Object.freeze({ x: 33, y: 2,  palette: 'red',    delay: 0.30, ripe: 0.0 }),
  Object.freeze({ x: 47, y: 2,  palette: 'pink',   delay: 0.34, ripe: 0.9 }),
  Object.freeze({ x: 61, y: 10, palette: 'red',    delay: 0.38, ripe: 0.0 }),
  Object.freeze({ x: 17, y: 10, palette: 'orange', delay: 0.42, ripe: 0.7 }),
  Object.freeze({ x: 53, y: 16, palette: 'red',    delay: 0.46, ripe: 0.0 }),
]);

/** Density ramp: low luminance produces fine glyphs, high luminance solid ones. */
export const DENSITY_RAMP = Object.freeze(['.', ':', '-', '=', '+', '*', 'o', 'O', '@']);

/** Green shading colours for foliage. */
export const FOLIAGE = Object.freeze({
  dark: '#1B4D2E',
  mid: '#22C55E',
  light: '#86EFAC',
  under: '#3F8F6A',
});
