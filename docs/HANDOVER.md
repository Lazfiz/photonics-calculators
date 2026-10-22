# Handover — 2026-10-22 (session 136 → session 137)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 136: **materials fix part 9** (x-ray-optics, polymer-optics, thermal-expansion), branch `phase-4/materials-fix-9`, PR #167.
Materials is done: 410 / 411 pages tiered, 0 `knownIssue`s. Only `polarizer-types` (needs the user with Chrome) is left in Phase 4.

## State
- `src/physics/materials/x-ray-optics.ts`: `scatteringFactors(id, E_eV)` (ln-E interpolation, NaN outside 1–30 keV),
  `xrayIndex(formula, rho, E_eV)` → δ, β, θ_c, attenuation length, μ/ρ; `XRAY_MATERIALS` (10, CXRO default densities, diamond
  3.515); `xrayTransmission`. `henke-data.ts`: CXRO .nff rows for H, Be, C, N, O, Si, Ni, Cu, Mo, Pt, Au thinned to 0.2 % (412 rows),
  exempt in `tests/no-inline-constants.test.ts`. `r_e` added to constants. URL: material, density (0 = preset), energy (keV), thickness (µm).
- `polymer-optics.ts`: `POLYMERS` (pmma Beadie n²-power, pc/ps/zeonex Sultanova Sellmeier, noa61/su8 Cauchy), `polymerIndex`,
  `polymerDnDlambda`, `polymerGroupIndex`, `polymerAbbe`, `normalReflectance`, `corecladNA`. URL: polymer, cladding, wavelength.
- `thermal-expansion.ts`: `thermalExpansion(α, L, ΔT)`, `expansionWaves`. Page table has a Crystran/typical source column.
- Tests: `materials-x-ray-optics`, `materials-polymer-optics`, `materials-thermal-expansion` (1055 total).

## Next actions
1. `/ship` this branch. Post-merge values: `materials/x-ray-optics` "3.4077e-6" (Be 10 keV default), `materials/polymer-optics`
   "1.49081", `materials/thermal-expansion` "0.0710" (BK7 100 mm 100 K = 0.0710 mm); older ones in PRs #141–#166. No release unless asked.
2. Ask the user what comes next; no category audit is left. Options: open findings (ROADMAP, per category), `polarizer-types`
   (user at the laptop with Chrome), golden tests for the top-50 pages (Vercel Analytics is reachable through the Vercel MCP tools),
   or Phase 3 (charts, Plotly, JS budget).

## Non-obvious facts
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
