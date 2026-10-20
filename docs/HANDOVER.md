# Handover — 2026-10-20 (session 120 → session 121)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 120: **wave-optics fix part 10** (Kerr), branch `phase-4/wave-optics-fix-10`, PR #151. Next: **fix part 11**
(χ⁽²⁾: one plane-wave three-wave module; sum-frequency, difference-frequency, parametric-amplification → optical-parametric-amplifier).

## State
- Wave-optics modules: gaussian-beam, abcd, mode-matching, spatial-filter, higher-order-modes, bessel-beam,
  diffraction-integral, two-mirror-resonator, ring-cavity, laser-resonator, diode-laser, slab-laser, quasi-three-level,
  pulsed-laser, free-electron-laser, chirped-pulse, frequency-comb, high-harmonic, soliton; new this session:
  - `kerr.ts`: `criticalPower` (3.77 λ²/(8πn₀n₂)), `gaussianPeakIntensity`, `nonlinearPhase` (k₀n₂IL),
    `kerrLensFocalLength` (πw⁴/(8n₂PL)), `rayleighRangeInMedium`, `selfFocusingDistance` (Marburger, NaN for P ≤ P_cr),
    `focusedCollapseDistance` (1/z′ = 1/z_sf + 1/f), `FWHM_FACTOR`, `pulseHalfWidth`, `pulsePeakPower` (Gaussian or sech²),
    `spmMaxFrequencyShift`, `spmRmsBroadening(φ, shape)` (Gaussian reuses fiber-nonlinear), `spmSpectrum` (FFT).
    Test: `tests/wave-optics-kerr.test.ts`.
- kerr-lens: URL `peakPower` in kW (was `power` in W), default 100 kW, phase-profile chart (Gaussian vs parabola).
  self-phase-modulation: default 1 µJ (was 1 nJ), `shape` is a URL param, real spectrum. filamentation: fused-silica
  defaults (n₂ 2.4, Dubietis Table 1), 1 µJ, 100 fs, 50 µm, new `lensFocal` (mm, 0 = none); `pressure` dropped;
  filament length, B-integral and clamping dropped.
- 380 of 434 pages tiered, 10 `knownIssue`s. **Per-page findings for parts 11–13 are in the PR #141 description**
  (`gh pr view 141`): read the part's section first, don't re-audit.
- **User decisions (session 110), merges with redirects, 7 of 12 done.** Left: parametric-amplification →
  optical-parametric-amplifier; etalon-finesse → spectroscopy/etalon-fsr; coupled-mode → fiber-optics/mode-coupling;
  photonic-bandgap → thin-film/bragg-reflector; interferometer → spectroscopy/michelson-interferometer. sum-frequency and
  spectroscopy/sum-frequency-gen share a module. Session 78: keep dynamic-range, stimulated-raman-microscopy, resolution apart.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/kerr-lens=9.817`, `wave-optics/self-phase-modulation=1.202`,
   `wave-optics/filamentation=5.319`; part 9: `wave-optics/soliton=1.330`, `wave-optics/supercontinuum=53.3`;
   part 8: `wave-optics/chirped-pulse=94.21`, `wave-optics/optical-frequency-comb=193.414520000`, `wave-optics/attosecond-pulse=53.65`;
   part 7: `wave-optics/q-switched-laser=93.94`, `wave-optics/cavity-dumped=10.01`, `wave-optics/mode-locked-laser=25.23`,
   `wave-optics/free-electron-laser=823.9`; part 6: `wave-optics/diode-laser-resonator=4.957`, `wave-optics/slab-laser=72.23`,
   `wave-optics/thin-disk-laser=104.3`, `fiber-optics/fiber-laser=2.362`; part 5: `wave-optics/solid-state-laser-resonator=9.093`,
   `wave-optics/dye-laser-resonator=0.5444`, `wave-optics/gas-laser-resonator=0.9399`; part 4: `wave-optics/cavity-mode-spacing=0.6662`,
   `wave-optics/ring-cavity=102.4`; part 3: `wave-optics/hermite-gaussian=5.067`, `wave-optics/bessel-beam=24.22`,
   `wave-optics/diffraction-integral=0.9075`; part 2: `wave-optics/mode-matching=36.22`, `wave-optics/spatial-filter=67.74`;
   part 1: `wave-optics/gaussian-beam=0.2027`, `wave-optics/m2-factor=1.476`, `wave-optics/abcd-matrix=100.0000`. No release unless asked.
2. Wave-optics fix part 11 (χ⁽²⁾), then parts 12–13. Part 11: check spectroscopy/sum-frequency-gen's module before writing one.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 120:** Marburger's z_sf = 0.367 z_R/√(…) uses z_R = πn₀w₀²/λ with w₀ the 1/e² radius (arXiv physics/0503131,
  0801.2035); some write k w₀² = 2 z_R. Townes P_cr is 3.72 λ²/(8πn₀n₂), a Gaussian beam 3.77 (Fibich–Gaeta). Air MPI σ₈
  values in the literature differ by 10³: no clamping model. Chrome dumps queue behind `npm run check` (devctl exit 75).
- **Session 119:** a `useMemo` whose callback calls a heavy function draws the React Compiler warning "Existing memoization
  could not be preserved" and the compiler skips the whole component: call a plain module-level function instead (the
  compiler memoizes it). Oscillating asymptotes (radiation beats) aren't golden values: test exact solutions instead.
- **Session 118:** a running `next dev` keeps the redirects it read at start: a new redirect 404s there until a restart
  (`tests/redirects.test.ts` covers it). An edit made while `npm run check` runs may miss tsc: re-lint that file at least.
- **Session 117:** `next dev` refuses a second server (:3000 is up): ui-check that one; curl a cold page once first.
- **Session 116:** a background `(gate; echo exit $?)` always "exits 0": read its `exit` line. `-Math.log(1)` is `-0`.
- **Sessions 114–115:** unsourceable constants: make them inputs, cite the defaults, log the gap. Render a SimpleLineChart only
  with data (empty series → NaN attributes). Mutating an **untracked** file: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names.
  `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--dump-dom` reads hydrated values, `--screenshot=` needs `C:/…`.
- **Session 107:** Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Session 65:** `useURLState` in `.map` breaks hooks. Probe the module before writing the test, then mutate it once to see `ℹ fail N`. A slug rename (< 10
  files): `git mv` the folder, change `href`, move the registry entry, add the redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; JACoW and APS PRAB/PRSTAB PDFs too; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
  It joins the line across NaN points: split traces for real gaps. `SimpleLineChart` has no `y2`: use two charts or ratios.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 161 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. Edit with `node - <<'EOF'`; `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` (no heredoc) hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
