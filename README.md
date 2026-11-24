# Summon BloomCode — ASCII Lily Studio

An interactive, music-synced ASCII lily bouquet. Five lilies bloom one after another from a terminal-style frame, characters pulse with the analyser's RMS level, and every glyph is drawn into an 80×40 framebuffer at 60fps.

Built with **vanilla JavaScript ES6+**, HTML5 `<pre>` text rendering, CSS3, and **Tone.js 14.8.x**. No build step, no framework, no dependencies to install.

> **Version note:** the requested `14.8.59` was never published to npm — the last published 14.8.x is `14.8.49`, which is what the CDN URLs use. The UMD build is loaded as the primary source because Tone's ESM files use extensionless imports that require a bundler; the import map remains as a fallback.

> *Who needs flowers when you can code them?*

Vibecoding by Software Company — Summon Team | Qi (Director) | Gao (Architect) | Kou (Engineer) | Xu (PM) | Yan (QA)

---

## Features

- Five procedural six-petal lilies in red, purple, yellow and white, with stems, leaves and a ribbon-tied bouquet wrap
- Sequential bloom: stem → leaves → bud → petals, eased with `easeOutCubic`
- Audio unlock flow that respects browser autoplay policy, plus RMS-driven brightness/scale pulsing
- Resilient audio chain: local MP3 → CDN MP3 → generated `Tone.PolySynth` ambient melody → silent animation
- Tone.js Transport at 120 BPM driving beat-synced visual events
- Controls: play/pause, restart, speed (0.5×–2×), volume, mute, colour/monochrome, dark/light terminal, `.txt` export, share link
- URL parameters: `?speed=1&color=color&bg=dark`
- Keyboard shortcuts: **Space** play/pause, **R** restart, **M** mute
- `ResizeObserver` keeps the 80×40 grid legible in any iframe, down to 800×600 and below
- Preferences persisted in `localStorage` with safe fallbacks in sandboxed iframes

---

## Run locally

Requires Node 18+.

```bash
cd BloomCode
npx serve .
```

Then open the URL printed by `serve` (usually `http://localhost:3000`).

> ES modules and the import map need HTTP — opening `index.html` via `file://` will not work. There is no install or build step.

---

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project → Import** that repository.
3. Set **Framework Preset: Other**, leave **Build Command** empty, set **Output Directory** to `.`, then click **Deploy**.

`vercel.json` supplies clean URLs, the SPA rewrite, immutable caching for audio, and permissive frame headers. The audio file is served from `/public/audio/angel-radio-edit.mp3`.

---

## Embed in WorkBuddy AI iframe

```html
<iframe src="https://your-vercel-url.vercel.app" width="800" height="600" title="BloomCode ASCII Lily Studio"></iframe>
```

The app detects its container with `ResizeObserver` and scales the font so the whole 80×40 grid stays visible. Preserve settings in the embed URL, for example:

```html
<iframe src="https://your-vercel-url.vercel.app/?speed=1&color=mono&bg=dark"
        width="800" height="600" title="BloomCode ASCII Lily Studio"></iframe>
```

`X-Frame-Options: ALLOWALL` is set for embedding. Note that modern browsers ignore non-standard `X-Frame-Options` values, so the page is effectively embeddable because no restrictive value is sent.

---

## Replace the audio file

Drop any royalty-free MP3 at:

```
public/audio/angel-radio-edit.mp3
```

The bundled file is an **original, generated ambient loop** (16 s, 128 kbps, mono) so the local path works immediately with no external dependency. Replace it with your own track without changing any code — the player picks it up automatically.

The load order is defined in `src/config.js`:

1. `/public/audio/angel-radio-edit.mp3`
2. `CONFIG.AUDIO.CDN_URL` — a placeholder Pixabay URL; replace it with any CORS-enabled MP3
3. Generated `Tone.PolySynth` + reverb ambient melody
4. Silent mode with a synthetic pulse (if Tone.js itself is blocked)

---

## Customise colours

Colours live in `src/config.js`:

```js
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
```

Monochrome green is `CONFIG.MONOCHROME_COLOR` (`#00ff41`). Flower positions, colours and bloom delays are in the `FLOWERS` array in the same file. Petal glyphs and angles are in `GLYPHS` and `PETALS`.

---

## Project structure

```
BloomCode/
├── vercel.json
├── package.json
├── index.html
├── style.css
├── README.md
├── TEAM_GUIDE.md
├── public/
│   └── audio/
│       ├── angel-radio-edit.mp3
│       └── README.md
└── src/
    ├── main.js
    ├── ascii-renderer.js
    ├── flower-generator.js
    ├── audio-sync.js
    └── config.js
```

- `ascii-renderer.js` — 2D `{char, color}` framebuffer; batches same-colour runs into `<span>`s for one DOM write per frame
- `flower-generator.js` — stems, leaves, buds, six-petal lilies, bouquet wrap and idle sway
- `audio-sync.js` — Tone.js dynamic load, unlock, source failover, analyser and transport
- `main.js` — state, UI, URL params, keyboard, export/share, resize and the `requestAnimationFrame` loop

---

## Accessibility & performance

- `role="img"` and `aria-label="Animated ASCII lily bouquet"` on the artwork
- Visible focus rings on every interactive control
- Keyboard shortcuts for the main actions
- 3,200 cells maximum; framebuffer cells are reused rather than reallocated
- Pulsing uses CSS `transform` and `filter`, so audio reactivity does not re-render the grid
- `prefers-reduced-motion` disables the transform pulse

---

## Team guide

See [`TEAM_GUIDE.md`](./TEAM_GUIDE.md) for the Summon Team role breakdown.
