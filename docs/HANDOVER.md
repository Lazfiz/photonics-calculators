# Handover — 2026-10-22 (session 130 → session 131)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 130: **materials fix part 5b** (nonlinear-index, nonlinear-crystals), branch `phase-4/materials-fix-5b`, PR #161 to
open. Next: materials fix part 6 (brillouin, raman, two-photon-absorption). No merges, 416 pages.

## State
- `src/physics/materials/kerr-index.ts`: `KERR_MEDIA` (silica fibre 1550 nm: `SILICA_N2`, Malitson n₀; 12 media at 800 nm
  from Dubietis 2017 Table 1, n₂ in 1e-16 cm²/W → m²/W), `kerrIndexChange`, `piPhaseIntensity`. The page reuses
  `kerr.ts` `nonlinearPhase`/`criticalPower` and `fiber-nonlinear.ts` `nonlinearCoefficient`.
- `src/physics/materials/nonlinear-crystals.ts`: `SHG_CRYSTALS` (bbo, lbo, ktp, bibo, mgo-ln, ppln; 1064 → 532 nm; d_eff,
  n_ω, n_2ω, transparency), `typeIPhaseMatchingAngle`, `uniaxialWalkOff`, `xyPlaneIndex`, `focusedShg` (Boyd–Kleinman, Δk = 0),
  `shgPrefactor`, `waistForXi`, `shgFigureOfMerit`, `BK_OPTIMUM`. User decision: lean SHG page, unsourced crystals dropped.
- URL params: nonlinear-index `material`, `n2` (cm²/W, custom), `n0`, `intensity` W/cm², `wavelength` nm, `length` mm, `area` µm²;
  nonlinear-crystals `material`, `length` mm, `pumpPower` W, `waist` µm, custom `pumpWavelength` nm, `deff` pm/V, `n`.
- `tests/materials-nonlinear.test.ts` (7 tests), 1021 tests. Materials 15 / 32 tiered, 16 `knownIssue`s; 398 / 416 total.

## Next actions
1. `/ship` this branch. Release-check values: `materials/nonlinear-index=10.54` (default φ rad),
   `materials/nonlinear-crystals=12.11` (default BBO P_2ω mW); older ones in PR #141–#160. No release unless asked.
2. Materials fix part 6 (ROADMAP item 6): brillouin-scattering, raman-scattering, two-photon-absorption. PR #155 batch-3
   findings: `gh pr view 155 --json body -q .body | grep -n "brillouin\|raman\|two-photon"`. Split 6a/6b if needed.
3. Later: open findings (ROADMAP; new: nonlinear-crystals and nonlinear-index dropped data), `polarizer-types` (needs the
   user at the laptop with Chrome).

## Non-obvious facts
- **Session 130:** EKSMA data sheets download (`curl -L -A "Mozilla/5.0" https://eksmaoptics.com/out/media/EKSMA_Optics_<BBO|LBO|KTP>_Crystals.pdf`,
  `pdftotext` without `-layout`); castech-us.com serves HTML pages (`index.htm` lists them); findlight CASTECH PDFs return HTML.
  WebFetch of an Optica abstract page can read its tables (small model: cross-check the numbers).
- **Session 129:** textbook tables and worked examples: FOSSEE notebooks (`tbc-python.fossee.in/convert-notebook/<book>/ChapterN.ipynb`,
  WebFetch). Caltech authors' PDFs download, but their tables are OCR-garbled. Chrome exit 75 (another project's devctl job holds it): rerun in background.
- **Session 128:** MDPI PDFs 403 to curl and WebFetch: try the Semantic Scholar cache (`pdfs.semanticscholar.org/…`).
  Schott's per-glass sheets return HTML; refractiveindex.info hosts `schott_2017-01-20.pdf` (`pdftotext` puts each E, μ, K
  value a line below its label). Crossref every DOI and article number; add no sign convention a source doesn't state.
- **Session 127:** `git add` a new page directory or test before the gate (page tests list via git). refractiveindex.info formula 4's
  last term c₉λ^c₁₀ is Sellmeier `K`. A redirect can't add a query, so a merged preset page lands on the default.
- **Session 126:** sources that download: Crystran data sheets (`curl -L -A "Mozilla/5.0" https://www.crystran.com/optical-materials/<slug>`,
  slugs from that index page; its "reflection loss (2 surfaces)" is 1 − 2n/(n²+1), a free golden value); refractiveindex.info
  YAML via `gh api "repos/polyanskiy/refractiveindex.info-database/git/trees/main?recursive=1"` and raw.githubusercontent
  (`formula 1`: n² − 1 = c₀ + ΣBλ²/(λ² − λᵢ²), i.e. `fromResonanceWavelengths(1 + c₀, …)`; `formula 2`: Cᵢ already squared).
  amorphousmaterials.com does not. A `const … as const satisfies Record<…>` table loses optional fields in its union type:
  export it as `Record<Id, Interface>` (TS2339 on `note`). Long floats in a `style` (`left: 53.40199…%`) fail hydration
  (server HTML shortens them): round to 3 decimals. Background `npm run check` "exit code 0" again hid a red tsc: read the log's `exit` line.
- **Sessions 124–125:** registry entries end with a `  },` line (scripts slice on it). Long `node - <<'EOF'` scripts with
  backticks fail: write them to the scratchpad. The merge codemod runs after appending to `redirects.json` (don't re-sort).
- **Session 123:** devctl exit 75 skips the *whole* chained command, a `node - <<EOF` edit before it too: grep that the edit
  landed. A user `next dev` on :3000 rewrites `.next/dev/types` right after `rm -rf`, sometimes garbled (TS1002 in validator.ts):
  `rm -rf .next/dev/types` alone again, then rerun the gate. ui-check and `--dump-dom` that server; curl a cold page once first.
- **Sessions 120–122:** a removed page breaks tsc (TS2307 in `.next/types/validator.ts`) until `rm -rf .next/types .next/dev/types`,
  run on its own. A merge lowers the page floor in `tests/calculator-pages.test.ts`. Chrome dumps queue behind `npm run check`.
- **Session 119:** a `useMemo` whose callback calls a heavy function draws the React Compiler warning "Existing memoization
  could not be preserved" and the compiler skips the whole component: call a plain module-level function instead.
- **Session 118:** a running `next dev` keeps the redirects it read at start: a new redirect 404s there until a restart
  (`tests/redirects.test.ts` covers it). An edit made while `npm run check` runs may miss tsc: re-lint that file at least.
- **Sessions 114–115:** unsourceable constants: make them inputs, cite the defaults, log the gap. Render a SimpleLineChart only
  with data (empty series → NaN attributes). Mutating an **untracked** file: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names
  and units. `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--dump-dom` reads hydrated values, `--screenshot=` needs `C:/…`.
- **Session 107:** Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Sessions 64–65:** `useURLState` in `.map` breaks hooks. Per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts`, `imaging.ts` and `materials.ts` are **LF**; scripts must keep line endings.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; JACoW and APS PRAB/PRSTAB PDFs too; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE, Elsevier and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes`, tick text and per-trace `showlegend` (an unnamed trace has no legend entry); it supports
  `y2` and log axes. It joins the line across NaN points: split traces for real gaps. `SimpleLineChart` has no `y2`.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 85 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. CI ≈ 2–3 min.
