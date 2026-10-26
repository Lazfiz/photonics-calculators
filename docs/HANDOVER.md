# Handover — 2026-10-26 (session 160 → session 161)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 160 did 3d (chart interaction) on branch `phase-3/chart-interaction`, PR #197. PR #196 (3c) is merged.
Next: **3e** (Vercel Speed Insights and a JS budget in CI), then Phase 5.

## State
- `src/components/chart-hover.tsx`: `ChartHover` (transparent SVG over the chart, same viewBox, so pointer moves re-render
  only it; crosshair snaps to the nearest data x; readout = each series' nearest point within 24 px, `hoverRows`; touch scrub
  with `touch-pan-y`; ←/→ (Shift ×10), Home/End, Esc; sr-only live region for keyboard use) and `ChartActions` (PNG/CSV).
- `src/components/chart-export.ts`: `downloadPng` (SVG → canvas 2×, gray-900 background, title and legend drawn on the
  canvas) and `downloadCsv` (UTF-8 BOM). Loaded by `import()` on click, out of the initial JS.
- `chart-axes.ts` gained `formatValue` (5 significant digits, exponent outside [1e-3, 1e5)), `chartCsv` (wide when x is shared,
  a shorter series allowed; else long `series,x,y`), `fileStem`. Tests in `tests/simple-chart.test.ts` (1145 total).
- `SimpleChart` now renders its own title row (title + buttons); a grouped bar's dot sits on its bar (`HoverPoint.cx`).
  Readout skips `fill: "toself"`, `mode: "text"` and `hoverinfo` skip/none traces.
- Probed headless at 1200 and 360 px: gires-tournois (dual y), quantum-efficiency (SimpleLineChart), mueller-matrix (grouped
  category bars). Readout, PNG and CSV correct; no console errors.

## Next actions
1. `/ship` PR #197 (build was started at the end of session 160: check it's green). Site-wide chart UI change, no values change.
   On a release: post-merge-check (load only) `wave-optics/gires-tournois`, `detectors/quantum-efficiency`,
   `polarization/mueller-matrix`; hover one chart on a phone.
2. 3e: Speed Insights + a JS budget in CI (`node scripts/initial-js.mjs` prints initial JS per page after a build). The
   ChartPanel CLS finding (ROADMAP open findings) matters here: `ssr: false`, no placeholder.

## Non-obvious facts
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
