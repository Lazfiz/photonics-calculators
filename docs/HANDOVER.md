# Handover — 2026-10-20 (session 107 → session 108)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 107 did **spectroscopy fix part 11** (molecular) on branch `phase-4/spectroscopy-molecular` (PR #138 after `/ship`).
Next: **spectroscopy fix part 12** (snr-averaging + signal-to-noise → imaging/signal-to-noise, fourier-self-comb → dual-comb,
sum-frequency-gen, blackbody, wavenumber-converter; split 12a/12b if big). Then ask the user: wave-optics or materials audit.

## State
- New `diatomic.ts` (wavenumbers in m⁻¹): `DIATOMICS` (CO, HCl: NIST constants incl. ω_e y_e, ω_e z_e; AME2020 masses,
  IUPAC abundances, minor isotopologue), `reducedMass`, `rotationalConstant(V)`, `vibrationalTerm`, `isotopologue`,
  `rotationalPartition` (NaN if not converged at the J cap), `rotationalLines` (HITRAN S per molecule in level v), `rovibrationalBand`.
- New `terahertz.ts`: `waterPermittivity` (LHM double Debye), `lorentzPermittivity`, `constantPermittivity`, `complexIndex`,
  `slabTransmission(Polar)`, `extractIndex`, `maxAbsorption` (Jepsen–Fischer, floored at 0).
- New `photoemission.ts`: `kineticEnergy`, `imfpTpp2m` (E above E_F, NaN below 50 eV), `samplingDepth`, `TPP2M_MATERIALS`.
- Tests: `tests/spectroscopy-molecular.test.ts` (5). 349 of 444 pages tiered, 4 `knownIssue`s (all spectroscopy, part 12).
- Per-page findings, goldens and references: PR #127 description (`gh pr view 127`); read the part at hand only.
- **User decisions (session 96):** merges with redirects (ROADMAP "Spectroscopy fix parts"). **Release flow:** merges to `main`
  deploy nothing. Production deploys only from `release`, and only when the user asks: `git push origin main:release`, then
  `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set Vercel's Production Branch to `release`.
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 11: `spectroscopy/microwave-spectroscopy=115.2712` (GHz),
   `spectroscopy/infrared-spectroscopy=2885.98` (cm⁻¹), `spectroscopy/terahertz-spectroscopy=2.070` (n at 1 THz, 20 °C),
   `spectroscopy/electron-spectroscopy=1197.6` (eV; λ 3.08 nm); part 10: `spectroscopy/pump-probe=-2.752`,
   `spectroscopy/time-resolved=12.50`, `spectroscopy/fluorescence-quantum-yield=0.6454`, `spectroscopy/two-dimensional=282.8`;
   earlier parts: `git show db346912:docs/HANDOVER.md`. No release unless asked.
2. Spectroscopy part 12 (ROADMAP item 12); PR #127 has the findings.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
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
