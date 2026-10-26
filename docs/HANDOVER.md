# Handover — 2026-10-26 (session 162 → session 163)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 162 released PR #198 (3e) and did the Phase 5 spot-check on `phase-5/spot-check`, PR #199: 20 pages, 2 bugs fixed.
The user chose a **full textbook-tier pass** (5w-1 … 5w-15, ≈ 20 pages per session). Next: **5w-1 detectors 1/3**.

## State
- `src/physics/detectors/tia.ts`: `tiaFilteredNoise(p, f0, band)` → `{ terms (A²/Hz averaged), enbw (Hz) }`, noise through
  |H|² = 1/(1+(f/f₀)⁴) up to a brick-wall B (closed-form moments; series below u = 0.01). `tiaBandNoise` removed.
  `photodiode-tia-noise` default i_rms 2.605 nA (was 1.468), NEP 6.78 nW (was 3.82).
- `src/physics/imaging/super-resolution.ts`: `simSupportHasGap(λex, λem, NA, p)` = k₀ > 2k_c; SIM default shows the
  softer "pattern beyond the detection cut-off" note instead.
- Minor: Stokes axes S₁/S₀…, single-AR TIR subtext, coupling NA > 0.3 warning, diamond `absorbsBelow` 226.7 nm, Planck test.
- Release `20858995` (PR #198) is live; post-merge-check passed. Speed Insights still needs enabling by the user.
- Gates on `6cda9f56`: `npm run check` 1148 pass; `npm run build` green.

## Next actions
1. `/ship` PR #199. On a release: `node scripts/post-merge-check.mjs <sha> detectors/photodiode-tia-noise=2.605e-9
   imaging/structured-illumination` (the card prints `toExponential(3)`).
2. 5w-1: detectors textbook slugs part 1/3 (registry order, skip photodiode-tia-noise and readout-noise). 4 parallel
   `physics-reviewer` agents × ≈ 5 pages, ask for verdict + BUG/MINOR/UNVERIFIED with hand calculations.
3. After 5w: the Gemini hero (ask the user for the files).

## Non-obvious facts
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
- **Session 150:** Chénais 2006 is open at arXiv:0704.0701; Chanteloup 2014 at researching.cn. Falkenstein 1978 and Penzkofer
  papers are OCR PDFs at epub.uni-regensburg.de. Optica abstract pages show tables of paywalled papers to WebFetch; OpenAlex
  (`api.openalex.org/works/doi:<doi>`) gives abstracts. Node 24 test output prints `ℹ pass N`. A double-quoted `node -e`
  with backticks is shell-expanded: write a .cjs file.
- **Session 145:** devctl can skip a whole `&&` chain ("not started after 61 s", exit 75) under another project's cargo job.
  Scratchpad probes import the repo with 9 `../`.
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
