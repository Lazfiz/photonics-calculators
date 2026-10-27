# Handover — 2026-10-27 (session 167 → session 168)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 167 did 5w-5 (imaging textbook pass 2/3) on `phase-5/5w-5-imaging`, PR #204: 18 pages, 1 bug (mtf default NA 0.95
past the paraxial W₀₂₀), ≈ 30 minor fixes. PRs #200–#203 are merged to `main` but not released (`release` = `d82602ed`).
Next: **5w-6 imaging 3/3**.

## State
- `lightFieldMicroscope`: refocused DOF uses W/R_obj (e = W) even when pixels cap N_u; dofRefocused/dofView NaN when N_u < 1.
  `plenopticCamera`: overlapping micro-images count 2p_µ − D clean pixels; focus ≤ f blanks only refocusNear/Far.
- New `widefieldAxialFirstZero` = λ/(n − √(n² − NA²)) in `optical-sectioning-thickness.ts` (the paraxial
  `widefieldDepthOfField` stays for microscope DOF). psf-calculator axial FWHM is the exact 0.886 (as confocal-resolution);
  5 pages still use `axialPsfFwhm` 0.88.
- mtf defaults NA 0.4, Δz 3 µm; magnification eyepiece 15×; optical-sectioning-thickness NA 1.4.
- Gates on `4c909851`: `npm run check` 1160 pass, 6 old eslint warnings; build: see the PR.

## Next actions
1. `/ship` PR #204. On a release (user asks): `node scripts/post-merge-check.mjs <sha> imaging/psf-calculator=523
   imaging/optical-sectioning-thickness=0.59 imaging/light-field=53.64 imaging/digital-holography=0.03326`.
2. 5w-6: imaging textbook slugs 38–55 in registry order, skipping structured-illumination (17): resolution,
   second-harmonic-generation, sensor-cmos, shack-hartmann, signal-to-noise, simultaneous-multicolor, speckle-imaging,
   spectral-unmixing, spinning-disk, stimulated-raman-microscopy, stitching, sum-frequency-microscopy, super-resolution,
   telecentricity, third-harmonic-microscopy, three-photon-microscopy, two-photon-microscopy. Four `physics-reviewer` agents
   (5/4/4/4), then two `implementer`s on disjoint page sets; main session does physics modules + tests + registry meanwhile.
   Also fix the open `sensor-cmos` DR finding and the `airy-disk` polarization wording in that session.
3. Last in Phase 5: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 167:** reviewers' "(from memory)" source attributions need checking: the multiphoton page credited Kobat 2011 with an
  800 nm claim; its abstract (crossref API `/works/<doi>`, field `abstract`) is about 1280 nm only. Implementers: brief
  warning conditions with abs() when a quantity is signed (mtf edgeWaves). `npx eslint <file>` alone can take > 2 min.
- **Sessions 163–167 (5w, 83 pages, 2 bugs):** reviewers' useful catches are defaults that hide the page's effect, stated-but-false
  conditions (a fixed "40 %" true only at low NA), results that ignore an input the chart uses or a selector that changes
  nothing, fixed chart ranges that miss the input, and paraxial/classical formulas past their limit (NA > 1). Brief: verdict +
  BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", unique probe prefixes (probeA-…), don't edit. Implementers:
  allowed files, no registry, targeted tests + eslint + one tsc; ≈ 3 min each. Check their JSX text joins ("lies lies").
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
