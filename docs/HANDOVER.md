# Handover — 2026-10-14 (session 55 → session 56)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 55 finished thin-film leftovers b (PR #71: `sputtering-deposition`, `plasma-deposition`, `adhesion-testing`);
thin film is 45/45. Next: part 0 of the next category audit (ask the user which). `polarizer-types` stays blocked
until the user is at the laptop with Chrome.

## State
- 190 of 459 pages are tiered (thin-film 45/45, fiber 47/47, laser-safety 40/40), 0 `knownIssue`s, 598 tests pass.
- New in session 55:
  - `sputtering.ts`: `SPUTTER_TARGETS` (10 metals: Y500, U_s, M, ρ, T_m), `targetIonCurrent`, `sputteredAtomRate`,
    `diskOnAxisFlux` (Φ/(π(a²+d²))), `growthRate`, `thompsonPeakEnergy`, `argonMeanFreePath`, `D_AR`.
  - `plasma-global-model.ts`: L&L argon `kIz/kEx/kEl`, `collisionalLoss`, `geometry` (h_l, h_R, d_eff, A_eff),
    `electronTemperature` (bisection), `argonDischarge(P, R, l, p, T_g)`, `lowPressureRegime`.
  - `adhesion.ts`: `benjaminWeaver`, `kendallPeelEnergy`, `tapeClass` (D3359 B), `bendTest(hs, R, E, ν, h, σ_res)`.
  - `ATM`, `TORR` now in `constants.ts`.

## Next actions
1. Next category audit, part 0 (ROADMAP box): ask the user which category, inventory its pages with `checker`
   (`npx tsx scripts/tier-status.ts <category>`, `scripts/find.ts`), split into ≈ 4-page parts, add them as boxes.
2. Each fixed page: tier, `modelNote` (≤ 220 characters, count with `[...s].length`) and references
   (`scripts/crossref.mjs`). Run one `physics-reviewer` pass before the PR.
3. `/ship`: `post-merge-check <sha> <category>/<slug>=<default value as rendered>` per page.
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 used as a phase index on ≈ 20 pages), G.657.A3 and
   the MCF R_eq (need Chrome); the small thin-film findings (sputtering gas scattering, plasma high-pressure h).

## Non-obvious facts
- **Session 55 lessons:**
  - Worked examples in course notes often read T_e, E_c etc. off figures: check the model against them loosely (10 %)
    and pin the golden values to an independent script (a grid scan instead of the bisection).
  - archive.org holds readable scans of Ohring (1992), Maissel & Glang and Kittel 8th ed. (read the pages as images).
  - Run a long source lookup as a background agent and write the modules that don't depend on it meanwhile.
  - The physics-reviewer's best catches are page-level and validity-level: a regime limit far below the page's
    warning threshold, text claims about limits (compliant substrate), defaults that trigger the page's own warning.
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
