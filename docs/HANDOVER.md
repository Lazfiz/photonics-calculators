# Handover — 2026-10-20 (session 106 → session 107)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 106 did **spectroscopy fix part 10** (kinetics) on branch `phase-4/spectroscopy-kinetics` (PR after `/ship`).
Next: **spectroscopy fix part 11** (molecular: microwave-spectroscopy CO μ 6.856 → B 1.9324 cm⁻¹, terahertz-spectroscopy,
infrared-spectroscopy, electron-spectroscopy).

## State
- `src/physics/math.ts`: new `erfcx(x)` (x ≥ 0; series below 2, continued fraction above).
- `fluorescence-lifetime.ts`: `emgDecay`, `convolvedDecay`, `periodicDecay` (pile-up of earlier pulses, geometric tail),
  `gaussianPulseBandwidth` (0.4413, exact Δλ).
- New `pump-probe.ts`: `sequentialPopulations` (A→B→GS, IRF-convolved), `excitationFraction` (depth-averaged),
  `photonFluence`, `deltaA` (GSB/SE/ESA-A/ESA-B Gaussian bands), `deltaTOverT`.
- New `quantum-yield.ts`: `relativeQuantumYield` (absorptance or absorbance form; NaN on bad input).
- New `two-dimensional.ts` (wavenumbers in m⁻¹): `dimer`, `transferMatrix`, `dimerPeaks`, `absorptiveLineshape`
  (∫G·L·L in closed form via Faddeeva), `spectrum2D`, `linearAbsorption`, `orientationalAverage`, `homogeneousFwhm`.
- `transient-absorption` merged into `pump-probe` (redirect). URL param changes are listed in the PR description.
- Tests: `tests/spectroscopy-kinetics.test.ts` (6). 345 of 445 pages tiered, 8 `knownIssue`s (all spectroscopy).
- Per-page findings, goldens and references: PR #127 description (`gh pr view 127`); read the part at hand only.
- **User decisions (session 96):** merges with redirects (ROADMAP "Spectroscopy fix parts"). **Release flow:** merges to `main`
  deploy nothing. Production deploys only from `release`, and only when the user asks: `git push origin main:release`, then
  `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set Vercel's Production Branch to `release`.
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 10: `spectroscopy/pump-probe=-2.752` (mOD),
   `spectroscopy/time-resolved=12.50` (ns), `spectroscopy/fluorescence-quantum-yield=0.6454`, `spectroscopy/two-dimensional=282.8`
   (cm⁻¹); part 9: `spectroscopy/absorption-depth=1.565`, `spectroscopy/penetration-depth=63.66`, `spectroscopy/optical-path-length=1.500`,
   `spectroscopy/near-infrared=1.003`; earlier parts: `git show db346912:docs/HANDOVER.md`. No release unless asked.
2. Spectroscopy part 11 (ROADMAP item 11); PR #127 has the findings.
3. Later: open findings (conc-mirror/jacquinot overlap, FSO `adaptive-optics` actuators-as-modes, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome). Gold for SERS needs a gold dataset (none in `materials/`).

## Non-obvious facts
- **Session 106:** after a merge removes a page, tsc fails on stale `.next/types` validators: `rm -rf .next/types .next/dev/types`.
  Plotly 3 (heatmaps) ignores string axis/colorbar titles: use `title: { text }`. The 2D lineshape closed form loses ≈ 4e-8
  when σ ≪ γ: Lorentzian product below σ = 1e-4 γ. EMG for z > 0 must use erfcx (e^(σ²/2τ²) overflows).
- **Session 105:** Hale & Querry is tabulated every 200 nm in the NIR, so it misses the 1450/1940 nm water peaks (1.4 µm gives
  12 /cm, the peak is 31.7): use Segelstein. Scholkmann–Wolf DPF coefficients were checked against two open implementations
  (paper is paywalled). A command that starts a server in the background keeps devctl "busy": run later chrome jobs with
  `run_in_background`.
- **Session 103:** Norton–Beer coefficients (Naylor & Tahic 2007) give FWHM ratios 1.2/1.4/1.6 exactly: a good check. The
  Mertz ramp makes Re(C) ≈ B cos φ; in the found-ZPD frame the phase is φ + 2πσ·shift·Δx (sign!). Use closed forms for
  cosine-sum ILS. devctl blocks a whole foreground command while a gate runs.
- **Sessions 101–102:** fit polynomials in a scaled variable u ∈ [−1, 1]. `assert.equal(-0, 0)` fails (Object.is). In
  `sed` replacements `&` is the match and a backslash-n a newline: use Edit. eslint's `preserve-manual-memoization` fires on
  `useMemo` over derived values: drop the `useMemo`. NIST ASD DOI is DataCite (`crossref.mjs` 404); astm.org 403s,
  ASTM DOIs (10.1520/…) are in Crossref. ar5iv HTML gives LaTeX.
- **Sessions 99–100:** a merge can leave a chained redirect: point it at the final page. `tests/calculator-pages.test.ts` has a page-count floor (now ≥ 440); a merge can trip it. The global
  minimum between two peak centres is often an endpoint, not the dip: `dipDepth` uses running maxima from both sides.
  devctl queues headless Chrome behind other projects' jobs: run screenshots with a fresh `--user-data-dir`.
  A wavenumber through `toPrecision(4)` prints "2.002e+4": use `toFixed(0)` for cm⁻¹.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Sessions 86–89:** run gates with `run_in_background` from the start. The merge codemod drops the last entry's trailing
  comma. **Never put Markdown backticks in a `node -e "…"` string**: bash runs them; use Write.
- **Session 78:** reviewer batches of 7 pages, `timeout 60`. Crossref 429s if hit often. `tier-status.ts` > 2 min: background.
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the
  redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Earlier:** registry/JSX text can't hold `{…}`. Reviewer numbers need a source. `useURLState` in `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
  It joins the line across NaN points: split traces for real gaps.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
