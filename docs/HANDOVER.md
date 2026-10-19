# Handover — 2026-10-19 (session 93 → session 94)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
PR #123 (part 13) was merged. Session 93 finished **imaging part 14 (light field)** on branch
`phase-4/imaging-light-field` (with this handover; PR #124 expected). Next: **imaging part 15 (registration and
computational imaging)**, the last imaging part.

## State
- New `src/physics/imaging/light-field.ts`: `lightFieldMicroscope({na, magnification, n, lensletPitch, pixelPitch,
  lambda})` (Levoy 2006 eqs. 1–5; N_u capped at W/(2p_px), flag `pixelLimited`) and `plenopticCamera({lensletPitch,
  lensletFocal, pixelPitch, sensorWidthPx, sensorHeightPx, mainFNumber, mainFocal, focusDistance, lambda})` (Ng 2005).
- `light-field`: new URL key `n` (medium index, default 1). `plenoptic-camera`: `mainLensNA` dropped for `mainFNumber`
  (image-side f/#, default 4) and new `focusDistanceM` 1; defaults are Ng's prototype (140 mm, 125 µm, f_µ 0.5 mm, 9 µm,
  4000 × 4000). Both pages link to each other.
- Test: `tests/imaging-light-field.test.ts` (3 tests). 312 of 454 pages tiered; 4 `knownIssue`s, all imaging part 15.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the
  user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 14: `imaging/light-field=7.50`,
   `imaging/plenoptic-camera=288`; part 13: `imaging/sensor-cmos=84.44`, `imaging/dynamic-range=83.22`,
   `imaging/signal-to-noise=56.391`; part 12: `imaging/adaptive-optics=0.2810`, `imaging/speckle-imaging=21.28`; earlier
   parts: `git show 04f88743:docs/HANDOVER.md`. Don't release unless asked.
2. Imaging part 15 (`registration`, `stitching`, `denoising-algorithms`, `computational-imaging`; goldens in ROADMAP).
   Four pages with fabricated outputs: consider splitting into 15a/15b before starting.
3. Then ask the user which category to audit next (ROADMAP). Later: open findings (FSO `adaptive-optics`
   actuators-as-modes, part 8 leftovers, local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`,
   detectors 7b, fiber, FSO), `polarizer-types` (needs the user at the laptop with Chrome). `simultaneous-multicolor`
   could use `binnedReadNoise` instead of its inline copy.

## Non-obvious facts
- **Session 93:** Levoy 2006 PDF: `graphics.stanford.edu/papers/lfmicroscope/levoy-lfmicroscope-sig06.pdf` (the
  plain name 404s); Ng 2005: `graphics.stanford.edu/papers/lfcamera/lfcamera-150dpi.pdf`. Levoy's 50×/1.3 row says
  f/20 lenslets but M/(2NA) = 19.2, and Table 1's D_tot1 is rounded to 2 digits (test tolerance 1.2 %). Ng's
  prototype reports 12 usable pixels across where floor(125/9) = 13; floor ratios with `+ 1e-9` (4000·9/125 = 288).
- **Session 92:** the ROADMAP's sensorNoise(700, 1.5, 0.1) golden used dark 0.1 e⁻; the page's 0.011 e⁻ plus σ_q gives
  the same 26.50 / 26.41. With PRNU 1 % the SNR at half well is 77.45 (77.46 without DSNU and σ_q); flat-fielded 122.46.
  `useURLState` setters batch, so a preset button can call nine setters at once. `next start` exits 1 when killed.
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
