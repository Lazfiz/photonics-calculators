# Handover — 2026-10-26 (session 159 → session 160)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 159 did 3c (chart layout) on branch `phase-3/chart-layout`, PR #196. PR #195 (3b) is merged.
Next: **3d** (chart interaction: hover crosshair and readout, PNG/CSV export), then 3e, then Phase 5.

## State
- `src/components/chart-axes.ts`: pure helpers for both SVG charts (`niceTicks`, `formatTick`, `tickCount`, `labelWidth`,
  `labelStride`, `plotValue`, `splitAtGaps`, `xCategories`, `PALETTE`, `dashArray`), tested in `tests/simple-chart.test.ts`.
- `src/hooks/use-element-width.ts`: ResizeObserver width, null on the server and until measured.
- `src/components/chart-legend.tsx`: wrapping HTML legend below the plot. Plotly `layout.legend` positions are ignored.
- `SimpleChart` (client-only via ChartPanel `ssr: false`) draws nothing until measured; a numeric `layout.width` draws at once
  (tests use it). Height = `layout.height` (400) at ≥ 700 px wide, shrinking to 280. Margins grow to fit tick labels.
- `SimpleLineChart` (prerendered) lays out at 900 until measured inside a fixed `height` px box, so no layout shift.
- Probed at 360 px body width: 11–12 px text, no overlapping labels on quantum-efficiency, dark-current, gires-tournois
  (dual y, null gap), mueller-matrix (category bars), otdr-analysis, fiber-bandwidth.

## Next actions
1. `/ship` PR #196. Site-wide chart change, no value changes. On a release: post-merge-check (load only)
   `wave-optics/gires-tournois`, `detectors/quantum-efficiency`, `polarization/mueller-matrix`; look at one chart on a phone.
2. 3d: hover crosshair/readout and PNG/CSV export on both SVG charts (`chart-axes.ts` has the scales' inputs; the
   readout can reuse `formatTick`). Consider the ChartPanel CLS finding (ROADMAP open findings) before 3e.

## Non-obvious facts
- **Session 159:** the Chrome extension window can't be resized below the desktop width and its screenshots time out
  under load; set `document.body.style.width = '360px'` and measure the SVGs in `javascript_tool` (the charts only react to
  their container). The site refuses iframes (contentDocument null). Headless Chrome's minimum viewport is 512 px: a
  `--window-size=390,…` screenshot is cropped, not narrow. PIL works with plain `python -c` (not `-I`). In a bash
  `--screenshot="…\\$n.png"` the `\\$` escapes the `$`: use `"$(cygpath -w "$TEMP/$n.png")"`.
- **Session 158:** prerendered pages are `.next/server/app/<cat>/<slug>.html`; their `<script src>` tags are the initial JS.
  Production chunks have no module paths: identify them by strings (`react.dev/errors` = react-dom, `prefetch`/`rsc` =
  Next router, `va.vercel` = analytics). `ui-check` against production is the baseline for telling stale checks from
  regressions. `node scripts/initial-js.mjs` prints initial JS per page after a build.
- **Session 157:** `plotly.js/lib/<trace>` builds under Turbopack with no loader. A new Plotly trace type goes in both
  `plotly-traces.ts` and `plotly-bundle.ts`. `ui-check <base> load /a /b` prints `plotly svg` or `svg+gl` per drawn
  chart. Measure a chunk with `gzip -c <file> | wc -c` in `.next/static/chunks` (grep a trace name to find Plotly's).
- **Session 155:** React Compiler is off, so a `preserve-manual-memoization` error is fixed by dropping the `useMemo`. Plotly data:
  cast to `PlotParams["data"]` (`src/types/plotly.d.ts`), never `any[]`. `refractionAngle` at exactly the critical angle can
  round to NaN (n·sin(asin(1/n)) > 1): don't test it there.
- **Sessions 152–153:** write regex-heavy scripts with the Write tool (a quoted bash heredoc drops doubled backslashes). devctl
  runs gated jobs at BelowNormal priority: under another project's Rust build `npm test` took 15 min (starved, not hung).
- **Session 151:** ts-morph `sf.insertText` forgets every node: record positions (numbers) first, insert last-to-first.
  ts-morph scripts must live under `scripts/` (a scratchpad script can't resolve `ts-morph`). A `next start -p 3100` left
  from an earlier session serves the old build (EADDRINUSE for the new one): check the PID's command line with
  `Get-CimInstance Win32_Process -Filter 'ProcessId=<pid>'` and kill it. ui-check reports "not hydrated" for a slug that
  doesn't exist: check `ls src/app/<category>`.
- **Session 150:** Chénais 2006 (Yb thermal review) is open at arXiv:0704.0701; Chanteloup 2014 (HPL) is open at researching.cn.
  Falkenstein 1978 and Penzkofer papers are OCR PDFs at epub.uni-regensburg.de: digitize figures by pixel analysis and check the
  tick calibration against a tabulated value. Optica abstract pages show tables of paywalled papers to WebFetch; OpenAlex
  (`api.openalex.org/works/doi:<doi>`) gives abstracts. Subagent numbers need checking against the rendered source. Node 24 test
  output prints `ℹ pass N`, not TAP `# pass`. A double-quoted `node -e` with backticks is shell-expanded: write a .cjs file.
- **Session 145:** devctl can skip a whole `&&` chain ("not started after 61 s", exit 75) when another project's cargo job holds
  the CPU. Keep edits and test runs in separate calls. Scratchpad probes import the repo with 9 `../`.
- **Session 144:** web.archive.org holds vendor PDFs that block scripts: list captures with
  `web.archive.org/cdx/search/cdx?url=<url>&output=txt`, fetch `/web/<ts>id_/<url>`. SCHOTT 2017 data sheets:
  `refractiveindex.info/download/data/2017/schott_2017-01-20.pdf`. Check a data-sheet c_p against 3·atoms·R/M.
- **Session 138:** ITU-T PDFs download with curl via `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`.
  Optica full text reads in Chrome via `get_page_text`; WebFetch gets "Please wait". Reviewer claims from memory were wrong
  twice: check each before editing.
- **Session 137:** the Chrome extension works once Chrome is signed in to claude.ai. Thorlabs uses slug URLs
  (`https://www.thorlabs.com/<family-slug>?tabName=Specs`), client-rendered. `javascript_tool` results truncate at ≈ 1000
  characters. **Port 3000 can be another project**: run this repo on 3100 and check the page title.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `--dump-dom` reads hydrated values). Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, so round plotted values (6 decimals).
  ChartPanel sends scatter and bar traces to SVG `SimpleChart` (y2, log, category axes, grouped bars, fill tozeroy/toself,
  marker symbols circle/square/diamond/x, `markers+text`). `null` and non-finite values break lines (`connectgaps: true` joins).
  Coordinates are rounded to 0.01 px. `SimpleLineChart` has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, pass
  `xRaw` to the input. `detectors.ts`, `imaging.ts`, `materials.ts` registries are LF. NaN/∞ show as "—" with a reason. eslint:
  6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
