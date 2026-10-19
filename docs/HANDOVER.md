# Handover — 2026-10-19 (session 90 → session 91)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
PR #120 (part 10b) was merged. Session 90 finished **imaging part 11 (MTF and wavefront)** on branch
`phase-4/imaging-mtf-wavefront` (with this handover; PR #121 expected). Next: **imaging part 12 (adaptive optics, speckle)**.

## State
- New `src/physics/imaging/diffraction-mtf.ts` (SI): `cutoffFrequency(NA, λ)` = 2NA/λ, `diffractionMtf(ν)`,
  `defocusW020(Δz, NA, n)` = Δz·NA²/(2n) (paraxial), `defocusedOtf(ν, W₀₂₀ in waves)` (Hopkins overlap integral, Simpson),
  `wienerGain`, `wienerTransfer` = H²/(H² + NSR), `wienerHalfFrequency(NSR)` (ν where MTF = √NSR).
- New `src/physics/imaging/wavefront.ts`: `marechalStrehl` (moved out of shack-hartmann.ts), `marechalRms(S, λ)`,
  `PV_RMS_RATIO`/`pvFromRms`/`rmsFromPv` per Zernike term, `defocusStrehlExact(σ/λ)` = sinc²(φ/2) with φ = 2√3·2πσ/λ,
  `zernikeStrehl(mode, σ/λ)` for defocus/astigmatism/coma/spherical (radial integrals with J₀, ≤ 5 waves).
- `integrateSimpson(g, a, b, n)` is now shared in `src/physics/math.ts` (coupled-mode.ts uses it).
- `wavefront-error` merged into `strehl-ratio` (redirect; title "Strehl Ratio and Wavefront Error", tier exact).
  `mtf`, `deconvolution` tier textbook. Test: `tests/imaging-mtf-wavefront.test.ts` (6 tests). 305 of 455 pages
  tiered; 11 `knownIssue`s, all imaging.
- URL keys: `mtf` na 0.95, wavelength 550, n 1, defocus 0.5 µm (was 0), nu 0.5; `deconvolution` keeps na 1.4,
  wavelengthNm 550, snrInput 30 dB and drops method, refractiveIndex, iterations, regularization, imageSize, z-slices;
  `strehl-ratio` keeps wavelengthNm 550, wfeNm 20, adds `input` rms|pv and `mode` defocus|astigmatism|coma|spherical.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS
  presets (`selective-plane`, `working-distance`, `wavefront-error` done). Keep dynamic-range,
  stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 11: `imaging/mtf=3.4545`, `imaging/deconvolution=196.4`,
   `imaging/strehl-ratio=0.9491`; part 10b: `imaging/fov-calculator=0.6668`, `imaging/pixel-fov=26.81`,
   `imaging/telecentricity=1.680`; part 10a: `imaging/magnification=10.00`, `imaging/pupil-matching=0.938`,
   `imaging/dof=3.4375`, `imaging/illumination=297.3`; parts 1–9: `git show 847a0d20:docs/HANDOVER.md`. Don't release
   unless asked.
2. Imaging part 12 (adaptive optics and speckle; goldens in ROADMAP).
3. Later: open findings (part 8 leftovers, local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`,
   detectors 7b, fiber, FSO), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 90:** the ROADMAP's φ 2.578 is kW₀₂₀ (paraxial, NA 0.95, Δz 0.5 µm); OTF(0.5) = 0.15592 matches a brute 2D
  pupil-overlap integral. The defocused OTF first goes negative near W₀₂₀ = 0.65λ (λ/2 stays positive). Exact Strehl
  (σ = 0.1λ): defocus 0.6626, astigmatism 0.6713, coma 0.6694, spherical 0.6664 vs Maréchal 0.6738. At Maréchal S 0.3
  pure defocus is 21 % lower (0.247); the balanced terms stay within 10 % (shack-hartmann's note holds for those).
  The pages were not checked in a browser; `/ship` runs the build.
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
