# Handover — 2026-10-07 (session 2 → session 3)

**Start here:** read this file, then `docs/ROADMAP.md`. Phase 0 is done locally. The only steps left are the push and ship, and they're blocked on the user's manual step 0.1. After that comes Phase 1.

## State
- Branch `phase-0` is 5 commits ahead of `main` (`0749eb58`). **Not pushed**: the user chose to skip the push this session because the PAT is still in the `origin` URL.
  - `60181268` fix(build): 5 parse errors, 54 hidden type errors and 4 prerender TDZ crashes
  - `2fdda432` chore: Claude Code setup (CLAUDE.md, rules, skills, agents, settings, hook) and cleanup
  - `a34ec2a6` fix(mode-matching): conjugate sign in the chart overlap
  - `5b12ad97` ci: `npm run check`, `.github/workflows/ci.yml`, ESLint baseline
  - then a docs commit (ROADMAP and this handover)
- Local gates are green: `check` has 0 errors (about 1,446 warnings), tests pass 21/21, and `build` prerenders 541/541 static pages. The built `/detectors/channel-photomultiplier` contains "order-of-magnitude upper bound".
- `node_modules` is now a Windows install (`npm ci`, npm 12, Node 24.21). Nothing is running in the background.

## Next actions
1. Ask the user whether 0.1 is done: PAT revoked, remote reset, GLM backup deleted, Vercel re-authenticated.
   - Verify without printing anything: `git remote get-url origin | grep -c '@'` must output `0`.
   - `git remote -v` and `git remote get-url` are denied in settings because they would print the PAT.
2. 0.6: `git push -u origin phase-0`, open a PR (`gh pr create`), and wait for CI (about 15 min) and the Vercel preview.
   - Use `/verify` on the preview URL: channel-photomultiplier text, and check that the JSON-LD parses.
   - Then merge and verify the live site.
3. User: protect `main` so CI must pass (0.5).
4. Update the memory pointer, suggest `/clear`, and start Phase 1 (BER first).

## Non-obvious facts
- **Timings on this disk:**
  - full `tsc` takes about 4 min
  - `npm run build` takes about 6–10 min (2.3 min compile, 51 s TypeScript, then prerender)
  - `npm run check` takes about 6 min

  Always use `run_in_background` and read only the tail.
- **`prebuild` rewrites `src/generated/search-index.json`.** It produces 5,134 changed lines and a dirty tree. Run `git checkout -- src/generated/search-index.json` after every local build and never commit the file (Phase 2 registry item). CI deliberately doesn't diff it.
- **`next build` catches runtime TDZ errors that tsc misses.** Sweep with:
  `npx eslint --rule '{"@typescript-eslint/no-use-before-define": ["error", {"functions": false, "classes": false, "variables": true, "typedefs": false, "ignoreTypeReferences": true}]}' -f json -o <file> src`
  The `materials/*` hits on `baseLayout`/`plotConfig` are module-scope constants and safe.
- **ESLint baseline:** 4 rules are set to `warn` in `eslint.config.mjs`. ROADMAP tracks promoting them back to `error` in Phase 1 (purity, set-state-in-effect) and Phase 2 (memoization, any).
- **`ion-assisted-deposition` is broken and was deliberately NOT fixed:** the correct flux just exposes other bad assumptions. See ROADMAP; it's a Phase 4 rewrite. The BER bug is still open (Phase 1).
- **The project `.claude/` setup takes effect from the next session:** agents, skills, rules and the commit hook. The hook runs `node .claude/hooks/block-secrets.mjs` on every Bash call (quick exit when the command isn't `git commit`). It was tested in a scratch repo: it blocks staged and `commit -a` leaks and never echoes the secret.
- **Committing with other changes staged:** use `git commit -F msg -- <paths>`. It commits only those paths.
- **npm 12 skips the install scripts** for esbuild, sharp and unrs-resolver. Their prebuilt `win32-x64` packages are present, so this is harmless.
- **Searching and the toolchain:** Windows plus Defender means `git grep` / `git ls-files` are fast, while `grep -r` over the repo times out. Next is 16.2.2, so read `node_modules/next/dist/docs/` before using a Next API.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq` (scope `mariusrut-8463s-projects`). The MCP returned 403 until the user re-authenticates. The site is https://photonics-calculators.vercel.app.

## Working style for this project (quota)
- One phase or stage per session, then a handover and `/clear`.
- The main session designs and reviews. Routine multi-file edits go to the `implementer` agent (Sonnet, `.claude/agents/`) with the goal, allowed files, gates and a report of ≤40 lines. Batches of physics review go to `physics-reviewer`.
- Keep tool output small: tail and failures only.
