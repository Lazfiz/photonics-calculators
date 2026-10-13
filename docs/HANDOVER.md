# Handover — 2026-10-13 (session 48 → session 49)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 48 shipped **fiber-optics fix part 5** (PR #53) and the **Codex review fixes** (PR #55: `eye-safety-fso`, SimpleChart
category axes; Codex findings for mode-matching, abcd-matrix and search are in ROADMAP Open findings). **Next: fix part 6**, `doped-fiber-gain.ts` (`polarizer-types` stays blocked until the user is at the laptop with Chrome connected).

## State
- 162 of 461 pages are tiered, 19 `knownIssue`s (all fiber-optics), 512 tests pass.
- New `src/physics/fiber-optics/sagnac.ts`: `EARTH_ROTATION_RATE` 7.292115e-5, `RAD_PER_S_TO_DEG_PER_H`,
  `sagnacScaleFactor` (2πLD/(λc)), `transitTime`, `properFrequency`, `shotNoisePhase` (one-sided ASD, ±π/2 bias),
  `noiseEquivalentRate`, `angleRandomWalkDegPerRootHour` (Allan N = ASD/√2 ÷ 60), `loopMirrorReflectance`,
  `loopMirrorTransmittance(k, Δφ, τ)`, `birefringentPhase`, `loopCombPeriod`.
- New `fiber-bundle.ts`: `HEX_PACKING_LIMIT`, `hexRingCount`, `hexFiberCount`, `hexBundleDiameter`,
  `squareBundleDiameter`, `bundleFill`, `fiberEtendue`, `combinerEtendueRatio`, `taperedPumpNA`.
- Other fiber modules: `fiber-bragg-grating.ts`, `fiber-sensors.ts`, `fiber-nonlinear.ts`, `chromatic-dispersion.ts`,
  `gaussian-coupling.ts`, `dispersion-comp.ts`, `macro-bending-loss.ts` (`DB_PER_NEPER`), `polarization-mode-dispersion.ts`.
- Per-page reviewer evidence for parts 6–11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 6, `doped-fiber-gain.ts` (ROADMAP box has the golden values; PR #43 lines for each page):
   - `fiber-amplifier`: gain ignores the pump (YDFA 292 dB). Implicit saturation G = 1 + (P_sat/P_in)·ln(G₀/G):
     G₀ 16.44 dB, P_in 0.1, P_sat 10 → 11.58 dB.
   - `rare-earth-doped` + `rare-earth-fiber`: duplicates with disagreeing cross-sections → merge (redirect, codemod
     `2026-10-08-merge-duplicates.ts`). P_sat = hνA/((σa+σe)τ) = 0.2711 mW; L₉₀ = 10/α_dB = 12.28 m (dB used as
     nepers); 172 dB full-inversion headline; NF trend wrong. Source: Giles & Desurvire JLT 9, 271, 10.1109/50.65886.
   - `fiber-laser`: η_q = η_s/η_Stokes = 0.8721 (page multiplies); optimum coupling uses absorption as gain (Rigrod
     10.1063/1.1714517).
   - One cross-section table shared by the pages.
2. Each fixed page: remove its `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
3. One `physics-reviewer` pass before the PR. Session 48's pass caught a √2 convention error; ask it about conventions.
4. `/ship`: `post-merge-check <sha> fiber-optics/<slug>=<default value as rendered>` per page.

## Non-obvious facts
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
- **Independent checks that worked:** RK4 of coupled-mode equations, Landau–Zener, coherent multi-pass sums,
  coupler-matrix field sums (loop mirror), photon counting (shot noise vs Allan). Mutate the code once to prove the test bites.
- **eslint** reports ≈ 870 pre-existing warnings. `check` passes; lint only the changed files.
- **Connectors:** per project in `~/.claude.json` (`disabledMcpServers`). Vercel is on; the other 10 are off.
- **SimpleChart:** non-numeric string x (or `xaxis.type: "category"`) is a category axis, one slot per label; bar traces
  group unless `barmode` is overlay/stack and start at 0; long labels rotate −45°. `tests/simple-chart.test.ts` renders it
  with `renderToStaticMarkup`.
- **Screenshots without the extension:** `chrome.exe --headless=new --virtual-time-budget=8000 --window-size=1280,2600
  --screenshot=<png> <url>`, then crop with `sharp` (in node_modules) before reading.
- **Polarization conventions:** Goldstein/Collett signs. Fibre pages that rotate Stokes vectors must chain
  `mueller.ts` `muellerRetarder`.
- **Sources:** Agrawal FOCS 4th ed. `10.1002/9780470918524`; Erdogan `10.1109/50.618322`; Kersey `10.1109/50.618377`;
  Born & Wolf 7th ed. `10.1017/CBO9781139644181`. WebFetch returns PDFs as binary: `curl` + `pdftotext -layout`.
- **React Compiler lint:** build memo objects from primitive deps (`preserve-manual-memoization`).
- **Deleted pages or modules break `tsc`** through a stale `.next/types/validator.ts`: `rm -rf .next/types`.
- **Line endings:** some files are CRLF. Node edit scripts must `.replace(/\r\n/g, "\n")` before matching anchors.
- **Shell:**
  - Edit scripts go in scratchpad `.cjs` files; run them with `< /dev/null`. Write `.tsx` pages with the Write tool.
  - Physics probe: a scratchpad `.ts` importing `"C:/dev/photonics-calculators/src/…"` runs with `npx tsx`.
  - `python -` hangs even with `< /dev/null`; use `node`. In Git Bash a `/a/b` argument becomes
    `C:/Program Files/Git/a/b` (`MSYS_NO_PATHCONV=1`).
  - `git grep` skips untracked files: a new module isn't found until it's added.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`. `TaskStop` leaves `node` on port 3100: `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min, physics-reviewer ≈ 13 min. Background them; don't
  edit `.ts` while `check` runs.
- **`useURLState` doesn't clamp:** clamp in the page. Non-finite URL params fall back to the default.
  **Plotly can't draw Infinity:** map to `null`.
