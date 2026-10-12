# Handover — 2026-10-12 (session 42 → session 43)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole (sessions 1–40, about 50k tokens): `grep -n` it.
Session 42 shipped **polarization part 4** (PR #40, merged as `5df0ed7b`; production check passed). Polarization is
32/33 tiered with 0 `knownIssue`s left on the site. **Next: `polarizer-types`** (sourced specs), then the next
category audit, which the user picks.

## State
- New physics modules:
  - `src/physics/polarization/`: `optical-activity`, `circular-dichroism`, `spectral-depolarization`, `scrambler`,
    `interference-colours`, `conoscopy`, `photoelasticity`, `microscope-extinction`;
  - `src/physics/cie-colour.ts`: CIE 1931 2° at 5 nm, D65, sRGB, `srgbEncode`.
- Shared additions:
  - `math.ts`: `largestSymmetricEigenvalue` (Smith 1961); the smallest eigenvalue is −λmax(−A).
  - `uniaxial.ts`: `sectionRetardance` and `sectionSlowAxis`.
  - `mueller.ts`: `retarderFromCosSin`.
  - `components/rgba-canvas.tsx` draws computed images.
- 139 of 461 pages are tiered and 456 tests pass. `npx tsx scripts/tier-status.ts` prints the table.

## Next actions
1. Merge the docs PR for this handover if it is still open (`gh pr list`).
2. `polarizer-types`: sourced specs. Vendor spec pages are JS-rendered or return 403 to WebFetch and curl. Try Claude
   in Chrome (needs the user's browser), or ask the user for data sheets. Clear the two eslint warnings noted in
   ROADMAP.
3. Next category audit: ask the user (detectors 0/54 or fiber-optics 3/49). Part 0 sends `physics-reviewer` batches.
4. A production re-check of part 4, if needed: `node scripts/post-merge-check.mjs <sha>
   "polarization/optical-activity=66.524" "polarization/circular-dichroism=32 980"
   "polarization/depolarization=1.0000 → 0.5000" "polarization/microscope-polarizer=2.74 nm"
   "polarization/polarization-scrambling=0.1364" polarization/conoscopic`.

## Non-obvious facts
- **Polarization conventions:**
  - Goldstein/Collett signs, with +θ counter-clockwise looking into the beam.
  - Between linear polarizers, T is unchanged by Γ → −Γ on every plate, so fast and slow axes give the same T.
  - Mono greys go through `srgbEncode`; colours come from `interferenceColour` or `retarderChainColour`.
- **Conoscopy:** ordinary waves sit on the ends of the bisection bracket (nα = 1/√λmax(T), nγ = 1/√λmin(T)). `eigenKz`
  accepts an end with |f| ≤ 1e-12. Fringes finer than a pixel are averaged with `pixelVisibility` (sinc·sinc).
- **Scrambler:** the product of stage means needs incommensurate stage frequencies. `stageResonance` flags
  q·f_i ≈ p·f_j (p, q ≤ 4, 1 %), and the page warns. The exact locked case is an open finding.
- **Sources:**
  - Crossref chapter DOIs: Goldstein 3rd ed. `10.1201/b10436-n`; Shurcliff 1962 `10.4159/harvard.9780674424135.cN`;
    Macleod 4th ed. `10.1201/9781420073034-cN`; Marcuvitz `10.1049/pbew021e_chN`.
  - Jacobi–Anger is DLMF 10.12.2 (https://dlmf.nist.gov/10.12), not an A&S equation number.
  - WebFetch returns arXiv PDFs as binary: save the file and run `pdftotext -layout` on it.
- **Mutation checks need a transcription test:** independent data sets agree only to about 1e-4, so coefficient typos
  survive them.
- **React Compiler lint:** `useMemo` deps that are results of plain function calls can trip
  `preserve-manual-memoization`. Build the objects inside the memo from primitive deps.
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`, then
  `npm run check`.
- **Line endings:** some working files are CRLF (`core.autocrlf=true`, `.gitattributes` eol=lf). Git Bash `grep`/`sed`
  hide the CR. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files. `node -e "…"` breaks on apostrophes and runs backticks.
  - `python -` with no stdin hangs.
  - In Git Bash a `/a/b` argument becomes `C:/Program Files/Git/a/b`. Use `MSYS_NO_PATHCONV=1` (needed for
    `ui-check … load /a`). `post-merge-check` takes paths without the leading slash.
  - A quick physics probe: copy the `.ts` file under `src/` so imports resolve, run `npx tsx`, then delete it.
- **Trust data:** tier, `modelNote` (≤ 220 chars, no newlines) and references go in
  `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`. It can't hydrate-check a page with no `<input>`. Never run
  `taskkill /IM chrome.exe`.
- **Dev/prod server:**
  - Use port 3100, because 3000 may be another project's server.
  - Stop it before `npm run build`; both use `.next`.
  - `TaskStop` on `next dev` or `next start` leaves its `node` child on the port. Find the PID with
    `netstat -ano | grep :3100`, then run `taskkill //PID <pid> //T //F`.
  - Restore `next-env.d.ts` (`git checkout --`) after a dev run.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min. Run them in the background, and don't
  edit `.ts` files while `check` runs.
- **Committing:** `git add <paths>` then `git commit -F msg`, one topic each.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`:**
  - It has no `shapes`; use a `mode: "markers"` trace instead.
  - It skips NaN and values ≤ 0 on log axes.
  - Legend text is literal: use ₛ, ₚ and ₜ.
