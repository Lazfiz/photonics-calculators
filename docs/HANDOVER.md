# Handover — 2026-10-08 (session 18 → session 19)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, the kept-page bug list).
- Session 18 checked PR #13 in production (Vercel success, `macro-bend` → 308, `ui-check` ALL PASS, 0 console
  errors). It then fixed the safety-hazard weighting on `phase-4/hazard-weighting` (**PR #__**). Merge only after
  the user approves, then run `ui-check` against production.

## State
- **`phase-4/hazard-weighting`** (on `main` 3671181c):
  1. `fix(laser-safety)`: `src/physics/laser-safety/hazard-weighting.ts` + `tests/laser-safety-hazard-weighting.test.ts`,
     wired into `blue-light-hazard`, `uv-hazard`, `uv-exposure`, `exposure-duration`; the `uv-hazard` registry text.
  2. `docs`: ROADMAP (Phase 4 sub-item, the finding marked fixed), this file.
- **Gates:** `check`: tsc 0 errors, eslint 0 errors (1,223 warnings, was 1,231), tests 102/102. `build` 490/490 pages.
  Local `next start` + headless Chrome: the 4 pages with query inputs show the hand-checked values, 0 console errors.

## What the module holds (sources checked this session)
- S(λ): ICNIRP 2004 Table 1 (Health Phys. 87:171). The PDF is at icnirp.org (`ICNIRPUV2004.pdf`). Log-linear
  interpolation between the table points, which ICNIRP's footnote allows; the test checks it against eqns 2a–c.
- UVA eye limit: ICNIRP's 10⁴ J/m² per 8 h, unweighted, 315–400 nm. ACGIH and IEC 62471 allow 10 W/m² after
  1000 s; ICNIRP is the stricter, so the module uses it.
- B(λ): ICNIRP 2013 Table 2 (Health Phys. 105:74; `ICNIRPVisible_Infrared2013.pdf`). Small source: 100 J/m² up to
  100 s, then 1 W/m². Risk groups from IEC 62471 Table 6.1, confirmed by ams-OSRAM AN002 Table 1. Exempt and RG1
  are both 1 W/m², so on blue light alone a small source is never RG1.
- UV laser MPE: IEC 60825-1:2014 Table A.1, from memory, checked against ANSI Z136.1 Table 5a as quoted in a Sandia
  report (0.56 t^0.25 J/cm², 1 J/cm²). A copy of the standard would settle the 302.5–315 nm rows.

## Decisions (this session)
- `uv-exposure` wasn't in the finding, but it had the same Gaussian S(λ) (100× low at 180 nm, 2× low at 222 nm),
  so it was fixed too.
- The weighting charts use a log y-axis: B(λ) and S(λ) span 3 and 5 decades, and the old linear charts hid
  the tails that were wrong.
- The `uv-hazard` URL key `spectralIrr` stays (old links still work); only the label says "Irradiance (W/cm²)".

## Next actions
1. Push, open the PR, CI, preview check of the 4 pages, ask before merging, `ui-check` production.
2. Next in the Phase 4 list: `macro-bending-loss` (Marcuse; golden values are in the findings),
   `optical-sectioning-thickness` (nm/µm), the OPO threshold, `apodization-comparison`. Then 2c (tier/references).
3. `exposure-duration` leftovers (conservative or cosmetic, listed in the ROADMAP sub-item): an unused pupil
   input, the 10 s / 100 s caps, the C_A exponent, 1.5–1.8 µm, and "0.0 µs" below 18 µs.

## Ship flow (worked eleven times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `list_deployments` (filter by `sha`) gives the URL; `web_fetch_vercel_url` fetches it
  (team `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`). Or a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9. The module rounds to 1 fm (`toNm`).
  Table lookups at band edges need this.
- **Standards PDFs:** WebFetch can't read PDFs. `curl` them to the scratchpad, then use a small Node inflate +
  `Tj`/`TJ` text extractor (no pypdf or poppler on this machine). icnirp.org PDFs extract cleanly; EUR-Lex returns
  nothing to curl.
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (copy the file to the scratchpad, restore it).
- **Scratch scripts** that import `typescript` or `ts-morph` from the scratchpad need absolute paths into
  `C:/dev/photonics-calculators/node_modules/`. `node -e '…'` breaks on apostrophes; use a `.cjs` file.
- **`SimpleChart`:** it ignores `rangemode`, `range: [0, "auto"]` breaks the axis, and it skips NaN. On a log axis it
  clamps 0 to 1e-10, so leave out zero points (the pages drop the "Selected λ" marker when the weight is 0).
- **`ui-check`:** flakes on Chrome startup (loop up to 3 times until `ALL PASS` or `FAILED`); load mode
  (`node scripts/ui-check.mjs <base> load <paths…>`) prints `ALL PASS` even with errors (read
  `console errors/warnings: N`); in Git Bash set `MSYS_NO_PATHCONV=1`.
- **Local production server:** use `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs. After deleting pages, delete `.next/types` and `.next/dev/types` (stale TS2307).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
