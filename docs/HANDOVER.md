# Handover — 2026-10-22 (session 131 → session 132)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 131: **materials fix part 6** (brillouin-scattering, raman-scattering, two-photon-absorption), branch
`phase-4/materials-fix-6`, PR #162 to open. Next: materials fix part 7 (absorption). No merges, 416 pages.

## State
- `src/physics/materials/brillouin.ts`: `FUSED_SILICA_BRILLOUIN` (Agrawal n 1.45, v_A 5960, ρ 2210, p₁₂ 0.286), `brillouinGain`,
  `acousticWavelength`, `phononLifetime`; the page reuses `fiber-nonlinear.ts` `brillouinShift`/`stokesWavelength` and links sbs-threshold.
- `src/physics/materials/raman-gain.ts`: `RAMAN_LINES` (diamond: Savitski 2013 Table 1 at 6 pump λ; Ba(NO₃)₂ 532/1064; KGW 901/768;
  fused silica from `fiber-nonlinear.ts`), `ramanGainAtPump` (measured / interpolated in 1/λ_p / scaled 1/λ_p), `lorentzianGain`,
  `dephasingTime`, `ramanGainExponent`. Stokes λ from `coherent-raman.ts` (shift in 1/m).
- `src/physics/materials/two-photon.ts`: `TPA_MEDIA` (Van Stryland 1985 OL Table 1: GaAs, CdTe, CdSe, ZnTe at 1064; ZnSe, CdS, ZnO
  at 532), `tpaF2`, `scalingBeta` (Eq. 1, K 3100), `scaledBeta` (F₂ ratio), `tpaRegime`, `tpaTransmission`.
- URL params: brillouin `material` (fused-silica|custom), `wavelength` nm, `linewidth` MHz, custom `n`, `vA`, `rho`, `p12`; raman
  `material`, `pumpWl` nm, `intensity` GW/cm², `length` mm; TPA `material`, `wavelength` nm, `intensity` GW/cm², `thickness` mm,
  custom `beta` cm/GW, `lambdaRef` nm, `bandGap` eV.
- `tests/materials-scattering.test.ts` (8 tests), 1029 tests. Materials 18 / 32 tiered, 13 `knownIssue`s; 401 / 416 total.

## Next actions
1. `/ship` this branch. Release-check values: `materials/brillouin-scattering=11.15` (ν_B GHz), `materials/raman-scattering=1239.83`
   (diamond Stokes nm), `materials/two-photon-absorption=30.3` (GaAs T %); older ones in PR #141–#161. No release unless asked.
2. Materials fix part 7 (ROADMAP item 7): oh-absorption → fiber-optics/low-water-peak, absorption → spectroscopy/lambert-beer-law,
   rare-earth-absorption, color-centers. PR #155 findings: `gh pr view 155 --json body -q .body | grep -n "oh-abs|absorption|rare-earth|color"`.
   Two merges (redirect + codemod): split 7a/7b if needed.
3. Later: open findings (ROADMAP; new: dropped data on the three part-6 pages), `polarizer-types` (needs the user at the laptop with Chrome).


## Non-obvious facts
- **Session 131:** CREOL papers download (`curl -L -A "Mozilla/5.0" https://api.creol.ucf.edu/Publications/<n>.pdf`; 1790 = Van Stryland
  1985 OL). Strathprints author PDFs download. A garbled `pdftotext -layout` table often reads column by column without `-layout`;
  check each row against the paper's own predicted column. A `next start` left on :3100 serves the old build after a rebuild: kill it first.
- **Session 130:** EKSMA data sheets download (`curl -L -A "Mozilla/5.0" https://eksmaoptics.com/out/media/EKSMA_Optics_<BBO|LBO|KTP>_Crystals.pdf`,
  `pdftotext` without `-layout`); castech-us.com serves HTML pages (`index.htm` lists them); findlight CASTECH PDFs return HTML.
  WebFetch of an Optica abstract page can read its tables (small model: cross-check the numbers).
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
- **Sessions 114–115:** unsourceable constants: make them inputs, cite the defaults, log the gap. Render a SimpleLineChart only
  with data (empty series → NaN attributes). Mutating an **untracked** file: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names
  and units. `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 107:** Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome; `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--dump-dom` reads hydrated values). Python has no Pillow:
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
