/**
 * @file Application entry point: wires the renderer, generator, audio engine
 * and UI together, and drives the requestAnimationFrame loop.
 * @module main
 */

import { CONFIG, FLOWERS } from './config.js';
import { ASCIIRenderer } from './ascii-renderer.js';
import { FlowerGenerator } from './flower-generator.js';
import { AudioSync } from './audio-sync.js';

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node;
}

/**
 * Read a stored value, falling back when storage is blocked (e.g. iframes).
 * @param {string} key
 * @returns {string|null}
 */
function safeGet(key) {
  try { return localStorage.getItem(key); } catch (_err) { return null; }
}

/**
 * @param {string} key
 * @param {string} value
 * @returns {void}
 */
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (_err) { /* private mode */ }
}

/** The whole application. */
class BloomCodeApp {
  constructor() {
    /** @type {HTMLPreElement} */
    this.pre = /** @type {HTMLPreElement} */ (el('canvas'));
    /** @type {HTMLElement} */
    this.frameShell = el('frame-shell');
    /** @type {HTMLElement} */
    this.pulseLayer = el('pulse-layer');
    /** @type {HTMLElement} */
    this.ticker = el('code-ticker');
    /** @type {HTMLElement} */
    this.statusLine = el('status-line');
    /** @type {HTMLElement} */
    this.toastEl = el('toast');
    /** @type {HTMLElement} */
    this.overlay = el('start-overlay');
    /** @type {HTMLButtonElement} */
    this.startBtn = /** @type {HTMLButtonElement} */ (el('start-btn'));
    /** @type {HTMLElement} */
    this.spinner = el('spinner');

    /** @type {ASCIIRenderer} */
    this.renderer = new ASCIIRenderer(CONFIG.GRID.COLS, CONFIG.GRID.ROWS, this.pre);
    /** @type {FlowerGenerator} */
    this.generator = new FlowerGenerator(this.renderer);
    /** @type {AudioSync} */
    this.audio = new AudioSync();

    /** @type {number} Speed multiplier, 0.5..2. */
    this.speed = CONFIG.SPEED.DEFAULT;
    /** @type {boolean} */
    this.playing = false;
    /** @type {boolean} */
    this.started = false;
    /** @type {number} Scaled animation clock in milliseconds. */
    this.animationTime = 0;
    /** @type {number} */
    this.lastFrameTime = 0;
    /** @type {number} */
    this.beatEnergy = 0;
    /** @type {number|null} */
    this.rafId = null;
    /** @type {number} */
    this.toastTimer = 0;

    this._readUrlParams();
    this._restorePreferences();
    this._applyTheme();
    this._applyControlState();
    this._bindUI();
    this._observeSize();

    // Non-blocking: a blocked CDN must never stop the animation.
    this.audio.preload().catch(() => {});

    // Draw the first (empty-but-framed) bouquet immediately.
    this.generator.generateBouquet(0, 0);
    this.renderer.renderFrame();
    this._updateTicker(0);

    this.rafId = requestAnimationFrame(this._loop);
  }

  /** Parse ?speed=&color=&bg= from the current URL. */
  _readUrlParams() {
    try {
      const params = new URLSearchParams(location.search);
      const rawSpeed = Number(params.get('speed'));
      if (Number.isFinite(rawSpeed) && rawSpeed >= CONFIG.SPEED.MIN && rawSpeed <= CONFIG.SPEED.MAX) {
        this.speed = rawSpeed;
      }
      const color = params.get('color');
      if (color === 'color' || color === 'mono') this.colorMode = color;
      const bg = params.get('bg');
      if (bg === 'dark' || bg === 'light') this.backgroundMode = bg;
    } catch (_err) {
      // Malformed URLs should not break the app.
    }
  }

  /** Restore persisted preference values (URL params take precedence). */
  _restorePreferences() {
    if (this.colorMode === undefined) {
      this.colorMode = safeGet(CONFIG.STORAGE.COLOR) === 'mono' ? 'mono' : 'color';
    }
    if (this.backgroundMode === undefined) {
      this.backgroundMode = safeGet(CONFIG.STORAGE.BACKGROUND) === 'light' ? 'light' : 'dark';
    }
    const storedSpeed = Number(safeGet(CONFIG.STORAGE.SPEED));
    if (!new URLSearchParams(location.search).has('speed') && Number.isFinite(storedSpeed)) {
      if (storedSpeed >= CONFIG.SPEED.MIN && storedSpeed <= CONFIG.SPEED.MAX) this.speed = storedSpeed;
    }
    this.audio.muted = safeGet(CONFIG.STORAGE.MUTED) === '1';
    const rawVolume = safeGet(CONFIG.STORAGE.VOLUME);
    const storedVolume = rawVolume === null || rawVolume === '' ? NaN : Number(rawVolume);
    this.audio.volume = Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : 0.8;
  }

  /** Apply the selected terminal palette. */
  _applyTheme() {
    document.body.dataset.theme = this.backgroundMode;
    this.renderer.setMonochrome(this.colorMode === 'mono', CONFIG.MONOCHROME_COLOR);
    this.renderer._lastHtml = ''; // force a repaint with the new colours
  }

  /** Sync control labels and slider values with internal state. */
  _applyControlState() {
    /** @type {HTMLInputElement} */
    const speed = /** @type {HTMLInputElement} */ (el('speed'));
    /** @type {HTMLInputElement} */
    const volume = /** @type {HTMLInputElement} */ (el('volume'));

    speed.value = String(this.speed);
    volume.value = String(Math.round(this.audio.volume * 100));
    el('speed-value').textContent = `${this.speed.toFixed(1)}×`;
    el('volume-value').textContent = `${Math.round(this.audio.volume * 100)}%`;

    /** @type {HTMLButtonElement} */
    const playLabel = /** @type {HTMLElement} */ (el('play-label'));
    playLabel.textContent = this.playing ? 'Pause' : 'Play';
    el('play-icon').textContent = this.playing ? '❚❚' : '▶';

    /** @type {HTMLButtonElement} */
    const muteBtn = /** @type {HTMLButtonElement} */ (el('mute-btn'));
    muteBtn.textContent = this.audio.muted ? '🔇 Muted' : '🔊 Sound';
    muteBtn.setAttribute('aria-pressed', String(this.audio.muted));

    /** @type {HTMLButtonElement} */
    const colorBtn = /** @type {HTMLButtonElement} */ (el('color-btn'));
    colorBtn.textContent = this.colorMode === 'mono' ? 'Mono green' : 'Color';
    colorBtn.setAttribute('aria-pressed', String(this.colorMode === 'mono'));

    /** @type {HTMLButtonElement} */
    const bgBtn = /** @type {HTMLButtonElement} */ (el('bg-btn'));
    bgBtn.textContent = this.backgroundMode === 'dark' ? 'Dark' : 'Light';
    bgBtn.setAttribute('aria-pressed', String(this.backgroundMode === 'light'));
  }

  /** Attach all button, slider and keyboard handlers. */
  _bindUI() {
    this.startBtn.addEventListener('click', () => this._start());

    el('play-btn').addEventListener('click', () => {
      if (!this.started) this._start();
      else this._togglePlay();
    });

    el('restart-btn').addEventListener('click', () => this.restart());
    el('mute-btn').addEventListener('click', () => this.toggleMute());
    el('export-btn').addEventListener('click', () => this.exportFrame());
    el('share-btn').addEventListener('click', () => this.share());

    /** @type {HTMLInputElement} */
    const speed = /** @type {HTMLInputElement} */ (el('speed'));
    speed.addEventListener('input', () => {
      this.speed = Number(speed.value);
      el('speed-value').textContent = `${this.speed.toFixed(1)}×`;
      safeSet(CONFIG.STORAGE.SPEED, String(this.speed));
    });

    /** @type {HTMLInputElement} */
    const volume = /** @type {HTMLInputElement} */ (el('volume'));
    volume.addEventListener('input', () => {
      const v = Number(volume.value);
      this.audio.setVolume(v / 100);
      el('volume-value').textContent = `${v}%`;
      safeSet(CONFIG.STORAGE.VOLUME, String(v / 100));
    });

    el('color-btn').addEventListener('click', () => {
      this.colorMode = this.colorMode === 'color' ? 'mono' : 'color';
      safeSet(CONFIG.STORAGE.COLOR, this.colorMode);
      this._applyTheme();
      this._applyControlState();
    });

    el('bg-btn').addEventListener('click', () => {
      this.backgroundMode = this.backgroundMode === 'dark' ? 'light' : 'dark';
      safeSet(CONFIG.STORAGE.BACKGROUND, this.backgroundMode);
      this._applyTheme();
      this._applyControlState();
    });

    document.addEventListener('keydown', (event) => {
      /** @type {HTMLElement} */
      const target = /** @type {HTMLElement} */ (event.target);
      const tag = target && target.tagName ? target.tagName.toUpperCase() : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'SELECT') return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!this.started) this._start();
        else this._togglePlay();
      } else if (event.key === 'r' || event.key === 'R') {
        this.restart();
      } else if (event.key === 'm' || event.key === 'M') {
        this.toggleMute();
      }
    });

    // Treat clicks anywhere in the artwork as play/pause too.
    this.frameShell.addEventListener('dblclick', () => {
      if (this.started) this._togglePlay();
    });

    this.audio.onBeat(() => { this.beatEnergy = 1; });
  }

  /** Keep the 80x40 grid legible inside any iframe size. */
  _observeSize() {
    const resize = () => this._fitGrid();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(resize);
      observer.observe(this.frameShell);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();
  }

  /** Compute and apply a font size that fits the grid into the frame. */
  _fitGrid() {
    const width = Math.max(1, this.frameShell.clientWidth - 16);
    const height = Math.max(1, this.frameShell.clientHeight - 16);
    const byWidth = width / (CONFIG.GRID.COLS * CONFIG.FONT.ASPECT);
    const byHeight = height / (CONFIG.GRID.ROWS * 1.06);
    const size = Math.min(CONFIG.FONT.SIZE_MAX, Math.max(CONFIG.FONT.SIZE_MIN, Math.min(byWidth, byHeight)));
    this.pre.style.fontSize = `${size.toFixed(2)}px`;
  }

  /** Unlock audio, then start the show. */
  async _start() {
    if (this.started) return;
    this.started = true;
    this.startBtn.disabled = true;
    this.spinner.hidden = false;
    this.statusLine.textContent = 'Unlocking audio…';

    try {
      const result = await this.audio.init();
      if (result.mode === 'silent') {
        this.toast('Audio unavailable — playing silent animation');
        this.statusLine.textContent = 'Silent mode — animation only.';
      } else if (result.mode === 'synth') {
        this.toast('Audio file unavailable — using generated melody');
        this.statusLine.textContent = 'Generated ambient melody · 120 BPM';
      } else {
        this.statusLine.textContent = 'Local soundtrack · 120 BPM';
      }
    } catch (_err) {
      this.toast('Audio unavailable — playing silent animation');
      this.statusLine.textContent = 'Silent mode — animation only.';
    } finally {
      this.spinner.hidden = true;
      this.overlay.hidden = true;
      this.startBtn.disabled = false;
    }

    this.playing = true;
    await this.audio.play();
    this._applyControlState();
  }

  /** Toggle pause/resume. */
  async _togglePlay() {
    this.playing = !this.playing;
    if (this.playing) await this.audio.play();
    else this.audio.pause();
    this.statusLine.textContent = this.playing ? 'Blooming…' : 'Paused.';
    this._applyControlState();
  }

  /** Reset the animation clock and restart the soundtrack. */
  restart() {
    this.animationTime = 0;
    this.beatEnergy = 0;
    this.audio.stop();
    this.generator.generateBouquet(0, 0);
    this.renderer.renderFrame();
    this._updateTicker(0);
    if (this.started && this.playing) this.audio.play().catch(() => {});
    this.toast('Animation restarted');
  }

  /** Toggle mute and remember the choice. */
  toggleMute() {
    this.audio.setMuted(!this.audio.muted);
    safeSet(CONFIG.STORAGE.MUTED, this.audio.muted ? '1' : '0');
    this._applyControlState();
    this.toast(this.audio.muted ? 'Muted' : 'Sound on');
  }

  /** Download the current ASCII frame as a plain-text file. */
  exportFrame() {
    const text = this.renderer.toText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bloomcode-lily-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast('Frame exported as .txt');
  }

  /** Copy a permalink carrying the current settings. */
  async share() {
    const url = new URL(location.href);
    url.search = '';
    url.searchParams.set('speed', this.speed.toFixed(1));
    url.searchParams.set('color', this.colorMode);
    url.searchParams.set('bg', this.backgroundMode);

    try {
      await navigator.clipboard.writeText(url.toString());
      this.toast('Share link copied to clipboard');
    } catch (_err) {
      // Clipboard API is unavailable in some sandboxed iframes.
      const fallback = document.createElement('textarea');
      fallback.value = url.toString();
      fallback.style.position = 'fixed';
      fallback.style.opacity = '0';
      document.body.appendChild(fallback);
      fallback.select();
      try {
        document.execCommand('copy');
        this.toast('Share link copied to clipboard');
      } catch (_copyErr) {
        this.toast(`Copy this link: ${url.toString()}`);
      }
      fallback.remove();
    }
  }

  /**
   * Refresh the decorative "source code" line under the artwork.
   * @param {number} progress 0..1 bloom progress
   * @returns {void}
   */
  _updateTicker(progress) {
    const top = Math.min(...FLOWERS.map((f) => f.y)) - 5;
    const bottom = Math.max(...FLOWERS.map((f) => f.y)) + 5;
    const ymin = Math.round(top - progress * 4);
    const ymax = Math.round(bottom - progress * 3);
    const maxw = Math.round(20 + progress * 45);
    this.ticker.textContent =
      `ymin = ${ymin}, ymax = ${ymax}, maxw = ${maxw}; bloomProgress = ${progress.toFixed(2)};`;
  }

  /**
   * Show a transient toast message.
   * @param {string} message
   * @returns {void}
   */
  toast(message) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('is-visible'), 3200);
  }

  /**
   * Main animation loop. Regenerates the framebuffer only when the clock
   * advances; the pulse is a CSS transform so it costs no re-render.
   * @param {number} now
   * @returns {void}
   */
  _loop = (now) => {
    const dt = this.lastFrameTime ? Math.min(64, now - this.lastFrameTime) : 16;
    this.lastFrameTime = now;

    if (this.playing) {
      this.animationTime += dt * this.speed;
      const progress = Math.min(1, this.animationTime / CONFIG.BLOOM_DURATION_MS);
      const level = this.audio.getVolumeLevel();
      this.generator.generateBouquet(this.animationTime, level);
      this.renderer.renderFrame();
      this._updateTicker(progress);
    }

    // Beat flash decays independently of the render loop.
    this.beatEnergy *= 0.92;
    const level = this.audio.getVolumeLevel();
    const scale = 1 + level * 0.03 + this.beatEnergy * 0.008;
    const brightness = 0.9 + level * 0.45 + this.beatEnergy * 0.12;
    this.pulseLayer.style.transform = `scale(${scale.toFixed(4)})`;
    this.pulseLayer.style.filter = `brightness(${brightness.toFixed(3)})`;

    this.rafId = requestAnimationFrame(this._loop);
  };
}

/** Boot with a single top-level error boundary. */
try {
  new BloomCodeApp();
} catch (error) {
  console.error('[BloomCode] failed to start:', error);
  const fallback = document.getElementById('status-line');
  if (fallback) fallback.textContent = 'Initialisation failed — see console.';
}
