# Handover — 2026-10-14 (session 54 → session 55)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 54 finished thin-film leftovers a (PR #69: `thermal-evaporation`, `ion-assisted-deposition`, `angle-shift`),
which passed the production check. Next: thin-film leftovers b (`sputtering-deposition`, `plasma-deposition`,
`adhesion-testing`). `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 187 of 459 pages are tiered (thin-film 42/45), 0 `knownIssue`s, 588 tests pass.
- New in session 54:
  - `thermal-evaporation.ts`: `EVAPORANTS` (8 metals, Alcock 1984 solid/liquid fits), `vapourPressure`, `inFitRange`,
    `evaporationMassFlux` (Hertz–Knudsen), `surfaceSourceRate` (Ṁ/(πρh²)), `surfaceSourceProfile`, `airMeanFreePath`,
    `meanSpeed`, `structureZone` (NaN at T_s ≥ T_m). `ATM`, `TORR` defined there (open finding: move to constants).
  - `ion-assisted-deposition.ts`: `IAD_MATERIALS` (7 oxides/fluorides), `ionFlux`, `moleculeFlux`, `iadParameters`.
    The page passes `{ ...bulk, rho: ρ_set }` for the QCM density input (0 = bulk).
  - `angle-shift` reuses `stopBandCentreAtAngle(λ₀, n, n, θ)` from `quarter-wave-stack.ts`.

## Next actions
1. Thin-film leftovers b (ROADMAP box; findings under "Thin film"): `sputtering-deposition`, `plasma-deposition`,
   `adhesion-testing`. Not audited yet; the constants codemod changed their amu from m_p to m_u. Audit first
   (`/physics-audit`), then fix with modules + golden tests. `grep -n "<slug>" docs/archive/roadmap-history.md`.
2. Each fixed page: tier, `modelNote` (≤ 220 characters, count with `[...s].length`) and references
   (`scripts/crossref.mjs`). Run one `physics-reviewer` pass before the PR.
3. `/ship`: `post-merge-check <sha> thin-film/<slug>=<default value as rendered>` per page.
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 used as a phase index on ≈ 20 pages), G.657.A3 and
   the MCF R_eq (need Chrome); the small thermal-evaporation finding (T_m, ATM/TORR).

## Non-obvious facts
- **Session 54 lessons:**
  - A windows-update restart mid-stage loses nothing on disk; check `git status`/`git diff --stat`, run the tests, then
    the gates and the reviewer.
  - The physics-reviewer's best catches are page-level: an input `max` that its own validity check rejects
    (°C → K rounding at 273 vs 273.15), defaults that trigger the page's own warning, a readout pinned to a constant.
  - QCM rates: rate × density set in the monitor is the true mass rate whatever the film's porosity; only a rate
    from measured thickness needs the film density.
- **Sources:**
  - Optics Express full text and PDFs don't download (JS shell). arXiv papers that reproduce a table work. Cross-check
    a coefficient table against a second independent reproduction (e.g. Au(s) A = 9.152, not 9.52).
  - Thorlabs product pages are JS-rendered. Their spec-sheet PDFs come from the public `/graphql` endpoint (storeId
    "Thorlabs-Website"); the item's attached PDFs sit on `thin01mstroc282prod.dxcloud.episerver.net`.
  - WebFetch returns PDFs as binary: `curl -A "Mozilla/5.0"` + `pdftotext -layout` (or `-raw` for tables).
    Datasheet lookups suit a background general-purpose agent with a strict output format.
- **Fits:** empirical fits can go unphysical inside their stated range (SK's W < 0 for d/Λ < 0.4 at λ/Λ ≳ 1). Check
  the sign and ordering of fitted quantities across the whole range; check piecewise fits meet at their joins.
- **URL strings:** `s in OBJ` is true for prototype keys (`?fiber=constructor` crashed a page). Use `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` (the legend is pinned right; long names clip) and per-point marker colours.
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces. It supports `yaxis: "y2"`.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on `NaN > 0` silently converges to a wrong finite
  answer. Skip zero terms. Show NaN/∞ as "—" with a reason, never "NaN dB".
- **tsx doesn't type-check:** `npx tsx --test` passes code that `tsc` rejects. Run `npm run check` before trusting a test.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`, never `next dev`. A `next start` can outlive its timeout and hold port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &` (no completion notice).
- **Stale `.next`:** a removed page breaks `tsc` via `.next/types` and `.next/dev/types` (`rm -rf` both); a stale
  `.next/dev` cache made every route 404 (`rm -rf .next/dev`).
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals of mode fields,
  brute-force scans for optimisers, published FEM/multipole numbers. Mutate the code once to prove the test bites (the
  spec reporter prints `✖` and `ℹ fail N`, not "not ok").
- **eslint** reports ≈ 764 pre-existing warnings (its summary line starts with `✖`; don't mistake it for a test
  failure). `check` passes; lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 2–3 min, physics-reviewer ≈ 4–13 min. Background them; don't
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
- **Shell:** edit scripts are scratchpad `.cjs` files run with `< /dev/null`; normalise CRLF before matching anchors.
  Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`, run with `npx tsx`.
  `python -` hangs; use `node`. `git grep` skips untracked files.
- **`useURLState` doesn't clamp:** clamp in the page. **Plotly can't draw Infinity:** map to `null`.
