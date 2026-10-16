# Handover — 2026-10-16 (session 79 → session 80)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 79 finished **imaging part 1 (diffraction PSF)** on branch `phase-4/imaging-diffraction-psf` (PR #110, with this
handover). Next: **imaging part 2 (confocal)**. `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- New `src/physics/imaging/diffraction-psf.ts`: `airyIntensity(v)`, `lateralOpticalCoordinate`, `airyFirstZeroRadius`,
  `airyFwhm`, `encircledEnergyAiry(v)`, `paraxialAxialIntensity(u)`, `axialOpticalCoordinate`, `axialIntensity(z, λ, n, NA)`
  (Debye on-axis sinc²), `axialFirstZero`, `naFromFNumber`, `fNumberFromNa`, `thinLensNa`; constants
  `BESSEL_J1_FIRST_ZERO`, `AIRY_HALF_MAX_V`, `SINC2_HALF_MAX_X`. Test: `tests/imaging-diffraction-psf.test.ts`.
- `airy-disk`, `resolution`, `psf-calculator` (textbook) and `na-fnumber` (exact) are tiered.
- 268 of 458 pages are tiered. There are 48 `knownIssue`s, all in imaging.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `selective-plane` → `light-sheet`, `working-distance` →
  `image-distance`, `strehl-ratio` + `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with
  CCD/CMOS presets. Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/airy-disk=0.353` (µm, default),
   `imaging/psf-calculator=520` (axial FWHM nm), `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5` (Abbe nm).
   Don't release unless asked.
2. Imaging part 2 (confocal): extend `optical-sectioning-thickness.ts`; `confocal-pin-hole`, `confocal-resolution`,
   `spinning-disk`, `3d-reconstruction`. Reuse `encircledEnergyAiry` for pinhole throughput (v = j₁,₁ · AU).
3. Later: the detectors part 7b leftovers, fiber and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 79:**
  - A pinhole of x AU is a diameter: its edge sits at v = x · j₁,₁, so EE(1 AU) = 0.838 and EE(0.5 AU) = 0.588.
  - `axialPsfFwhm`'s 0.88 (Zeiss) rounds the Debye uniform-cos θ result 0.8859; the pages show 0.88 and plot the
    exact curve (0.7 % apart). Born & Wolf sections cited: §8.5.2, §8.6.2, §8.8, ch. 4 (not checked against the book).
  - React Compiler lint `preserve-manual-memoization` fires on a `useMemo` over clamped values: drop the `useMemo`.
- **Session 78:**
  - The registry test allows a `knownIssue` of 40–240 characters ending in a full stop, with no `{}`, and only on an
    untiered page.
  - Reviewer stalls: when the shell hangs (dozens of leftover bash.exe or node.exe), every agent stalls with "no
    progress for 600s". Run reviewer batches of 7 pages, 2–3 at a time, with `timeout 60` on Bash and one page per Read.
    Each batch then takes 5–8 minutes.
  - Crossref returns 429 when hit too often. Space out the calls.
  - One Opus safeguard false positive stopped a reviewer (req_011Cg5yPcFoLiDXcpkpNs3P7); a relaunch passed.
  - `npx tsx scripts/tier-status.ts imaging` takes more than 2 minutes; run it in the background.
  - Fix-part boxes in the ROADMAP hold the reviewer's golden values. Its section and equation numbers are unverified.
- **Session 77:** Seib semi-infinite: η(f) = 1 − e^(−αW)/(1 + α L_f); subtract the MTF floor before integrating
  line-spread shares. PDG PDFs: `pdg.lbl.gov/<year>/reviews/rpp<year>-rev-<name>.pdf`. Use `node --import tsx --test
  <file>`: `npx tsx --test` stalled for > 2 min.
- **Session 76:** EMVA 1288 PDFs download with curl: `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf`. DSNU₁₂₈₈ is
  absolute (e⁻), PRNU₁₂₈₈ relative; σ_q² = 1/12 DN². Random patterns in a client page must be seeded (module-level const).
- **Session 74:** rect ⊗ rect is a trapezoid of FWHM max(a, b). Johnson noise of 50 Ω beats shot noise below ≈ 1 mA.
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
- **eslint:** about 665 pre-existing warnings. Lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Shell:** physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`. `python -`
  hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
