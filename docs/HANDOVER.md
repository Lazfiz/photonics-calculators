# Handover — 2026-10-11 (session 41 → session 42)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md` (about 110 lines). Don't read
`docs/archive/roadmap-history.md` whole: it is frozen history (sessions 1–40, about 50k tokens), so `grep -n` it.
**Next: polarization part 4 (optical activity, microscopy, scrambling)** on a new branch `phase-4/polarization-activity`.
Session 41 merged PR #37 (polarizers; production check passed) and set up the token-hygiene tooling below.

## State
- Physics: `src/physics/polarization/{jones,mueller,stokes,uniaxial,retarders,twisted-nematic,fresnel,
  reflection-polarizers,prism-polarizers,sheet-polarizer,wire-grid}.ts`; crystal data in `materials/uniaxial-data.ts`.
- `fresnel.ts`: N = n − iκ, e^{i(ωt − kz)}, r_p = −r_s at normal incidence (same as `thin-film/ellipsometry.ts`;
  `transfer-matrix.ts` uses e^{−iωt} and r_p = r_s).
- Shared UI: `components/crystal-select.tsx`, `components/polarization-format.ts` (+ `fromLog10`).
- 131 of 461 pages tiered; 6 `knownIssue`s left (all polarization part 4). `npx tsx scripts/tier-status.ts` prints the
  table.
- **Tooling (session 41):**
  - Skills `/ship` (push → PR → CI → merge on the user's yes → production check) and `/handover`.
  - Scripts `tier-status.ts`, `crossref.mjs` and `post-merge-check.mjs`.
  - Agents: `checker` (Haiku) and `physics-reviewer`, now on Opus with high effort.
  - Session detail now goes in the PR description; ROADMAP gets one line per stage.

## Next actions
1. Ship this session's branch `chore/token-hygiene` if it is not merged yet (`gh pr list`). It has no physics changes.
   After the merge, `node scripts/post-merge-check.mjs <sha> polarization/brewster-polarizer=0.4264`.
2. Polarization part 4 (the 8 pages in ROADMAP). Verify every source with `node scripts/crossref.mjs` first. Batch
   review with `physics-reviewer`; leave mechanical edits to `implementer`.
3. `polarizer-types` (sourced specs) is still open. Vendor spec pages are JS-rendered or return 403 to WebFetch and
   curl. Try Claude in Chrome (needs the user's browser), or ask the user for data sheets.

## Non-obvious facts
- **Sources:** Crossref has chapter DOIs with titles and pages for:
  - Goldstein 3rd ed. (`10.1201/b10436-n`: Fresnel Equations -9, Dielectric Plates -11, Polarization Optical
    Elements -27);
  - Shurcliff 1962 (`10.4159/harvard.9780674424135.cN`: c4 parameters, c5 dichroic, c6 birefringence, c7 reflection
    polarizers);
  - Macleod 4th ed. (`10.1201/9781420073034-cN`);
  - Marcuvitz (`10.1049/pbew021e_chN`).

  Bennett's Handbook of Optics "Polarizers" chapter is not on Crossref. WebFetch returns arXiv PDFs as binary: save the
  file and run `pdftotext -layout` on it.
- **Mutation checks need a transcription test:** independent data sets agree only to about 1e-4, so coefficient typos
  survive them.
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`. Build the objects inside the memo from primitive deps instead.
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`, then
  `npm run check`.
- **Shell:**
  - A heredoc whose body has an apostrophe fails in this Bash tool even when quoted (`<<'EOF'`): write the file with
    the Write tool.
  - `python -` with no stdin hangs.
  - Backticks inside `node -e "…"` run as commands.
  - In Git Bash, a `/a/b` argument becomes `C:/Program Files/Git/a/b`. Prefix the command with `MSYS_NO_PATHCONV=1`, or
    pass paths without the leading slash. `post-merge-check` handles this itself.
- **Trust data:** tier, `modelNote` (≤ 220 chars) and references go in `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`. It can't hydrate-check a page with no `<input>`. Never run
  `taskkill /IM chrome.exe`.
- **Dev/prod server:**
  - Use port 3100, because 3000 may be another project's server.
  - Stop the server before `npm run build`; both use `.next`.
  - Kill it with `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`. A stopped `next start` leaves its `node` child on
    the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background, and don't edit
  `.ts` files while `check` runs.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`:**
  - It has no `shapes`; use a `mode: "markers"` trace instead.
  - It skips NaN and values ≤ 0 on log axes.
  - Legend text is literal: use ₛ, ₚ and ₜ rather than `_s`.
- **Older facts** (refractiveindex.info YAML, Sellmeier formula types, ICNIRP/IEC sources) are in the session-38 and
  session-39 handovers in git (`git log -- docs/HANDOVER.md`).
