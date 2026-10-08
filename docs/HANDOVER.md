# Handover — 2026-10-08 (session 22 → session 23)

**Start here:** read this file, then `docs/ROADMAP.md`. The Phase 4 findings list is done (the imaging group was
the last); left are the `exposure-duration` leftovers and Phase 2 stage **2c**. Ask the user which.
- PR #17 (findings batch 3) was merged and checked on production before this session.
- Session 22 fixed the imaging findings on `phase-4/imaging-findings` (**PR #18**). Merge only after the user
  approves, then run `ui-check` against production (incl. a load check of the 8 pages).

## State
- **`phase-4/imaging-findings`** (on `main` 20ec0776), one commit per topic plus docs:
  1. `two-photon-microscopy`, `three-photon-microscopy`, `multiphoton-depth`: `src/physics/imaging/multiphoton-focus.ts`.
  2. `third-harmonic-microscopy` (uses the same module).
  3. `coherent-raman`: `…/imaging/coherent-raman.ts`.
  4. `second-harmonic-generation`: `…/imaging/second-harmonic-generation.ts` (Boyd–Kleinman h by Simpson).
  5. `super-resolution`: `…/imaging/super-resolution.ts`.
  6. `shack-hartmann`: `…/imaging/shack-hartmann.ts`.
  7. `docs`: ROADMAP ("Imaging findings", parent findings box ticked), this file.
- **Gates:** `check` green on the final code tree (tsc 0, eslint 0 errors, 1,166 warnings, was 1,187; 190 tests,
  was 165). `build` green (490 static pages); local production server: the 8 pages load with 0 console
  errors (`ui-check` load mode) and show the expected default values.
  A scratchpad `mutate.mjs` caught 17/17 formula mutations (incl. re-inserting the old 0.61λ/NA waist and STED baseline).

## Decisions (this session)
- `three-photon-microscopy` wasn't on the findings list but had the same Airy-as-waist error plus invented
  0.235λ/NA, 0.36λ/NA²; fixed with the shared module (commit 1).
- Focus model everywhere: Zipfel 2003's Gaussian fit to I², extended to I and I³ via w = 2ω_xy. Coefficients were
  confirmed by search (an arXiv SRS paper reproduces 404 nm / 1.22 µm / 0.166 µm³ from them) and checked against the
  exact paraxial Airy pattern in the tests. Pulses are Gaussian (P_peak = 0.94 E/τ; the old pages used E/τ).
- SHG keeps the slab-of-uniform-χ⁽²⁾ model but focused (Boyd–Kleinman, B = 0, centred focus, paraxial). With normal
  dispersion and L ≫ b the SH is suppressed, which the page now says. No closed form for h with σ ≠ 0: Simpson with
  ≥ 10 points per unit τ and per radian, capped at 4 × 10⁵ (chart worst case ≈ 40 ms).
- PALM: shot-noise limit only (no pixel-size/background inputs); the page cites Thompson 2002 and Mortensen 2010
  for what that leaves out. Zhang's 0.21λ/NA wasn't readable online, so the test fits the Airy itself (0.206).
- Shack-Hartmann dynamic range: Akondi & Dubra 2021 eq. 2 with the image width = zero-to-zero spot diameter.
  Default lenslet shape is square (sinc² spot); the old page implied circular (1.22).
- `multiphoton-depth` default µ_s 6 mm⁻¹ from Kobat, Horton & Xu 2011 (5–6 attenuation lengths ≈ 0.8–1 mm at 800 nm
  in vivo). Kobat 2009's 55 µm is fixed tissue, not used.
- URL keys. New: coherent-raman `mode` (was component state), `linewidth`, `chiNR`; third-harmonic `scatteringCoeff`;
  shack-hartmann `lensletShape`, `photons`. Dropped: shack-hartmann `dynamicRangeWaves`, `numSubapertures`.
  Changed meaning: SHG `dn` is signed n(2ω) − n(ω) (was |Δn|), `chi2` is d_eff. Default: multiphoton-depth
  `scattering` 6 (was 0.1).
- Depth charts on log axes drop points below 1e-10 (SimpleChart would clamp them flat).

## Next actions
1. Push, CI, ask before merging PR #18, then `ui-check` production with a load check of the 8 pages.
2. Then stage **2c** (tier + references per registry entry, shown on each page) or the `exposure-duration` leftovers
   (unchecked item at the end of Phase 4). Ask the user.

## Ship flow (worked fifteen times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO (302 to `vercel.com/sso-api`). Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **`ui-check` load mode** waits for an `<input>` with a React fiber; pages without inputs (e.g.
  `optical-glass-catalog`) fail with "not hydrated". Use a scratchpad copy that probes `button` instead. Wrap each
  run in `timeout 200`: a Chrome-startup hang otherwise blocks forever. Flake: loop up to 3 times.
  In Git Bash set `MSYS_NO_PATHCONV=1`, or the `/category/slug` args become Windows paths ("invalid URL").
- **Mutation check:** a scratchpad `mutate.mjs` (exact string replace → run one test → restore) is quicker than
  copying files by hand; use it only while no `check` is running.
- **PDFs:** `pdftotext` is on the PATH (Git Bash `/mingw64/bin`); `curl` the PDF to the scratchpad first. WebFetch
  can't read PDFs, and arXiv HTML may 404 for new papers.
- **TS syntax:** `-x ** 2` is a parse error (esbuild "Unexpected **"); write `-(x ** 2)` or `-x * x`.
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs (whole `/<category>/<slug>` matches).
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; `hazard-weighting.ts` rounds (`toNm`).
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. Never start a Bash command with a bare `cat > file` (it waits on stdin); use a heredoc.
- **`SimpleChart`** (what `ChartPanel` renders for scatter/bar): no `shapes`, no second x axis; unnamed traces stay
  out of the legend; skips NaN; on a log axis it clamps values below 1e-10 to 1e-10. Filter NaN/∞ in the page anyway.
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
