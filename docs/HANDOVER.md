# Handover — 2026-10-08 (session 19 → session 20)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2 stage 2c, or the rest of the Phase 4 kept-page list).
- PR #14 (hazard weighting) is merged and live; production `ui-check` passed (a comment on the PR).
- Session 19 fixed the four named Phase 4 kept-page bugs on `phase-4/kept-page-bugs` (**PR #15**). Merge only
  after the user approves, then run `ui-check` against production.

## State
- **`phase-4/kept-page-bugs`** (on `main` 81d48ea9), one commit per page plus docs:
  1. `macro-bending-loss`: `src/physics/fiber-optics/macro-bending-loss.ts` (Marcuse 1976 + exact LP01 U, W),
     `besselJ`/`besselK` in `math.ts`. 15.9 / 3.12 / 0.111 dB/turn at 7.5 / 10 / 15 mm (the review's golden values).
  2. `optical-sectioning-thickness`: `src/physics/imaging/optical-sectioning-thickness.ts` (Zeiss confocal, Zipfel 2P).
  3. `optical-parametric-oscillator`: `src/physics/wave-optics/optical-parametric-oscillator.ts` (Boyd g, SRO threshold).
  4. `apodization-comparison`: `src/physics/spectroscopy/apodization-comparison.ts`, `besselI0` in `math.ts`.
  5. `docs`: ROADMAP (findings marked fixed, Phase 4 sub-item), this file.
- **Gates:** `check` tsc 0 errors, eslint 0 errors (1,219 warnings, was 1,223), tests all pass. `build`: see the PR.
- The gate ran green after commit 1 and again on the tree with commits 2–4 together (their files don't overlap).

## Decisions (this session)
- Module files are named after the page slug. `physics/fiber-optics/bend-loss.ts` failed `tests/redirects.test.ts`:
  its import path contains `/fiber-optics/bend-loss`, a removed href.
- `macro-bending-loss` keeps the `coreNA` URL key and adds `coreIndex` (the merged `bend-loss` page's key);
  `claddingIndex` links from that page are ignored. Defaults now reproduce the golden case (NA 0.1246).
- Pure Marcuse, no elasto-optic factor: real silica fibre loses less (R_eff ≈ 1.28 R). The page says so.
- OPO: plane-wave model with I = P/(πw²); the threshold uses the same L_eff = min(L, √π w/ρ) as the gain.
  New URL key `signalWavelength` (default 800 nm).
- Apodization: the sidelobe/ENBW table is measured, not copied from Harris 1978 (his Gaussian rows don't fit his
  own definition). Gaussian α changed 2.5 → 3 to match the −55 dB the label promised (it measures −56).
- Bessel functions use integral representations with the trapezoidal rule (exponentially convergent), not
  polynomial fits; `besselK` is ~0.05 ms, the LP01 solve ~0.2 ms (Illinois; bisection was 2.2 ms).

## Next actions
1. Push, CI, preview check of the 4 pages, ask before merging, `ui-check` production.
2. Then either stage **2c** (tier/references per registry entry, shown on each page; the new modules already
   state their tier and references in their headers) or the rest of the Phase 4 findings list
   (`dual-comb-spectroscopy`, `stress-measurement`/`coating-stress`, `infrared-glass`, `dispersion-comp`, PMD, …).
   Ask the user.
3. `exposure-duration` leftovers are still listed in the hazard-weighting ROADMAP sub-item.
4. Other pages repeat the 2P error: `two-photon-microscopy` and `multiphoton-depth` use 0.532λ/(…) or 0.532λ/NA²
   as the axial FWHM (findings, Imaging line). Reuse `twoPhotonAxialFwhm`.

## Ship flow (worked twelve times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `list_deployments` (filter by `sha`) gives the URL; `web_fetch_vercel_url` fetches it
  (team `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`). Or a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs, import paths included.
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; `hazard-weighting.ts` rounds (`toNm`).
- **Standards PDFs:** WebFetch can't read PDFs. `curl` them to the scratchpad, then a small Node inflate +
  `Tj`/`TJ` extractor. icnirp.org PDFs extract cleanly; EUR-Lex returns nothing to curl.
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (copy the file to the scratchpad, restore it).
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. `node -e '…'` breaks on apostrophes; use a heredoc into `node -`.
- **`SimpleChart`:** ignores `rangemode`; `range: [0, "auto"]` breaks the axis; skips NaN; on a log axis it clamps 0
  to 1e-10, so leave out zero points. `ChartPanel` (Plotly) needs NaN/∞ filtered by the page.
- **`ui-check`:** flakes on Chrome startup (loop up to 3 times until `ALL PASS` or `FAILED`); load mode
  (`node scripts/ui-check.mjs <base> load <paths…>`) prints `ALL PASS` even with errors (read
  `console errors/warnings: N`); in Git Bash set `MSYS_NO_PATHCONV=1`.
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead). After deleting pages, delete `.next/types`.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
