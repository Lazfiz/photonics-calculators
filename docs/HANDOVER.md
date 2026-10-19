# Handover — 2026-10-19 (session 95 → session 96)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 95 finished **imaging part 15b (denoising, computational imaging)** on branch `phase-4/imaging-denoising`
(PR #126 expected). **The imaging audit is complete (61/61).** Next: ask the user which category to audit next.

## State
- New `src/physics/imaging/denoising.ts`: `boxNoiseRatio`, `gaussianKernel`/`gaussianNoiseRatio` (taps to ⌈3σ_s⌉),
  `medianVarianceFactor(n)` (exact, Simpson over the order-statistic density) / `medianNoiseRatio(k)`, `snrGainDb`,
  `boxTransfer`, `gaussianTransfer`, `halfResponseFrequency`, `visuShrinkThreshold`.
- New `src/physics/imaging/computational-imaging.ts`: `singleViewSnr`/`fusedSnr` (`mode` perView | totalDose, on
  `cameraSnr`), `syntheticNa`, `coherentCutoffPeriod`, `incoherentCutoffPeriod`, `spaceBandwidthGain`.
- `denoising-algorithms`: filters box/Gaussian/median (URL `filter`), keys `inputNoise`, `filterSize`, `sigmaSpatial`,
  new `imageSize`; bilateral/NLM/wavelet/deep and their keys dropped. `computational-imaging`: new `naIll`, `dose`;
  `bgNoise` is now a mean background count; default NA 0.1.
- Test: `tests/imaging-denoising.test.ts` (7 tests, incl. a seeded Monte Carlo median check). 316 of 454 pages
  tiered; no `knownIssue`s left anywhere.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the
  user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 15b: `imaging/denoising-algorithms=9.54`,
   `imaging/computational-imaging=157.02`; part 15a: `imaging/registration=934.0`, `imaging/stitching=84.70`;
   part 14: `imaging/light-field=7.50`, `imaging/plenoptic-camera=288`; earlier parts: `git show 04f88743:docs/HANDOVER.md`.
   Don't release unless asked.
2. Ask the user which category to audit next: wave-optics 2/49, materials 4/45 or spectroscopy 5/54 (ROADMAP).
3. Later: open findings (FSO `adaptive-optics` actuators-as-modes, part 8 leftovers, local `sinc` copies,
   `fluorophores.ts` cutoff, `optical-sectioning-thickness`, detectors 7b, fiber, FSO), `polarizer-types` (needs the
   user at the laptop with Chrome). `simultaneous-multicolor` could use `binnedReadNoise` instead of its inline copy.

## Non-obvious facts
- **Session 95:** `SimpleChart` colours a markers-only trace from `line.color` (else the palette), not `marker.color`:
  give a "Current" marker trace both. Var(median of n normals): 3 → 0.448671, 5 → 0.286834, 9 → 0.166101,
  225 → 0.006968 (π/(2n) 0.006981). Section/equation numbers in book citations were not checked, so none are cited.
- **Session 94:** Robinson & Milanfar 2004 is at `users.soe.ucsc.edu/~milanfar/publications/journal/MotionPerformanceFinal.pdf`
  (equations are images; pdftotext loses them). No open Fitzpatrick 1998 PDF found; the 2-D TRE was derived and checked
  by Monte Carlo. React Compiler is not enabled, so `useMemo` over clamped values only earns a lint warning: cache
  heavy pure results in a module-level `Map` instead.
- **Session 92:** the ROADMAP's sensorNoise(700, 1.5, 0.1) golden used dark 0.1 e⁻; the page's 0.011 e⁻ plus σ_q gives
  the same 26.50 / 26.41. With PRNU 1 % the SNR at half well is 77.45 (77.46 without DSNU and σ_q); flat-fielded 122.46.
  `useURLState` setters batch, so a preset button can call nine setters at once. `next start` exits 1 when killed.
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
