# Handover — 2026-10-18 (session 86 → session 87)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 86 merged PR #116 (part 7) and finished **imaging part 8 (nonlinear and photoacoustic)** on branch
`phase-4/imaging-nonlinear-photoacoustic` (PR #117, with this handover). Next: **imaging part 9 (Gaussian optics)**.

## State
- `coherent-raman.ts`: `detectedPhotoelectrons(P, λ, τ, η)`, `srsShotNoiseSnr(δ, P, λ, τ, η)` = δ√N (Ozeki 2009).
- `multiphoton-focus.ts`: `mixedFocusFwhm(beams[{lambda, order}], n, NA)`, FWHM of ∏ I(λᵢ)^kᵢ (SRS, CARS, SFG).
- `second-harmonic-generation.ts`: `sumFrequencyWavelength`, `sfgCoefficient` (thin slab, P₃ = K P₁P₂, returns ξ = L/b_min),
  `averageSfgPower`, `sfgCoherenceLengths`.
- New `src/physics/imaging/photoacoustic.ts`: `initialPressure`, `effectiveAttenuation`, `transportMeanFreePath`,
  `fluenceAtDepth`, `paAxialResolution` (0.88 v/Δf), `paLateralResolution` (0.71 v/(NA f₀)), `acousticLossDb`,
  `stressConfinementTime`, `skinPulseLimit`, `skinLongExposureIrradianceLimit` (reuse `skin-exposure-limits.ts`).
- Test: `tests/imaging-nonlinear-photoacoustic.test.ts` (771 tests in all). 292 of 457 pages are tiered; 23 `knownIssue`s,
  all in imaging.
- URL keys: `stimulated-raman-microscopy` (new `n`, `detectedBeam` = stokes | pump, `modulationDepth` ppm,
  `quantumEfficiency`), `sum-frequency-microscopy` (new `n`, `repRate`, `deff`, `thickness`, `deltaN`), `photoacoustic`
  (`pulseEnergy`, `scatteringCoeff` removed; new `backgroundAbsorption`, `reducedScattering`, `targetDepth`, `soundSpeed`,
  `bandwidthPct`, `acousticNa`, `acousticAttenuation`; `repetitionRate` default 10 Hz, `gruneisen` 0.2).
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch (PR #117). Values for a later release check: part 8: `imaging/stimulated-raman-microscopy=5.778`,
   `imaging/sum-frequency-microscopy=452.17`, `imaging/photoacoustic=271.0`; part 7: `imaging/optical-coherence=5.694`
   (µm), `imaging/low-coherence=6.658`, `imaging/digital-holography=7.993`, `imaging/computer-generated-holography=39.56`;
   part 6: `imaging/fluorescence-spectra=5.05`, `imaging/simultaneous-multicolor=21.16`,
   `imaging/hyperspectral-microscopy=40.0`; part 5: `imaging/fcs=0.7517`, `imaging/frap=0.1118`,
   `imaging/contrast-methods=-80.3`; part 4: `imaging/palm-storm=41.3`, `imaging/structured-illumination=89.9`,
   `imaging/expansion-microscopy=65.0`; part 3: `imaging/light-sheet=1.236`, `imaging/tirf=110.3`,
   `imaging/cleared-tissue=60.0`; part 2: `imaging/confocal-pin-hole=457`, `imaging/confocal-resolution=197.2`,
   `imaging/spinning-disk=1.12`, `imaging/3d-reconstruction=859`; part 1: `imaging/airy-disk=0.353`,
   `imaging/psf-calculator=520`, `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 9 (Gaussian optics; goldens in ROADMAP).
3. Later: open findings (part 8 leftovers, local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`,
   detectors 7b, fiber, FSO), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 86:**
  - Wang & Hu 2012 (Science 335, 1458) is readable at `pmc.ncbi.nlm.nih.gov/articles/PMC3322413/` with a full Chrome
    User-Agent (Europe PMC's fullTextXML returns 500). It gives R_L = 0.71 v/(NA f₀), R_A = 0.88 v/Δf and 800 Pa per mK.
  - Boyd's SFG in SI with I = 2nε₀c|A|²: I₃ = 2d²ω₃² I₁I₂L²/(n₁n₂n₃ε₀c³); degenerate it is 4× the SHG formula.
- **Session 85:** Choma 2003 is open at Caltech (`authors.library.caltech.edu/records/yx529-g3n22/files/CHOoe03.pdf`,
  `curl -A "Mozilla/5.0"`); its SNR is a power ratio. Coherence length conventions differ by 2 (l_c = 2Δz). A mutation
  probe on an untracked file can't be undone with `git checkout`: copy the file first or revert by hand.
- **Session 84:** FPbase's API needs a full Chrome User-Agent plus `Accept: application/json`. A Siano–Metzler band is
  exactly 0 past its cutoff, so split integrals there. Förster prefactor 0.021084 nm (textbooks: 0.0211).
- **Session 83:** Koppel's SNR is the N → ∞ limit (finite N: 1/√(1 + 1/N)). With e^(−iωt), δ = −π/2 is positive phase
  contrast. A `positive()` guard rejects an `Infinity` default. devctl exit 75: queue with `run_in_background`.
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
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN; show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint
  only changed files; JSX text needs `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs.
  `git grep` skips untracked files. A bare `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
