# Summon BloomCode — ASCII Lily Studio

An interactive ASCII lily bouquet that blooms in sync with music. The flower style is adapted from the reference bouquet in [`arimecoa/GIVEAWAY-ASCII`](https://github.com/arimecoa/GIVEAWAY-ASCII): volumetric six-petal lilies shaded with an ASCII density ramp, layered green foliage and drifting golden specks, rebuilt for an 80×40 `<pre>` grid. An audio analyser drives a gentle brightness and scale pulse.

Built with **vanilla JavaScript ES6+**, HTML `<pre>` rendering and CSS3. No framework, no build step, no dependencies to install.

> **Who needs flowers when you can code them? - ASCII Lily Bouquet**
>
> Vibecoding by Software Company - Summon Team

Designed for Qi (Delivery Director), Gao (Software Architect), Kou (Software Engineer), Xu (Product Manager) and Yan (QA Engineer).

> **Tone.js note:** the requested `14.8.59` patch was never published to npm. The import map declares that exact URL for compatibility, while a working UMD build of `14.8.49` (the last published 14.8.x) is loaded as the primary source. Tone's ESM files use extensionless imports that require a bundler.

---

## Features

- Eight large **shaded lilies** plus five buds, each with six volumetric petals in pink, red, orange, yellow, coral or white
- Density-ramp shading (`. : - = + * o O @`) gives the petals light, creases and curled tips like the reference
- Layered green foliage: solid converging stems and narrow leaves with dark/mid/light shading
- Drifting golden specks in the negative space and a CSS text glow
- Staggered bloom: stems grow first, then each flower opens from a tight bud to a full six-petal lily
- Audio unlock overlay, 120 BPM Tone.js Transport, RMS analyser pulse
- Resilient audio chain: local MP3 → CDN MP3 → generated `Tone.PolySynth` ambient melody → silent animation
- Controls: Pause/Play, Restart, Sound, Color, Dark, `.txt` Export, Share, Speed (0.5×–2×), Volume (0–100%)
- URL parameters: `?speed=1&color=color&bg=dark`
- Keyboard: **Space** play/pause, **R** restart, **M** mute
- `ResizeObserver` scaling for 800×600 iframes and small screens
- Preferences persisted in `localStorage` with safe fallbacks in sandboxed iframes

---

## Run locally

Requires Node 18+.

```bash
cd BloomCode
npx serve .
```

Open the URL printed by `serve` (usually `http://localhost:3000`).

> ES modules and the import map need HTTP — opening `index.html` via `file://` will not work.

---

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project → Import** that repository.
3. Set **Framework Preset: Other**, leave **Build Command** empty, set **Output Directory** to `.`, then click **Deploy**.

`vercel.json` supplies clean URLs, the SPA rewrite, immutable caching for `/public/audio/`, and `X-Frame-Options: ALLOWALL`. The audio file is served from `/public/audio/angel-radio-edit.mp3`.

Be aware that Vercel auto-selects `public/` as the output directory when that folder exists. Set Output Directory to `.` explicitly, or the root files will 404.

---

## Embed in WorkBuddy AI iframe

```html
<iframe src="https://your-vercel-url.vercel.app" width="800" height="600" title="BloomCode ASCII Lily Studio"></iframe>
```

Preserve settings in the URL:

```html
<iframe src="https://your-vercel-url.vercel.app/?speed=1&color=color"
        width="800" height="600" title="BloomCode ASCII Lily Studio"></iframe>
```

The Share button copies a permalink containing the current `speed` and `color` settings.

---

## Replace the audio file

Drop any royalty-free MP3 at:

```
public/audio/angel-radio-edit.mp3
```

The bundled file is an **original generated ambient loop** (16 s, 128 kbps, mono), so the local path works immediately with no external dependency. Replacing it needs no code change.

Load order, defined in `src/config.js`:

1. `/public/audio/angel-radio-edit.mp3`
2. `CONFIG.AUDIO.CDN_URL` — placeholder Pixabay URL; replace with any CORS-enabled MP3
3. Generated `Tone.PolySynth` + reverb ambient melody
4. Silent animation with a synthetic pulse if Tone.js itself is blocked

---

## Customise colours and geometry

All geometry constants live in `src/config.js`.

```js
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
```

- `SHADED_FLOWERS` — positions, sizes, palette, bloom delays and tilt for the eight open lilies
- `SHADED_BUDS` — the five unopened buds
- `SHADED_PALETTES` — deep/mid/tip colours and anther colour per variety
- `DENSITY_RAMP` — the `. : - = + * o O @` characters used for petal shading
- `FOLIAGE` — dark/mid/light/under green shades for stems and leaves
- `CONFIG.MONOCHROME_COLOR` — `#00ff41` for the green terminal mode

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

- `ascii-renderer.js` — 2D `{char, color}` framebuffer, batched into spans for one DOM write per frame
- `flower-generator.js` — `generateStem` (solid), `generatePointedLily` (six petal vectors), `generateLeaf` (thin curve)
- `audio-sync.js` — Tone.js load/unlock, source failover, analyser and transport
- `main.js` — state, UI, URL params, keyboard, export/share, resize and the `requestAnimationFrame` loop

---

## Accessibility & performance

- `role="img"` and `aria-label="Animated ASCII lily bouquet"` on the artwork
- Visible focus rings on all controls
- 3,200 cells maximum; framebuffer cells are reused instead of reallocated
- Pulse is a CSS `transform`/`filter`, so audio reactivity costs no re-render
- `prefers-reduced-motion` disables the transform pulse

---

## Team guide

See [`TEAM_GUIDE.md`](./TEAM_GUIDE.md) for the Summon Team role breakdown.
