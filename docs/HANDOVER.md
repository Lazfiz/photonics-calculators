# Handover — 2026-10-22 (session 132 → session 133)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 132: **materials fix part 7a** (two merges), branch `phase-4/materials-fix-7a`, PR to open. Next: part 7b
(rare-earth-absorption, color-centers). 414 pages.

## State
- Redirects: `/materials/oh-absorption` → `/fiber-optics/low-water-peak`, `/materials/absorption` → `/spectroscopy/lambert-beer-law`
  (merge codemod run; page floor 414 in `tests/calculator-pages.test.ts`).
- `src/physics/fiber-optics/silica-attenuation.ts`: `OH_BANDS` (Humbach positions 943, 1246, 1383, 2212, 2722 nm; strengths
  1.2 Philen 1982 BSTJ, 62.7 Humbach, `ohDbPerKmPerPpm(7.75)` = 10 029.8 from Hetherington & Jack ε 77.5 L/(mol·cm), ρ 2201,
  M_OH 17.007; 1246/2212 NaN = not modelled), `ohBandFwhm` (30 nm·(λ/1383)²), `ohContentPpm`, `OH_1383_DB_PER_KM_PER_PPM`.
  `silicaLossDbPerKm` sums the bands scaled from `ohPeakDbPerKm`; 1310/1550 goldens unchanged.
- low-water-peak page: URL values clamped, OH content (ppb) in the 1383 card, new 0.8–2.9 µm log chart + band table.
- `src/physics/spectroscopy/lambert-beer-law.ts`: `absorbanceFromNapierian(α m⁻¹, d m)` = αd/ln 10. Lambert-Beer page: new
  "Bulk sample" section, URL `alpha` (cm⁻¹, default 1) and `thickness` (mm, default 10; the old absorption page's name).
- PR #155's absorption golden "α 0.1 cm⁻¹, 10 mm → T 0.36788" is inconsistent: T = e⁻¹ needs α = 1 cm⁻¹ (tested both).
- Materials 18 / 30 tiered, 11 `knownIssue`s; 401 / 414 total.

## Next actions
1. `/ship` this branch. Release-check values: `fiber-optics/low-water-peak` "0.311" (loss at 1383 nm, dB/km, defaults),
   `spectroscopy/lambert-beer-law` "36.79" (bulk internal T %); older ones in PR #141–#162. No release unless asked.
2. Materials fix part 7b: rare-earth-absorption (`DOPANT_PRESETS` from `doped-fiber-gain.ts`, α in m⁻¹ and dB/m; Yb σa
   2.6e-24 Paschotta 1997, Er Barnes 1991), color-centers (Stokes shift, drop η = σem/σabs; NV Wee 2007, Moulton 1986).
   PR #155 findings: `gh pr view 155 --json body -q .body | grep -n "rare-earth|color"`.
3. Later: open findings (ROADMAP; new: low-water-peak 1246/2212 nm band strengths), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
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
