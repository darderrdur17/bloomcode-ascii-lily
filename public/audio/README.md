# Audio assets

`angel-radio-edit.mp3` is an **original ambient loop generated for this project** — 16 seconds, 44.1 kHz, 128 kbps mono, with soft pentatonic plucks and a sustained pad. It is deliberately licence-free so the demo works on Vercel without external audio.

To use a different track, replace the file keeping the same name:

```
public/audio/angel-radio-edit.mp3
```

No code changes are needed. The player requests `/public/audio/angel-radio-edit.mp3` first and falls back to the CDN URL, then to a generated Tone.js melody, then to silent animation.

Note that `vercel.json` sends `Cache-Control: immutable` for this path. If you replace the file on a deployed site, change the filename (and the URL in `src/config.js`) or invalidate the CDN cache to see it update.
