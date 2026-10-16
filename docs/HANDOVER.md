# Handover — 2026-10-16 (session 80 → session 81)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 80 finished **imaging part 2 (confocal)** on branch `phase-4/imaging-confocal` (PR #111, with this handover).
Next: **imaging part 3 (light sheet and TIRF)**. `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- New `src/physics/imaging/confocal.ts`: `confocalFwhmCoefficients(P)` (numerical, ≈ 1–2 s), `CONFOCAL_FWHM_TABLE`
  (0–5 AU step 0.1: [AU, lateral λ/NA, axial and section λ/(n − √(n² − NA²))]), `confocalLateralFwhm`,
  `confocalAxialFwhm` (point), `confocalOpticalSectionFwhm` (plane), `pinholeAiryUnits`, `pinholeThroughput`,
  `spinningDiskFrameRate`, `pinholeFillFactor`, `CONFOCAL_MAX_PINHOLE_AU`. Regenerate the table with
  `npx tsx scripts/gen-confocal-table.ts` (≈ 1 min) if the model changes. Test: `tests/imaging-confocal.test.ts`.
- New `src/physics/imaging/light-sheet.ts`: `gaussianSheetWaist` (λ/(π NA)), `gaussianSheetRayleighRange`,
  `gaussianSheetFwhm`, `effectiveAxialFwhm` (reciprocal quadrature). Part 3 extends it.
- `confocal-pin-hole`, `confocal-resolution`, `spinning-disk`, `3d-reconstruction` are tiered (textbook).
  272 of 458 pages are tiered; 44 `knownIssue`s, all in imaging.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `selective-plane` → `light-sheet`, `working-distance` →
  `image-distance`, `strehl-ratio` + `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with
  CCD/CMOS presets. Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/confocal-pin-hole=457` (section nm),
   `imaging/confocal-resolution=197.2` (lateral nm), `imaging/spinning-disk=1.12` (AU; section 1737 nm),
   `imaging/3d-reconstruction=859` (axial nm); part 1: `imaging/airy-disk=0.353`, `imaging/psf-calculator=520`,
   `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 3 (light sheet, TIRF, cleared tissue; merge `selective-plane` → `light-sheet` with a redirect).
3. Later: the open finding on `optical-sectioning-thickness` (Wilhelm vs wave model), detectors 7b leftovers, fiber
   and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 80:**
  - Optical section (thin plane) ≠ axial PSF (point): at P → 0 they are 0.677 and 0.638 λ/(n − √(n² − NA²)). Wilhelm's
    0.64 is the point value; his geometric √2 n PH/NA term overestimates the plane response (40 % at 1 AU).
  - Lateral confocal FWHM at 1 AU is 0.502 λ/NA, only 2.4 % below widefield; it slightly overshoots (0.516) near 2 AU.
  - The pinhole integral of a radial function is 1-D: ∫ f(ρ) θ(ρ; r, p) ρ dρ with θ the arc inside the disk.
  - Grid v ≤ 80 step 0.1, 400 pupil points: within 0.05 % of a 2× finer grid and of v ≤ 120.
  - CSU: 12 scans per revolution, consistent with Tanaami 2002's 1 frame/ms at 5000 rpm (title only, not the text).
- **Session 79:**
  - A pinhole of x AU is a diameter: its edge sits at v = x · j₁,₁, so EE(1 AU) = 0.838 and EE(0.5 AU) = 0.588.
  - `axialPsfFwhm`'s 0.88 (Zeiss) rounds the Debye uniform-cos θ result 0.8859; the pages show 0.88 and plot the
    exact curve (0.7 % apart). Born & Wolf sections cited: §8.5.2, §8.6.2, §8.8, ch. 4 (not checked against the book).
  - React Compiler lint `preserve-manual-memoization` fires on a `useMemo` over clamped values: drop the `useMemo`.
- **Session 78:**
  - Reviewer stalls: when the shell hangs (dozens of leftover bash.exe or node.exe), every agent stalls with "no
    progress for 600s". Run reviewer batches of 7 pages, 2–3 at a time, with `timeout 60` on Bash and one page per Read.
    Each batch then takes 5–8 minutes.
  - Crossref returns 429 when hit too often. Space out the calls.
  - `npx tsx scripts/tier-status.ts imaging` takes more than 2 minutes; run it in the background.
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
- **Fits:** empirical fits can go unphysical inside their stated range. Timings: CI ≈ 2–3 min, physics-reviewer ≈ 9 min,
  `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN. Show NaN/∞ as "—" with a reason. Plotly can't draw Infinity.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. A `next start` can hold port 3100:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **eslint:** about 570 pre-existing warnings. Lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Shell:** physics probes are scratchpad `.ts` files, run from the repo directory (`node --import tsx <abs path>`), importing `"C:/dev/photonics-calculators/src/…"`. `python -`
  hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
