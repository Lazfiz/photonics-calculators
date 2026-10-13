# Handover — 2026-10-13 (session 50 → session 51)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 50 shipped fiber-optics fix part 8 (PR #60, step-index modes, microbend, G.657). **Next: fix part 9**,
`coupled-mode.ts` + evanescent K₀ tail (`polarizer-types` stays blocked until the user is at the laptop with Chrome).

## State
- 173 of 460 pages are tiered, 9 `knownIssue`s (all fiber-optics), 538 tests pass.
- New `src/physics/fiber-optics/step-index-modes.ts`: `petermannIIRadius`, `lp01Field` (ψ(0) = 1), `normalizedB`,
  `claddingIndex`, `effectiveIndex`, `coreConfinement` (Γ), `besselJZeros`, `guidedLpModes`, `countModes`,
  `guidedModeCount` (exact up to `MAX_EXACT_MODE_V` 40), `asymptoticModeCount` (V²/2).
- New `microbend.ts`: `claddingMismatch` δ = β − kn₂, `criticalPeriod`, `lp01TransformSlope` (closed-form Hankel
  transform of the exact LP01 field, Lommel integrals), `sinusoidalMicrobendLoss` (exact), `gaussianMicrobendLoss`
  (Petermann), `peakTiltLoss`. New `g657.ts`: `G657_LIMITS`, `g657Category`, `meetsG657`, `G657A_MIN_MFD_UM` 8.2.
- `math.ts`: `besselKScaled` = eˣK_ν(x) (step min(0.05, 0.5/√x)); `besselK` wraps it. Use it for K ratios at large x.
- Other fiber modules: `fiber-birefringence.ts`, `doped-fiber-gain.ts`, `sagnac.ts`, `fiber-bundle.ts`,
  `fiber-bragg-grating.ts`, `fiber-sensors.ts`, `fiber-nonlinear.ts`, `chromatic-dispersion.ts`, `gaussian-coupling.ts`,
  `dispersion-comp.ts`, `macro-bending-loss.ts` (`lp01Mode`, `vNumber`, `modeFieldRadius`, `bendLossPerTurnDb`), PMD.
- Per-page reviewer evidence for parts 9–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 9 (ROADMAP box has the goldens): `multi-core` (κ 4.45e-3 /m; XT −38.3 dB/10 km at R_b 0.1 m),
   `side-polished` (26.2 % at 2 µm), `d-shaped-fiber`, [`fiber-coupler`]. Reuse `lp01Field`/`lp01Mode` for the
   evanescent overlap; check κ against a numerical overlap integral.
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
3. One `physics-reviewer` pass before the PR; ask it about conventions and in-range inputs that give NaN/∞ or 0·∞.
4. `/ship`: `post-merge-check <sha> fiber-optics/<slug>=<default value as rendered>` per page.
5. Open: G.657.A3 (ROADMAP open finding) once Chrome is available.

## Non-obvious facts
- **Part 8 lessons:** the Gaussian-mode microbend formula is ×1.85 low at Λ 0.5 mm and ×59 at 0.05 mm against the exact
  LP01 field: the field's edge at r = a dominates high spatial frequencies. Check an approximation against the exact
  field before shipping it. Phase index n₁ 1.4494 vs group 1.4682 changes Marcuse bend loss by ≈ 14 %.
  ITU-T PDFs are blocked to curl/WebFetch; G.657 limits came from HFCL/STL tables.
- **SimpleChart/ChartPanel markers:** no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces.
- **Part 7 lessons:** Sakai–Kimura ε = 1 − b/a vs Snyder & Love e² ≈ 2ε; bend birefringence fast axis is in the loop plane.
- **Formula images:** Optiwave puts equations in PNGs; `curl` them and Read the image.
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
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro transit). Bragg λ, Fresnel, V and n_eff need the
  phase index ≈ 1.447. Many fibre pages still mix them (ROADMAP open finding).
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min) and prints nothing until done. Check with Vercel MCP `list_deployments` (project
  `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`) and `curl` the live page.
  A `git_info_fail` deploy has no logs; a production redeploy needs the user (auto mode blocks it).
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
