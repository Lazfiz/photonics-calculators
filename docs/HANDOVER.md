# Handover — 2026-10-18 (session 82 → session 83)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 82 finished **imaging part 4 (super-resolution)** on branch `phase-4/imaging-super-resolution` (PR #113, with
this handover). Next: **imaging part 5 (FCS, FRAP, phase contrast)**. `polarizer-types` stays blocked until the user is
at the laptop with Chrome.

## State
- `src/physics/imaging/super-resolution.ts` gained `mortensenPrecision(λ, NA, N, a, b², { estimator: "ls" | "mle",
  emccd })`, `nyquistResolution(ρ, D)`, `smlmEffectiveResolution(σ, d_N)`, `simCutoff`, `simLateralFwhm` (1/k_c),
  `simRawImageCount(m, angles)`, `expansionEffectiveResolution(d, E, probe, linker, "pre" | "post")`.
- Test: `tests/imaging-super-resolution.test.ts` (740 tests in all). `palm-storm` now computes σ_loc from photons,
  background and pixel (it was an input); SIM takes λex and λem, pattern % and harmonics; ExM takes the labelling mode.
- 278 of 457 pages are tiered; 37 `knownIssue`s, all in imaging.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `working-distance` → `image-distance`, `strehl-ratio` +
  `wavefront-error` → one page, `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane` →
  `light-sheet` done). Keep dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: `imaging/palm-storm=41.3` (effective nm),
   `imaging/structured-illumination=89.9` (nm), `imaging/expansion-microscopy=65.0` (nm); part 3:
   `imaging/light-sheet=1.236`, `imaging/tirf=110.3`, `imaging/cleared-tissue=60.0`; part 2:
   `imaging/confocal-pin-hole=457`, `imaging/confocal-resolution=197.2`, `imaging/spinning-disk=1.12`,
   `imaging/3d-reconstruction=859`; part 1: `imaging/airy-disk=0.353`, `imaging/psf-calculator=520`,
   `imaging/na-fnumber=0.1786`, `imaging/resolution=289.5`. Don't release unless asked.
2. Imaging part 5 (`fcs`, `frap`, `contrast-methods`; goldens in ROADMAP).
3. Later: the open finding on `optical-sectioning-thickness` (Wilhelm vs wave model), detectors 7b leftovers, fiber
   and FSO open findings (ROADMAP), Chrome-only checks.

## Non-obvious facts
- **Session 82:**
  - Mortensen 2010 is open in Europe PMC (PMC3127582): `…/europepmc/webservices/rest/PMC3127582/fullTextXML`. Eq. 5 is
    the MLE, eq. 6 the unweighted least-squares fit (GME, 16/9); EMCCD doubles both variances. ∫₀¹ ln t/(1+τt) dt =
    Li₂(−τ)/τ checks the tanh-sinh quadrature.
  - ExM: pre-expansion labels keep their full size L; post-expansion labels shrink to L/E. The ROADMAP's post golden
    63.79 nm wasn't reproducible; the code gives 62.66 nm.
  - `SimpleChart` skips NaN points but joins the line across them; for real gaps inside one trace use 0 or split traces.
  - A Git Bash heredoc can drop a backslash in `\s`: build regexes with `String.raw` or write the script with Write.
- **Session 81:**
  - TIRF d is the intensity depth, half the field decay. Interface intensity: 4 (s), 4/n² (p) at θ_c; 3.075, 3.932 at 65°.
  - The ROADMAP's light-sheet golden 1.2065 µm uses emission = 488 nm; the page defaults to 510 nm → 1.236 µm.
  - A merge touching < 10 files is done by hand (entry, keyword, `git rm`, redirect). A `taskkill`ed `next start`
    reports "failed, exit 1"; harmless.
- **Session 80:** optical section (thin plane) ≠ axial PSF (point): at P → 0 they are 0.677 and 0.638 λ/(n − √(n² − NA²)).
  Lateral confocal FWHM at 1 AU is 0.502 λ/NA. Regenerate `confocal.ts`'s table with `npx tsx scripts/gen-confocal-table.ts`.
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
- **Fits** can go unphysical inside their stated range. CI ≈ 2–3 min, physics-reviewer ≈ 9 min. `s in OBJ` is true
  for prototype keys; use `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN; show NaN/∞ as "—" with a reason. eslint: ≈ 570 old warnings, lint
  only changed files; JSX text needs `&apos;`.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `"C:/dev/photonics-calculators/src/…"`. `python -` hangs. `git grep` skips untracked files.
  A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
