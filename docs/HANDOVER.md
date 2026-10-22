# Handover — 2026-10-22 (session 129 → session 130)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 129: **materials fix part 5a** (Pockels), branch `phase-4/materials-fix-5`, PR #160 to open. Part 5 was split:
5a electro-optic + photorefractive (done), 5b nonlinear-crystals + nonlinear-index (next). No merges, 416 pages.

## State
- `src/physics/materials/pockels.ts`: `POCKELS` (kdp Zernike n_o, kdp-d n 1.51, adp n 1.52: r₆₃ 10.6/26.4/8.5 pm/V Wilson &
  Hawkes Table 3.1; linbo3 r₃₃ 30.8, r₁₃ 8.6 clamped, ε₃₃ 28 Weis & Gaylord, Zelmon n), `pockelsIndexChange`,
  `longitudinalHalfWaveVoltage` (retardation λ/2n³r), `phaseHalfWaveVoltage` (λd/(n³rL), one polarization, = 2× in a
  longitudinal cell), `transverseHalfWaveVoltage` (n_e³r₃₃ − n_o³r₁₃), `crossedPolarizerTransmission`, `gratingPeriod`,
  `diffusionField`, `trapLimitedField`, `spaceChargeField`, `twoBeamCouplingGain` (m⁻¹), `balancedGratingPeriod`,
  `twoBeamSignalGain` ((1+β)/(1+βe^(−ΓL))).
- URL params: electro-optic `material` (kdp, kdp-d, adp, linbo3, custom + `n`, `r` pm/V, `geometry`), `wavelength` nm,
  `voltage` V, `length` mm, `gap` µm (old unit kept); photorefractive `material` (linbo3, custom + `n`, `r`, `epsilon`),
  `wavelength`, `angle` (full outside 2θ, °), `temperature` K, `traps` (10²² m⁻³), `length` mm, `ratio` (pump/signal).
- `tests/materials-pockels.test.ts` (10 tests), 1014 tests. Materials 13 / 32 tiered, 18 `knownIssue`s; 396 / 416 total.

## Next actions
1. `/ship` this branch. Release-check values: `materials/electro-optic=8.717` (default KDP V_π kV),
   `materials/photorefractive=4.211` (Γ cm⁻¹); older ones in PR #141–#159. No release unless asked.
2. Materials fix part 5b (ROADMAP item 5b): nonlinear-crystals (wire length and power through
   `imaging/second-harmonic-generation.ts` or `wave-optics/three-wave.ts`; d_eff fixes: bulk MgO:LN ≈ 4.5, OP-GaAs QPM ≈ 69,
   PPLN 2d₃₃/π; Nikogosyan 2005 10.1007/b138685) and nonlinear-index (`wave-optics/kerr.ts` `nonlinearPhase`, golden
   1550 nm, 2.6e-20 m²/W, 1e16 W/m², 1 cm → 10.54 rad; γ via `fiber-nonlinear.ts` `nonlinearCoefficient` with A_eff).
   PR #155's batch-3 findings: `gh pr view 155 --json body -q .body | grep -n -A2 "nonlinear"`.
3. Later: open findings (ROADMAP; new: EO crystals without a source), `polarizer-types` (needs the user at the laptop
   with Chrome).

## Non-obvious facts
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
