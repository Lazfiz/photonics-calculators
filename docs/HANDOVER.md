# Handover — 2026-10-18 (session 84 → session 85)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 84 finished **imaging part 6 (fluorophores and unmixing)** on branch `phase-4/imaging-fluorophores-unmixing`
(PR #115, with this handover). Next: **imaging part 7 (OCT and holography)**; split it 7a/7b if it is too big.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- New `src/physics/imaging/fluorophores.ts`: `FLUOROPHORES` (8 FPbase proteins, mTagBFP2 → miRFP670, each with fitted
  Siano–Metzler ex/em bands), `fluorophoreByName`, `logNormalBand`, `bandAtWavelength`, `integrateSpectrum` (Simpson,
  ≤ 0.25 nm), `emissionFraction`, `brightness`, `relativeSignal`, `forsterOverlap`, `FORSTER_PREFACTOR_NM`,
  `forsterRadius(J, Φ_D, κ², n)` (m), `fretEfficiency`.
- New `src/physics/imaging/linear-unmixing.ts`: `gram`, `transposeTimes`, `reconstruct`, `choleskySolve`, `invertSpd`,
  `ols`, `nnls` (Lawson–Hanson), `fcls`, `olsCovariance` (sandwich), `shareStdDev` (delta method), `conditionNumber`,
  `simulateMixture(E, x, readNoise, rng)`. `src/physics/math.ts` gained `symmetricEigenvalues` (cyclic Jacobi).
- Test: `tests/imaging-fluorophores-unmixing.test.ts` (759 tests in all). 285 of 457 pages are tiered; 30
  `knownIssue`s, all in imaging.
- URL keys: `fluorescence-spectra` (`dye1`, `dye2`, `laser`, `filterCenter`, `filterBW`, `kappa2`, `n`, `distance`),
  `simultaneous-multicolor` (`ch1`–`ch4` = "dye,laser,centre,width", `numChannels`, `binMode`, …),
  `spectral-unmixing` (`dye1`–`dye4`, `abundance1`–`4`, `numBands`, `startNm`, `endNm`, `photons`, `method`, `seed`),
  `hyperspectral-microscopy` (`snrDb` removed; `spectralFlux`, `quantumEff`, `readNoise`, `darkCurrent`).
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/fluorescence-spectra=5.05` (R₀ nm),
   `imaging/simultaneous-multicolor=21.16`, `imaging/hyperspectral-microscopy=40.0` (MiB), spectral-unmixing κ 2.10;
   part 5: `imaging/fcs=0.7517`, `imaging/frap=0.1118`, `imaging/contrast-methods=-80.3`; part 4:
   `imaging/palm-storm=41.3`, `imaging/structured-illumination=89.9`, `imaging/expansion-microscopy=65.0`; part 3:
   `imaging/light-sheet=1.236`, `imaging/tirf=110.3`, `imaging/cleared-tissue=60.0`; part 2:
   `imaging/confocal-pin-hole=457`, `imaging/confocal-resolution=197.2`, `imaging/spinning-disk=1.12`,
   `imaging/3d-reconstruction=859`; part 1: `imaging/airy-disk=0.353`, `imaging/psf-calculator=520`,
   `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 7 (OCT and holography; goldens in ROADMAP).
3. Later: open findings (`fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), Chrome.

## Non-obvious facts
- **Session 84:**
  - FPbase (`www.fpbase.org/api/proteins/spectra/?slug=…`) is behind Cloudflare: curl needs a full Chrome User-Agent
    string plus `Accept: application/json`; plain `Mozilla/5.0` gets the challenge page.
  - A Siano–Metzler log-normal is exactly 0 past its cutoff ν = ν_m − ρH/(ρ² − 1) (the anti-Stokes side), so tail-only
    bleed-through reads 0. Integrals that cross the cutoff: tanh-sinh fails on the zero stretch, so split at the cutoff.
  - Förster prefactor (9000 ln10·1e-28/(128π⁵N_A))^(1/6)·1e7 = 0.021084 nm comes from N_A in `constants.ts`; textbooks
    round it to 0.0211. Lakowicz section numbers (§13.2) are unverified.
- **Session 83:**
  - Koppel's SNR ε√(ΔτT) is the N → ∞ limit; finite N gives a 1/√(1 + 1/N) factor.
  - Phase-contrast sign: with e^(−iωt), δ = −π/2 is positive PC. An attenuating ring of amplitude a reverses the image
    once tan(|φ|/2) > a.
  - `Number.isFinite(Infinity)` is false: a `positive()` guard rejects an `Infinity` default.
  - devctl defers foreground commands while another job holds the CPU (exit 75); queue them with `run_in_background`.
- **Session 82:** Mortensen 2010 is open in Europe PMC (PMC3127582). `SimpleChart` skips NaN points but joins the line
  across them; for real gaps use 0 or split traces. A Git Bash heredoc can drop a backslash: write scripts with Write.
- **Sessions 79–81:** TIRF d is the intensity depth. A pinhole of x AU is a diameter. Lint `preserve-manual-memoization`
  fires on a `useMemo` over clamped values: drop it.
- **Session 78:** reviewer stalls come from a hung shell: batches of 7 pages, `timeout 60`. Crossref returns 429 when
  hit too often. `tier-status.ts` takes > 2 min: run it in the background.
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the
  redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` is **LF**; scripts must keep line endings.
- **Earlier:** registry and JSX text can't hold `{…}`; write `0 − x·expm1(…)` to avoid `-0`. "From memory" reviewer
  numbers need a source. Test the extreme corner of every input range. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN; show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint
  only changed files; JSX text needs `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs.
  `git grep` skips untracked files. A bare `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
