# Handover — 2026-10-08 (session 20 → session 21)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4 findings list, or Phase 2 stage 2c).
- PR #15 (four kept-page fixes) is merged and live; production `ui-check` passed (a comment on the PR).
- Session 20 fixed findings batch 2 on `phase-4/findings-batch-2` (**PR #16**). Merge only after the user
  approves, then run `ui-check` against production.

## State
- **`phase-4/findings-batch-2`** (on `main` bf604850), one commit per topic plus docs:
  1. `dispersion-comp`: `src/physics/fiber-optics/dispersion-comp.ts` (slope mismatch, broad-source σ, penalty).
  2. `polarization-mode-dispersion`: `…/fiber-optics/polarization-mode-dispersion.ts` (mean DGD, Maxwellian tail).
  3. `stress-measurement` + `coating-stress`: `src/physics/thin-film/stoney.ts`.
  4. `infrared-glass`, `optical-glass-catalog`, `materials/chromatic-dispersion`: `src/physics/materials/sellmeier.ts`
     and `sellmeier-data.ts` (20 published sets).
  5. `dual-comb-spectroscopy`: `src/physics/spectroscopy/dual-comb-spectroscopy.ts`.
  6. `docs`: ROADMAP (findings marked fixed, "Findings batch 2" sub-item), this file.
- **Gates:** `check` green after commits 1, 2–3, 4 and 5 (tsc 0, eslint 0 errors, 1,195 warnings, was 1,219;
  143 tests). `build` green on the final tree.

## Decisions (this session)
- Shared modules are named after the physics when several pages use them (`stoney.ts`, `sellmeier.ts`); the
  redirect test matches whole hrefs, so `/thin-film/stoney` is safe next to the removed `/thin-film/stress`.
- Sellmeier data come from the refractiveindex.info database (CC0, on GitHub: `gh api` lists it,
  `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/main/database/data/...` serves the YAML).
  `specs/schott/optical/<glass>.yml` holds SCHOTT nd, Vd, density and TIE-19 dn/dT coefficients.
- Each data set is tested against an *independent* source (catalog nd/Vd, Li 1980, Chandler-Horowitz 2005, Crystran
  tables, Bond 1965, CRC n_D). Li 1980's MgF₂ runs 0.4 % high in the IR; Dodge agrees with Duncanson & Stevenson.
- No verified dispersion formula for KRS-5 or AMTIR-1: the page shows the data-sheet n at 10 µm only. A remembered
  KRS-5 set matched Crystran at 0.54/1/5/20/40 µm but not at 2 and 10 µm, so it was not used.
- New URL keys: dispersion-comp `slope`, `compSlope`, `compDispersion`, `refWavelength`, `channelWavelength`;
  PMD `maxToMean`; stress `deflectionUm`, `deflectionBeforeUm`, `filmModulus`, `filmPoisson`, `alphaSub`,
  `alphaFilm`; materials `material`, `wavelength`. Dropped: `targetResidual`, `fiberCount`, `probability`,
  `deflection` (old links fall back to defaults).
- Dual-comb defaults changed to Δf_r = 200 Hz and N = 100 000 so the default maps alias-free (the old 1 kHz with
  200 000 teeth is 4× over the f_r²/(2Δf_r) limit).

## Next actions
1. Push, CI, preview check of the 9 pages, ask before merging, `ui-check` production.
2. Then either stage **2c** (tier/references per registry entry, shown on each page; the modules state theirs in
   their headers) or the rest of the Phase 4 findings: free-space-comms (`pointing-loss`, `adaptive-optics`,
   `scintillation`), imaging (2P focal volume on 4 pages, SHG sinc²), spectroscopy (`spectral-resolution`,
   `lambert-beer-law`, …). Ask the user.
3. `exposure-duration` leftovers are still listed in the hazard-weighting ROADMAP sub-item.

## Ship flow (worked thirteen times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `list_deployments` (filter by `sha`) gives the URL; `web_fetch_vercel_url` fetches it
  (team `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`). Or a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs (whole `/<category>/<slug>` matches).
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; `hazard-weighting.ts` rounds (`toNm`).
- **Standards PDFs:** WebFetch can't read PDFs. `curl` them to the scratchpad, then a small Node inflate +
  `Tj`/`TJ` extractor. Crystran's HTML material pages carry index tables WebFetch can read.
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (copy the file to the scratchpad, restore it).
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. Never start a Bash command with a bare `cat > file` (it waits on stdin); use a heredoc.
- **Python single-file edits** on Windows: open with `newline=''` or the file turns CRLF.
- **`SimpleChart`** (what `ChartPanel` renders for scatter/bar): no `shapes`; unnamed traces stay out of the legend;
  skips NaN; on a log axis it clamps 0 to 1e-10. `ChartPanel` (Plotly) needs NaN/∞ filtered by the page.
- **`ui-check`:** flakes on Chrome startup (loop up to 3 times until `ALL PASS` or `FAILED`); load mode
  (`node scripts/ui-check.mjs <base> load <paths…>`) prints `ALL PASS` even with errors (read
  `console errors/warnings: N`); in Git Bash set `MSYS_NO_PATHCONV=1`.
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
