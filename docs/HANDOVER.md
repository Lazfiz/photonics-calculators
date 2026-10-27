# Handover — 2026-10-27 (session 163 → session 164)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 163 did 5w-1 (detectors textbook pass 1/3) on `phase-5/5w-1-detectors`, PR #200: 16 pages, 0 bugs, minor fixes.
PR #199 is released (`release` = `d82602ed`); its post-merge-check passed. Next: **5w-2 detectors 2/3**.

## State
- `boxcar.ts`: `optimalGateWidth(fwhm, B)` → optimum centred gate (s) at input bandwidth B (golden section on ln T/FWHM ∈
  [1e-3, 10]); 1.18904·FWHM for B·FWHM ≫ 1, 0.62848 at B = 1 MHz / 500 ns. The page warns when B·FWHM < 2.
- `noise.ts`: `quantizationNoiseElectrons(g)` = g/√12 e⁻; `amplifier-noise` read floor √(e_n² + g²/12) (defaults barely move).
- `cooling-benefit` and `dark-noise-temperature` now default to E_g(T) (Varshni / Vurgaftman): Si −40 °C reduction ×630 → ×950.
- `detectivity` temperature chart holds the load at the entered T; `em-gain` benefit labelled "vs G = 1".
- Gates on `3deff943`: `npm run check` 1152 pass; build: see the PR.

## Next actions
1. `/ship` PR #200. On a release: `node scripts/post-merge-check.mjs <sha> detectors/boxcar-integrator
   detectors/cooling-benefit` (no new default value worth pinning; check that both load cleanly).
2. 5w-2: detectors textbook slugs 17–32 in registry order, skipping photodiode-tia-noise: flicker-noise, gain-bandwidth,
   gain-temperature, geiger-mode-avalanche, ingaas-parameters, intensified-ccd, linear-mode-avalanche, lockin-amplifier,
   microchannel-plate, modulation-transfer, nep, photodiode-speed, photon-transfer, pixel-crosstalk, pmt, quantum-efficiency.
   4 parallel `physics-reviewer` agents × 4 pages; ask for verdict + BUG/MINOR/UNVERIFIED with hand calculations and
   "(from memory)" marks. 5w-3 then has the last 15 (reset-noise … well-capacity, skipping readout-noise).
3. After 5w: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 163:** 16 textbook pages gave 0 bugs and ≈ 40 minor items; the reviewers' useful catches were stated-but-false
  conditions (optimum ignoring B, DR "at any gain", fixed-gap activation energy: n_i's slope needs E_g − T·dE_g/dT ≈ 1.20 eV
  for Si, not 1.12). Tell parallel reviewers to name scratchpad probes uniquely (they overwrote `probe.ts`). When an
  implementer edits `detectors.ts` in parallel, do the main session's registry edits after it finishes.
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
- **Sessions 145–150:** Optica abstract pages show tables of paywalled papers to WebFetch; OpenAlex (`api.openalex.org/works/doi:<doi>`)
  gives abstracts. A double-quoted `node -e` with backticks is shell-expanded. devctl can skip a whole `&&` chain (exit 75).
- **Session 144:** web.archive.org holds vendor PDFs: list captures with `web.archive.org/cdx/search/cdx?url=<url>&output=txt`,
  fetch `/web/<ts>id_/<url>`. SCHOTT 2017 data sheets: `refractiveindex.info/download/data/2017/schott_2017-01-20.pdf`.
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
