# Handover — 2026-10-11 (session 38 → session 39)

**Start here:** read this file, then "Polarization part 2" in `docs/ROADMAP.md` Phase 4. Part 1 (Jones, Mueller,
Stokes) is done on branch `phase-4/polarization-jones` (PR: see `gh pr list`). **Next: polarization part 2
(birefringent crystals).**

## State
- `src/physics/polarization/{jones,mueller,stokes}.ts` exist, with the CONVENTION header in `jones.ts` (Goldstein/
  Collett). Part 2–4 modules import from them; don't redefine rotations or Stokes formulas.
- Shared UI: `components/polarization-format.ts` (`fix`, `degOrDash`, `stokesProblem`, `stateLabel`,
  `CONVENTION_NOTE`) and `components/poincare-wireframe.ts` (both hemispheres). Use them on the remaining pages.
- 116 of 461 pages tiered; 16 polarization `knownIssue`s left (parts 2–4).
- Goldstein 3rd ed. chapter titles and pages (Crossref, doi:10.1201/b10436-n) are in the comment above the
  `goldstein()` helper in `src/registry/calculators/polarization.ts`. Fresnel Equations is pp. 117–147 and Mueller
  Matrices for Dielectric Plates pp. 177–199 (useful for part 3).

## Next actions
1. PR for `phase-4/polarization-jones`: CI, then ask the user to merge; after the merge, ui-check the nine pages
   on production and spot-check: `retarder` default S₃ −1.000 "Left circular"; `degree-polarization` DOP 87.75 %;
   `stokes` DOP 0.6164; `poincare-sphere` S₂ 0.8660.
2. Part 2 on a new branch `phase-4/polarization-crystals`: the uniaxial Sellmeier table and
   `physics/polarization/uniaxial.ts` as the ROADMAP lists. Verify every Sellmeier source (DOI, table) on Crossref first.
3. Parts 3 and 4 follow, one per session.

## Ship flow (worked twenty-nine times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.
- **Spot values on production:** `curl -s <url> | sed 's/<[^>]*>/ /g'` and grep: the prerendered HTML has the defaults.

## Non-obvious facts
- **Deleted pages or modules break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **Shell:** a heredoc with apostrophes in its body fails in this Bash tool ("unexpected EOF"): write scripts with the
  Write tool, or a quoted heredoc (`<<'EOF'`) into a scratchpad `.mjs`. Backticks inside a double-quoted `node -e "…"` run as commands.
- **Seibersdorf PDFs** need a browser user agent and the `www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/
  le/las/publ/<file>.pdf` path (the `laser-led-lamp-safety.` host returns HTML).
- **ICNIRP 2013 text:** `curl -sL -o x.pdf https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`;
  Table 5 and its notes: `pdftotext -f 14 -l 15 -raw` (symbols: `e` ≤, `G` <, `9` >, `j` minus, `ms` in T_i is µs);
  additivity p. 279 (`-f 9 -l 11`).
- **IEC 60825-1:** Ed. 3 isn't public; use Schulmeister's white papers. Don't link the Ed. 1.2 copy (licensed file).
- **ISO 13855** isn't public: K = 2000 mm/s (S ≤ 500 mm), else 1600 mm/s; the 2024 edition adds D_DS and Z terms.
- **Registry scripts:** an entry sliced up to `\n  },` has no newline after its last property; match `(?=\n|$)`.
- **Oracle from the shell:** a scratch `.ts` with absolute imports (`C:/dev/photonics-calculators/src/...`); `npx tsx`.
- **Mutation check:** scratchpad script: string-replace one mutation, run the one test file, restore.
- **Book chapters on Crossref:** `curl -s https://api.crossref.org/works/10.1201/<book-id>-<n>` gives each chapter title and pages
  (n = 2, 3, …); cite a chapter by title and pages when its number is uncertain.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`; in Git Bash prefix `MSYS_NO_PATHCONV=1`. Never
  `taskkill /IM chrome.exe`. Headless screenshot: `--headless=new --virtual-time-budget=8000 --screenshot=… <url>`.
- **Dev/prod server:** stop it before `npm run build` (both use `.next`); kill with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`; a stopped `next start` leaves its `node` child on the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes.
