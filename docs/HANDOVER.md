# Handover — 2026-10-11 (session 40 → session 41)

**Start here:** read this file, then "Polarization part 4" in `docs/ROADMAP.md` Phase 4. Part 3 (polarizers) is done on
branch `phase-4/polarization-polarizers` (PR: see `gh pr list`). **Next: polarization part 4 (optical activity,
microscopy, scrambling).** Part 2 (PR #36) is merged and checked on production.

## State
- Physics: `src/physics/polarization/{jones,mueller,stokes,uniaxial,retarders,twisted-nematic,fresnel,
  reflection-polarizers,prism-polarizers,sheet-polarizer,wire-grid}.ts`; crystal data in `materials/uniaxial-data.ts`.
- `fresnel.ts`: N = n − iκ, e^{i(ωt − kz)}, r_p = −r_s at normal incidence (same as `thin-film/ellipsometry.ts`;
  `transfer-matrix.ts` uses e^{−iωt} and r_p = r_s). `phaseOf` reads a rounding-level imaginary part as 0.
- `prism-polarizers.ts`: `glanWindow` finds each edge by bisection on k_t (monotonic below the grazing limit), ~1 ms;
  `glanBalancedHypotenuse` scans θ_h in 0.5° steps then bisects, ~25 ms. The higher-index wave is the reflected one.
- Shared UI: `components/crystal-select.tsx`, `components/polarization-format.ts` (+ `fromLog10` for transmittances
  below 1e-300).
- 131 of 461 pages tiered; 6 polarization `knownIssue`s left (all part 4).

## Next actions
1. PR for `phase-4/polarization-polarizers`: CI, then ask the user to merge; after the merge, ui-check the nine pages on
   production and spot-check defaults: `brewster-polarizer` P 0.4264 (4 plates); `polarizing-beamsplitter` R_p 1.81 %;
   `glans-prism` −2.35° … 5.61°; `birefringent-polarizer` 7.191°; `wire-grid` 23.9 dB; `polymer-polarizer` 31.8 dB.
2. `polarizer-types` (sourced specs) is still open: vendor spec pages (Thorlabs, Edmund, Newport) are JS-rendered or
   403 for WebFetch and curl. Try Claude in Chrome (needs the user's browser), or ask the user for data sheets.
3. Part 4 on a new branch `phase-4/polarization-activity` (ROADMAP list). Verify every source on Crossref first.

## Ship flow (worked thirty times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.
- **Spot values on production:** `curl -s <url> | sed 's/<[^>]*>/ /g'` and grep: the prerendered HTML has the defaults.

## Non-obvious facts
- **Sources:** Crossref has chapter DOIs with titles and pages for Goldstein 3rd ed. (`10.1201/b10436-n`: Fresnel
  Equations -9, Dielectric Plates -11, Polarization Optical Elements -27), Shurcliff 1962
  (`10.4159/harvard.9780674424135.cN`: c4 parameters, c5 dichroic, c6 birefringence, c7 reflection polarizers),
  Macleod 4th ed. (`10.1201/9781420073034-cN`), Marcuvitz (`10.1049/pbew021e_chN`). Bennett's Handbook of Optics
  "Polarizers" chapter is not on Crossref. arXiv PDFs come back binary from WebFetch: `pdftotext -layout` the saved file.
- **Mutation checks need a transcription test:** independent sets agree only to ~1e-4, so coefficient typos survive them.
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`; build objects inside the memo from primitive deps instead.
- **Deleted pages or modules break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **Shell:** a heredoc whose body has an apostrophe fails in this Bash tool even when quoted (`<<'EOF'`): write the file
  with the Write tool. `python -` with no stdin hangs. Backticks inside `node -e "…"` run as commands.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`; in Git Bash prefix `MSYS_NO_PATHCONV=1`. Never
  `taskkill /IM chrome.exe`.
- **Dev/prod server:** stop it before `npm run build` (both use `.next`); kill with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`; a stopped `next start` leaves its `node` child on the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes; legend text is
  literal (use ₛ, ₚ, ₜ rather than `_s`).
- **Older facts** (refractiveindex.info YAML, Sellmeier formula types, ICNIRP/IEC sources): see the session-39 and
  session-38 handovers in git (`git log -- docs/HANDOVER.md`).
