# Handover — 2026-10-20 (session 109 → session 110)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 109 did **spectroscopy fix part 12b** (SFG, blackbody, wavenumber-converter) on branch `phase-4/spectroscopy-sfg`
(PR #140 after `/ship`). **Spectroscopy is done: 41/41 tiered, 0 `knownIssue`s site-wide.** Next: ask the user which
category to audit next, wave-optics (2/49) or materials (4/45); start with a part 0 audit (reviewer batches).

## State
- New `src/physics/spectroscopy/sum-frequency.ts`: `sfgWavelength(λ_vis, ν̃_IR)` (reuses `sumFrequencyWavelength`),
  `resonantSusceptibility`, `sfgSusceptibility`, `sfgIntensity` (A_NR e^{iφ} + Σ A_q/(ν̃ − ν̃_q + iΓ_q)),
  `singleResonancePeakShift` (closed form, rationalised), `localMaxima` (parabolic refinement). SFG page: CH and air/water
  OH presets (illustrative amplitudes), NR amplitude/phase inputs, apparent-peak table.
- New `src/physics/spectroscopy/wavenumber.ts`: `photonFromWavelength`, `photonFromWavenumber`. Blackbody page reuses
  `src/physics/blackbody.ts` (radiance M/π, band fraction, log-log chart). Test file `tests/spectroscopy-sfg.test.ts` (5 tests).
- 352 of 441 pages tiered. **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only
  when the user asks: `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still
  has to set Vercel's Production Branch to `release`.
- **User decisions (session 96):** merges with redirects. **(session 78):** keep dynamic-range, stimulated-raman-microscopy and
  resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 12b: `spectroscopy/sum-frequency-gen=457.73` (SFG range low end,
   nm), `spectroscopy/blackbody=501.5` (Wien peak, nm), `spectroscopy/wavenumber-converter=10000.00`; part 12a:
   `imaging/signal-to-noise=56.391`, `spectroscopy/dual-comb-spectroscopy=5.000`; part 11 and earlier: `git show b649db59:docs/HANDOVER.md`.
   Redirects to check: the three hrefs removed in 12a. No release unless asked.
2. Ask the user: wave-optics or materials audit (ROADMAP "Next category audit").
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 109:** a Lorentzian tail falls only as A/Δ: a far-detuned "background only" check needs ≈ 1e-4 tolerance. Interfering
  lines pull each other: the SFG d⁺ peak shows −0.2 cm⁻¹ next to r⁺ although its own background shift is positive.
- **Session 108:** `python -` with a heredoc also hangs (stop the task). The merge codemod adds the old title as a keyword; extend that
  `keywords` array by hand afterwards.
- **Session 107:** NIST WebBook keeps higher constants in footnotes (CO ω_e y_e, ω_e z_e; HCl ω_e z_e): grep the saved HTML.
  Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
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
