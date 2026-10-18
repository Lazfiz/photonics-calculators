# Handover — 2026-10-18 (session 81 → session 82)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 81 finished **imaging part 3 (light sheet, TIRF, cleared tissue)** on branch `phase-4/imaging-light-sheet`
(PR #112, with this handover). Next: **imaging part 4 (super-resolution)**. `polarizer-types` stays blocked until the
user is at the laptop with Chrome.

## State
- New `src/physics/imaging/tirf.ts`: `tirfCriticalAngle`, `tirfMaxAngle` (arcsin(NA/n₁)), `tirfPenetrationDepth`
  (1/(2γ), reuses fiber-sensors `evanescentDecay`), `tirfInterfaceIntensity` → `{ s, p }` (Axelrod 2001 eqs. 4–5).
- New `src/physics/imaging/cleared-tissue.ts`: `ballisticFraction`, `ballisticDepth`, `paraxialFocalShift`,
  `marginalFocalShift`. `light-sheet.ts` gained `gaussianSheetDivergence`, `gaussianSheetHalfThicknessAt`.
- Test: `tests/imaging-light-sheet-tirf.test.ts` (736 tests in all). `selective-plane` merged into `light-sheet` with a
  redirect (308 checked locally); its title is a `light-sheet` keyword.
- `light-sheet`, `tirf` (exact), `cleared-tissue` tiered. 275 of 457 pages are tiered; 40 `knownIssue`s, all in imaging.
- Regenerate `confocal.ts`'s FWHM table with `npx tsx scripts/gen-confocal-table.ts` (≈ 1 min) if the model changes.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/light-sheet=1.236` (eff. axial µm, emission 510 nm),
   `imaging/tirf=110.3` (nm), `imaging/cleared-tissue=60.0` (ballistic %); part 2: `imaging/confocal-pin-hole=457`,
   `imaging/confocal-resolution=197.2`, `imaging/spinning-disk=1.12`, `imaging/3d-reconstruction=859`; part 1:
   `imaging/airy-disk=0.353`, `imaging/psf-calculator=520`, `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`.
   Don't release unless asked.
2. Imaging part 4 (super-resolution: `palm-storm`, `structured-illumination`, `expansion-microscopy`; goldens in ROADMAP).
3. Later: the open finding on `optical-sectioning-thickness` (Wilhelm vs wave model), detectors 7b leftovers, fiber
   and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 81:**
  - TIRF d is the intensity depth, half the field decay. Interface intensity: 4 (s), 4/n² (p) at θ_c; 3.075, 3.932 at 65°.
  - Index-mismatch focal shift: paraxial n_s/n_imm and marginal tan α_imm/tan α_s bracket the real shift (Diel 2020).
  - The ROADMAP's light-sheet golden 1.2065 µm uses emission = 488 nm; the page defaults to 510 nm → 1.236 µm.
  - A merge touching < 10 files is done by hand (entry, keyword, `git rm`, redirect). A `taskkill`ed `next start`
    reports "failed, exit 1"; harmless.
- **Session 80:**
  - Optical section (thin plane) ≠ axial PSF (point): at P → 0 they are 0.677 and 0.638 λ/(n − √(n² − NA²)). Wilhelm's
    0.64 is the point value; his geometric √2 n PH/NA term overestimates the plane response (40 % at 1 AU).
  - Lateral confocal FWHM at 1 AU is 0.502 λ/NA, only 2.4 % below widefield; it slightly overshoots (0.516) near 2 AU.
  - Confocal grid v ≤ 80 step 0.1, 400 pupil points: within 0.05 % of a 2× finer grid. CSU: 12 scans per revolution.
- **Session 79:**
  - A pinhole of x AU is a diameter: its edge sits at v = x · j₁,₁, so EE(1 AU) = 0.838 and EE(0.5 AU) = 0.588.
  - `axialPsfFwhm`'s 0.88 (Zeiss) rounds the Debye result 0.8859 (0.7 %). Born & Wolf § numbers are unchecked.
  - React Compiler lint `preserve-manual-memoization` fires on a `useMemo` over clamped values: drop the `useMemo`.
- **Session 78:**
  - Reviewer stalls ("no progress for 600s") come from a hung shell. Batches of 7 pages, 2–3 at a time, `timeout 60`.
  - Crossref returns 429 when hit too often. `tier-status.ts` takes > 2 min: run it in the background.
  - Fix-part boxes in the ROADMAP hold the reviewer's golden values. Its section and equation numbers are unverified.
- **Session 69:** `SimpleChart` maps `null` y to 0; use `NaN` for gaps. On log axes, y ≤ 0 is skipped.
- **Session 68:** Registry text can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
- **Session 65:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`.
  - A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the redirect,
    `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts for multi-line edits; write regexes via the Write tool or a quoted heredoc.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` is **LF**; scripts must keep line endings.
- **Earlier:** "from memory" reviewer numbers need a source. JSX text cannot hold `{…}`. Test the extreme corner of every
  input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes, SRS manuals and PDG. Optics Express,
  Appl. Opt., IEEE and nature.com don't download. `node scripts/crossref.mjs -q "<citation>"` finds book-chapter DOIs.
- **Fits** can go unphysical inside their stated range. CI ≈ 2–3 min, physics-reviewer ≈ 9 min. `s in OBJ` is true
  for prototype keys; use `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN; show NaN/∞ as "—" with a reason. eslint: ≈ 570 old warnings, lint
  only changed files; JSX text needs `&apos;`.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `"C:/dev/photonics-calculators/src/…"`. `python -` hangs. `git grep` skips untracked files.
  A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
