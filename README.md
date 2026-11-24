# Summon BloomCode — ASCII Lily Studio

An interactive ASCII lily bouquet that blooms in sync with music. The bouquet renderer is ported directly from [`arimecoa/GIVEAWAY-ASCII`](https://github.com/arimecoa/GIVEAWAY-ASCII): eleven volumetric six-petal lilies, five buds, 3D-shaded ASCII density glyphs, curved leaves, drifting golden specks and a soft bloom glow. Our app wraps that renderer with audio, controls and Vercel deployment.

Built with **vanilla JavaScript ES6+**, HTML5 `<canvas>` rendering and CSS3. No framework, no build step, no dependencies to install.

> **Who needs flowers when you can code them? - ASCII Lily Bouquet**
>
> Vibecoding by Software Company - Summon Team

Designed for Qi (Delivery Director), Gao (Software Architect), Kou (Software Engineer), Xu (Product Manager) and Yan (QA Engineer).

> **Tone.js note:** the requested `14.8.59` patch was never published to npm. The import map declares that exact URL for compatibility, while a working UMD build of `14.8.49` (the last published 14.8.x) is loaded as the primary source. Tone's ESM files use extensionless imports that require a bundler.

---

## Features

- Eleven large **shaded lilies** plus five buds, each with six volumetric petals in pink, red, orange, yellow, coral or white
- 3D-shaded ASCII density glyphs give the petals light, creases, curled tips and spot markings
- Layered green foliage: curved stems and twisting, drooping leaves with front/back shading
- Drifting golden specks in the negative space and a multi-pass additive glow
- Staggered bloom with wind sway and a slow breathing motion after opening
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

The bouquet's own constants are at the top of `src/bouquet-canvas.js` — `FLOWERS_BASE`, `BUDS_BASE`, `PALETTES`, `BUCKETS`, `LEVELS`, `settings` (`wind`, `size`, `glow`) and `LIGHT`. Editing those changes the reference rendering directly.

Monochrome mode is a CSS filter applied by `src/main.js`, using `CONFIG.MONOCHROME_COLOR` (`#00ff41`) in `src/config.js`.

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
    ├── bouquet-canvas.js
    ├── ascii-renderer.js
    ├── flower-generator.js
    ├── audio-sync.js
    └── config.js
```

- `bouquet-canvas.js` — the reference renderer: luminance field, 3D petal/leaf brushes, glyph masks, glow compositing and text export
- `ascii-renderer.js` / `flower-generator.js` — the earlier `<pre>` framebuffer implementation, kept in the project structure
- `audio-sync.js` — Tone.js load/unlock, source failover, analyser and transport
- `main.js` — state, UI, URL params, keyboard, export/share, resize and the `requestAnimationFrame` loop

---

## Accessibility & performance

- `role="img"` and `aria-label="Animated ASCII lily bouquet"` on the artwork
- Visible focus rings on all controls
- The renderer uses typed arrays and pre-rendered glyph masks; cells are reused rather than reallocated
- Render runs at 30fps to match the reference, while UI pulse uses CSS `transform`/`filter`
- `prefers-reduced-motion` disables the transform pulse

---

## Team guide

See [`TEAM_GUIDE.md`](./TEAM_GUIDE.md) for the Summon Team role breakdown.
