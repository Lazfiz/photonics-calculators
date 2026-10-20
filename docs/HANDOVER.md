# Handover — 2026-10-20 (session 117 → session 118)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 117: **wave-optics fix part 7** (pulsed output), branch `phase-4/wave-optics-fix-7`, PR #148. Next: **fix part 8**
(pulses: chirped-pulse + pulse-compression into one CPA page; cep-stabilization → optical-frequency-comb; attosecond-pulse).

## State
- Wave-optics modules: gaussian-beam, abcd, mode-matching, spatial-filter, higher-order-modes, bessel-beam,
  diffraction-integral, two-mirror-resonator, ring-cavity, laser-resonator (four-level + Rigrod), diode-laser, slab-laser,
  quasi-three-level, and new this session:
  - `pulsed-laser.ts`: `singlePassLoss`, `photonLifetime`, `qSwitchExtraction` (rη = −ln(1−η)), `qSwitchPeakPhotons`, `qSwitchPulse`,
    `qSwitchWaveform` (RK4, aligned at the peak, FWHM), `roundTripTime`, `TIME_BANDWIDTH`, `transformLimitedBandwidth`,
    `wavelengthWidth`, `cavityLengthForRepRate`.
  - `free-electron-laser.ts`: `ALFVEN_CURRENT` (from CODATA), `lorentzFactor`, `resonanceWavelength`, `besselFactor` [JJ], `beamSize`,
    `pierceParameter` (Huang–Kim eq. 5), `gainLength1D`, `xieDegradation` (19 coefficients), `freeElectronLaser`, `felPower`.
    Test: `tests/wave-optics-pulsed.test.ts` (Xie 1995 table 1, LCLS table I).
- `SimpleLineChart` now rounds pixel coordinates to 0.01 px (the 1-ulp Node/Chrome hydration mismatch is gone).
- Page floor in `tests/calculator-pages.test.ts` is 436.
- 372 of 436 pages tiered, 20 `knownIssue`s. **Per-page findings for parts 8–13 are in the PR #141 description**
  (`gh pr view 141`): read the part's section first, don't re-audit.
- **User decisions (session 110), merges with redirects, 5 of 12 done:** parametric-amplification → optical-parametric-amplifier;
  etalon-finesse → spectroscopy/etalon-fsr; chirped-pulse + pulse-compression; coupled-mode → fiber-optics/mode-coupling;
  cep-stabilization → optical-frequency-comb; photonic-bandgap → thin-film/bragg-reflector; interferometer →
  spectroscopy/michelson-interferometer. sum-frequency and spectroscopy/sum-frequency-gen share a module. Session 78: keep
  dynamic-range, stimulated-raman-microscopy, resolution apart.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/q-switched-laser=93.94`, `wave-optics/cavity-dumped=10.01`,
   `wave-optics/mode-locked-laser=25.23`, `wave-optics/free-electron-laser=823.9`; part 6: `wave-optics/diode-laser-resonator=4.957`,
   `wave-optics/slab-laser=72.23`, `wave-optics/thin-disk-laser=104.3`, `fiber-optics/fiber-laser=2.362`; part 5:
   `wave-optics/solid-state-laser-resonator=9.093`, `wave-optics/dye-laser-resonator=0.5444`, `wave-optics/gas-laser-resonator=0.9399`;
   part 4: `wave-optics/cavity-mode-spacing=0.6662`, `wave-optics/ring-cavity=102.4`; part 3: `wave-optics/hermite-gaussian=5.067`,
   `wave-optics/bessel-beam=24.22`, `wave-optics/diffraction-integral=0.9075`; part 2: `wave-optics/mode-matching=36.22`,
   `wave-optics/spatial-filter=67.74`; part 1: `wave-optics/gaussian-beam=0.2027`, `wave-optics/m2-factor=1.476`,
   `wave-optics/abcd-matrix=100.0000`. No release unless asked.
2. Wave-optics fix part 8 (pulses), then parts 9–13. Part 8 can reuse `TIME_BANDWIDTH`/`transformLimitedBandwidth` from `pulsed-laser.ts`.
3. Later: open findings (ROADMAP; diode and Yb:YAG default constants unsourced), `polarizer-types` (needs the user at
   the laptop with Chrome).

## Non-obvious facts
- **Session 117:** `next dev` refuses a second server in the repo (prints its PID and port; :3000 was up): ui-check that one.
  A cold page's first ui-check can fail "not hydrated" or ECONNREFUSED 9333: curl the page once, rerun.
- **Session 116:** a background `(gate; echo exit $?)` always finishes "exit code 0": read the `exit` line in the log.
  `ValidatedNumberInput`'s `step` is a string (`step="1"`). `-Math.log(1)` is `-0` and fails `assert.equal(…, 0)`: write `Math.log(1/x)`.
- **Session 115:** unsourceable gain constants (gas, dye, Coldren, Yb:YAG): make them inputs, cite the defaults, log the gap.
  ui-check flags `Received NaN for the attribute` when a SimpleLineChart gets only empty series: render it only with data.
- **Session 114:** a mutation test on an **untracked** file can't be undone with `git checkout`: `cp` it to the scratchpad
  first. During `npm run check` devctl queues other heavy commands for minutes. A stick spectrum in SimpleLineChart: one series per family, points (x, 0), (x, h), (x, 0) along the baseline.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names.
  `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 112:** `node - <<'EOF'` edits work (`python -` hangs). Chrome `--screenshot=` needs a `C:/…` path (`/c/…` writes nothing); an `rm` on `"$W"/*.png` is blocked: use `${W:?}`.
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  `chrome --headless=new --dump-dom <url> | sed 's/<[^>]*>/ /g' | grep -o "<label> +[0-9.]+"` reads a hydrated value; the
  Chrome path is `C:/Program Files/Google/Chrome/Application/chrome.exe`.
- **Session 110:** save each reviewer report to a scratchpad file at once (lost on compaction). Kerr 1/f = 8n₂PL/(πw⁴) is checked.
- **Session 107:** NIST WebBook keeps higher constants in footnotes: grep the saved HTML.
  Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Sessions 86–89:** the merge codemod drops the last entry's trailing comma. **Never put Markdown backticks in `node -e "…"`**: use Write.
- **Session 65:** `useURLState` in `.map` breaks hooks. Probe the module before writing the test, then mutate it once to see `ℹ fail N`. A slug rename (< 10
  files): `git mv` the folder, change `href`, move the registry entry, add the redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; JACoW and APS PRAB/PRSTAB PDFs too; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
  It joins the line across NaN points: split traces for real gaps.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 222 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
