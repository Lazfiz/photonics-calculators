# Handover — 2026-10-19 (session 102 → session 103)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 102 did **spectroscopy fix part 6** (stray light + calibration) on branch `phase-4/spectroscopy-stray-light`
(PR #133 after `/ship`). Next: **spectroscopy fix part 7** (FTIR: ftir-resolution, fourier-transform,
michelson-interferometer, phase-correction; split 7a/7b if big).

## State
- New `src/physics/spectroscopy/stray-light.ts`: `measuredTransmittance` ((1 − s)T + s·T_s), `absorbanceError`
  (log1p), `measuredAbsorbance`, `apparentAbsorbanceLimit`, `maxStrayRatio`, `strayRatioFromPowerRatio` (S/(1+S)),
  `overlappingOrders` (nλ′ = mλ), `orderSortingWindow`. s = stray share of the detected reference power.
- New `src/physics/spectroscopy/spectral-calibration.ts`: `czernyTurner` (via `detectorCoverage`), `pixelToWavelength`,
  `wavelengthToPixel`, `fitPolynomial` (pixels scaled to u ∈ [−1, 1], `ols` from `imaging/linear-unmixing.ts`),
  `evalPolynomial`, `polynomialSlope`, `maxCalibrationError`. Tests: `tests/spectroscopy-stray-light.test.ts`.
- stray-light-rejection merged into stray-light (redirect). spectral-calibration URL params: `pixelNoise` (nm) became
  `centroidNoise` (px); new `grooveDensity`, `order`, `deviation`, `focalLength`, `pixelPitch`, `seed`, `lines` (string).
- 329 of 445 pages tiered, 25 `knownIssue`s (all spectroscopy).
- Per-page findings, goldens and references: PR #127 description (`gh pr view 127`); read the part at hand only.
- **User decisions (session 96):** merges with redirects (ROADMAP "Spectroscopy fix parts"). **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the
  user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 6: `spectroscopy/stray-light=2.699` (measured A),
   `spectroscopy/spectral-calibration=0.0120` (cubic max error, nm); part 5: `spectroscopy/grating-efficiency=501.2`,
   `spectroscopy/spectral-range=605.3`, `spectroscopy/dispersive-element=74.7`; part 4:
   `spectroscopy/surface-enhanced-raman=1.15e+4`, `spectroscopy/raman-shift=561.893`; part 3: `spectroscopy/stokes-shift=1602.6`,
   `spectroscopy/spectral-deconvolution=40.08`; part 2: `spectroscopy/spectral-line-broadening=0.3525`,
   `spectroscopy/libs-analysis=0.2128`; part 1: `spectroscopy/lambert-beer-law=31.62`; earlier parts:
   `git show 04f88743:docs/HANDOVER.md`. Don't release unless asked.
2. Spectroscopy part 7 (ROADMAP item 7): FTIR on a shared interferogram/FFT module; Norton–Beer is in
   `apodization-comparison.ts`.
3. Later: open findings (FSO `adaptive-optics` actuators-as-modes, part 8 leftovers, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome). Gold for SERS needs a gold dataset (none in `materials/`).

## Non-obvious facts
- **Session 102:** with β₀ ≈ 3° the flat-detector distortion is nearly odd, so a quadratic calibration barely beats a
  line; a cubic is needed. Fit polynomials in a scaled pixel u ∈ [−1, 1] (pixel⁶ ≈ 10²⁰ breaks the normal equations).
  `assert.equal(-0, 0)` fails (Object.is): write `0 − x`. In `sed` replacements `&` is the match, so `&gt;` breaks:
  use Edit. NIST ASD lines download as CSV (`lines1.pl?…&format=2`); its DOI 10.18434/T4W30F is DataCite, so
  `crossref.mjs` says 404. astm.org returns 403; ASTM DOIs (10.1520/…) are in Crossref.
- **Session 101:** the Casini–Nelson envelope tends to 1 for every order near grazing (ρ → 0), so unnormalised it shows
  a false return to 100 % at the Littrow cutoff; normalised it steps at each Rayleigh anomaly (expected). |sin ψ| ≤ 1
  isn't enough for a fixed-deviation mount: α = ψ + D_v/2 < 90° needs mλ_c < d(1 + cos D_v). eslint's
  `preserve-manual-memoization` fires on `useMemo` over derived values: drop the `useMemo`. ar5iv HTML gives LaTeX.
- **Session 100:** a merge can leave a chained redirect (`/a → /b` with `/b` removed): point it at the final page.
- **Session 99:** `tests/calculator-pages.test.ts` has a page-count floor (now ≥ 440); a merge can trip it. The global
  minimum between two peak centres is often an endpoint, not the dip: `dipDepth` uses running maxima from both sides.
  devctl queues headless Chrome behind other projects' jobs (minutes): run screenshots in the background with a fresh
  `--user-data-dir`. A wavenumber through `toPrecision(4)` prints "2.002e+4": use `toFixed(0)` for cm⁻¹.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Sessions 86–89:** devctl queues heavy commands when another project's build hogs the CPU: run gates with
  `run_in_background` from the start. The merge codemod drops the last entry's trailing comma. **Never put Markdown
  backticks in a `node -e "…"` string**: bash runs them; use Write. spiedigitallibrary.org samples return HTML.
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
