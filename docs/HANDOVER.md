# Handover — 2026-10-25 (session 156 → session 157)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 156 on `phase-2/inline-b1` (PR #187): inventoried formulas inside page components, split 2-inline-b into b1–b6,
and did b1 (fibre index contrast). Next: **b2** (normal-incidence reflectance, AR indices; 8 pages). User plan: b2–b6, then
Phase 3, then Phase 5 (spot-check review of ≈ 20 pages, then the user's Gemini home hero, last).

## State
- `scripts/inline-inventory.ts` (ts-morph) prints each math line inside a component body. Filter deg↔rad and log10 lines, then
  judge: chart axes, √N or quadrature sums of module outputs, π multiples for display and demo signals stay inline.
- `fiber-optics/step-index-modes`: `numericalAperture(n1, n2)` (NaN unless n₁ ≥ n₂ > 0), `coreIndexFromNA`,
  `relativeIndexDifference(fiber)`. 10 fibre pages use them; birefringence-fiber keeps its own n₁ > n₂ guard (NaN at equal).
  fiber-characterization Δ now shows "—" for n₂ > n₁ (was negative). Tests 1118 pass.

## Next actions
1. `/ship` this branch (no page value changes; post-merge-check only on a release the user asks for:
   `fiber-optics/v-number` V ≈ 2.077, `fiber-optics/fiber-characterization` NA 0.1246 at the defaults).
2. b2 → b6 per ROADMAP, one PR each. Reuse existing module functions first (`git grep -n "export function <name>" -- src/physics`):
   `normalReflectance` exists twice (detectors/photodiode-qe with k, materials/polymer-optics with n₀); pick one, don't add a third.

## Non-obvious facts
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
  Falkenstein 1978 and Penzkofer papers are OCR PDFs at epub.uni-regensburg.de: digitize figures by pixel analysis and check the tick
  calibration against a tabulated value. Pavlopoulos 1988 is the DTIC ADA208291 reprint on archive.org. Tamošauskas BBO coefficients
  are in arXiv:2111.01212's supplement code. Optica abstract pages show tables of paywalled papers to WebFetch; OpenAlex
  (`api.openalex.org/works/doi:<doi>`) gives abstracts. Subagent numbers need checking against the rendered source. Node 24 test
  output prints `ℹ pass N`, not TAP `# pass`. A double-quoted `node -e` with backticks is shell-expanded: write a .cjs file.
  Headless `--dump-dom` wrote empty files under devctl CPU load.
- **Session 148:** patents.google.com has old patents' full text; Isomet app notes at `isomet.com/App-Manual_pdf/`. Melkumov 2004 is
  arXiv:1502.02885 (pdftotext rows shifted by one: render). 2005 Opt. Express DOIs use `OPEX` (check with `crossref.mjs -q`).
- **Session 147:** CREOL papers download as `api.creol.ucf.edu/Publications/<n>.pdf` (DeSalvo 1996 = 1814, Sheik-Bahae PRL 1990 = 1805;
  find numbers by web search); van Driel's papers at `physics.utoronto.ca/~vandriel/papers/`. No pdftoppm here, so the Read tool can't
  render PDFs: render a page with `uv run -q --with pymupdf python <script>` (fitz `page.get_pixmap(dpi, clip).save(png)`) and Read the PNG.
  Scanned IEEE tables OCR to garbage with pdftotext. The DTIC copy returned HTML.
- **Session 145:** devctl queues commands when another project's cargo job holds the CPU and can skip a whole `&&` chain
  ("not started after 61 s", exit 75): heredoc writes and edits in that chain never ran. Keep edits and test runs in
  separate calls; run tests with `run_in_background`. Scratchpad probes import the repo with 9 `../` (`../../../../../../../../../dev/…`).
- **Session 144:** web.archive.org holds vendor PDFs that block scripts: list captures with `web.archive.org/cdx/search/cdx?url=<url>&output=txt`,
  fetch `/web/<ts>id_/<url>` (a capture can be truncated at 1 MiB: take an older one). Amorphous Materials sheets (AMTIR-1 2024,
  AMTIR-6 = As₂S₃, comparison ver 5: `pdftotext -table` unscrambles it), Norland NOA sheets, Corning ULE and Kaye & Laby
  (`kayelaby.npl.co.uk/general_physics/…`) came that way. SCHOTT 2017 data sheets: `refractiveindex.info/download/data/2017/schott_2017-01-20.pdf`
  (Explanations: TIE-19 validity); refractiveindex.info `data/specs/schott/optical/<glass>.yml` has α and density. NIST-JANAF tables
  curl (`janaf.nist.gov/tables/Mg-008.txt` = MgO cr); NIST cryogenic pages (`trc.nist.gov/cryogenics/materials/…`) fit (L − L₂₉₃)/L₂₉₃.
  Check a data-sheet c_p against 3·atoms·R/M: Crystran's GaAs 360 J/(kg·K) exceeds Dulong–Petit.
- **Session 138:** ITU-T PDFs download with curl: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-G.657-202408-I!!PDF-E&type=items`
  (the edition list at `/rec/T-REC-G.657/en`; check which is in force, 2016 is superseded). Optica full text (Opt. Express) reads in
  Chrome via `get_page_text` on `opg.optica.org/oe/fulltext.cfm?uri=oe-<vol>-<issue>-<page>`; WebFetch gets "Please wait".
  `javascript_tool` results holding URLs with query strings come back BLOCKED: use `find` or a known URL pattern. Reviewer
  claims from memory were wrong twice (A3 is not in G.657 (2024); G(V) attribution held), so check each before editing.
- **Session 137:** the Chrome extension works once Chrome is signed in to claude.ai (the Google popup failed "Couldn't verify your
  browser"; email sign-in worked). Thorlabs moved to slug URLs (`https://www.thorlabs.com/<family-slug>?tabName=Specs` or
  `Damage%20Thresholds`); old `objectgroup_id` links redirect to wrong products; index pages (`/polarizers`, `/crystal-polarizers`,
  `/polarizing-beamsplitters`) list the slugs. Pages are client-rendered (fetch returns a 1.3 KB shell). `javascript_tool` results
  truncate at ≈ 1000 characters: filter lines, or use `get_page_text`. Chrome tabs freeze when devctl runs another project's
  `cargo nextest` (CPU 100 %): fall back to headless `ui-check` / `--dump-dom`. **Port 3000 can be another project** (Planet
  Incubator): run this repo on 3100 and check the page title.
- **Sessions 113–115:** unsourceable constants become inputs or go (cite defaults, log the gap). `besselJ0Fast` in quadratures.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `--dump-dom` reads hydrated values). Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Charts:** axis minimum at the data minimum, so round plotted values (6 decimals). ChartPanel sends scatter and bar traces to SVG
  `SimpleChart` (no legend layout, per-point colours, shapes; supports y2 and log axes; joins lines across NaN). Markers need
  `line.color` too. `SimpleLineChart` has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, pass
  `xRaw` to the input. `detectors.ts`, `imaging.ts`, `materials.ts` registries are LF. NaN/∞ show as "—" with a reason. eslint:
  6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Sources:** arXiv, TI notes, PDG, JACoW, APS PRAB, Europe PMC XML download; Appl. Opt., IEEE, Elsevier, nature.com don't (Opt. Express: Chrome).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
