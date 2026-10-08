# Handover — 2026-10-08 (session 17 → session 18)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 2).
- Session 17 merged the duplicate calculators on `phase-2/duplicates` (**PR #__PR__**): 52 pages into 44, so
  524 calculators became 472. Merge it only after the user approves, then run `ui-check` against production.
- Next: the next unchecked ROADMAP item (see Next actions).

## State
- **`phase-2/duplicates`** (3 commits on `main` 3d325fd3):
  1. `fix(registry)` (`d28be16e`): HTML entities, line breaks and a JSX expression in 26 registry strings. Stage 2b
     moved the text out of JSX attributes (which decode `&apos;`), so 17 strings showed entities on the page.
  2. `refactor(registry)`: the merge. `src/registry/redirects.json` + `next.config.mjs` `redirects()`, the codemod
     `scripts/codemods/2026-10-08-merge-duplicates.ts`, 104 deleted files, 2 retitles, tests.
  3. `docs`: ROADMAP (findings, Phase 4 item), CLAUDE.md count, this file.
- **Gates:** see the PR. `check`: tsc 0 errors, eslint 0 errors (1,231 warnings), tests 96/96. `build` 490/490 pages; the routes manifest has the 52 redirects (308).
- **Local tsc gotcha:** after deleting pages, `.next/types` and `.next/dev/types` still import them, so tsc reports
  TS2307 there. Delete both folders (generated, gitignored); a build recreates them. CI is unaffected.

## How merging works now
- `src/registry/redirects.json` (`"/old/href": "/kept/href"`) is the one list. `next.config.mjs` serves it as
  `permanent: true` (308). To merge another page: add the pair and run
  `npx tsx scripts/codemods/2026-10-08-merge-duplicates.ts --write`. It removes the entry and the page dir, adds the
  old title to the keeper's `keywords`, and retargets `related`. Hand-fix other hrefs: `tests/redirects.test.ts`
  lists any href in `src/` that points at a removed page (e.g. the curated `src/app/laser-safety/page.tsx`).
- `tests/registry.test.ts` now also fails on duplicate titles and on entities, line breaks or braces in the text.

## Decisions (this session)
- Keeper = correct physics first, then coverage of the dropped pages' use. Choices that differ from the reviewers:
  `thin-film/stress` → `coating-stress` (both stress → curvature; `stress-measurement` is the inverse and has a
  10⁶ unit bug, so it stays separate); `imaging/coherent-anti-stokes` → `imaging/coherent-raman` (imaging intent).
- Not merged (different calculations): see "Found while merging duplicates" in the ROADMAP's Phase 2 findings.
- The user chose to finish the merge first and fix the bugs found in kept pages later (the site has little
  traffic and the laser-safety pages carry disclaimers). They are a Phase 4 checkbox, safety pages first.

## Next actions
1. After the merge: check the Vercel status, `ui-check` production, and spot-check a redirect
   (`curl -sI <prod>/fiber-optics/macro-bend` → 308 to `/fiber-optics/macro-bending-loss`).
2. ROADMAP Phase 2: 2c (tier/references, with Phase 4), or the kept-page bug list (Phase 4 checkbox). Small and
   self-contained: `materials/chromatic-dispersion` Sellmeier module (Malitson 1965), and `macro-bending-loss`
   (Marcuse; golden values are in the findings).

## Ship flow (worked ten times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** `list_deployments` (filter by `sha`) gives the URL; `web_fetch_vercel_url` fetches it
  (team `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`). Or a local `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Tests:** `node:test`. Check that a test can fail by mutating in place (copy the file to the scratchpad, restore it).
- **Scratch scripts** that import `typescript` or `ts-morph` from the scratchpad need absolute paths into
  `C:/dev/photonics-calculators/node_modules/`. `node -e '…'` breaks on apostrophes; use a `.cjs` file.
- **ts-morph:** removing or inserting an object's last property drops the trailing comma the registry uses; the merge
  codemod re-adds it.
- **Page edits:** use a Node script per file, guarded by markers. More than 10 files needs the codemod skill.
- **`SimpleChart`:** it ignores `rangemode`, `range: [0, "auto"]` breaks the axis, and it skips NaN.
- **`ui-check`:** flakes on Chrome startup (loop up to 3 times until `ALL PASS` or `FAILED`); load mode prints
  `ALL PASS` even with errors (read `console errors/warnings: N`); in Git Bash set `MSYS_NO_PATHCONV=1`; pages
  without an `<input>` always report "not hydrated".
- **Local production server:** use `npx next start -p 3100` (port 3000 may be another project). Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
