# Handover — 2026-10-07 (session 8 → session 9)

**Start here:** read this file, then `docs/ROADMAP.md`.
- **Phases 0 and 1 are shipped.** PR #2 (`phase-0`) and PR #3 (`phase-1`) were merged into `main` on 2026-10-07 and verified live.
- Next: the nested-`<label>` codemod from "Found during Phase 1", then Phase 2.

## State
- **`main`** is at `3983934d` (merge of PR #3). Production at https://photonics-calculators.vercel.app is deployed from it.
- Session 8:
  - `5f706727` `fix(physics)`: `src/physics/random.ts` (mulberry32 `createRng`, `uniform`, Box–Muller `gaussian`) replaces `Math.random` in render in 6 pages. `react-hooks/purity` is `error` again.
  - 0.1: the user revoked the PAT and set the plain `origin` URL.
  - 0.6: PRs #2 and #3 were opened and merged with merge commits, so the stacked branch kept its history. The `phase-0` and `phase-1` branches are still on the remote and can be deleted.
- **Gates:**
  - `check`: 0 errors, 1,365 warnings, 51/51 tests.
  - `build`: green, 541 static routes. CI (`check-and-build`) is green on both PRs.
  - Live `ui-check`: 35/35 PASS, 0 console errors. The load check on the PRNG pages also shows 0 errors.
  - The 1-ulp quantum-efficiency error doesn't appear in production builds.
- **Session 8 also finished:**
  - The Vercel connector was reconnected with the team scope.
  - `main` is protected by the ruleset "Protect main": a PR and `check-and-build` are required, and force-push and deletion are blocked.
  - The z.ai backup file was deleted.
- **0.1 is done.** The z.ai key no longer works (the plan expired). The Defender exclusion is optional and wasn't done.

## Next actions
1. Nested-label codemod (ROADMAP "Found during Phase 1"): 138 `<label>` cards in 53 files wrap a `ValidatedNumberInput`.
   - Model it on `scripts/codemods/2026-10-07-input-captions.ts`: move the span content into `label={<>…</>}` and drop the wrapper.
   - Use the `codemod` skill: dry run, then a 5-file sample diff, then the tsc gate, then apply.
   - Work on a branch from `main`, then PR.
2. Phase 2: `src/physics/constants.ts` plus physics modules, then the registry.
3. Ship flow that worked:
   - push with `gh` credentials (below)
   - `gh pr create`, then `gh pr checks <n> --watch`
   - verify the preview: `get_access_to_vercel_url` (team `team_LaEJuanZGFVc5UHhLD6LRaiq`) gives a `?_vercel_share=` link; open it with a cookie jar, then curl or `ui-check`. A local `npm run start` build also works.
   - ask the user, then `gh pr merge <n> --merge`
   - wait for the Vercel status on the merge commit, then run `ui-check` against production

## Decisions made this session
- **One fixed seed per page, created inside the memo** (`createRng(1)`), not a module-level generator.
  - Every recompute draws the same sequence, so the server and client agree.
  - Changing an input rescales one noise realization rather than redrawing it.
  - There's no "new sample" button. That would be a feature: keep the initial seed fixed and put any reseed in `useState`.
- **polarization-scrambling still draws a random input angle (seeded).** The residual DoP doesn't depend on it, because rotating every Stokes vector about S3 leaves |⟨S⟩| unchanged. Only the displayed S1/S2 components change.
- **mulberry32** was chosen for simplicity (32-bit state, period 2³²). That's fine for visual noise, but not for long Monte Carlo runs. Golden values come from an independent Python port of the C reference; no published test vectors were used.

## Non-obvious facts
- **Pushing:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
  - `gh` is logged in through the keyring with `repo` and `workflow` scopes.
  - This avoids a Git Credential Manager pop-up that would block a non-interactive shell.
  - The repo is public, so `ls-remote` succeeding proves nothing about auth.
- **Preview URLs** come from the Vercel PR comment: `gh pr view <n> --json comments`. Without a share link they return 302 to a Vercel login.
- **`ui-check` load mode prints `ALL PASS` even when it logs console errors.** Read the `console errors/warnings: N` line instead.
  - The full mode also doesn't fail on console errors, because of the known 1-ulp `quantum-efficiency` error.
- **Git Bash rewrites `/path` arguments into Windows paths** (`C:/Program Files/Git/...`). Set `MSYS_NO_PATHCONV=1` before `node scripts/ui-check.mjs <base> load /a /b`.
- **Timings:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run them in the background.
- **Comparing lint before and after per file:** `git show HEAD:<p> | npx eslint --stdin --stdin-filename <p>`. It's slow (~20 s per file).
- **`ui-check` flakes on Chrome startup** ("reading 'webSocketDebuggerUrl'"). Rerun until the log has `ALL PASS` or `FAILED`.
- **Don't write `\n` inside a Python heredoc that patches TS source** (it becomes a raw newline). Patching through a `py - <<'EOF'` script with `str.count(old) == 1` asserts worked well for ≤10 files.
- **Codemods:** ts-morph parses all 524 pages in about 5 s. Keep the pattern: idempotent, self-verifying, dry run first.
- **Committing:**
  - `git commit -F msg -- <paths>` commits only those paths; untracked files need `git add` first.
  - Python is `python`/`py`, not `python3`.
- **Dev server cleanup:**
  - Kill it with `netstat -ano | grep :3000` → `taskkill //PID <pid> //F //T`.
  - Then `git checkout -- next-env.d.ts src/generated/search-index.json`.
- **Don't add, delete or rename files while `check` runs.** `scripts/` is linted too.
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4), and `point-ahead` is off by a factor of 2 (Phase 4).
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`.
- **Chrome extension:** not connected in sessions 3–8. Use `scripts/ui-check.mjs`.
