# Handover — 2026-10-20 (session 103 → session 104)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 103 did **spectroscopy fix part 7** (FTIR) on branch `phase-4/spectroscopy-ftir` (PR after `/ship`).
Next: **spectroscopy fix part 8** (throughput and cavities: jacquinot, conc-mirror, etalon-fsr, cavity-ring-down).

## State
- New `src/physics/fft.ts`: `nextPow2`, `fftRadix2` (in place, inverse includes 1/N), `dft` (any N via Bluestein).
  Use it instead of O(N²) DFT loops (several old pages still have them).
- New `src/physics/spectroscopy/ftir.ts`: `FTIR_APODIZATIONS` (boxcar, triangular, Happ–Genzel, Norton–Beer weak/medium/strong,
  Blackman–Harris 3/4), `apodization`, `instrumentLineShape` (closed form; NB by Simpson), `ilsFwhm`, `ilsHighestSidelobe`,
  `nominalResolution`, `singleSidedPoints`, `scanTime`, `modulationFrequency`, `lineInterferogram`, `halfVisibilityOpd`,
  `cosineTransform`. `fourier-transform.ts`: `amplitudeSpectrum` (coherent gain), `aliasedFrequency`, `noiseFloorRms`.
  `ftir-phase-correction.ts`: `synthesizeInterferogram`, `findZpd`, `lowResolutionPhase`, `phaseAt`, `mertz`, `forman`,
  `uncorrectedSpectrum`, `magnitudeSpectrum`, `relativeRmsError`. Tests: `tests/spectroscopy-ftir.test.ts`.
- URL params changed: fourier-transform `noise` is now RMS (was p-p), new `sampleRate`, `window`; ftir-resolution
  `apodization` (URL now); michelson `sourceWidth` → `linewidth` (cm⁻¹), new `lineSpacing`, `apodization`, default
  `nPoints` 512; phase-correction `opdPoints` = single-sided N (512–8192), new `doubleSided`, `zpdShift`,
  `phaseOffset`, `dispersion`, `noise` (% of centreburst, replaces `phaseNoise`), `method` (mertz/forman/magnitude).
- 333 of 445 pages tiered, 21 `knownIssue`s (all spectroscopy).
- Per-page findings, goldens and references: PR #127 description (`gh pr view 127`); read the part at hand only.
- **User decisions (session 96):** merges with redirects (ROADMAP "Spectroscopy fix parts"). **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the
  user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 7: `spectroscopy/ftir-resolution=0.6034` (boxcar ILS
   FWHM, cm⁻¹), `spectroscopy/michelson-interferometer=220.6` (half-visibility OPD, µm), `spectroscopy/phase-correction=0.449`
   (Mertz error, %); part 6: `spectroscopy/stray-light=2.699`, `spectroscopy/spectral-calibration=0.0120`; part 5:
   `spectroscopy/grating-efficiency=501.2`, `spectroscopy/spectral-range=605.3`, `spectroscopy/dispersive-element=74.7`;
   earlier parts: `git show 384d9995:docs/HANDOVER.md`. Don't release unless asked.
2. Spectroscopy part 8 (ROADMAP item 8): jacquinot (golden 1000 cm⁻¹, 1 cm → 6.283e-3 sr), conc-mirror, etalon-fsr,
   cavity-ring-down; PR #127 has the findings.
3. Later: open findings (FSO `adaptive-optics` actuators-as-modes, part 8 leftovers, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome). Gold for SERS needs a gold dataset (none in `materials/`).

## Non-obvious facts
- **Session 103:** Norton–Beer coefficients (Naylor & Tahic 2007) give FWHM ratios 1.2/1.4/1.6 exactly: a good check. The
  Mertz ramp makes Re(C) ≈ B cos φ; in the found-ZPD frame the phase is φ + 2πσ·shift·Δx (sign!). Numeric ILS for 8
  windows took 0.5 s: use closed forms for cosine sums. devctl blocks a whole foreground command while a gate runs.
- **Sessions 101–102:** fit polynomials in a scaled variable u ∈ [−1, 1]. `assert.equal(-0, 0)` fails (Object.is). In
  `sed` replacements `&` is the match and a backslash-n a newline: use Edit. eslint's `preserve-manual-memoization` fires on
  `useMemo` over derived values: drop the `useMemo`. NIST ASD DOI is DataCite (`crossref.mjs` 404); astm.org 403s,
  ASTM DOIs (10.1520/…) are in Crossref. ar5iv HTML gives LaTeX.
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
