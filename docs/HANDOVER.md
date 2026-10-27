# Handover — 2026-10-27 (session 166 → session 167)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 166 did 5w-4 (imaging textbook pass 1/3) on `phase-5/5w-4-imaging`, PR #203: 18 pages, 1 bug (digital-holography
NA), ≈ 25 minor fixes. PRs #200–#202 are merged to `main` but not released (`release` = `d82602ed`). Next: **5w-5 imaging 2/3**.

## State
- `hologramNA` is now sin(atan(NΔx/2z)); new `hologramEffectiveNA` = min(NA, λ/(2Δx)) in `src/physics/imaging/holography.ts`.
  digital-holography shows reconstruction grid λz/(NΔx) and resolution λ/(2NA_eff) separately (z 50 mm → 6.5 µm = Δx).
- `dynamicRangeDb(maxSignal, noiseFloor, darkCharge = 0)` in `src/physics/detectors/camera-snr.ts`: (S_max − D), NaN when
  D ≥ S_max. Only dynamic-range passes D; other callers unchanged (sensor-cmos is an open finding).
- confocal-resolution widefield axial uses the exact 0.886 (`SINC2_HALF_MAX_X`), not `axialPsfFwhm`'s 0.88 (8 pages keep it).
- Gates on `f62f29c4`: `npm run check` 1159 pass, 6 old eslint warnings; build: see the PR.

## Next actions
1. `/ship` PR #203. On a release (user asks): `node scripts/post-merge-check.mjs <sha> imaging/digital-holography=0.03326
   imaging/dynamic-range=83.22 imaging/confocal-pin-hole imaging/coherent-raman`.
2. 5w-5: imaging textbook slugs 19–36 in registry order (skip airy-disk, structured-illumination): hyperspectral-microscopy,
   illumination, image-distance, light-field, light-sheet, low-coherence, magnification, mtf, multiphoton-depth,
   optical-coherence, optical-power, optical-sectioning-thickness, palm-storm, photoacoustic, plenoptic-camera, psf-calculator,
   pupil-matching, registration. 5w-6 = 37–53 (resolution … end). Four `physics-reviewer` agents (5/5/4/4), then two
   `implementer`s on disjoint file sets in parallel (main session edits the registry meanwhile); `npm run check` before commit.
3. Last in Phase 5: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Sessions 163–166 (5w, 65 pages, 1 bug):** reviewers' useful catches are defaults that hide the page's effect, stated-but-false
  conditions (a fixed "40 %" true only at low NA), results that ignore an input the chart uses or a selector that changes
  nothing, fixed chart ranges that miss the input, and paraxial/classical formulas past their limit (NA > 1). Brief: verdict +
  BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", unique probe prefixes (probeA-…), don't edit. Implementers:
  allowed files, no registry, targeted tests + eslint + one tsc; ≈ 3 min each. Check their JSX text joins ("lies lies").
- **Session 165:** pubs.aip.org shows a Cloudflare check (don't bypass); the MSU Burle handbook PDF is 404/bot-walled.
- **Session 162:** reviewer claims from memory were wrong again (2 of 2 laser-safety claims; ICNIRP 2013 Table 5 has no C_A
  below 10 ps on purpose). ICNIRP 2013 PDF: `curl -sL https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`
  then `pdftotext -raw` and grep the row (`313 e l G 315`). A seeded `shuf --random-source=<(yes N)` clusters badly: draw
  with `shuf | awk -F/ '!seen[$1]++'` for one page per category. Reviewers' real bugs were in textbook-tier models
  (vendor app-note simplifications, warning-note conditions): read those first.
- **Session 161:** CLS probe = scratchpad CDP script: `Page.addScriptToEvaluateOnNewDocument` with a `layout-shift`
  PerformanceObserver (skip `hadRecentInput`), read `window.__cls` 5 s after navigate. Shifts below the fold don't count, so
  use a 3000 px tall viewport to see chart shifts. Production is the baseline. Git Bash rewrites `/cat/slug` args even for
  node scripts: `export MSYS_NO_PATHCONV=1`.
- **Session 160:** the Chrome extension's screenshots time out on this site; use a headless CDP script instead (pattern in
  `scripts/ui-check.mjs`): `Emulation.setDeviceMetricsOverride` gives a true 360 px viewport, `Input.dispatchMouseEvent`
  triggers React hover, and `Page.captureScreenshot` clips are in page coordinates (add `scrollY`). Capture a download by
  stubbing `URL.createObjectURL` + `HTMLAnchorElement.prototype.click` and returning the blob as base64. A page `fetch` to a
  local receiver on another port fails. In the Bash tool a bare `python -` or `cat > file` with no input hangs until timeout.
- **Session 159:** set `document.body.style.width = '360px'` and measure the SVGs in `javascript_tool` when screenshots fail.
  The site refuses iframes. Headless Chrome's minimum *window* is 512 px (`--window-size` crops); device metrics don't.
  PIL works with plain `python -c` (not `-I`).
- **Session 158:** prerendered pages are `.next/server/app/<cat>/<slug>.html`; their `<script src>` tags are the initial JS.
  Production chunks have no module paths: identify them by strings (`react.dev/errors` = react-dom, `prefetch`/`rsc` =
  Next router, `va.vercel` = analytics). `ui-check` against production is the baseline for telling stale checks from
  regressions.
- **Session 157:** `plotly.js/lib/<trace>` builds under Turbopack with no loader. A new Plotly trace type goes in both
  `plotly-traces.ts` and `plotly-bundle.ts`. `ui-check <base> load /a /b` prints `plotly svg` or `svg+gl` per drawn
  chart. Measure a chunk with `gzip -c <file> | wc -c` in `.next/static/chunks`.
- **Session 155:** React Compiler is off, so a `preserve-manual-memoization` error is fixed by dropping the `useMemo`. Plotly data:
  cast to `PlotParams["data"]` (`src/types/plotly.d.ts`), never `any[]`. `refractionAngle` at exactly the critical angle can
  round to NaN: don't test it there.
- **Sessions 152–153:** write regex-heavy scripts with the Write tool (a quoted bash heredoc drops doubled backslashes). devctl
  runs gated jobs at BelowNormal priority: under another project's Rust build `npm test` took 15 min (starved, not hung).
- **Session 151:** ts-morph `sf.insertText` forgets every node: record positions first, insert last-to-first. ts-morph scripts
  must live under `scripts/`. A `next dev`/`next start` left on 3100 survives TaskStop: confirm with `curl` (page title) and
  `tasklist //FI "PID eq <pid>"`, then `taskkill //PID <pid> //T //F`. ui-check reports "not hydrated" for a missing slug.
- **Session 138:** ITU-T PDFs download with curl via `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`.
  Optica full text reads in Chrome via `get_page_text`. Reviewer claims from memory were wrong twice: check each.
- **Session 137:** Thorlabs uses slug URLs (`https://www.thorlabs.com/<family-slug>?tabName=Specs`), client-rendered.
  `javascript_tool` results truncate at ≈ 1000 characters. **Port 3000 can be another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome (`--dump-dom` reads hydrated values). Registry/JSX
  text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, so round plotted values (6 decimals).
  ChartPanel sends scatter and bar traces to SVG `SimpleChart` (y2, log, category axes, grouped bars, fill tozeroy/toself,
  marker symbols, `markers+text`). `null` and non-finite values break lines (`connectgaps: true` joins). Coordinates are
  rounded to 0.01 px. `SimpleLineChart` has no y2. `SimpleChart` draws nothing until measured; `layout.width` draws at once.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, pass
  `xRaw` to the input. `detectors.ts`, `imaging.ts`, `materials.ts` registries are LF. NaN/∞ show as "—" with a reason. eslint:
  6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked
  files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
