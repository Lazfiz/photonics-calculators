# Handover — 2026-10-13 (session 53 → session 54)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 53 finished fiber-optics fix part 11 (PR #67: `photonic-crystal`, `specialty-fiber`), which passed the production
check. **Fiber-optics is fully tiered (47/47).** Next: the thin-film leftovers (6 untiered pages). `polarizer-types`
stays blocked until the user is at the laptop with Chrome.

## State
- 184 of 459 pages are tiered, 0 `knownIssue`s, 578 tests pass.
- New in session 53:
  - `photonic-crystal.ts`: Saitoh–Koshiba `saitohKoshibaV/W`, `shortWavelengthV`, `endlesslySingleModeLimit` (0.4275),
    `cutoffWavelength`, `effectiveIndex`, `pcfDispersion`, `pcfMode` (NaN where W ∉ (0, V) or d/Λ ∉ [0.2, 0.8];
    MFD NaN for V < 1.2).
  - `specialty-fiber.ts`: `SPECIALTY_FIBERS` (6 data-sheet rows), `specialtyV`, `specialtyCutoff`, `specialtyMfd`
    (reuses `vNumber`, `lp11CutoffWavelength` and `modeFieldRadius` from `macro-bending-loss.ts`).
- The fiber modules are listed in `src/physics/fiber-optics/`. Silica dispersion: `materials/sellmeier.ts` +
  `MATERIALS.fusedSilica` (Malitson).

## Next actions
1. Thin-film leftovers (ROADMAP box; findings under "Thin film"): `thermal-evaporation` (missing ÷ρ and vapour-pressure
   coefficients, fix both together), `ion-assisted-deposition` (flux dimension), then `sputtering-deposition`,
   `plasma-deposition`, `adhesion-testing`, `angle-shift`. Split into a/b boxes before starting (≈ 4 pages each).
   `grep -n "<slug>" docs/archive/roadmap-history.md` for old evidence.
2. Each fixed page: remove `knownIssue` if any; add tier, `modelNote` (≤ 220 characters, count with `[...s].length`,
   not awk) and references (`scripts/crossref.mjs`). Run one `physics-reviewer` pass before the PR.
3. `/ship`: `post-merge-check <sha> thin-film/<slug>=<default value as rendered>` per page.
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 used as a phase index on ≈ 20 pages), G.657.A3 and
   the MCF R_eq (need Chrome).

## Non-obvious facts
- **Part 11 lessons:**
  - Optics Express full text and PDFs don't download (JS shell). arXiv papers that reproduce a table work. Cross-check
    a coefficient table against a second independent reproduction.
  - Thorlabs product pages are JS-rendered. Their spec-sheet PDFs come from the public `/graphql` endpoint (storeId
    "Thorlabs-Website"); the item's attached PDFs sit on `thin01mstroc282prod.dxcloud.episerver.net`.
  - Empirical fits can go unphysical inside their stated range (SK's W < 0 for d/Λ < 0.4 at λ/Λ ≳ 1). Check the sign
    and ordering of fitted quantities across the whole range, not only at the test points.
  - `s in OBJ` is true for prototype keys (`?fiber=constructor` crashed a page). Validate URL strings with `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` (the legend is pinned right; long names clip) and per-point marker colours (markers and
    bars), so a caption can't say "the selected bar is red".
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces.
  - It supports `yaxis: "y2"` with `layout.yaxis2`.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on `NaN > 0` silently converges to a wrong finite
  answer. Skip zero terms. Show NaN/∞ as "—" with a reason, never "NaN dB".
- **tsx doesn't type-check:** `npx tsx --test` passes code that `tsc` rejects. Run `npm run check` before trusting a test.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`, never `next dev`. A `timeout`-wrapped `next start` can outlive its timeout and hold port 3100: `netstat -ano |
  grep :3100`, `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &` (no completion notice).
- **Stale `.next`:** a removed page breaks `tsc` via `.next/types` and `.next/dev/types` (`rm -rf` both); a stale
  `.next/dev` cache made every route 404 (`rm -rf .next/dev`).
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals of mode fields,
  brute-force scans for optimisers, published FEM/multipole numbers. Mutate the code once to prove the test bites (the
  spec reporter prints `✖` and `ℹ fail N`, not "not ok").
- **eslint** reports ≈ 780 pre-existing warnings. `check` passes; lint only the changed files.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min, physics-reviewer ≈ 4–13 min. Background them; don't
  edit `.ts` while `check` runs. Any edit after `build` means another `build` before the push.
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro transit). Bragg λ, Fresnel, V and n_eff need the
  phase index ≈ 1.447 (ROADMAP open finding for the other pages).
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min). Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`). A production redeploy needs the user.
- **Registry edits:** a single entry can take the Edit tool; bulk edits go through a scratchpad `.cjs` script with a dry
  run and anchor checks. Build references without empty keys.
- **Screenshots:** `chrome.exe --headless=new --virtual-time-budget=8000 --window-size=1280,2400 --screenshot=<png>
  <url>`, then crop with `sharp` before reading.
- **Sources:** WebFetch returns PDFs as binary: `curl -A "Mozilla/5.0"` + `pdftotext -layout` (or `-raw` for tables).
  Datasheet lookups suit a background general-purpose agent with a strict output format.
- **Shell:** edit scripts are scratchpad `.cjs` files run with `< /dev/null`; normalise CRLF before matching anchors.
  Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`, run with `npx tsx`.
  `python -` hangs; use `node`. `git grep` skips untracked files.
- **`useURLState` doesn't clamp:** clamp in the page. **Plotly can't draw Infinity:** map to `null`.
