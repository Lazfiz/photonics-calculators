# Handover — 2026-10-13 (session 51 → session 52)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 51 shipped fiber-optics fix part 9 (PR #62, `coupled-mode.ts`; production check ALL PASS). **Next: fix part 10**,
tapers + attenuation (`polarizer-types` stays blocked until the user is at the laptop with Chrome).

## State
- 177 of 460 pages are tiered, 6 `knownIssue`s (all fiber-optics), 542 tests pass.
- New `src/physics/fiber-optics/coupled-mode.ts`: `couplingCoefficient` (Snyder κ, D ≥ 2a), `averagePowerCoupling`
  (Koshiba h̄), `hayashiPowerCoupling`, `criticalBendRadius`, `pairCrosstalk` (tanh hL), `lp01PowerBeyondPlane` (η),
  `evanescentIntensityRatio` (K₀ tail), `polishedCouplerPhase` (Digonnet–Shaw ∫κ dz).
- `step-index-modes.ts`: `petermannIIRadius`, `lp01Field` (ψ(0) = 1), `normalizedB`, `claddingIndex`, `effectiveIndex`,
  `coreConfinement`, mode counts. `microbend.ts`, `g657.ts`. `macro-bending-loss.ts`: `lp01Mode`, `vNumber`,
  `modeFieldRadius` (Marcuse fit), `bendLossPerTurnDb`. `math.ts`: `besselKScaled` = eˣK_ν(x), `besselK`, `besselI0`.
- Other fiber modules: `fiber-birefringence.ts`, `doped-fiber-gain.ts`, `sagnac.ts`, `fiber-bundle.ts`,
  `fiber-bragg-grating.ts`, `fiber-sensors.ts`, `fiber-nonlinear.ts`, `chromatic-dispersion.ts`, `gaussian-coupling.ts`,
  `dispersion-comp.ts`, PMD.
- Per-page reviewer evidence for parts 10–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 10 (ROADMAP box): `fiber-taper` + `tapered-fiber` merge (Birks–Li constant hot zone r₀e^(−x/2L₀): 125 µm,
   x 5, L₀ 2 → 35.8 µm; 10.1109/50.134196; Love 10.1049/ip-j.1991.0060 for adiabaticity; the Marcuse fit fails at
   V 0.36, use `petermannIIRadius` or the cladding–air guide); `attenuation` (Keiser IR 7.81e11 e^(−48.48/λ); A_R 0.93;
   minimum near 1550 nm); `otdr-analysis` (cumulative splices, DR with pulse width, Barnoski–Jensen P_bs
   10.1364/AO.15.002112, 1 ns·10 → 10.21 m at n 1.4682 group); [`low-water-peak`, `link-budget` (margin sign)].
   A shared `silica-attenuation.ts` for attenuation + low-water-peak. A page merge needs a redirect (`.claude/rules/nextjs.md`).
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
3. One `physics-reviewer` pass before the PR; ask about conventions and in-range inputs that give NaN/∞ or 0·∞.
4. `/ship`: `post-merge-check <sha> fiber-optics/<slug>=<default value as rendered>` per page (toFixed renders "-", not "−").
5. Open: G.657.A3 and the MCF photoelastic R_eq (ROADMAP open findings) once Chrome is available.

## Non-obvious facts
- **Part 9 lessons:** Snyder κ is exact for the CMT overlap at any D ≥ 2a (Graf addition theorem), so check it against a
  2-D overlap integral. Koshiba h̄ has the closed form 2κ²d·Re[1/√((1+i dΔβ)² + (dβΛ/R)²)]; it is Hayashi's
  2κ²R/(βΛ) only for Δβ = 0 and d ≫ R/(βΛ). The exact K₀ tail at 2 µm is 18.3 % against 26.2 % for exp(−2γd). Smooth,
  decaying tail integrals converge spectrally with Simpson (100 panels give 1e-10). Compute Bessel ratios as one scaled
  ratio times e^(…): separate K's underflow to 0/0 at W ≳ 350. First-order Δn_eff overestimates for n_ext < n₂ and
  underestimates near n_eff (variational bound); scale warnings to n_eff − n₂. Sample oscillating plots adaptively.
- **Part 8 lessons:** check an approximation against the exact LP01 field before shipping it (Gaussian microbend was ×59
  low at 0.05 mm). ITU-T PDFs are blocked to curl/WebFetch; G.657 limits came from HFCL/STL tables.
- **SimpleChart/ChartPanel markers:** no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces.
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
- **eslint** reports ≈ 800 pre-existing warnings. `check` passes; lint only the changed files.
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
- **Registry edits** on one file go through a scratchpad `.cjs` script with a dry run and anchor checks
  (`slug: "<x>",` → entry ends at the next `\n  },`). Strip an existing `tier:` block first so it re-runs. Build
  reference objects without empty keys (a book has no `url`).
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
