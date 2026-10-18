# Handover — 2026-10-18 (session 89 → session 90)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
PR #119 (part 10a) was merged. Session 89 finished **imaging part 10b (field of view, telecentricity)** on branch
`phase-4/imaging-field-of-view` (with this handover; PR #120 expected). Next: **imaging part 11 (MTF and wavefront)**.

## State
- `src/physics/imaging/field-of-view.ts` (SI) now has `objectFov(w, h, M)` → {width, height, diagonal},
  `pixelFootprint(p, M, b)`, `subtendedAngle(s, f)` = 2·atan(s/2f), `pixelIfov(p, f, b)`, `nyquistFrequency(p)` = 1/(2p),
  `nyquistPixel(λ, NA)` = λ/(4NA), plus `objectFieldDiameter`.
- New `src/physics/imaging/telecentric.ts`: `chiefRayAngle(h, s_EP)`, `magnificationChange(Δz, s_EP)` = −Δz/(s_EP + Δz)
  (0 for s_EP = ∞, NaN if the object crosses the pupil), `pupilDistanceFromSlope(h, θ_t)` = h/tan θ_t.
  The telecentric depth reuses `inoueDepthOfField` with n = 1.
- Test: `tests/imaging-field-of-view.test.ts` (6 tests). 302 of 456 pages are tiered; 15 `knownIssue`s, all imaging.
- URL keys: `fov-calculator` gains `na` 0.75, `wavelength` 550, `fieldNumber` 22; `pixel-fov` gains `pixels` 2048;
  `telecentricity` keeps `magnification` 0.5 and drops `objectDistance`, `pupilDiameter`, `maxFieldAngle` for `na` 0.025,
  `wavelength` 550, `blur` 10 µm, `fieldHeight` 5, `pupilDistance` 200, `dz` 10, `slope` 0.1°.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `strehl-ratio` + `wavefront-error` → one page,
  `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane`, `working-distance` done). Keep
  dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 10b: `imaging/fov-calculator=0.6668`,
   `imaging/pixel-fov=26.81`, `imaging/telecentricity=1.680`; part 10a: `imaging/magnification=10.00`,
   `imaging/pupil-matching=0.938`, `imaging/dof=3.4375`, `imaging/illumination=297.3`; part 9: `imaging/image-distance=66.67`,
   `imaging/afocal=-0.5`, `imaging/optical-power=58.63`; parts 1–8: `git show 5b242e6f:docs/HANDOVER.md`. Don't release
   unless asked.
2. Imaging part 11 (MTF and wavefront; goldens in ROADMAP), including the `strehl-ratio` + `wavefront-error` merge.
3. Later: open findings (part 8 leftovers, local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`,
   detectors 7b, fiber, FSO), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 89:** the ROADMAP's telecentric −0.05 is the first-order −Δz/s_EP; the exact paraxial value with a fixed
  sensor is −Δz/(s_EP + Δz) = −4.76 %. Its DoF 1.68 mm is Inoué's λ/NA² + e/(m·NA) at 550 nm, NA 0.025, e 10 µm, m 0.5.
  The pages were not checked in a browser (no build this session); `/ship` runs the build.
- **Session 88:** Inoué's and MicroscopyU's n in d = λ₀n/NA² + ne/(M·NA) is the **immersion** index (air for a dry
  objective), not the specimen's; the ROADMAP golden 5.8425 µm used n 1.52 with a dry 0.4 NA. 100×/1.4 at n 1.515 gives
  0.49547 µm (the ROADMAP's 0.4954 was truncated). MicroscopyU's resolution page gives 1.22λ/(NA_obj + NA_cond); the
  ROADMAP's 297.3 nm is λ/(NA_o + NA_c), Abbe's period. Evident's Köhler PDFs: condenser NA 0.7–0.8 × objective NA.
  spiedigitallibrary.org samples return HTML, not PDF. devctl queues heavy commands when another project's build
  hogs the CPU: run gates with `run_in_background` from the start.
- **Session 87:** Gullstrand's exact eye: 43.05 + 19.11 D, principal planes 5.7286 mm apart in n 1.336 → 58.635 D. As
  thin elements its rear focus is at 24.31 mm. The merge codemod drops the last entry's trailing comma.
  **Never put Markdown backticks in a `node -e "…"` string**: bash runs them. Use Write.
- **Session 86:** Wang & Hu 2012 is readable at `pmc.ncbi.nlm.nih.gov/articles/PMC3322413/` with a full Chrome
  User-Agent. Boyd's SFG in SI: I₃ = 2d²ω₃² I₁I₂L²/(n₁n₂n₃ε₀c³); degenerate it is 4× the SHG formula.
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
