# Handover — 2026-10-07 (session 4 → session 5)

**Start here:** read this file, then `docs/ROADMAP.md`. Phase 0 is done but not pushed: the user's manual step 0.1 is still open.
At the start of session 4 the `origin` URL still embedded a credential. Phase 1 items 1–2 are done on `phase-1`.
Next: the Phase 1 JSON-LD codemod and the 55 placeholder descriptions.

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
- **`phase-1`** is stacked on `phase-0` and also not pushed. Session 3 added the shared math and BER work; session 4 added:
  - `ffc2414b` fix(url-state): `src/lib/url-state-store.ts` + `useSyncExternalStore` in `use-url-state.ts` + `tests/url-state-store.test.ts`
  - `97917a56` fix(inputs): clamp on blur/Enter in `validated-number-input` and `input-slider`; `src/lib/number-input.ts` + test
  - `b0afc487` chore(eslint): `set-state-in-effect` back to `error`
  - test(ui): `scripts/ui-check.mjs` (headless Chrome over CDP)
  - then a docs commit (ROADMAP tick, findings, this file)
- **Gates on `phase-1`:**
  - `check`: 0 errors, 1,440 warnings, 41/41 tests.
  - `build`: green, 541/541 prerendered.
- **UI check:** `node scripts/ui-check.mjs` passes on dev: boxcar-integrator (min=10: typing 50 stays 50), ber (shared link plus reset removes the param) and quantum-efficiency (slider). It also passes 25/25 on `next start` after the build, with 0 console errors.

## Next actions
1. Ask the user whether 0.1 is done.
   - Check without printing the URL: `u=$(git config --get remote.origin.url); case "$u" in https://*@*) echo with-credential;; *) echo clean;; esac`
   - `git remote -v` / `get-url` are denied.
2. If it's done, ship (0.6):
   - Push `phase-0`, open a PR and merge after CI and the preview.
   - Then push `phase-1` and open a PR against `main`.
   - On the preview, check the ber and bpsk-qpsk charts (log₁₀ axis, dotted no-noise curves) and run `node scripts/ui-check.mjs <preview-url>`. The preview may need Vercel auth; the production URL works after merge.
3. Phase 1 item 3: rebuild JSON-LD from each page's `metadata` (427 pages, so use the `/codemod` skill) and write the 55 placeholder descriptions.
4. Later Phase 1 items:
   - ShareButton hydration and the breadcrumb; make "541" a computed value.
   - The `label="{label}"` codemod (40 files) and rendering `CalculatorShell` in the 64 pages that don't.
   - A seeded PRNG for the 6 `Math.random` pages, then `purity` back to `error`.

## Decisions made this session
- **`useURLState`:** the URL is the source of truth, plus an overlay of unflushed writes.
  - The server snapshot is the default (static prerender), so a shared link still shows the defaults until hydration. "Read URL state before first paint" stays in Phase 3.
  - Setting a value whose `String()` equals the default's removes the param. Non-finite URL numbers become the default.
  - URL values are **not range-checked**; see the ROADMAP finding.
  - A failed `replaceState` (Safari throttling) keeps the overlay, and the next write retries.
- **Number inputs:** in-range values reach `onChange` live. Out-of-range values are held back: `ValidatedNumberInput` shows a "Min/Max" warning, `InputSlider` sets `aria-invalid` and a yellow border.
  - They're clamped on blur or Enter, and the warning stays to explain the change. Invalid or empty text reverts.
  - Moving the slider discards half-typed text. `InputSlider` now uses `useId` (the id used to come from the label).

## Non-obvious facts
- **Timings on this disk:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Use `run_in_background` and read only the tail.
- **Python is `python` / `py` (3.14), not `python3`, in Git Bash.** `math.erfc` and `math.lgamma` are handy for golden values.
- **Don't add, delete or rename files while `check` runs.** ESLint lists files up front. `scripts/` is linted too.
- **Chrome extension:** not connected in sessions 3 or 4. Use `scripts/ui-check.mjs` instead (Chrome at the default path, or set `CHROME`).
  - It types with `Input.insertText` per character and selects all via `commands: ["selectAll"]`.
  - React attaches fibers before the hydration commit, so it waits for idle after.
  - `load` mode only reports console errors.
- **A warm Chrome profile** exposes 1-ulp SSR/client differences in chart paths, which show up as a hydration-mismatch error. The script uses a fresh profile. ROADMAP has the Phase 3 finding.
- **Dev server cleanup:**
  - `TaskStop` on `npm run dev` leaves `node …/start-server.js` listening. Find it with `netstat -ano | grep :3000` and `taskkill //PID <pid> //F`.
  - `next dev` rewrites `next-env.d.ts` and `src/generated/search-index.json`; `build` rewrites only the search index. Restore them with `git checkout -- <path>`, and never commit them.
- **SimpleChart quirks:**
  - It floors log axes at 1e-10, so plot log₁₀ values on a linear axis until Phase 3.
  - `Number(null)` becomes 0 there, so trim arrays instead of inserting nulls.
- **Committing:** `git commit -F msg -- <paths>` commits only those paths, but untracked files need `git add` first.
- **Agents not offered:** `.claude/agents/implementer.md` and `physics-reviewer.md` exist, but sessions 3 and 4 didn't list them as Agent types.
- **TDZ errors** that `tsc` misses show up in `next build`. Sweep with `@typescript-eslint/no-use-before-define`.
- **ESLint baseline:** 3 rules are still `warn`: `purity` (Phase 1), plus memoization and `any` (Phase 2).
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4 rewrite). See ROADMAP.
- **Commit hook:** it runs `node .claude/hooks/block-secrets.mjs` on Bash calls and blocks token shapes in commits.
- **npm 12 skips install scripts** for esbuild, sharp and unrs-resolver. Harmless: the prebuilt win32-x64 packages are present.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq` (scope `mariusrut-8463s-projects`). The MCP returned 403 until re-authentication.

## Working style (quota)
- One phase or stage per session, then a handover and `/clear`.
- Keep tool output small: tail and failures only.
