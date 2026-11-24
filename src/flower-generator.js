/**
 * @file Pointed-lily geometry: solid stems, thin leaves and six-petal stars.
 * @module flower-generator
 */

import { CONFIG, FLOWERS, GLYPHS, PALETTE, PETALS } from './config.js';

/** @typedef {import('./ascii-renderer.js').ASCIIRenderer} ASCIIRenderer */

/**
 * Clamp a number to [min, max].
 * @param {number} v
 * @param {number} [min=0]
 * @param {number} [max=1]
 * @returns {number}
 */
function clamp(v, min = 0, max = 1) {
  return Math.min(max, Math.max(min, v));
}

/**
 * Builds the bouquet out of continuous lines. No filled circles anywhere.
 */
export class FlowerGenerator {
  /**
   * @param {ASCIIRenderer} renderer
   */
  constructor(renderer) {
    /** @type {ASCIIRenderer} */
    this.renderer = renderer;
  }

  /**
   * Draw a solid, gap-free stem. Exactly one glyph per Bresenham step.
   * @param {number} x0 base x
   * @param {number} y0 base y
   * @param {number} x1 tip x
   * @param {number} y1 tip y
   * @param {string} color
   * @param {number} [reveal=1] 0..1 growth amount
   * @returns {void}
   */
  generateStem(x0, y0, x1, y1, color, reveal = 1) {
    const t = clamp(reveal);
    if (t <= 0) return;
    const ex = x0 + (x1 - x0) * t;
    const ey = y0 + (y1 - y0) * t;
    const dx = ex - x0;
    const glyph = Math.abs(dx) < 1 ? GLYPHS.stem : dx > 0 ? GLYPHS.stemSlant : GLYPHS.stemFold;
    this.renderer.drawLine(x0, y0, ex, ey, glyph, color);
  }

  /**
   * Draw a thin, outward-pointing leaf: at most 4 cells wide and 2 tall.
   * @param {number} stemX attachment x on the stem
   * @param {number} stemY attachment y on the stem
   * @param {-1|1} dir -1 points left, 1 points right
   * @param {string} color
   * @returns {void}
   */
  generateLeaf(stemX, stemY, dir, color) {
    const start = dir > 0 ? stemX + 1 : stemX - 4;
    const topRow = dir > 0 ? ['(', '\\', '/', ')'] : ['(', '/', '\\', ')'];
    const bottomRow = dir > 0 ? [' ', '\\', '/', ' '] : [' ', '/', '\\', ' '];

    for (let i = 0; i < 4; i++) {
      if (topRow[i] !== ' ') this.renderer.drawChar(start + i, stemY, topRow[i], color);
      if (bottomRow[i] !== ' ') this.renderer.drawChar(start + i, stemY + 1, bottomRow[i], color);
    }
  }

  /**
   * Draw one lily as six pointed lines plus a yellow (o) pistil.
   * Bloom stages: stem only → bud → 2 petals → 4 petals → 6 petals → centre.
   * @param {number} centerX
   * @param {number} centerY
   * @param {string} color petal colour
   * @param {number} bloomProgress 0..1
   * @param {number} [scale=1]
   * @param {number} [tiltDeg=0] rotation in degrees
   * @returns {void}
   */
  generatePointedLily(centerX, centerY, color, bloomProgress, scale = 1, tiltDeg = 0) {
    const bloom = clamp(bloomProgress);
    if (bloom < 0.18) return; // stem only

    const cx = Math.round(centerX);
    const cy = Math.round(centerY);

    // Closed bud: exactly "( )".
    if (bloom < 0.38) {
      this.renderer.drawChar(cx - 1, cy - 1, GLYPHS.budLeft, color);
      this.renderer.drawChar(cx + 1, cy - 1, GLYPHS.budRight, color);
      this.renderer.drawChar(cx, cy, GLYPHS.stem, PALETTE.stem);
      return;
    }

    const count = bloom < 0.58 ? 2 : bloom < 0.78 ? 4 : 6;
    const length = Math.min(6, Math.max(5, Math.round(5 * scale)));
    const tilt = (tiltDeg * Math.PI) / 180;
    const stretchX = 1.05;
    const stretchY = 0.85;

    for (let i = 0; i < count; i++) {
      const petal = PETALS[i];
      const angle = (petal.angle * Math.PI) / 180 + tilt;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const endX = cx + ux * length * stretchX;
      const endY = cy + uy * length * stretchY;

      // Petals are single-cell lines: no filled disks, no '*' or '.' body.
      this.renderer.drawLine(cx, cy, endX, endY, petal.glyph, color);
    }

    // Yellow pistil appears only on the fully open flower.
    if (bloom >= 0.92) {
      this.renderer.drawChar(cx - 1, cy, GLYPHS.centerLeft, PALETTE.accent);
      this.renderer.drawChar(cx, cy, GLYPHS.center, PALETTE.accent);
      this.renderer.drawChar(cx + 1, cy, GLYPHS.centerRight, PALETTE.accent);
      this.renderer.drawChar(cx, cy - 1, GLYPHS.pollen, PALETTE.accent);
      this.renderer.drawChar(cx, cy + 1, GLYPHS.pollen, PALETTE.accent);
    }
  }

  /**
   * Draw the entire fixed bouquet.
   * @param {number} elapsedMs scaled animation-clock milliseconds since (re)start
   * @param {number} audioLevel 0..1 RMS level from the analyser (reserved for pulse)
   * @returns {void}
   */
  generateBouquet(elapsedMs, audioLevel = 0) {
    const r = this.renderer;
    r.clearFrame();

    const raw = elapsedMs / CONFIG.BLOOM_DURATION_MS;
    const sway = Math.sin((elapsedMs / CONFIG.SWAY_PERIOD_MS) * Math.PI * 2) * CONFIG.SWAY_AMPLITUDE;
    const baseX = 40;
    const baseY = 38;

    for (let i = 0; i < FLOWERS.length; i++) {
      const f = FLOWERS[i];
      const local = clamp((raw - f.delay) / (1 - f.delay));

      const fx = f.x + sway * (i % 2 === 0 ? 1 : -1);
      const fy = f.y;
      const color = PALETTE[f.color];
      const length = Math.min(6, Math.max(5, Math.round(5 * f.scale)));
      const tipY = fy + Math.round(length * 0.85);

      // Stems are present from 0% (stem-only stage) and finish growing early.
      this.generateStem(baseX, baseY, fx, tipY, PALETTE.stem, clamp(0.3 + raw * 3));

      if (local <= 0) continue;

      // Two thin leaves per stem, attached at points that never break the line.
      if (local > 0.2) {
        const leafReveal = clamp((local - 0.2) / 0.3);
        if (leafReveal > 0) {
          const t1 = 0.42;
          const t2 = 0.7;
          const l1x = baseX + (fx - baseX) * t1;
          const l1y = baseY + (tipY - baseY) * t1;
          this.generateLeaf(Math.round(l1x), Math.round(l1y), i % 2 === 0 ? -1 : 1, PALETTE.leaf);
          if (leafReveal > 0.5) {
            const l2x = baseX + (fx - baseX) * t2;
            const l2y = baseY + (tipY - baseY) * t2;
            this.generateLeaf(Math.round(l2x), Math.round(l2y), i % 2 === 0 ? 1 : -1, PALETTE.leaf);
          }
        }
      }

      this.generatePointedLily(fx, fy, color, local, f.scale, f.tilt);
    }

    // No wrap, no dashes, no ribbon glyph at the base — stems simply converge.
    void audioLevel;
  }
}
