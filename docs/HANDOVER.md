# Handover — 2026-10-21 (session 122 → session 123)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 122: **wave-optics fix part 12** (guided waves), branch `phase-4/wave-optics-fix-12`, PR #153. Next: **fix part 13**
(interference: photonic-bandgap → thin-film/bragg-reflector; interferometer → spectroscopy/michelson-interferometer with
Mach-Zehnder; etalon-finesse → spectroscopy/etalon-fsr; slow-light). Read PR #141's batch 3/6 rows for these first.

## State
- Wave-optics modules: gaussian-beam, abcd, mode-matching, spatial-filter, higher-order-modes, bessel-beam,
  diffraction-integral, two-mirror-resonator, ring-cavity, laser-resonator, diode-laser, slab-laser, quasi-three-level,
  pulsed-laser, free-electron-laser, chirped-pulse, frequency-comb, high-harmonic, soliton, kerr, three-wave,
  optical-parametric-oscillator; new this session:
  - `four-wave-mixing.ts`: `fwmIdlerWavelength`, `fwmDetuning` (Ω = ω_s − ω_p), `fwmLinearMismatch` (β₂Ω² + β₄Ω⁴/12),
    `fwmSignalGain` (three-wave `parametricGain` with Γ = γP, Δk = κ = Δβ + 2γP), `fwmGainCoefficient`, `fwmIdlerPower`
    (photon count), `fwmPhaseMatchedDetuning` (κ = 0 quadratic). Lossless, undepleted.
  - `slab-waveguide.ts`: `slabV` (half-thickness V), `slabModeCount`, `slabModeB` (TE r = 1, TM r = n₁²/n₂², bisection),
    `slabEffectiveIndex`, `slabTEConfinement`, `slabTEField`. Test: `tests/wave-optics-guided-waves.test.ts` (RK4, quadrature).
  - `injection-locking.ts`: `lockingRange(k_c, ρ, α)` → {lower −k_c√ρ√(1+α²), upper k_c√ρ}.
  - fiber-optics `coupled-mode.ts` gained `codirectionalPsi`, `codirectionalTransfer`, `codirectionalPeak`.
- New URL params: four-wave-mixing `seedPower` mW, `beta2` ps²/km, `beta4` ps⁴/km (n2 unit unchanged, now labelled ×10⁻²⁰ m²/W);
  injection-locking `couplingRate` GHz, `alpha`, `detuning` GHz (old `lockingBW` and coupled-mode's params are ignored).
- 386 of 432 pages tiered, 3 `knownIssue`s (photonic-bandgap, interferometer, slow-light). User merges (session 110): 9 of 12
  done, the 3 left are part 13. Session 78: keep dynamic-range, stimulated-raman-microscopy, resolution apart.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/four-wave-mixing=27.09`,
   `wave-optics/optical-waveguide=1.498429`, `wave-optics/injection-locking=-3.162`, `fiber-optics/mode-coupling=0.2297`;
   part 11: `wave-optics/sum-frequency=91.87`, `wave-optics/difference-frequency=3.361`, `wave-optics/optical-parametric-amplifier=29.10`;
   part 10: `wave-optics/kerr-lens=9.817`, `wave-optics/self-phase-modulation=1.202`, `wave-optics/filamentation=5.319`;
   part 9: `wave-optics/soliton=1.330`, `wave-optics/supercontinuum=53.3`;
   part 8: `wave-optics/chirped-pulse=94.21`, `wave-optics/optical-frequency-comb=193.414520000`, `wave-optics/attosecond-pulse=53.65`;
   part 7: `wave-optics/q-switched-laser=93.94`, `wave-optics/cavity-dumped=10.01`, `wave-optics/mode-locked-laser=25.23`,
   `wave-optics/free-electron-laser=823.9`; part 6: `wave-optics/diode-laser-resonator=4.957`, `wave-optics/slab-laser=72.23`,
   `wave-optics/thin-disk-laser=104.3`, `fiber-optics/fiber-laser=2.362`; part 5: `wave-optics/solid-state-laser-resonator=9.093`,
   `wave-optics/dye-laser-resonator=0.5444`, `wave-optics/gas-laser-resonator=0.9399`; part 4: `wave-optics/cavity-mode-spacing=0.6662`,
   `wave-optics/ring-cavity=102.4`; part 3: `wave-optics/hermite-gaussian=5.067`, `wave-optics/bessel-beam=24.22`,
   `wave-optics/diffraction-integral=0.9075`; part 2: `wave-optics/mode-matching=36.22`, `wave-optics/spatial-filter=67.74`;
   part 1: `wave-optics/gaussian-beam=0.2027`, `wave-optics/m2-factor=1.476`, `wave-optics/abcd-matrix=100.0000`. No release unless asked.
2. Wave-optics fix part 13 (interference), which closes the wave-optics category.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Sessions 120–122:** a removed page breaks tsc (TS2307 in `.next/types/validator.ts`) until `rm -rf .next/types .next/dev/types`,
  run on its own (devctl exit 75 skips a whole chained command). A merge lowers the page floor in `tests/calculator-pages.test.ts`
  (432). Chrome dumps queue behind `npm run check`. PPLN 1064 − 1550: QPM 29.95 µm, δ_si −97.7 fs/mm (Zelmon).
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
