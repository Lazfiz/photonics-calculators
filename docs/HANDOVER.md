# Handover — 2026-10-07 (session 3 → session 4)

**Start here:** read this file, then `docs/ROADMAP.md`. Phase 0 is done but not pushed: the user's manual step 0.1 is still open.
Phase 1, item 1 (shared math + BER) is done on `phase-1`. Next: the Phase 1 item on `use-url-state` and the number inputs.

## State
- **`phase-0`**: 5 commits ahead of `main` (`0749eb58`), **not pushed**.
  - At the start of session 3 the `origin` URL still embedded a credential.
  - The user chose to skip the push again and start Phase 1.
- **`phase-1`** is stacked on `phase-0` and also not pushed:
  - `873acc47` feat(physics): `src/physics/math.ts` (erf/erfc/Q/Φ, lnFactorial, Poisson pmf/cdf/sf) + `tests/math.test.ts`
  - `3c7c4141` fix(ber): exact Poisson photon-counting model (`src/physics/free-space-comms/ber.ts`) + `tests/ber.test.ts`
  - `804ea9b5` fix(bpsk-qpsk): Gray QPSK BER = BPSK, SER shown separately (`.../bpsk-qpsk.ts`) + `tests/bpsk-qpsk.test.ts`
  - `eec3dc30` refactor: scintillation, diversity-reception and fade-probability use the shared `erfc`
  - then a docs commit (ROADMAP ticks/findings and this file)
- **Gates on `phase-1`:**
  - `check`: 0 errors, 1,442 warnings, 33/33 tests.
  - `build`: see the last line of this section.
- **Dev SSR check:**
  - `/free-space-comms/ber` (defaults 100 photons/bit, 100 noise counts): OOK BER 1.00e-13, threshold ≥ 183, 77.7 photons/bit for 1e-9.
  - `/bpsk-qpsk`: 3.87e-6 at 10 dB.
  - **Charts not checked visually:** the Chrome extension wasn't connected.
- Build: `npm run build` green on `phase-1`, prerendering 541/541. The built `ber.html` contains "1.00e-13".

## Next actions
1. Ask the user whether 0.1 is done.
   - Check without printing the URL: `u=$(git config --get remote.origin.url); case "$u" in https://*@*) echo with-credential;; *) echo clean;; esac`
   - `git remote -v` / `get-url` are denied.
2. If it's done, ship (0.6):
   - Push `phase-0`, open a PR and merge after CI and the preview.
   - Then push `phase-1` and open a PR against `main`.
   - On the preview, check the ber and bpsk-qpsk charts: log₁₀ axis, dotted no-noise curves.
3. Phase 1, item 2: the `use-url-state` reset bug, plus clamp-on-blur in `ValidatedNumberInput` and `InputSlider`.
   - These are shared components (488 pages), so verify on 2–3 calculators. Read `.claude/rules/ui.md` first.
4. Later Phase 1 items: the JSON-LD codemod and placeholder descriptions, the shell/breadcrumb, and the new `label="{label}"` codemod item (40 files).

## Physics decisions made this session
- **BER model: exact Poisson photon counting.** Inputs are detected photons per bit (averaged over 0s and 1s) and noise counts per detector per slot.
  - OOK uses the ML threshold ⌊2n̄/ln(1+2n̄/n_b)⌋+1. DPSK uses two port counters with random tie-breaks.
  - Noiseless limits: 10 / 20 photons/bit at 1e-9 (Caplan 2008, doi:10.1007/978-0-387-28677-8_4).
  - Checked against brute-force Python sums to 1e-13. Values below 1e-300 are returned as 0 (Chernoff bound short-circuit).
- The `math.ts` erfc switches from series to continued fraction at x = 2. Relative error ≤ 2e-13 vs CPython.

## Non-obvious facts
- **Timings on this disk:** `tsc` ≈ 4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Use `run_in_background` and read only the tail.
- **Python 3 is on PATH:** `math.erfc` and `math.lgamma` are handy for golden reference values.
- **Don't add, delete or rename files while `check` runs.** ESLint lists files up front and crashes with ENOENT.
- **Dev server cleanup:**
  - `TaskStop` on `npm run dev` leaves `node …/start-server.js` listening. Find it with `netstat -ano | grep :<port>` and kill that PID.
  - `next dev` rewrites `next-env.d.ts` and `src/generated/search-index.json`; `build` rewrites only the search index. Restore them with `git checkout -- <path>`, and never commit them.
- **SimpleChart quirks:**
  - It floors log axes at 1e-10, so plot log₁₀ values on a linear axis until Phase 3.
  - `Number(null)` becomes 0 there, so trim arrays instead of inserting nulls.
- **Committing:** `git commit -F msg -- <paths>` commits only those paths, but untracked files need `git add` first.
- **Agents not offered:** `.claude/agents/implementer.md` and `physics-reviewer.md` exist, but this session didn't list them as Agent types. Check with `/agents` before planning to delegate.
- **TDZ errors** that `tsc` misses show up in `next build`. Sweep with `@typescript-eslint/no-use-before-define` (`variables: true`, `functions: false`). The `materials/*` hits are safe.
- **ESLint baseline:** 4 rules are set to `warn`. Phase 1 promotes purity and set-state-in-effect back to error; Phase 2 does memoization and any.
- **`ion-assisted-deposition` is deliberately unfixed** (Phase 4 rewrite). See ROADMAP.
- **Commit hook:** it runs `node .claude/hooks/block-secrets.mjs` on Bash calls and blocks token shapes in commits.
- **npm 12 skips install scripts** for esbuild, sharp and unrs-resolver. This is harmless because the prebuilt win32-x64 packages are present.
- **Vercel:** project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq` (scope `mariusrut-8463s-projects`). The MCP returned 403 until re-authentication.

## Working style (quota)
- One phase or stage per session, then a handover and `/clear`.
- Keep tool output small: tail and failures only.
