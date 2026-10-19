# Handover — 2026-10-19 (session 99 → session 100)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 99 did **spectroscopy fix part 3** (peak model) on branch `phase-4/spectroscopy-peak-model` (PR #130).
Next: **spectroscopy fix part 4** (Raman: raman-shift absorbs raman-spectroscopy; stimulated-raman and CARS → imaging; SERS).

## State
- New `src/physics/spectroscopy/peak-model.ts`: height-normalised Gaussian/Lorentzian/pseudo-Voigt `peakShape`,
  `peakArea`, `bandSum`, seeded `gaussianNoise` (mulberry32 + Box–Muller), `fitHeights` (linear LSQ, Cholesky, SE and
  correlation), `dipDepth` (Sparrow), `bandStats` (max, FWHM, centroid), Huang–Rhys `franckCondonWeights`,
  `vibronicLineShape`/`vibronicSpectrum`/`vibronicSpectrumNm` (ν̃, ν̃³, λ⁻² Jacobian). New `stokes-shift.ts`. 8 goldens.
- emission-spectra merged into spectral-deconvolution (redirect; `mode` = bands | vibronic; peaks in the URL as one
  `peaks=c:w:h,…` string). stokes-shift tiered exact. 322 of 449 pages tiered, 35 `knownIssue`s.
- The per-page findings, golden values and references are in the PR #127 description (`gh pr view 127`); read the
  section for the part at hand instead of re-auditing.
- **User decisions (session 96):** merges with redirects. The parts are listed in ROADMAP "Spectroscopy fix parts".
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the
  user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 3: `spectroscopy/stokes-shift=1602.6`,
   `spectroscopy/spectral-deconvolution=40.08`; part 2: `spectroscopy/spectral-line-broadening=0.3525`,
   `spectroscopy/libs-analysis=0.2128`; part 1: `spectroscopy/lambert-beer-law=31.62`,
   `spectroscopy/absorption-cross-section=1.912e-16`, `spectroscopy/optical-density=6.64`; earlier parts:
   `git show 04f88743:docs/HANDOVER.md`. Don't release unless asked.
2. Spectroscopy part 4 (ROADMAP item 4): SERS quasistatic sphere with `materials/silver.ts`; reuse imaging
   `srsLineshape` for the merged Raman pages.
3. Later: open findings (FSO `adaptive-optics` actuators-as-modes, part 8 leftovers, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome). `simultaneous-multicolor` could use `binnedReadNoise` instead of its inline copy.

## Non-obvious facts
- **Session 99:** `tests/calculator-pages.test.ts` has a page-count floor (now ≥ 440); a merge can trip it. The global
  minimum between two peak centres is often an endpoint, not the dip: `dipDepth` uses running maxima from both sides.
  devctl queues headless Chrome behind other projects' jobs (minutes): run screenshots in the background with a fresh
  `--user-data-dir`. A wavenumber through `toPrecision(4)` prints "2.002e+4": use `toFixed(0)` for cm⁻¹.
- **Session 98:** `SimpleLineChart` has no y-range prop and puts the axis minimum at the data minimum, so a Gaussian wing
  shows "5.6e-27" on the axis: round plotted values (6 decimals). A cm⁻³ density as a raw number input shows 17 digits;
  enter it in 10¹⁶ cm⁻³. TCH pseudo-Voigt deviates ≈ 1.2–1.3 % of the peak at Δ_L/Δ_G ≈ 0.6–0.9.
- **Session 97:** `no-inline-constants` flags any literal within 1 % of 299 792 (c in km/s), e.g. a slider max 3e5. Backticks
  in `node -e` ran `git push origin main:release` (failed on a stray `\`): edit docs with Edit, never a shell string.
- **Session 96:** `lede` defaults to `description`, and the registry test fails when they're equal: drop the lede. Seven
  parallel `physics-reviewer` batches of 7 finish in ≈ 6 min; ask for a draft `knownIssue` per page.
- **Session 95:** `SimpleChart` colours a markers-only trace from `line.color` (else the palette), not `marker.color`:
  give a "Current" marker trace both. Section/equation numbers in book citations were not checked, so none are cited.
- **Session 94:** React Compiler is not enabled, so `useMemo` over clamped values only earns a lint warning: cache
  heavy pure results in a module-level `Map` instead.
- **Session 92:** `useURLState` setters batch, so a preset button can call nine setters at once. `next start` exits 1
  when killed.
- **Sessions 86–89:** devctl queues heavy commands when another project's build hogs the CPU: run gates with
  `run_in_background` from the start. The merge codemod drops the last entry's trailing comma. **Never put Markdown
  backticks in a `node -e "…"` string**: bash runs them; use Write. spiedigitallibrary.org samples return HTML.
- **Session 82:** `SimpleChart` skips NaN points but joins the line across them; for real gaps split traces. A Git Bash
  heredoc can drop a backslash: write scripts with Write.
- **Session 78:** reviewer stalls come from a hung shell: batches of 7 pages, `timeout 60`. Crossref returns 429 when
  hit too often. `tier-status.ts` takes > 2 min: run it in the background (or count `tier:` lines in the registry file).
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the
  redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Earlier:** registry and JSX text can't hold `{…}`; write `0 − x·expm1(…)` to avoid `-0`. "From memory" reviewer
  numbers need a source. Test the extreme corner of every input range. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
