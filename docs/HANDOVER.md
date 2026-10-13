# Handover — 2026-10-13 (session 49 → session 50)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 49 shipped fiber-optics fix part 7 (PR #58, `fiber-birefringence.ts`). **Next: fix part 8**, reuse
`macro-bending-loss.ts` (`polarizer-types` stays blocked until the user is at the laptop with Chrome connected).

## State
- 168 of 460 pages are tiered, 12 `knownIssue`s (all fiber-optics), 525 tests pass.
- New `src/physics/fiber-optics/fiber-birefringence.ts`: `geometricG`, `geometricGroupG` (Sakai–Kimura G(V), d(VG)/dV),
  `geometricBirefringence` (B = εn₁Δ²G, ε = 1 − b/a, slow axis = major axis), `beatLength`, `dgdPerLength`,
  `BEND_C_SILICA` 0.133, `bendBirefringence`, `loopRetardance`, `loopDiameterFor` (Lefèvre), `paddleStates`
  (chains `muellerRetarder`), `crossPolarizedRatio` (exact PM coupled power), `fibreCrosstalkDb`, `lengthToRatio`,
  `ratioFromDb`/`ratioToDb`.
- Other fiber modules: `doped-fiber-gain.ts`, `sagnac.ts`, `fiber-bundle.ts`, `fiber-bragg-grating.ts`, `fiber-sensors.ts`,
  `fiber-nonlinear.ts`, `chromatic-dispersion.ts`, `gaussian-coupling.ts`, `dispersion-comp.ts`, `macro-bending-loss.ts`
  (`DB_PER_NEPER`, `lp01Mode`, `vNumber`, `modeFieldRadius`, `bendLossPerTurnDb`), `polarization-mode-dispersion.ts`.
- Per-page reviewer evidence for parts 8–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 8 (ROADMAP box has the goldens): `mode-field-diameter` (MFD 10.08 µm), `bend-insensitive` (15.9 dB/turn at
   7.5 mm), `micro-bend` (beat-length resonance ≈ 0.76 mm), [`v-number`, `fiber-characterization`]. Five pages: split
   off the bracketed two if the context runs short.
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
3. One `physics-reviewer` pass before the PR; ask it about conventions and in-range inputs that give NaN/∞ or 0·∞.
4. `/ship`: `post-merge-check <sha> fiber-optics/<slug>=<default value as rendered>` per page.

## Non-obvious facts
- **Part 7 lessons:** check formulas from secondary sources independently. A first-order perturbation with
  Bessel functions (J₂/K₂ cos 2φ correction + boundary integral, kept in `tests/fiber-birefringence.test.ts`) confirmed
  G(V) to 1e-5. Sakai–Kimura's ε = 1 − b/a; Snyder & Love's e² = 1 − b²/a² ≈ 2ε (don't mix them). Bend birefringence:
  fast axis in the loop plane. A hand estimate of B was off by 2.5×; trust the code + independent check, not memory.
- **Formula images:** Optiwave tutorials put equations in PNGs (`cdn.optiwave.com/wp-content/uploads/2014/11/13141707/
  Optical-Fiber-equation-<n>.png`); `curl` them, stack with `sharp` (flatten on white) and Read the one image.
- **Edge-of-domain derivatives:** a central difference returns NaN at MIN_V; use a one-sided second-order stencil.
- **Part 6 review lessons:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on `NaN > 0` silently converges
  to a wrong finite answer (3e50 W). Skip zero terms. Show NaN/∞ as "—" with a reason, never "NaN dB".
- **Hung checks:** `chrome --dump-dom` against `next dev` never exits (the HMR socket). Wrap every chrome, ui-check
  and server command in `timeout <s>`, and check pages on `next start` after `build`. Plotly charts (ChartPanel)
  are not in a `--dump-dom` even on good pages; only SimpleChart SVGs are.
- **Stale `.next`:** a removed page breaks `tsc` via `.next/types` and `.next/dev/types` (`rm -rf` both); a killed
  dev server can leave a truncated `routes.d.ts`; a stale `.next/dev` cache made every route 404 (`rm -rf .next/dev`).
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals of mode fields,
  brute-force scans for optimisers, Landau–Zener, coupler-matrix sums. Mutate the code once to prove the test bites.
- **eslint** reports ≈ 840 pre-existing warnings. `check` passes; lint only the changed files.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`. `TaskStop` leaves `node` on port 3100: `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min, physics-reviewer ≈ 6–13 min. Background them; don't
  edit `.ts` while `check` runs.
- **ARW convention:** IEEE 952 defines N by σ²(τ) = N²/τ (two-sided PSD). From a one-sided ASD, N = ASD/√2 ÷ 60 in
  °/√h. Many datasheets just ÷ 60 (√2 higher). The PR #43 review value 3.636e-5 was that form; the page shows 2.571e-5.
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro transit). Bragg λ, Fresnel, V and n_eff need the
  phase index ≈ 1.447. Many fibre pages still mix them (ROADMAP open finding).
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min) and prints nothing until done. Check with Vercel MCP `list_deployments` (project
  `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`) and `curl` the live page.
  A `git_info_fail` deploy has no logs; a production redeploy needs the user (auto mode blocks it).
- **Smith thresholds** (16 SRS, 21 SBS) are co-polarized. g_R ≈ 1e-13 m/W is for a 1 µm pump; at 1550 nm ≈ 6.5e-14.
- **calculator-pages test:** the JSON-LD fixture is `chromatic-dispersion` with `references: undefined`; keep it.
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Strip an existing `tier:` block first so it re-runs. Build
  reference objects without empty keys (a book has no `url`).
- **SimpleChart:** non-numeric string x (or `xaxis.type: "category"`) is a category axis, one slot per label; bar traces
  group unless `barmode` is overlay/stack and start at 0; long labels rotate −45°. `tests/simple-chart.test.ts` renders it
  with `renderToStaticMarkup`.
- **Screenshots without the extension:** `chrome.exe --headless=new --virtual-time-budget=8000 --window-size=1280,2600
  --screenshot=<png> <url>`, then crop with `sharp` (in node_modules) before reading.
- **Sources:** Agrawal FOCS 4th ed. `10.1002/9780470918524`; Erdogan `10.1109/50.618322`; Kersey `10.1109/50.618377`;
  Born & Wolf 7th ed. `10.1017/CBO9781139644181`. WebFetch returns PDFs as binary: `curl` + `pdftotext -layout`.
- **React Compiler lint:** build memo objects from primitive deps (`preserve-manual-memoization`).
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files; run them with `< /dev/null`. Write `.tsx` pages with the Write tool.
  - Physics probe: a scratchpad `.ts` importing `"C:/dev/photonics-calculators/src/…"` runs with `npx tsx`.
  - `python -` hangs even with `< /dev/null`; use `node`. In Git Bash a `/a/b` argument becomes
    `C:/Program Files/Git/a/b` (`MSYS_NO_PATHCONV=1`).
  - `git grep` skips untracked files: a new module isn't found until it's added.
- **`useURLState` doesn't clamp:** clamp in the page. Non-finite URL params fall back to the default.
  **Plotly can't draw Infinity:** map to `null`.
