# Handover — 2026-10-25 (session 153 → session 154)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 153: **Findings 4f-c and 4f-d** done on `phase-4/findings-4f-cd`: the last of the codemod's 185 skipped URL values.
Next: **golden-value tests for the top 50 calculators by traffic**; get traffic data first (Vercel MCP `aggregate_pageviews`).

## State
- 4f-c: all 56 flagged bindings in materials, imaging, detectors, spectroscopy were already guarded (selects use
  `includes`/`find ?? default`; "0 = preset" overrides are clamped after the swap; text parsers filter and clamp).
- 4f-d: 24 bindings on 7 pages got `useURLState(key, def, { min, max })` plus the field's min/max: nH/nL/nSub/nInc/nFilm
  1–5 on `angle-tuning`, `dichroic`, `spectrophotometry`, `wavelength-separation`, `wedge-film` (the beamsplitter
  convention); design λ 100–20000 nm (`dichroic`, `wedge-film`); film thickness 0–20000 nm (`spectrophotometry`);
  Poincaré θ 0–180°; Gires–Tournois λ 100–20000 nm, plot bandwidth 0.1–20000 nm with the span capped at λ. The other 35
  (Stokes validation, periodic angles, validated adhesion/evaporation lists, ABCD/HG/cavity clamps) were already guarded.
  No default changed. The ROADMAP Cross-cutting bullet for this list is gone.

## Next actions
1. `/ship` this branch. No default changed: after a release the user asks for, post-merge-check only needs page loads
   (`thin-film/dichroic`, `wave-optics/gires-tournois`). No release unless asked.
2. Top-50 golden tests (needs traffic data), then the heuristic-model box and the Phase 2/3 boxes further down.

## Non-obvious facts
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
- **Session 148:** patents.google.com holds full text of old patents (US 3,661,441 tables of TeO₂/LiNbO₃ M₂); Isomet app notes are PDFs
  at `isomet.com/App-Manual_pdf/`. Melkumov 2004 is arXiv:1502.02885 (Appendix 2, pm²); its pdftotext rows are shifted by one, so
  render the page. Markevich & Chulkov 2016 is CC BY at vestifm.belnauka.by. 2005 Opt. Express DOIs use `OPEX` (10.1364/OPEX.13.010266):
  check with `crossref.mjs -q`. pdftotext scrambles Opt. Express table rows: render them.
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
- **Sessions 113–115:** unsourceable constants: make them inputs or drop them, cite the defaults, log the gap. Next redirects keep
  the query string. Render a SimpleLineChart only with data. `besselJ0Fast` inside quadratures.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `--dump-dom` reads hydrated values). Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Charts:** axis minimum at the data minimum, so round plotted values (6 decimals). ChartPanel sends scatter and bar traces to SVG
  `SimpleChart` (no legend layout, per-point colours, shapes; supports y2 and log axes; joins lines across NaN). Markers need
  `line.color` too. `SimpleLineChart` has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, pass
  `xRaw` to the input. `detectors.ts`, `imaging.ts`, `materials.ts` registries are LF. NaN/∞ show as "—" with a reason. eslint:
  ≈ 85 old warnings, lint only changed files; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Sources:** arXiv, TI notes, PDG, JACoW, APS PRAB, Europe PMC XML download; Appl. Opt., IEEE, Elsevier, nature.com don't (Opt. Express: Chrome).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
