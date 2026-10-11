# Handover — 2026-10-11 (session 39 → session 40)

**Start here:** read this file, then "Polarization part 3" in `docs/ROADMAP.md` Phase 4. Part 2 (birefringent crystals)
is done on branch `phase-4/polarization-crystals` (PR: see `gh pr list`). **Next: polarization part 3 (polarizers).**

## State
- Physics: `src/physics/polarization/{jones,mueller,stokes,uniaxial,retarders,twisted-nematic}.ts`; crystal data in
  `src/physics/materials/uniaxial-data.ts` (7 crystals, o and e). Part 3 reuses `uniaxial.ts` (`plateWaves` handles any
  optic-axis direction and returns NaN for evanescent waves) and `retarders.ts` (`tirPhaseDifference`, `tirMaxPhase`).
- Shared UI: `components/crystal-select.tsx` (`CrystalSelect`, `CrystalNote`, `resolveIndices` with NaN outside a fit's
  range, `birefringenceOf`, `materialRange`), `components/polarization-format.ts` (+ `plateTypeLabel`).
- 122 of 461 pages tiered; 13 polarization `knownIssue`s left (parts 3–4).
- The "Rutile" preset 1.973/2.165 is still in the part-3 pages; replace it with `crystalIndices("rutile", λ)` (2.613/2.909
  at 589 nm). `materials/birefringent-crystals` and `materials/crystal-birefringence` can switch to `uniaxial-data.ts` too.

## Next actions
1. PR for `phase-4/polarization-crystals`: CI, then ask the user to merge; after the merge, ui-check the six pages on
   production and spot-check defaults: `double-refraction` separation 1.0921 mm, walk-off −6.23°; `birefringence`
   16.6541 waves; `waveplate-thickness` 15.011 µm and 615.46 µm; `waveplate-order` 1.6654 waves;
   `liquid-crystal-polarizer` 0.87 %.
2. Part 3 on a new branch `phase-4/polarization-polarizers` (ROADMAP list). Glan windows need the e-ray TIR at a
   cut angle: use `plateWaves` with `nIncident` = crystal side. Verify every source on Crossref first.
3. Part 4 follows.

## Ship flow (worked thirty times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.
- **Spot values on production:** `curl -s <url> | sed 's/<[^>]*>/ /g'` and grep: the prerendered HTML has the defaults.

## Non-obvious facts
- **refractiveindex.info data:** `gh api "repos/polyanskiy/refractiveindex.info-database/git/trees/main?recursive=1"`
  lists files; raw YAML at `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/main/database/data/main/
  <MAT>/nk/<Set>.yml`. Formula 1: n² − 1 = C₀ + ΣBλ²/(λ² − Cᵢ²) → `fromResonanceWavelengths(1 + C₀, …)`; formula 2:
  same with Cᵢ in µm² → `fromSquaredForm`; formula 4 with exponents 0/1 → `fromPoleForm`. A −Dλ² term (Shi, Jundt,
  Smith) doesn't fit `SellmeierModel`.
- **Mutation checks need a transcription test:** independent sets agree only to ~1e-4, so coefficient typos survive them.
  Evaluate the published coefficient strings in the test with its own formula code (1e-9).
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`; drop the manual memo (the compiler memoizes) or depend on primitive inputs.
- **Deleted pages or modules break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **Shell:** a heredoc with apostrophes in its body fails in this Bash tool, and so does `node -e '…'` with one inside:
  use the Edit tool, or a quoted heredoc (`<<'EOF'`) into a scratchpad file. Backticks inside `node -e "…"` run as commands.
- **Book chapters on Crossref:** `curl -s https://api.crossref.org/works/10.1201/<book-id>-<n>` (CRC) or
  `10.1017/CBO9781139644181.0nn` (Born & Wolf 7th: .010 = ch. 1, .024 = ch. 15) give titles and pages.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`; in Git Bash prefix `MSYS_NO_PATHCONV=1`. Never
  `taskkill /IM chrome.exe`.
- **Dev/prod server:** stop it before `npm run build` (both use `.next`); kill with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`; a stopped `next start` leaves its `node` child on the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes.
- **Older facts** (ICNIRP/IEC/ISO sources, Seibersdorf PDFs, registry slicing): see the session-38 handover in git
  (`git show 428a05ee:docs/HANDOVER.md`).
