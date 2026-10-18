# Handover — 2026-10-18 (session 83 → session 84)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 83 finished **imaging part 5 (FCS, FRAP, phase contrast)** on branch `phase-4/imaging-fluorescence-dynamics`
(PR #114, with this handover). Next: **imaging part 6 (fluorophores and unmixing)**; split it 6a/6b if it is too big.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- New `src/physics/imaging/fluorescence-dynamics.ts`: `fcsEffectiveVolume`, `fcsMeanNumber`, `fcsDiffusionCoefficient`,
  `fcsDiffusionCorrelation`, `fcsAutocorrelation` (Widengren T/(1 − T)), `koppelSnr(ε, Δτ, T, N = ∞)`,
  `soumpasisRecovery(u)`, `axelrodFluorescence/PostBleach/Recovery(u, K)`, `frapHalfTimeRatio("disk" | "gaussian", K)`,
  `frapDiffusionCoefficient(w, τ½, γ)`.
- New `src/physics/imaging/phase-contrast.ts`: `objectPhase`, `zernikeContrast(φ, δ, ringT)`, `zernikeContrastLinear`,
  `dicShearPhase(φ, s, w)`, `dicIntensity`, `dicContrast(Γ, Δφ, I_c)`.
- Test: `tests/imaging-fluorescence-dynamics.test.ts` (747 tests in all). 281 of 457 pages are tiered; 34
  `knownIssue`s, all in imaging.
- URL keys renamed on `fcs` (`brightnessKHz`, `tripletTauUs`, new `binUs`, `time`) and `contrast-methods` (`ring`,
  `ringTransmission`, `shearNm`, `edgeNm`, `biasWaves`, `strayPct`); `frap` gained `model`, `postBleach`, `bleachK`.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/fcs=0.7517` (fL), `imaging/frap=0.1118` (µm²/s),
   `imaging/contrast-methods=-80.3` (%); part 4: `imaging/palm-storm=41.3`, `imaging/structured-illumination=89.9`,
   `imaging/expansion-microscopy=65.0`; part 3: `imaging/light-sheet=1.236`, `imaging/tirf=110.3`,
   `imaging/cleared-tissue=60.0`; part 2: `imaging/confocal-pin-hole=457`, `imaging/confocal-resolution=197.2`,
   `imaging/spinning-disk=1.12`, `imaging/3d-reconstruction=859`; part 1: `imaging/airy-disk=0.353`,
   `imaging/psf-calculator=520`, `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 6 (`fluorescence-spectra`, `spectral-unmixing`, `simultaneous-multicolor`, `hyperspectral-microscopy`;
   goldens in ROADMAP).
3. Later: the open finding on `optical-sectioning-thickness` (Wilhelm vs wave model), detectors 7b leftovers, fiber
   and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 83:**
  - Koppel's SNR ε√(ΔτT) is the N → ∞ limit; the shot-noise variance (1 + G)/(M⟨n⟩²) gives a 1/√(1 + 1/N) factor
    (the ROADMAP golden 94.9 → 92.8 at the default N). Number fluctuations add when ε²Δτ τ_D is not ≪ 1.
  - Phase-contrast sign: with e^(−iωt), δ = −π/2 (direct light advanced) is positive PC, dark objects. An attenuating
    ring of amplitude a reverses the image once tan(|φ|/2) > a; the default 25 % ring is already non-linear at φ 0.29.
  - The Soumpasis disk recovery shape doesn't depend on the bleach depth; Axelrod's γ grows with K (1.193 at 2, 1.771 at 10).
  - Wohland 2001 and Saffarian & Elson 2003 are not open full text in Europe PMC; PMC PDFs return a JS challenge page.
  - `Number.isFinite(Infinity)` is false: a `positive()` guard rejects an `Infinity` default.
  - devctl defers foreground commands while a build holds the CPU (exit 75); queue them with `run_in_background`.
- **Session 82:**
  - Mortensen 2010 is open in Europe PMC (PMC3127582): `…/europepmc/webservices/rest/PMC3127582/fullTextXML`. EMCCD
    doubles both variances. ExM post-expansion labels shrink to L/E; the code gives 62.66 nm (not the ROADMAP's 63.79).
  - `SimpleChart` skips NaN points but joins the line across them; for real gaps use 0 or split traces.
  - A Git Bash heredoc can drop a backslash in `\s`: build regexes with `String.raw` or write the script with Write.
- **Sessions 80–81:** TIRF d is the intensity depth, half the field decay. Optical section (thin plane) ≠ axial PSF
  (point). Regenerate `confocal.ts`'s table with `npx tsx scripts/gen-confocal-table.ts`.
- **Session 79:** a pinhole of x AU is a diameter: EE(1 AU) = 0.838. React Compiler lint
  `preserve-manual-memoization` fires on a `useMemo` over clamped values: drop the `useMemo`.
- **Session 78:** reviewer stalls come from a hung shell: batches of 7 pages, `timeout 60`. Crossref returns 429 when
  hit too often. `tier-status.ts` takes > 2 min: run it in the background. Reviewer section numbers are unverified.
- **Session 68:** registry text can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. Charts of ≤ 300 points: compute them in the render. A slug rename touching < 10 files: `git mv` the
  folder, change `href`, move the registry entry, add the redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` is **LF**; scripts must keep line endings.
- **Earlier:** "from memory" reviewer numbers need a source. JSX text cannot hold `{…}`. Test the extreme corner of every
  input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes, SRS manuals and PDG; Europe PMC
  full-text XML for open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN; show NaN/∞ as "—" with a reason. eslint: ≈ 550 old warnings, lint
  only changed files; JSX text needs `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `"C:/dev/photonics-calculators/src/…"`. `python -` hangs. `git grep` skips untracked files.
  A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min, physics-reviewer ≈ 5–9 min.
