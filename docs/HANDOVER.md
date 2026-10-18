# Handover — 2026-10-18 (session 85 → session 86)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 85 finished **imaging part 7 (OCT and holography)** on branch `phase-4/imaging-oct-holography` (PR #116, with
this handover). Next: **imaging part 8 (nonlinear and photoacoustic)**; split it 8a/8b if it is too big.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- New `src/physics/imaging/oct.ts`: `OCT_GAUSSIAN_FACTOR` (2 ln2/π), `octAxialResolution(λ, Δλ, n)`, `spectralWidthHz`,
  `coherenceTime`, `coherenceLength` (= 2Δz, FWHM of |γ| in path difference), `degreeOfCoherence(opd, λ, Δλ)`,
  `fringeVisibility`, `dopplerFrequency(v, λ, n, θ)`, `tdSignalBandwidth` (2vΔλ/λ²), `fdOctSnr`, `tdOctSnr` (Choma 2003).
- New `src/physics/imaging/holography.ts`: `fresnelReconstructionPitch`, `hologramNA` (paraxial NΔx/2z),
  `maxInterferenceAngle`, `inlineMinDistance`, `depthOfFocus`, `fresnelNumber`, `slmMaxAngle`, `replayField`,
  `phaseQuantizationEfficiency` (sinc²(π/L)), `BINARY_AMPLITUDE_EFFICIENCY`, `pixelEnvelope`. `math.ts` gained `sinc`.
- Test: `tests/imaging-oct-holography.test.ts` (766 tests in all). 289 of 457 pages are tiered; 26 `knownIssue`s, all
  in imaging.
- URL keys: `optical-coherence` (`coherenceLengthMm` removed; new `aScanRateKhz`; `sourcePowerMw` is now the power on
  the sample), `low-coherence` (new `sourcePowerMw`, `detectorResponsivity`), `digital-holography` (`sensorHeight`,
  `refractiveIndex`, `numericalAperture` removed; default z 200 mm), `computer-generated-holography` (`objectPoints`,
  `diffractionEfficiency` removed; new `modulation` = phase | amplitude; `bitDepth` is 1, 2, 3, 4, 6, 8 or 10).
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 7: `imaging/optical-coherence=5.694` (µm),
   `imaging/low-coherence=6.658`, `imaging/digital-holography=7.993`, `imaging/computer-generated-holography=39.56`;
   part 6: `imaging/fluorescence-spectra=5.05`, `imaging/simultaneous-multicolor=21.16`,
   `imaging/hyperspectral-microscopy=40.0`; part 5: `imaging/fcs=0.7517`, `imaging/frap=0.1118`,
   `imaging/contrast-methods=-80.3`; part 4: `imaging/palm-storm=41.3`, `imaging/structured-illumination=89.9`,
   `imaging/expansion-microscopy=65.0`; part 3: `imaging/light-sheet=1.236`, `imaging/tirf=110.3`,
   `imaging/cleared-tissue=60.0`; part 2: `imaging/confocal-pin-hole=457`, `imaging/confocal-resolution=197.2`,
   `imaging/spinning-disk=1.12`, `imaging/3d-reconstruction=859`; part 1: `imaging/airy-disk=0.353`,
   `imaging/psf-calculator=520`, `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 8 (nonlinear and photoacoustic; goldens in ROADMAP).
3. Later: open findings (local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b,
   fiber, FSO), Chrome.

## Non-obvious facts
- **Session 85:**
  - Choma 2003 (Opt. Express) is open at Caltech: `authors.library.caltech.edu/records/yx529-g3n22/files/CHOoe03.pdf`
    downloads with `curl -A "Mozilla/5.0"`. Its SNR is a power ratio (dB = 20 log of peak/σ); its "126 dB" is the
    sensitivity at R_s = 1 (500 µW, 3.5 ms ⇒ ρ ≈ 0.73 A/W), not the SNR behind 47 dB attenuation.
  - Coherence length conventions differ by 2: l_c = cτ_c = (4 ln2/π)λ²/Δλ (FWHM of |γ| vs path difference); Fercher's
    "round-trip coherence length" (2 ln2/π)λ²/Δλ is the axial resolution in air. The old pages mixed the two.
  - A mutation probe on an untracked file can't be undone with `git checkout`: copy the file first or revert by hand.
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
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs.
  `git grep` skips untracked files. A bare `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
