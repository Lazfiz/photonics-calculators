# Handover — 2026-10-22 (session 133 → session 134)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 133: **materials fix part 7b** (rare-earth-absorption, color-centers), branch `phase-4/materials-fix-7b`, PR #164 to
open. Next: part 8 (thermal and damage: heat-capacity, thermal-conductivity-optics, damage-threshold, radiation-damage; three
merges into thin-film/environmental-stability). 414 pages.

## State
- `src/physics/materials/dopant-absorption.ts`: `dopantAbsorption(σ_a, N, L, Γ = 1)` → α (m⁻¹), dB/m, 1/α, loss dB, T;
  `DOPANT_LINES` (Er980/Er1480/Er1550/Yb976/Yb1064 from `DOPANT_PRESETS`, unchanged). Golden: Yb976 1000 wt-ppm → N 7.6597e24,
  α 19.149 m⁻¹, 83.164 dB/m.
- `src/physics/materials/color-centers.ts`: `COLOR_CENTERS` (NV⁻ 2.180/1.945/1.760 eV from Doherty 2013 Table 9, σ 3.1e-21 m²
  at 532 nm from Wee 2007; LiF F₂ 443→678 nm, F₂⁺ 645→910 nm, Baldacchini 2002 via arXiv:2412.21060 Table I, no σ),
  `stokesShift(λa, λe)` → eV, m⁻¹, quantum defect 1 − λa/λe. Tests: `tests/materials-dopant-absorption.test.ts`.
- rare-earth-absorption: title "Rare-Earth Dopant Absorption"; URL `line`, `sigmaA` (1e-25 m², 0 = preset), `dopantConcentration`
  (wt-ppm), `overlap`, `length` (m). color-centers: URL `center`, `absPeak`/`emPeak` (nm, 0 = preset), `sigmaA` (1e-17 cm²),
  `concentration` (m⁻³), `thickness` (mm). Old keys `pumpWl` and rare-earth `concentration` dropped.
- Materials 20 / 30 tiered, 9 `knownIssue`s; 403 / 414 total. New open finding: unsourced Er preset σ (ROADMAP).

## Next actions
1. `/ship` this branch. Release-check values: `materials/rare-earth-absorption` "19.15" (α m⁻¹, defaults),
   `materials/color-centers` "0.420" (Stokes eV, defaults); older ones in PR #141–#163. No release unless asked.
2. Materials fix part 8 (ROADMAP item 8). PR #155 findings: `gh pr view 155 --json body -q .body | grep -n "heat-capacity|damage"`.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
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
