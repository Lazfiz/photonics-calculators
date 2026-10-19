# Handover — 2026-10-19 (session 91 → session 92)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
PR #121 (part 11) was merged. Session 91 finished **imaging part 12 (adaptive optics, speckle)** on branch
`phase-4/imaging-ao-speckle` (with this handover; PR expected). Next: **imaging part 13 (sensors)**.

## State
- `src/physics/free-space-comms/turbulence.ts` gains `zernikeRadialOrder(j)` (Noll ordering), `nollResidual(J)` (exact
  Δ_J: Noll's diagonal covariances (n + 1)Γ(n − 5/6)/Γ(n + 23/6), scaled so that all modes sum to 1.0299; J ≤
  `NOLL_MAX_MODES` 5000), `DM_FITTING_COEFFICIENT` (continuous 0.28, tip-tilt segments 0.134, piston segments 1.26) and
  `dmFittingVariance(pitch, r0, κ)`. `fittingErrorVariance` (Noll's 0.2944 J^(−√3/2) fit) is unchanged.
- New `src/physics/imaging/speckle.ts`: `objectiveSpeckleSize` λz/D, `subjectiveSpeckleSize` λ(1 + M)N,
  `SPECKLE_FIRST_ZERO` j₁,₁/π, `surfacePhaseRms` 4πσ_h/λ, `speckleContrast` √(1 − e^(−2σ_φ²)), `averagedContrast` C/√N.
- Test: `tests/imaging-ao-speckle.test.ts` (3 tests). Both pages tier textbook. 307 of 455 pages tiered; 9 `knownIssue`s, all imaging.
- URL keys: `adaptive-optics` keeps wavelength 550, numZernike 15 (≤ 1000), dmActuators 32, dmStroke 5 µm; adds dr0 10 and
  dmType continuous|segmentedTipTilt|segmentedPiston; drops rmsWavefront. `speckle-imaging` keeps wavelengthNm 532,
  beamDiameterMm 5 (spot D), propagationDistMm 200, surfaceRoughnessUm 1, numAverages 10; adds fNumber 8, magnification 0.5;
  drops apertureDiameterMm and speckleContrast.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS
  presets (`selective-plane`, `working-distance`, `wavefront-error` done). Keep dynamic-range,
  stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 12: `imaging/adaptive-optics=0.2810`,
   `imaging/speckle-imaging=21.28`; part 11: `imaging/mtf=3.4545`, `imaging/deconvolution=196.4`,
   `imaging/strehl-ratio=0.9491`; part 10b: `imaging/fov-calculator=0.6668`, `imaging/pixel-fov=26.81`,
   `imaging/telecentricity=1.680`; earlier parts: `git show 04f88743:docs/HANDOVER.md`. Don't release unless asked.
2. Imaging part 13 (sensors: `sensor-ccm` + `sensor-cmos` merge; goldens in ROADMAP).
3. Later: open findings (FSO `adaptive-optics` actuators-as-modes, part 8 leftovers, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome).

## Non-obvious facts
- **Session 91:** Noll's printed 0.0072 prefactor is rounded: the series then sums to 1.03075, not 1.0299, and Δ₁₅ drifts
  to 0.0271; normalising to 1.0299 reproduces Table IV. His 0.2944 J^(−√3/2) fit is within 1.3 % for 10 ≤ J ≤ 100, but the
  exact residual falls as J^(−5/6) (8 % above the fit at J 1000). The Rician speckle contrast √(1 + 2r)/(1 + r) with
  r = e^(−σ²)/(1 − e^(−σ²)) simplifies to √(1 − e^(−2σ²)). Prerendered pages and ui-check pass (0 console errors).
- **Session 90:** exact Strehl (σ = 0.1λ): defocus 0.6626 … spherical 0.6664 vs Maréchal 0.6738; the defocused OTF first
  goes negative near W₀₂₀ = 0.65λ. ROADMAP φ 2.578 is kW₀₂₀ (paraxial).
- **Sessions 86–89:** devctl queues heavy commands when another project's build hogs the CPU: run gates with
  `run_in_background` from the start. The merge codemod drops the last entry's trailing comma. **Never put Markdown
  backticks in a `node -e "…"` string**: bash runs them; use Write. spiedigitallibrary.org samples return HTML.
  Wang & Hu 2012 is at `pmc.ncbi.nlm.nih.gov/articles/PMC3322413/` with a full Chrome User-Agent.
- **Sessions 84–85:** Choma 2003 is open at Caltech (`authors.library.caltech.edu/records/yx529-g3n22/files/CHOoe03.pdf`);
  its SNR is a power ratio. A mutation probe: copy the file first. FPbase API: Chrome User-Agent + `Accept: application/json`.
- **Session 83:** Koppel's SNR is the N → ∞ limit. With e^(−iωt), δ = −π/2 is positive phase contrast. A `positive()`
  guard rejects an `Infinity` default.
- **Session 82:** `SimpleChart` skips NaN points but joins the line across them; for real gaps split traces. A Git Bash
  heredoc can drop a backslash: write scripts with Write.
- **Sessions 79–81:** TIRF d is the intensity depth. A pinhole of x AU is a diameter. Lint `preserve-manual-memoization`
  fires on a `useMemo` over clamped values: drop it.
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
