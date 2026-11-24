/**
 * @file Framebuffer-backed ASCII renderer targeting a <pre> element.
 * @module ascii-renderer
 */

/** @typedef {{char: string, color: string|null}} Cell */

/**
 * Escapes the handful of glyphs that are special in HTML.
 * @param {string} ch
 * @returns {string}
 */
function escapeHtml(ch) {
  switch (ch) {
    case '&': return '&amp;';
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '"': return '&quot;';
    default: return ch;
  }
}

/**
 * Draws an 80x40 character grid into a <pre> using one innerHTML write per frame.
 * Cells are reused between frames to avoid allocation churn.
 */
export class ASCIIRenderer {
  /**
   * @param {number} cols
   * @param {number} rows
   * @param {HTMLPreElement} pre
   */
  constructor(cols, rows, pre) {
    if (!pre) throw new Error('ASCIIRenderer requires a <pre> element.');

    /** @type {number} */
    this.cols = cols;
    /** @type {number} */
    this.rows = rows;
    /** @type {HTMLPreElement} */
    this.pre = pre;

    /** @type {Cell[][]} */
    this.framebuffer = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ char: ' ', color: null }))
    );

    /** @type {boolean} */
    this.monochrome = false;
    /** @type {string} */
    this.monochromeColor = '#00ff41';
    /** @type {string} Last emitted HTML, used to skip redundant DOM writes. */
    this._lastHtml = '';
    /** @type {number} */
    this.framesRendered = 0;
  }

  /**
   * Switch between the full palette and a single green terminal colour.
   * @param {boolean} enabled
   * @param {string} [color]
   * @returns {void}
   */
  setMonochrome(enabled, color = '#00ff41') {
    this.monochrome = Boolean(enabled);
    this.monochromeColor = color;
    this._lastHtml = ''; // force a repaint
  }

  /**
   * Reset every cell in place. No new arrays are created.
   * @returns {void}
   */
  clearFrame() {
    for (let y = 0; y < this.rows; y++) {
      const row = this.framebuffer[y];
      for (let x = 0; x < this.cols; x++) {
        const cell = row[x];
        cell.char = ' ';
        cell.color = null;
      }
    }
  }

  /**
   * Write one character. Coordinates outside the framebuffer are ignored.
   * @param {number} x
   * @param {number} y
   * @param {string} char
   * @param {string|null} [color] CSS colour, or null for unstyled text
   * @returns {void}
   */
  drawChar(x, y, char, color = null) {
    if (!char) return;
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.cols || iy < 0 || iy >= this.rows) return;
    const cell = this.framebuffer[iy][ix];
    cell.char = char.length > 1 ? char[0] : char;
    cell.color = color;
  }

  /**
   * Draw a string horizontally, clipping at the right edge.
   * @param {number} x
   * @param {number} y
   * @param {string} text
   * @param {string|null} [color]
   * @returns {void}
   */
  drawText(x, y, text, color = null) {
    for (let i = 0; i < text.length; i++) {
      this.drawChar(x + i, y, text[i], color);
    }
  }

  /**
   * Bresenham line between two cells.
   * @param {number} x0
   * @param {number} y0
   * @param {number} x1
   * @param {number} y1
   * @param {string} char
   * @param {string|null} [color]
   * @returns {void}
   */
  drawLine(x0, y0, x1, y1, char, color = null) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const tx = Math.round(x1);
    const ty = Math.round(y1);
    const dx = Math.abs(tx - x);
    const dy = Math.abs(ty - y);
    const sx = x < tx ? 1 : -1;
    const sy = y < ty ? 1 : -1;
    let err = dx - dy;

    // Guard against pathological loops.
    let guard = this.cols * this.rows * 2;
    while (guard-- > 0) {
      this.drawChar(x, y, char, color);
      if (x === tx && y === ty) break;
      const e2 = err * 2;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  /**
   * Resolve the effective colour of a cell.
   * @param {string|null} color
   * @returns {string|null}
   */
  _resolveColor(color) {
    if (!color) return null;
    return this.monochrome ? this.monochromeColor : color;
  }

  /**
   * Serialise the framebuffer to HTML. Adjacent cells with the same resolved
   * colour are merged into a single <span>, keeping the DOM small.
   * @returns {string}
   */
  buildHtml() {
    const parts = [];
    for (let y = 0; y < this.rows; y++) {
      const row = this.framebuffer[y];
      let run = '';
      let runColor = /** @type {string|null} */ (null);
      let hasStyledRun = false;

      for (let x = 0; x < this.cols; x++) {
        const color = this._resolveColor(row[x].color);
        if (color !== runColor) {
          if (run) {
            parts.push(hasStyledRun
              ? `<span style="color:${runColor}">${escapeHtml(run)}</span>`
              : escapeHtml(run));
          }
          run = '';
          runColor = color;
          hasStyledRun = color !== null;
        }
        run += row[x].char;
      }
      if (run) {
        parts.push(hasStyledRun
          ? `<span style="color:${runColor}">${escapeHtml(run)}</span>`
          : escapeHtml(run));
      }
      parts.push('\n');
    }
    return parts.join('');
  }

  /**
   * Commit the current framebuffer to the DOM.
   * @returns {void}
   */
  renderFrame() {
    const html = this.buildHtml();
    if (html !== this._lastHtml) {
      this.pre.innerHTML = html;
      this._lastHtml = html;
    }
    this.framesRendered++;
  }

  /**
   * Flatten the framebuffer to plain text (used by the .txt export).
   * @returns {string}
   */
  toText() {
    const lines = [];
    for (let y = 0; y < this.rows; y++) {
      lines.push(this.framebuffer[y].map((c) => c.char).join(''));
    }
    return lines.join('\n');
  }
}
