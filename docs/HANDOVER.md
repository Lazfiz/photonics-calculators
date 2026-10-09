# Handover — 2026-10-09 (session 23 → session 24)

**Start here:** read this file, then `docs/ROADMAP.md`. With the `exposure-duration` leftovers done, every item from
the Phase 4 findings list is fixed. Next is Phase 2 stage **2c** (tier + references per registry entry, shown on
each page), unless the user picks something else (Phase 3 charts; Phase 4 golden tests for the top 50).
- **PR #19** (`phase-4/exposure-duration`) is merged (`df9e0869`) and checked on production (full `ui-check` suite
  + page values; comment on the PR).
- The user then asked for ICNIRP wherever the IEC values can't be checked: **`phase-4/uv-laser-icnirp`** switches the
  UV branch (PR, see below). Merge only after the user approves, then `ui-check` production and check that
  `/laser-safety/exposure-duration?wavelength=350&power=0.05` shows 2060 s (10⁴ J/m² at 4.86 W/m²; was "> 30 000 s").

## State
- `src/physics/laser-safety/eye-exposure-limits.ts` + `tests/laser-safety-eye-exposure-limits.test.ts` hold all
  point-source eye limits (180 nm – 1 mm); `hazard-weighting.ts` keeps only the incoherent S(λ)/B(λ) limits.
- **`phase-4/uv-laser-icnirp`** (on `main` df9e0869): one `fix(laser-safety)` commit (module UV branch, tests, page
  text) plus docs (ROADMAP, this file). 12 tests in the file; 6/6 UV mutations caught (PR #19: 18/18).

## Decisions (this session)
- Source: ICNIRP 2013 laser guidelines (open PDF: icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf).
  IEC 60825-1 is paywalled; its free preview stops before Annex A. Read the tables with `pdftotext -raw`:
  `-layout` shifts Table 5 rows and prints µ as "m" ("5 ms" is 5 µs).
- UV is ICNIRP now: 1 nm steps 302–315 nm, 10⁴ J/m² for 315–400 nm to 30 ks (no 10 W/m² step). EU Directive
  2006/25/EC Annex II Table 2.3 (image at legislation.gov.uk `/eudr/2006/25/annex/II`) confirms the ≥ 10 s values.
  It dates from 2006, before ICNIRP 2013 changed C_C (not checked: its Table 2.5); don't cite it for 1150–1400 nm.
- Point source only (C_E = 1, T₂ = 10 s). Dual limits use min(thermal, photochemical). The table's note e ("thermal
  below T₁, photochemical above") gives the same as the min from 400 to 500 nm. From 500 to 600 nm above 100 s it
  would allow C_B W/m² > 10 W/m², so the min is the safer reading.
- 1150–1400 nm adds the anterior-eye limit, 2 × skin (eye-only exposure, Table 5 note d). It binds above ≈ 1315 nm.
- The beam is a Gaussian with a 1/e² diameter (data-sheet convention), averaged over the limiting aperture. Not done:
  ICNIRP's advice to use the actual irradiance for beams < 1 mm (stated on the page).
- Wavelength range extended to 1 mm (same table). URL key `aperture` (pupil) dropped; other keys unchanged.

## Next actions
1. Push `phase-4/uv-laser-icnirp`, open the PR, CI, ask before merging, then `ui-check` production.
2. Then stage **2c** (or what the user picks).

## Ship flow (worked seventeen times)
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
- **Mutation check:** a scratchpad `mutate.mjs` (exact string replace → run one test → restore, in `try/finally`) is
  quicker than copying files by hand; use it only while no `check` is running.
- **PDFs:** `pdftotext` is on the PATH (Git Bash `/mingw64/bin`); `curl` the PDF to the scratchpad first. WebFetch
  can't read PDFs, and arXiv HTML may 404 for new papers. Springer pages redirect to a login; try the
  `…/counter/pdf/<doi>.pdf` URL of open-access journals.
- **TS syntax:** `-x ** 2` is a parse error (esbuild "Unexpected **"); write `-(x ** 2)` or `-x * x`.
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs (whole `/<category>/<slug>` matches).
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; the laser-safety modules round (`toNm`).
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. Never start a Bash command with a bare `cat > file` (it waits on stdin); use a heredoc.
  No `python3` in Git Bash; use node.
- **`SimpleChart`** (what `ChartPanel` renders for scatter/bar): no `shapes`, no second x axis; unnamed traces stay
  out of the legend; skips NaN; on a log axis it clamps values below 1e-10 to 1e-10. Filter NaN/∞ in the page anyway.
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
