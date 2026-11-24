# Summon Team Guide — BloomCode

Vibecoding by Software Company. This guide maps the Summon Team roles to the parts of the project each person owns.

**Product:** Summon BloomCode — ASCII Lily Studio  
**Stack:** vanilla JS ES6+, HTML `<pre>` rendering, CSS3, Tone.js, static Vercel deploy  
**Source of truth for geometry and colour:** `src/config.js`

---

## Team

| Role | Owner | Owns |
| --- | --- | --- |
| Delivery Director | **Qi** | Delivery scope, visual sign-off, bouquet composition, final acceptance |
| Software Architect | **Gao** | Module boundaries, framebuffer contract, 60fps budget, Vercel and iframe configuration |
| Software Engineer | **Kou** | Renderer, pointed-lily vectors, solid stems, thin leaves, audio failover chain, UI controls |
| Product Manager | **Xu** | Requirements, deliverable checklist, README, share-link parameters, review cadence |
| QA Engineer | **Yan** | Local and Vercel smoke tests, bloom-stage checks, iframe embedding, mobile widths, keyboard and export verification |

---

## Working agreements

1. **Config first.** Colours, flower positions, petal angles and timing go in `src/config.js`.
2. **No build step.** Everything must run with `npx serve .` and deploy with an empty Vercel build command.
3. **Pointed petals only.** Petal bodies are `/ \ |` lines; `*` and `.` are reserved for the pistil/pollen. No round flower sprites.
4. **Solid stems.** One continuous glyph per row, `| / \` only, colour `#22C55E`.
5. **Clean base.** No wrap, no dashes, no `@/@` artefact at the convergence point.
6. **Audio is optional by design.** Every audio path degrades to the generated melody or silent mode without throwing.
7. **60fps budget.** Keep the framebuffer at 80×40 and pulse via CSS transforms.

---

## Review checklist (Yan)

Run locally:

```bash
npx serve .
```

- [ ] At 0% only stems are visible
- [ ] At 20% a bud `( )` appears; at 40% two petals; at 60% four; at 100% six plus `(o)`
- [ ] At `bloomProgress = 0.89` every lily shows pointed tips, not a round blob
- [ ] No `o00o`, `o|o`, `-----`, `@/@` or `##` block leaves anywhere in the frame
- [ ] Stems are gap-free and the base is clean
- [ ] Overlay blocks playback until clicked; local MP3 plays afterwards
- [ ] Removing the MP3 triggers the generated melody; blocking Tone.js leaves the animation running
- [ ] Pause, Restart, Sound, Color, Dark, `.txt` Export and Share all work
- [ ] Space, R and M work when focus is on the page body
- [ ] Layout fits an 800×600 iframe and a narrow phone viewport
- [ ] `?speed=1.5&color=mono&bg=light` applies on load
- [ ] Vercel preview loads over HTTPS, embeds cleanly, and streams `/public/audio/angel-radio-edit.mp3`

---

## Hand-off notes

- **Qi → Kou:** flower placement, colour assignment, scale or tilt changes — edit `FLOWERS` in `src/config.js`.
- **Gao → Kou:** framebuffer API changes — update `ASCIIRenderer` and `FlowerGenerator` together.
- **Xu → Yan:** each release should include the Vercel preview URL and the audio source in effect.
- **Yan → Kou:** report the browser, viewport, bloom percentage and audio mode when logging an issue.
