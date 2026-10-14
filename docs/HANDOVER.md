# Handover — 2026-10-14 (session 56 → session 57)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 56 did the free-space-comms audit part 0 (PR #73, merged with handover PR #72): 20 pages audited, 19 bugs and
1 questionable, 20 `knownIssue`s live in production. Next: **FSO part 1, visibility laws** (ROADMAP box).
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 190 of 459 pages are tiered (free-space-comms 7/27), 20 `knownIssue`s (all FSO), 598 tests pass.
- The FSO modules already exist: `atmospheric-attenuation.ts` (Bucholtz Rayleigh, `kimExponent`, `totalExtinction`,
  `KOSCHMIEDER`, `DB_PER_NEPER`), `turbulence.ts` (Rytov, r₀, θ₀, all-regime `scintillationIndex` with aperture D,
  `lognormalFadeProbability`, AO terms), `pointing-loss.ts` (`beamRadius`, `gaussianDiscFraction`, `pointingCapture`),
  `ber.ts`, `bpsk-qpsk.ts`. None of the 20 untiered pages imports them.
- New modules planned: `precipitation.ts` (part 2), `link-budget.ts` (3), `background-radiance.ts` (5), `qkd.ts` (6).

## Next actions
1. FSO part 1: `fog-attenuation` and `wavelength-selection` on `atmospheric-attenuation.ts` (add Kruse and Al Naboulsi;
   check the Al Naboulsi coefficients against Opt. Eng. 43, 319 (2004) first). Merge `atmosphere` into
   `atmospheric-loss`: delete the page, add `"/free-space-comms/atmosphere": "/free-space-comms/atmospheric-loss"` to
   `src/registry/redirects.json`, and remove the registry entry and the related links that point to it.
2. Each fixed page: drop the `knownIssue`, set the tier, a `modelNote` (≤ 220 characters, count with `[...s].length`)
   and references (`scripts/crossref.mjs`). Run one `physics-reviewer` pass before the PR.
3. `/ship`: `post-merge-check <sha> free-space-comms/fog-attenuation=<default dB/km as rendered>` and so on per page,
   plus `free-space-comms/atmospheric-loss` (load check only).
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 used as a phase index on ≈ 20 pages), G.657.A3 and
   the MCF R_eq (need Chrome); the small thin-film findings (sputtering gas scattering, plasma high-pressure h).

## Non-obvious facts
- **Session 56 lessons:**
  - A category part 0 runs as 5 parallel `physics-reviewer` batches of 4 pages, grouped by the shared module the fixes
    will need (≈ 4 min each). Save each report to a scratchpad file as it arrives; split parts along those modules.
  - Write `knownIssue`s with a scratchpad `.cjs` script: a dry run that prints each length (40–240, ends with ".")
    and refuses entries that already have a tier.
  - When the previous handover PR is still open, branch from it, so the ROADMAP doesn't conflict; merge it first.
  - A `post-merge-check` value can be a phrase from the `knownIssue` text: it is in the prerendered HTML.
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
