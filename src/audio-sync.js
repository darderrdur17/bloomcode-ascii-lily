/**
 * @file Audio engine: unlocks Web Audio, loads music, generates a fallback
 * melody, and exposes an RMS level for visual pulsing.
 * @module audio-sync
 */

import { CONFIG } from './config.js';

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
 * Wraps Tone.js behind a small, failure-tolerant API.
 *
 * Tone.js is imported dynamically so that a blocked CDN never prevents the
 * ASCII animation from running. If neither MP3 source loads, a PolySynth
 * ambient loop is generated locally; if Tone.js itself is unavailable, the
 * animation continues in silent mode with a synthetic pulse.
 */
export class AudioSync {
  /** Create an uninitialised audio engine. */
  constructor() {
    /** @type {any|null} Tone.js namespace, populated by init(). */
    this.Tone = null;
    /** @type {'file'|'synth'|'silent'} */
    this.mode = 'silent';
    /** @type {boolean} */
    this.available = false;
    /** @type {boolean} */
    this.playing = false;
    /** @type {boolean} */
    this.muted = false;
    /** @type {number} 0..1 */
    this.volume = 0.8;

    /** @type {any|null} */
    this.player = null;
    /** @type {any|null} */
    this.synth = null;
    /** @type {any|null} */
    this.reverb = null;
    /** @type {any|null} */
    this.analyser = null;
    /** @type {any|null} */
    this.volumeNode = null;
    /** @type {any|null} */
    this.sequence = null;
    /** @type {boolean} */
    this.sequenceStarted = false;

    /** @type {Set<Function>} */
    this.beatCallbacks = new Set();
    /** @type {boolean} */
    this.disposed = false;
  }

  /**
   * Try importmap first, then two CDN URLs. Any failure falls through.
   * @returns {Promise<any|null>}
   */
  async _loadTone() {
    // Preferred: the UMD script already loaded in index.html exposes window.Tone.
    if (typeof window !== 'undefined' && window.Tone && typeof window.Tone.start === 'function') {
      return window.Tone;
    }

    const sources = ['tone', CONFIG.AUDIO.TONE_ESM, CONFIG.AUDIO.TONE_ESM_FALLBACK];
    for (const source of sources) {
      try {
        const mod = await import(/* webpackIgnore: true */ source);
        if (mod && typeof mod.start === 'function') return mod;
      } catch (_err) {
        // Try the next source.
      }
    }
    return null;
  }

  /**
   * Fetch the Tone.js module ahead of time, without touching AudioContext.
   * Called on page load so the click handler can unlock audio immediately.
   * @returns {Promise<boolean>} whether Tone.js is available
   */
  async preload() {
    if (!this.Tone) this.Tone = await this._loadTone();
    return Boolean(this.Tone);
  }

  /**
   * Unlock audio, build the signal chain and acquire a music source.
   * Must be called from a user gesture (e.g. the Play button click).
   * @returns {Promise<{ok:boolean, mode:'file'|'synth'|'silent', detail?:string}>}
   */
  async init() {
    this.Tone = this.Tone || (await this._loadTone());
    if (!this.Tone || this.disposed) {
      this.mode = 'silent';
      return { ok: false, mode: 'silent', detail: 'Tone.js could not be loaded.' };
    }

    const T = this.Tone;

    // Browser autoplay policy: resume the context inside the gesture.
    try {
      await T.start();
      const ctx = typeof T.getContext === 'function' ? T.getContext() : null;
      if (ctx && ctx.state !== 'running') await ctx.resume();
    } catch (_err) {
      return { ok: false, mode: 'silent', detail: 'AudioContext could not be resumed.' };
    }

    T.Transport.bpm.value = CONFIG.BPM;

    // source -> analyser -> volume -> destination
    this.analyser = new T.Analyser('waveform', 256);
    this.volumeNode = new T.Volume(0);
    this.analyser.connect(this.volumeNode);
    this.volumeNode.toDestination();

    let detail = '';
    const sources = [
      { url: CONFIG.AUDIO.LOCAL_URL, label: 'local MP3' },
      { url: CONFIG.AUDIO.CDN_URL, label: 'CDN MP3' },
    ];

    for (const source of sources) {
      try {
        const player = new T.Player();
        await player.load(source.url);
        player.loop = true;
        player.connect(this.analyser);
        this.player = player;
        this.mode = 'file';
        detail = `Loaded ${source.label}.`;
        break;
      } catch (_err) {
        detail = `${source.label} unavailable.`;
      }
    }

    if (this.mode !== 'file') {
      this._buildFallbackSynth();
      detail = 'Using generated ambient melody.';
    }

    this._setupTransport();
    this.setVolume(this.volume);
    this.available = true;
    return { ok: true, mode: this.mode, detail };
  }

  /**
   * Construct a pentatonic ambient loop with a soft PolySynth + reverb.
   * @returns {void}
   */
  _buildFallbackSynth() {
    const T = this.Tone;
    if (!T) return;

    this.reverb = new T.Reverb({ decay: 5, preDelay: 0.05, wet: 0.42 });
    this.reverb.connect(this.analyser);

    this.synth = new T.PolySynth(T.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.9, decay: 1.4, sustain: 0.32, release: 2.8 },
      volume: -10,
    });
    this.synth.connect(this.reverb);

    const notes = [
      'C4', 'G4', 'E4', 'A4', 'C5', 'G4',
      'D4', 'A4', 'F4', 'C5', 'E4', 'G4',
    ];
    this.sequence = new T.Sequence((time, note) => {
      if (this.synth && !this.disposed) {
        this.synth.triggerAttackRelease(note, '4n', time, 0.32);
      }
    }, notes, '8n');

    this.mode = 'synth';
  }

  /**
   * Wire the 120 BPM transport to the bloom-step callbacks.
   * @returns {void}
   */
  _setupTransport() {
    const T = this.Tone;
    if (!T) return;

    T.Transport.scheduleRepeat(() => {
      for (const callback of this.beatCallbacks) {
        try { callback(); } catch (_err) { /* keep the transport alive */ }
      }
    }, '4n');
  }

  /**
   * Start playback. Safe to call repeatedly.
   * @returns {Promise<boolean>} true when audio actually started
   */
  async play() {
    if (!this.Tone || this.mode === 'silent' || this.disposed) return false;
    try {
      await this.Tone.start();

      if (this.player) {
        if (this.playing && this.player.state === 'started') {
          // Already running — nothing to do.
        } else {
          this.player.start();
        }
      }

      if (this.sequence && !this.sequenceStarted) {
        this.sequence.start(0);
        this.sequenceStarted = true;
      }

      this.Tone.Transport.start();
      this.playing = true;
      return true;
    } catch (_err) {
      this.playing = false;
      return false;
    }
  }

  /**
   * Pause playback while preserving the transport position.
   * @returns {void}
   */
  pause() {
    if (!this.Tone) return;
    try {
      this.Tone.Transport.pause();
      if (this.player) this.player.pause();
    } catch (_err) {
      // Ignore stale-node errors after a dispose.
    }
    this.playing = false;
  }

  /**
   * Stop and reset the transport to the beginning.
   * @returns {void}
   */
  stop() {
    if (!this.Tone) return;
    try {
      this.Tone.Transport.stop();
      if (this.player) this.player.stop();
      if (this.sequence) this.sequence.clear();
      this.sequence = null;
      this.sequenceStarted = false;
      if (this.synth) this._buildFallbackSynth();
    } catch (_err) {
      // Nothing else to clean up.
    }
    this.playing = false;
  }

  /**
   * Set output volume.
   * @param {number} v 0..1
   * @returns {void}
   */
  setVolume(v) {
    this.volume = clamp(v);
    if (!this.volumeNode || !this.Tone) return;
    try {
      this.volumeNode.mute = this.muted || this.volume <= 0;
      const db = this.volume <= 0 ? -60 : 20 * Math.log10(this.volume);
      this.volumeNode.volume.rampTo(db, 0.05);
    } catch (_err) {
      // Parameter automation can fail on a closed context; keep state consistent.
    }
  }

  /**
   * Mute or unmute without losing the volume setting.
   * @param {boolean} value
   * @returns {void}
   */
  setMuted(value) {
    this.muted = Boolean(value);
    this.setVolume(this.volume);
  }

  /**
   * Current RMS-derived level, 0..1. Falls back to a gentle synthetic pulse
   * so the bouquet still breathes when there is no audio at all.
   * @returns {number}
   */
  getVolumeLevel() {
    if (this.analyser && this.Tone && this.playing) {
      try {
        const buffer = this.analyser.getValue();
        if (buffer && buffer.length) {
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i];
          const rms = Math.sqrt(sum / buffer.length);
          return clamp(rms * 3.2);
        }
      } catch (_err) {
        // Fall through to synthetic pulse.
      }
    }
    return 0.14 + 0.07 * Math.sin(performance.now() / 420);
  }

  /**
   * Register a callback fired on every Tone.Transport quarter note.
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  onBeat(callback) {
    this.beatCallbacks.add(callback);
    return () => this.beatCallbacks.delete(callback);
  }

  /**
   * Release every audio node.
   * @returns {void}
   */
  dispose() {
    this.disposed = true;
    this.playing = false;
    try {
      if (this.player) this.player.dispose();
      if (this.synth) this.synth.dispose();
      if (this.reverb) this.reverb.dispose();
      if (this.analyser) this.analyser.dispose();
      if (this.volumeNode) this.volumeNode.dispose();
      if (this.Tone) {
        this.Tone.Transport.stop();
        this.Tone.Transport.cancel();
      }
    } catch (_err) {
      // Best-effort teardown.
    }
    this.beatCallbacks.clear();
  }
}
