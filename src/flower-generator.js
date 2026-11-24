/**
 * @file Shaded ASCII bouquet adapted from the reference lily arrangement:
 * volumetric petals via a density ramp, layered foliage and drifting sparkles.
 * @module flower-generator
 */

import {
  CONFIG, DENSITY_RAMP, FOLIAGE, PALETTE,
  SHADED_BUDS, SHADED_FLOWERS, SHADED_PALETTES,
} from './config.js';

/** @typedef {import('./ascii-renderer.js').ASCIIRenderer} ASCIIRenderer */

/** @param {number} v @param {number} [lo] @param {number} [hi] @returns {number} */
const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
/** @param {number} a @param {number} b @param {number} x @returns {number} */
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/** @param {number} a @param {number} b @param {number} c @returns {number} */
function hash3(a, b, c) {
  let h = (Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(c, 83492791)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}
/** @param {string} hex @returns {[number,number,number]} */
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** @param {[number,number,number]} a @param {[number,number,number]} b @param {number} t @returns {[number,number,number]} */
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** @param {[number,number,number]} c @returns {string} */
const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

/** Builds the dense, shaded lily bouquet. */
export class FlowerGenerator {
  /** @param {ASCIIRenderer} renderer */
  constructor(renderer) { this.renderer = renderer; }

  /**
   * Solid, gap-free stem from a shared base to a flower.
   * @param {number} x0 @param {number} y0 @param {number} x1 @param {number} y1
   * @param {string} color @param {number} reveal
   * @returns {void}
   */
  generateStem(x0, y0, x1, y1, color, reveal) {
    const t = clamp(reveal);
    if (t <= 0) return;
    const ex = x0 + (x1 - x0) * t;
    const ey = y0 + (y1 - y0) * t;
    const dx = ex - x0;
    const glyph = Math.abs(dx) < 1 ? '|' : dx > 0 ? '/' : '\\';
    this.renderer.drawLine(x0, y0, ex, ey, glyph, color);
  }

  /**
   * A narrow shaded leaf, up to five cells wide, bending outward and down.
   * @param {number} x @param {number} y @param {-1|1} dir
   * @param {number} len @param {number} seed @param {number} reveal
   * @returns {void}
   */
  generateLeaf(x, y, dir, len, seed, reveal) {
    if (reveal <= 0.02) return;
    const L = len * (0.35 + 0.65 * reveal);
    const dark = rgb(FOLIAGE.dark), mid = rgb(FOLIAGE.mid), light = rgb(FOLIAGE.light);
    const droop = 0.25 + (hash3(seed, 4, 2) % 40) / 100;

    for (let ai = 0; ai <= 10; ai++) {
      const a = ai / 10;
      const px = x + dir * L * a;
      const py = y + droop * L * a * a - 0.6 * Math.sin(Math.PI * a);
      const w = 2.1 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(a, 0.999), 0.6)), 0.85);
      for (let qi = -3; qi <= 3; qi++) {
        const q = qi / 3;
        if (Math.abs(q) > 1) continue;
        const l = 0.5 + 0.32 * (1 - Math.abs(q)) + 0.14 * (q > 0 ? 1 : 0);
        const idx = clamp(Math.floor(l * DENSITY_RAMP.length), 0, DENSITY_RAMP.length - 1);
        this.renderer.drawChar(px, py + q * w * 0.7, DENSITY_RAMP[idx],
          css(mix(l > 0.7 ? mid : dark, light, Math.max(0, l - 0.65) * 2)));
      }
    }
  }

  /**
   * Draw one volumetric lily: six broad petals shaded with a density ramp.
   * @param {number} cx @param {number} cy @param {string} paletteName
   * @param {number} openness 0..1 @param {number} size
   * @param {number} tilt @param {number} seed @param {number} bright
   * @returns {void}
   */
  generateShadedLily(cx, cy, paletteName, openness, size, tilt, seed, bright) {
    if (size <= 0.3 || openness <= 0.01) return;
    const pal = SHADED_PALETTES[paletteName] || SHADED_PALETTES.red;
    const deep = rgb(pal.deep), mid = rgb(pal.mid), tip = rgb(pal.tip);
    const spin = tilt + 0.05 * Math.sin(seed);
    const theta = 1;
    const curl = 0.32 * Math.pow(openness, 1.5);
    const length = size * 2.2 * (0.45 + 0.55 * openness);
    const width = size * 0.36;
    const light = 0.78;

    for (let k = 0; k < 6; k++) {
      const inner = k % 2 === 1;
      const phi = spin + (k * Math.PI) / 3;
      const ux = Math.cos(phi), uy = Math.sin(phi);
      const tx = -uy, ty = ux;
      const foreshorten = 0.6 + 0.4 * Math.abs(Math.cos(phi - 0.3));
      const petalLen = length * (inner ? 0.94 : 1);
      const petalW = width * (inner ? 0.85 : 1) * foreshorten;

      for (let ai = 0; ai <= 10; ai++) {
        const a = ai / 10;
        const bend = curl * a * a * petalLen * 0.4;
        const px = cx + ux * petalLen * a * theta + tx * bend;
        const py = cy + uy * petalLen * a * theta * 0.72 + ty * bend * 0.6;
        const w = petalW * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(a, 0.999), 0.65)), 0.85);

        for (let qi = -4; qi <= 4; qi++) {
          const q = qi / 4;
          const aq = Math.abs(q);
          let l = light * (0.62 + 0.38 * Math.pow(1 - aq, 0.6)) * (0.75 + 0.35 * Math.min(1, a * 2));
          if (aq < 0.1) l *= 0.65; // central crease
          if (l < 0.10) continue;
          const glyph = DENSITY_RAMP[clamp(Math.floor(l * DENSITY_RAMP.length), 0, DENSITY_RAMP.length - 1)];
          let col = mix(deep, mid, Math.min(1, a * 2.4));
          col = mix(col, tip, clamp((a - 0.55) * 1.8 + (aq - 0.7) * 1.6));
          this.renderer.drawChar(px + tx * q * w, py + ty * q * w * 0.65, glyph, css(col));
        }
      }
    }

    // Stamens and anthers appear once the flower is open.
    if (openness > 0.45) {
      const show = smooth(0.35, 0.85, openness);
      const anther = rgb(pal.anther);
      for (let k = 0; k < 7; k++) {
        const phi = (k * Math.PI * 2) / 6 + 0.3;
        const ln = size * (k === 6 ? 0.62 : 0.55) * show;
        const ex = cx + Math.cos(phi) * ln;
        const ey = cy + Math.sin(phi) * ln * 0.7;
        this.renderer.drawLine(cx, cy, ex, ey, ':', css(rgb('#C49A6C')));
        this.renderer.drawChar(ex, ey, k === 6 ? 'o' : '@', css(anther));
      }
    }
    void bright;
  }

  /**
   * Draw drifting golden specks in the negative space.
   * @param {number} frame
   * @returns {void}
   */
  generateSparkles(frame) {
    const step = Math.floor(frame / 3);
    for (let y = 0; y < CONFIG.GRID.ROWS; y++) {
      for (let x = 0; x < CONFIG.GRID.COLS; x++) {
        if (hash3(x, y + step, 77) % 420 === 0) this.renderer.drawChar(x, y, '.', PALETTE.accent);
      }
    }
  }

  /**
   * Assemble the full bouquet for the current animation time.
   * @param {number} elapsedMs @param {number} audioLevel
   * @returns {void}
   */
  generateBouquet(elapsedMs, audioLevel = 0) {
    const r = this.renderer;
    r.clearFrame();
    const t = elapsedMs / CONFIG.BLOOM_DURATION_MS;
    const sway = Math.sin((elapsedMs / CONFIG.SWAY_PERIOD_MS) * Math.PI * 2) * CONFIG.SWAY_AMPLITUDE;
    const baseX = 40;
    const baseY = 39;

    this.generateSparkles(elapsedMs / 16 + audioLevel * 2);

    for (let i = 0; i < SHADED_FLOWERS.length; i++) {
      const f = SHADED_FLOWERS[i];
      const grow = smooth(0.02 + i * 0.012, 0.30 + i * 0.012, t);
      const topY = f.y + f.size * 1.1;
      const fx = f.x + sway * (i % 2 ? -1 : 1);
      this.generateStem(baseX, baseY, fx, topY, FOLIAGE.dark, grow);

      const leafCount = f.bright > 0.8 ? 3 : 2;
      for (let j = 0; j < leafCount; j++) {
        const frac = 0.42 + j * 0.17;
        const lx = baseX + (fx - baseX) * frac;
        const ly = baseY + (topY - baseY) * frac;
        this.generateLeaf(Math.round(lx), Math.round(ly), (i + j) % 2 ? 1 : -1,
          6 - j * 0.8, i * 31 + j * 7 + 3, clamp((grow - frac) * 4));
      }

      const open = smooth(f.delay, f.delay + 0.3, t);
      if (open > 0) {
        this.generateShadedLily(fx, f.y, f.palette, open, f.size * (0.7 + 0.3 * grow),
          f.tilt, i * 7 + 3, f.bright);
      }
    }

    for (let i = 0; i < SHADED_BUDS.length; i++) {
      const b = SHADED_BUDS[i];
      const grow = smooth(0.1 + i * 0.03, 0.36 + i * 0.03, t);
      this.generateStem(baseX, baseY, b.x + sway, b.y + 2, FOLIAGE.dark, grow);
      if (grow > 0.6) {
        this.generateShadedLily(b.x + sway, b.y, b.palette, 0.06 + 0.04 * Math.sin(t * 8 + i),
          b.size || 1.6, 0, 90 + i, 0.9);
      }
      void b.ripe;
    }

    void audioLevel;
  }
}
