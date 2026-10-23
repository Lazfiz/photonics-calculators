# Handover — 2026-10-23 (session 137 → session 138)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 137: **polarizer-types** from Thorlabs specs read in Chrome, branch `phase-4/polarizer-types`, PR #168.
All 411 pages are tiered, 0 `knownIssue`s; every category audit is done.

## State
- `src/physics/polarization/polarizer-types.ts`: `POLARIZERS` (8 Thorlabs families: GT10, GTH10, WP10, RPM10, WP25H-K, LPVISE2X2,
  PBSW-1064, PBS253; ER minima, range nm, aperture mm, `tPass` or `tUnpolarized`, pulsed J/cm² and CW W/cm LIDT with conditions),
  `polarizerFigures(spec)` → erDb, dop, k1, k2 (NaN when no stated T), tUnpolarized; `coversWavelength(spec, λ)` (±1 % for one-line parts).
  URL: inputPower (mW), wavelength (nm), input (aligned | unpolarized). Test `polarization-polarizer-types` (1062 total).

## Next actions
1. `/ship` this branch. Post-merge value: `polarization/polarizer-types` "9.500" (PBSW-1064 output, 10 mW aligned at 1064 nm). No
   release unless asked.
2. Ask the user what comes next. Options: open findings (ROADMAP, per category), golden tests for the top-50 pages (Vercel
   Analytics is reachable through the Vercel MCP tools), or Phase 3 (charts, Plotly, JS budget).

## Non-obvious facts
- **Session 137:** the Chrome extension works once Chrome is signed in to claude.ai (the Google popup failed "Couldn't verify your
  browser"; email sign-in worked). Thorlabs moved to slug URLs (`https://www.thorlabs.com/<family-slug>?tabName=Specs` or
  `Damage%20Thresholds`); old `objectgroup_id` links redirect to wrong products; index pages (`/polarizers`, `/crystal-polarizers`,
  `/polarizing-beamsplitters`) list the slugs. Pages are client-rendered (fetch returns a 1.3 KB shell). `javascript_tool` results
  truncate at ≈ 1000 characters: filter lines, or use `get_page_text`. Chrome tabs freeze when devctl runs another project's
  `cargo nextest` (CPU 100 %): fall back to headless `ui-check` / `--dump-dom`. **Port 3000 can be another project** (Planet
  Incubator): run this repo on 3100 and check the page title.
- **Session 136:** CXRO serves Henke tables (`https://henke.lbl.gov/optical_constants/sf/<el>.nff`) and its calculator by POST to
  `/cgi-bin/getdb.pl` (Formula, Density (-1 = default), Min, Max, Npts, Output=Text+File; the reply links `/tmp/xrayNNNN.dat`). Its β
  includes Compton, the .nff f₂ does not. refractiveindex.info YAML: `gh api -H "Accept: application/vnd.github.raw"
  repos/polyanskiy/refractiveindex.info-database/contents/database/data/<path>` (URL-encode each path segment). Acta Phys. Pol. A PDFs
  download (`przyrbwn.icm.edu.pl/APP/PDF/116/a116z442.pdf`). norlandprod.com refuses connections. A Crystran slug list is on
  `/optical-materials` (e.g. sapphire-al2o3, silicon-si). `.sort()` on an array literal drops its contextual type (string-literal fields
  fail tsc): declare the typed array, then sort a copy.
- **Session 135:** NASA NTRS PDFs download (`https://ntrs.nasa.gov/api/citations/<id>/downloads/<id>.pdf`; metadata at
  `/api/citations/<id>`): Macleod's "Moisture adsorption in optical coatings" is 19890003956. GSFC CCMPP presentations download via
  WebFetch (binary saved, then `pdftotext`): Edwards 2021 quotes Ma et al. eqs. 17a–e. The pdx.edu Peck 1986 PDF 403s.
  `npx tsx --test` on one file can take > 2 min on this disk: run it in the background.
- **Session 134:** Crystran pages fetch with curl (`https://www.crystran.com/optical-materials/<slug>`, slugs from that index page; strip
  tags, grep "Specific Heat Capacity|Density"); no Debye temperatures there. NIST JPCRD reprints download
  (`https://srd.nist.gov/jpcrdreprint/<doi suffix>.pdf`, e.g. 1.555761 Desai). Heredocs halve backslashes (a regex `\s` arrives as `s`): write such scripts with Write.
- **Session 133:** `timeout N npx next start` kills the server after N s, so a later ui-check reports "not hydrated" on every page;
  a leftover listener on :3100 gives ChunkLoadError. Check `netstat -ano | grep :3100` and allow ≥ 300 s. Doherty's NV review is
  arXiv:1302.3288. Barnes 1991 (Er σ): Southampton eprints blocks scripts; rp-photonics.com 403s to WebFetch; the Optica abstract
  of Moulton 1986 returned only "Please wait".
- **Session 132:** archive.org hosts the whole Bell System Technical Journal as OCR text:
  `https://archive.org/download/bstj<vol>-<issue>-<page>/bstj<vol>-<issue>-<page>_djvu.txt` (retry on a 500). Humbach 1996
  (J. Non-Cryst. Solids) is closed; its band positions are in arXiv:1402.0466 Table 2. The inline-constant test flags any literal
  within 1 % of a constant (1246e-9 ≈ μ₀): write such wavelengths as `1246 * NM`. devctl exit 75 skips a heredoc that writes a
  script too: write scripts with the Write tool, then run them.
- **Session 131:** CREOL papers download (`curl -L -A "Mozilla/5.0" https://api.creol.ucf.edu/Publications/<n>.pdf`). A garbled
  `pdftotext -layout` table often reads column by column without `-layout`. A `next start` left on :3100 serves the old build.
- **Session 130:** EKSMA data sheets download (`https://eksmaoptics.com/out/media/EKSMA_Optics_<BBO|LBO|KTP>_Crystals.pdf`);
  WebFetch of an Optica abstract page can read its tables (small model: cross-check the numbers).
- **Session 128:** MDPI PDFs 403 to curl and WebFetch; the Semantic Scholar cache sometimes works. Crossref every DOI and
  article number; add no sign convention a source doesn't state.
- **Session 127:** `git add` a new page directory or test before the gate (page tests list via git). A redirect can't add a
  query, so a merged preset page lands on the default.
- **Session 126:** Crystran data sheets and refractiveindex.info YAML (via `gh api`) download; amorphousmaterials.com does not.
  Export a table as `Record<Id, Interface>` (not `as const satisfies`). Round long floats in a `style` to 3 decimals.
  Background `npm run check` "exit code 0" can hide a red tsc: read the log's `exit` line.
- **Sessions 120–125:** registry entries end with a `  },` line. A removed page breaks tsc (TS2307 in `.next/types/validator.ts`)
  until `rm -rf .next/types .next/dev/types`. A merge lowers the page floor. The merge codemod runs after appending to
  `redirects.json`. A user `next dev` on :3000 can garble `.next/dev/types`: delete it again.
- **Session 119:** a `useMemo` calling a heavy function makes the React Compiler skip the component: call a module-level function.
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
- **Sources:** arXiv, TI notes, PDG, JACoW, APS PRAB, Europe PMC XML download; Optics Express, Appl. Opt., IEEE, Elsevier, nature.com don't.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
