# Summon Team Guide — BloomCode

Vibecoding by Software Company. This guide maps the Summon Team roles to the parts of the project each person owns, so hand-offs and reviews stay quick.

**Product:** Summon BloomCode — ASCII Lily Studio
**Stack:** vanilla JS ES6+, HTML5 `<pre>` rendering, CSS3, Tone.js 14.8.59, static Vercel deploy
**Source of truth for behaviour:** `src/config.js`

---

## Team

| Role | Owner | Owns |
| --- | --- | --- |
| Director | **Qi** | Creative direction, bouquet composition, flower silhouette, final visual sign-off |
| Architect | **Gao** | Module boundaries (`renderer` / `generator` / `audio` / `main`), framebuffer contract, performance budget, Vercel + iframe configuration |
| Engineer | **Kou** | Implementation of the renderer, flower geometry, audio failover chain, UI controls and keyboard shortcuts |
| PM | **Xu** | Scope, deliverable checklist, README and share-link behaviour, scheduling of review checkpoints |
| QA | **Yan** | Local/Vercel smoke tests, iframe embedding, audio-autoplay policy, mobile widths, keyboard and export verification |

---

## Working agreements

1. **Config first.** New colours, flower positions, timings or audio URLs go into `src/config.js`, never as literals in other modules.
2. **No build step.** Anything added must still run with `npx serve .` and deploy with an empty Vercel build command.
3. **Audio is optional by design.** Every audio path must degrade to the generated melody or silent mode without throwing.
4. **60fps budget.** Keep the framebuffer at 80×40. Pulse and brightness go through CSS transforms/filters, not re-renders.
5. **English + Indonesian copy** stays outside the runtime code unless the UI explicitly needs it.

---

## Review checklist (Yan)

Run locally:

```bash
npx serve .
```

- [ ] Initial overlay appears; nothing plays before the click
- [ ] Clicking **Play with Music** removes the overlay and starts the bouquet
- [ ] Local MP3 plays; if removed, the generated melody plays instead
- [ ] Removing Tone.js from the network still leaves the animation running
- [ ] Play/pause, restart, speed, volume, mute, colour, background, export and share all work
- [ ] **Space**, **R** and **M** work when focus is on the page body
- [ ] Layout fits an 800×600 iframe and a 390px-wide phone viewport
- [ ] `?speed=1.5&color=mono&bg=light` applies on load
- [ ] Vercel preview loads over HTTPS and embeds without `X-Frame-Options` blocking

---

## Hand-off notes

- **Qi → Kou:** any change to flower count, colour assignment or bloom stagger — edit `FLOWERS` in `src/config.js`.
- **Gao → Kou:** any change to the framebuffer API — update `ASCIIRenderer.drawChar/drawLine/clearFrame/renderFrame` and the generator together.
- **Xu → Yan:** every release should include the URL used for the Vercel preview and the exact audio source in effect.
- **Yan → Kou:** log the failing browser, viewport and audio mode when reporting an issue.
