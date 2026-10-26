# Handover — 2026-10-26 (session 161 → session 162)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 161 did 3e (Speed Insights, JS budget, chart placeholder) on branch `phase-3/speed-insights`, PR #198. Phase 3 is
done; PR #197 (3d) is merged. Next: **Phase 5** spot-check review (≈ 20 pages, `physics-reviewer`), then the Gemini hero.

## State
- `src/app/layout.tsx`: `<SpeedInsights />` (`@vercel/speed-insights/next` 2.0.0) after `<Analytics />`; a 3.5 KB gz chunk on
  every page. **The user must enable Speed Insights** in the Vercel dashboard (project → Speed Insights → Enable); the
  MCP `get_project` doesn't show whether it's on. It reports only from `release` deployments.
- `scripts/initial-js.mjs --max-shared <KB> --max-page <KB>` exits 1 over budget; CI runs it after the build with 150 / 32
  (now 145.4 KB shared, page-specific median 11.9 KB, max 27.9 KB thin-film/enhanced-aluminum). `_global-error.html` is
  skipped (no root layout).
- `src/components/chart-placeholder.tsx`: `ChartReserve` (title row + a box at `aspect-ratio 700/height`, min 280 px, max
  `layout.height`) and `ChartPlaceholder` (the same in SimpleChart's bordered box). `ChartPanel` loads SimpleChart with its
  own `import()` in an effect (`LazySimpleChart`, inside `ChartErrorBoundary`) instead of `next/dynamic`, whose `loading`
  gets no props; `SimpleChart` shows `ChartReserve` until measured. CLS at 1200 px, 3000 px tall viewport: gires-tournois
  0.095 → 0.002, mueller-matrix 0.018 → 0.001, heat-mirror 0.006 (legend). No console errors.

## Next actions
1. `/ship` PR #198. Site-wide chart change, no values change. On a release: post-merge-check (load only)
   `wave-optics/gires-tournois`, `polarization/mueller-matrix`, `thin-film/heat-mirror`; ask the user to enable Speed
   Insights, and to read its numbers after a few weeks (traffic is low: ~6 visitors a month).
2. Phase 5: spot-check review (ROADMAP). Then the Gemini hero (ask the user for the files).

## Non-obvious facts
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
