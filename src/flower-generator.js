/**
 * @file Procedural ASCII flower / bouquet geometry.
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
 * Ease-out cubic — quick start, soft landing. Used for petal opening.
 * @param {number} t 0..1
 * @returns {number}
 */
function easeOutCubic(t) {
  const x = clamp(t);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Builds stems, leaves, buds and six-petal lilies out of ASCII characters.
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
   * Draw a stem from (x, y) upward. `reveal` (0..1) controls how much is drawn.
   * @param {number} x
   * @param {number} y
   * @param {number} height
   * @param {string} color
   * @param {number} [lean=0] horizontal drift per row
   * @param {number} [reveal=1]
   * @returns {void}
   */
  generateStem(x, y, height, color, lean = 0, reveal = 1) {
    const visible = Math.max(0, Math.floor(height * clamp(reveal)));
    for (let i = 0; i <= visible; i++) {
      const t = height === 0 ? 0 : i / height;
      const px = x + lean * t + Math.sin(t * Math.PI * 1.5) * 0.45;
      const py = y - i;
      const glyph = lean > 0.35 ? GLYPHS.stemSlant : lean < -0.35 ? GLYPHS.petalFold : GLYPHS.stem;
      this.renderer.drawChar(px, py, glyph, color);
    }
  }

  /**
   * Draw one leaf branching sideways from a stem.
   * @param {number} x
   * @param {number} y
   * @param {-1|1} dir -1 for left, 1 for right
   * @param {string} color
   * @param {number} [size=3]
   * @returns {void}
   */
  generateLeaf(x, y, dir, color) {
    // A compact 2x2 "\\\\//" / "//\\\\" blob reads clearly as a leaf and
    // avoids the long diagonal streaks that long leaves create on an 80x40 grid.
    const x0 = x + (dir > 0 ? 1 : -2);
    const upper = dir > 0 ? GLYPHS.petalFold : GLYPHS.petalEdge;
    const lower = dir > 0 ? GLYPHS.petalEdge : GLYPHS.petalFold;
    this.renderer.drawChar(x0, y - 1, upper, color);
    this.renderer.drawChar(x0 + 1, y - 1, upper, color);
    this.renderer.drawChar(x0, y, lower, color);
    this.renderer.drawChar(x0 + 1, y, lower, color);
    this.renderer.drawChar(x0 + (dir > 0 ? 2 : -1), y, GLYPHS.bud, color);
  }

  /**
   * Draw a closed bud. Used for the early bloom phase.
   * @param {number} cx
   * @param {number} cy
   * @param {string} color
   * @param {number} progress 0..1
   * @returns {void}
   */
  generateBud(cx, cy, color, progress) {
    const p = clamp(progress);
    this.renderer.drawChar(cx, cy - 1, GLYPHS.bud, color);
    this.renderer.drawChar(cx - 1, cy, p > 0.5 ? GLYPHS.petalFold : GLYPHS.petalEdge, color);
    this.renderer.drawChar(cx + 1, cy, p > 0.5 ? GLYPHS.petalEdge : GLYPHS.petalFold, color);
    this.renderer.drawChar(cx, cy + 1, GLYPHS.stem, PALETTE.stem);
  }

  /**
   * Draw a fully parametric lily: six staggered petals plus pistil.
   * @param {number} centerX
   * @param {number} centerY
   * @param {string} color CSS colour for the petals
   * @param {number} bloomProgress 0..1 controls how many petals are visible
   * @param {number} [scale=1]
   * @returns {void}
   */
  generateLily(centerX, centerY, color, bloomProgress, scale = 1) {
    const bloom = easeOutCubic(bloomProgress);
    if (bloom <= 0) return;

    const cx = Math.round(centerX);
    const cy = Math.round(centerY);

    const maxLen = Math.max(2, Math.round(4 * scale));

    for (let i = 0; i < PETALS.length; i++) {
      const petal = PETALS[i];
      // Each petal opens slightly after the previous one.
      const local = clamp((bloom - i * 0.035) / 0.85);
      if (local <= 0) continue;

      const len = Math.max(1, Math.round(local * maxLen));
      const angle = (petal.angle * Math.PI) / 180;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      // Perpendicular vector, used to give each petal width.
      const nx = -uy;
      const ny = ux;

      for (let r = 2; r <= len; r++) {
        // Horizontal stretch compensates for terminal cells being ~2x tall.
        const px = Math.round(cx + ux * r * 1.3);
        const py = Math.round(cy + uy * r * 0.78);

        let glyph = petal.spine;
        if (r === len) glyph = GLYPHS.petalTip;
        this.renderer.drawChar(px, py, glyph, color);

        // Folded edges make the six petals read as broad lily petals.
        if (r >= 3 && r < len) {
          this.renderer.drawChar(
            Math.round(cx + ux * r * 1.3 + nx),
            Math.round(cy + uy * r * 0.78 + ny),
            petal.left,
            color
          );
          this.renderer.drawChar(
            Math.round(cx + ux * r * 1.3 - nx),
            Math.round(cy + uy * r * 0.78 - ny),
            petal.right,
            color
          );
        }
      }
    }

    // Draw the pistil last so petal strokes never overwrite it.
    if (bloom > 0.12) {
      this.renderer.drawText(cx - 2, cy, GLYPHS.pistil, PALETTE.accent);
    }
    if (bloom > 0.32) {
      this.renderer.drawText(cx - 1, cy + 1, GLYPHS.stigma, PALETTE.accent);
    }

    // Final sparkle ring once the flower is wide open.
    if (bloomProgress > 0.86) {
      const twinkle = Math.round(centerX + centerY) % 2 === 0;
      this.renderer.drawChar(cx - 6, cy - 2, GLYPHS.sparkle, PALETTE.accent);
      this.renderer.drawChar(cx + 6, cy - 2, GLYPHS.sparkle, PALETTE.accent);
      if (twinkle) {
        this.renderer.drawChar(cx, cy - 5, GLYPHS.sparkle, color);
      }
    }
  }

  /**
   * Draw the paper/ribbon wrap that gathers the stems at the bottom.
   * @param {number} glow 0..1 brightness hint from the audio analyser
   * @returns {void}
   */
  generateWrap(glow = 0) {
    const cx = 40;
    const color = glow > 0.45 ? PALETTE.accent : PALETTE.stem;
    this.renderer.drawLine(cx - 9, 33, cx - 3, 37, GLYPHS.petalFold, color);
    this.renderer.drawLine(cx + 9, 33, cx + 3, 37, GLYPHS.petalEdge, color);
    this.renderer.drawLine(cx - 5, 37, cx + 5, 37, GLYPHS.wrap, color);
    this.renderer.drawLine(cx - 4, 35, cx + 4, 35, GLYPHS.wrap, color);
    this.renderer.drawChar(cx, 35, GLYPHS.ribbon, PALETTE.yellow);
    this.renderer.drawChar(cx - 1, 36, GLYPHS.ribbon, PALETTE.yellow);
    this.renderer.drawChar(cx + 1, 36, GLYPHS.ribbon, PALETTE.yellow);
    this.renderer.drawLine(cx - 2, 39, cx + 2, 39, GLYPHS.wrap, color);
  }

  /**
   * Draw the whole bouquet for a given animation time.
   * @param {number} elapsedMs scaled animation-clock milliseconds since (re)start
   * @param {number} audioLevel 0..1 RMS level from the analyser
   * @returns {void}
   */
  generateBouquet(elapsedMs, audioLevel = 0) {
    const r = this.renderer;
    r.clearFrame();

    const raw = elapsedMs / CONFIG.BLOOM_DURATION_MS;
    const sway = Math.sin((elapsedMs / CONFIG.SWAY_PERIOD_MS) * Math.PI * 2) * CONFIG.SWAY_AMPLITUDE;

    for (let i = 0; i < FLOWERS.length; i++) {
      const f = FLOWERS[i];
      const local = clamp((raw - f.delay) / (1 - f.delay));
      if (local <= 0) continue;

      const fx = f.x + sway * (i % 2 === 0 ? 1 : -1) * 0.5;
      const fy = f.y + Math.abs(sway) * 0.25;
      const color = PALETTE[f.color];
      const stemColor = PALETTE.stem;

      // 1. Stem grows up from the bouquet's gather point.
      const stemReveal = clamp(local / 0.34);
      const baseX = 40;
      const baseY = 36;
      const topY = Math.round(fy + 2);
      const height = baseY - topY;
      if (height > 0) {
        const lean = fx - baseX;
        const visible = Math.max(0, Math.floor(height * stemReveal));
        for (let s = 0; s <= visible; s++) {
          const t = s / height;
          const px = baseX + lean * t + Math.sin(t * Math.PI) * 0.35;
          const py = baseY - s;
          const glyph = lean > 1 ? GLYPHS.stemSlant : lean < -1 ? GLYPHS.petalFold : GLYPHS.stem;
          r.drawChar(px, py, glyph, stemColor);
        }

        // 2. Leaves unfold once the stem is partly grown.
        if (local > 0.18) {
          const leafReveal = clamp((local - 0.18) / 0.28);
          const leafCount = Math.max(1, Math.round(3 * leafReveal));
          for (let k = 0; k < leafCount; k++) {
            const t = 0.28 + k * 0.24;
            const lx = Math.round(baseX + lean * t);
            const ly = Math.round(baseY - height * t);
            const dir = (k + i) % 2 === 0 ? -1 : 1;
            this.generateLeaf(lx, ly, dir, PALETTE.leaf);
          }
        }
      }

      // 3. Bud forms, then the six petals open.
      const budPhase = clamp((local - 0.30) / 0.22);
      const petalPhase = clamp((local - 0.42) / 0.58);
      if (budPhase > 0 && petalPhase < 1) {
        this.generateBud(Math.round(fx), Math.round(fy), color, budPhase);
      }
      if (petalPhase > 0) {
        this.generateLily(fx, fy, color, petalPhase, f.scale);
      }
    }

    // Wrap is present from the very first frame, anchoring the composition.
    this.generateWrap(audioLevel);
  }
}
