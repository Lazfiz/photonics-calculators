# Handover — 2026-10-20 (session 119 → session 120)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 119: **wave-optics fix part 9** (fibre solitons), branch `phase-4/wave-optics-fix-9`, PR #150. Next: **fix part 10**
(Kerr: shared critical power; kerr-lens, self-phase-modulation, filamentation).

## State
- Wave-optics modules: gaussian-beam, abcd, mode-matching, spatial-filter, higher-order-modes, bessel-beam,
  diffraction-integral, two-mirror-resonator, ring-cavity, laser-resonator, diode-laser, slab-laser, quasi-three-level,
  pulsed-laser, free-electron-laser, chirped-pulse, frequency-comb, high-harmonic; new this session:
  - `soliton.ts`: `SECH_FWHM_FACTOR`, `sechT0`, `sechPeakPower` (E/2T₀), `dispersionLength`, `nonlinearLength`,
    `fundamentalSolitonPower`, `solitonOrder`, `solitonPeriod`, `fissionLength` (L_D/N), `dispersiveWaveShift` (−3β₂/β₃),
    `solitonContent` (Satsuma–Yajima: ⌊N + ½⌋ solitons, amplitude 2N − 1), `solveNls` (normalised symmetric split-step on
    `fftRadix2`; defaults 1024 points, 64 T₀ window, h 0.01 L_D). Test: `tests/wave-optics-solitons.test.ts`.
- The soliton page simulates N ≤ 4, ≤ 10 L_D, ≤ 1000 steps of h = min(0.02, 0.05/N²); beyond that a note says where it stopped.
  Default distance is now 2 m (was 50 m = 184 L_D). β₂ is a URL param on both pages now (`beta2`); supercontinuum adds `beta3`
  and drops the unused core diameter, the fake bandwidth and the fake spectrum.
- 377 of 434 pages tiered, 13 `knownIssue`s. **Per-page findings for parts 10–13 are in the PR #141 description**
  (`gh pr view 141`): read the part's section first, don't re-audit.
- **User decisions (session 110), merges with redirects, 7 of 12 done.** Left: parametric-amplification →
  optical-parametric-amplifier; etalon-finesse → spectroscopy/etalon-fsr; coupled-mode → fiber-optics/mode-coupling;
  photonic-bandgap → thin-film/bragg-reflector; interferometer → spectroscopy/michelson-interferometer. sum-frequency and
  spectroscopy/sum-frequency-gen share a module. Session 78: keep dynamic-range, stimulated-raman-microscopy, resolution apart.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/soliton=1.330`, `wave-optics/supercontinuum=53.3`;
   part 8: `wave-optics/chirped-pulse=94.21`, `wave-optics/optical-frequency-comb=193.414520000`, `wave-optics/attosecond-pulse=53.65`;
   part 7: `wave-optics/q-switched-laser=93.94`, `wave-optics/cavity-dumped=10.01`, `wave-optics/mode-locked-laser=25.23`,
   `wave-optics/free-electron-laser=823.9`; part 6: `wave-optics/diode-laser-resonator=4.957`, `wave-optics/slab-laser=72.23`,
   `wave-optics/thin-disk-laser=104.3`, `fiber-optics/fiber-laser=2.362`; part 5: `wave-optics/solid-state-laser-resonator=9.093`,
   `wave-optics/dye-laser-resonator=0.5444`, `wave-optics/gas-laser-resonator=0.9399`; part 4: `wave-optics/cavity-mode-spacing=0.6662`,
   `wave-optics/ring-cavity=102.4`; part 3: `wave-optics/hermite-gaussian=5.067`, `wave-optics/bessel-beam=24.22`,
   `wave-optics/diffraction-integral=0.9075`; part 2: `wave-optics/mode-matching=36.22`, `wave-optics/spatial-filter=67.74`;
   part 1: `wave-optics/gaussian-beam=0.2027`, `wave-optics/m2-factor=1.476`, `wave-optics/abcd-matrix=100.0000`. No release unless asked.
2. Wave-optics fix part 10 (Kerr), then parts 11–13. Part 10's SPM page can reuse `nonlinearLength` from `soliton.ts` and
   `spmRmsBroadening` from `fiber-optics/fiber-nonlinear.ts`.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 119:** a `useMemo` whose callback calls a heavy function draws the React Compiler warning "Existing memoization
  could not be preserved" and the compiler skips the whole component: call a plain module-level function instead (the
  compiler memoizes it). The non-integer-N asymptote (2N − 1)² oscillates ±7 % even at 40 L_D (radiation beats): don't
  golden-test it numerically; the exact N = 2 breather (Satsuma–Yajima) is the solver test. A JS split step on 1024
  points costs ≈ 0.3 ms. Chrome screenshots queue behind `npm run check` in devctl: run them in the background.
- **Session 118:** a running `next dev` keeps the redirects it read at start: a new redirect 404s there until a restart
  (`tests/redirects.test.ts` covers it). An edit made while `npm run check` runs may miss tsc: re-lint that file at least.
  Treacy's φ₂ uses the **perpendicular** separation with cos³β (slant distance: cos²β).
- **Session 117:** `next dev` refuses a second server in the repo (prints its PID and port; :3000 was up): ui-check that one.
  A cold page's first ui-check can fail "not hydrated" or ECONNREFUSED 9333: curl the page once, rerun.
- **Session 116:** a background `(gate; echo exit $?)` always finishes "exit code 0": read the `exit` line in the log.
  `-Math.log(1)` is `-0` and fails `assert.equal(…, 0)`: write `Math.log(1/x)`.
- **Session 115:** unsourceable constants: make them inputs, cite the defaults, log the gap. ui-check flags `Received NaN for the attribute` when a SimpleLineChart gets only empty series: render it only with data.
- **Session 114:** a mutation test on an **untracked** file can't be undone with `git checkout`: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names.
  `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--dump-dom` reads hydrated values, `--screenshot=` needs `C:/…`.
- **Session 110:** save each reviewer report to a scratchpad file at once. Kerr 1/f = 8n₂PL/(πw⁴) is checked (part 10).
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
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 222 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. Edit with `node - <<'EOF'`; `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` (no heredoc) hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
