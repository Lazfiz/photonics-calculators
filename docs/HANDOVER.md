# Handover — 2026-10-14 (session 57 → session 58)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 57 did FSO part 1, the visibility laws (PR #75; handover PR #74 merged first). Both are in production; the
post-merge check passed. Next: **FSO part 2, precipitation** (ROADMAP box). `polarizer-types` stays blocked until the
user is at the laptop with Chrome.

## State
- 192 of 458 pages are tiered (free-space-comms 9/26), 17 `knownIssue`s (all FSO), 604 tests pass.
- `atmospheric-attenuation.ts` now has `kruseExponent`, `aerosolExponent(V, law)`, a `law` parameter ("kim" | "kruse")
  on `aerosolExtinction`/`totalExtinction`, `alNaboulsiFogExtinction(λ, V, "advection" | "radiation")` with
  `AL_NABOULSI_LAMBDA`/`_VISIBILITY` ranges, and NaN for V ≤ 0.
- New `wavelength-selection.ts`: `scoreWavelengths(range, V, weights)`, an eye score from `cwClassLimit("1", λ, 0)`.
- `/free-space-comms/atmosphere` → `atmospheric-loss` (308, live).
- Other FSO modules: `turbulence.ts`, `pointing-loss.ts`, `ber.ts`, `bpsk-qpsk.ts`. Planned: `precipitation.ts` (part 2),
  `link-budget.ts` (3), `background-radiance.ts` (5), `qkd.ts` (6).

## Next actions
1. FSO part 2: `rain-attenuation`, `snow-attenuation` on a new `precipitation.ts` (ROADMAP box has the candidate
   coefficients; verify each against two reproductions first: is the snow rate water-equivalent?).
2. Each fixed page: drop the `knownIssue`, set the tier, a `modelNote` (≤ 220 characters, `[...s].length`) and
   references (`scripts/crossref.mjs`); one `physics-reviewer` pass before the PR.
3. `/ship`: `post-merge-check <sha> free-space-comms/rain-attenuation=<default dB/km as rendered>
   free-space-comms/snow-attenuation=<…>`.
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 used as a phase index on ≈ 20 pages), G.657.A3 and
   the MCF R_eq (need Chrome); the small thin-film findings (sputtering gas scattering, plasma high-pressure h).

## Non-obvious facts
- **Session 57 lessons:**
  - FSO coefficient sources that download with `curl -A "Mozilla/5.0"` + `pdftotext`: radioeng.cz full texts (Nadeem,
    Leitgeb et al. reproduce the Kruse, Kim, Al Naboulsi and snow laws) and URSI GA proceedings. Two reproductions can
    disagree (URSI radiation fog 3.8367 vs 3.7502); settle it with a physical check (both laws must give ≈ 3.912/V at
    550 nm) rather than a vote.
  - A merge is: add the redirect, then `npx tsx scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, then
    `--write`); it removes the entry and the page dir and adds the old title as a keyword. Then `rm -rf .next/types
    .next/dev/types` (stale types break `tsc`; a stale `.next/dev` makes every route 404).
  - A category part 0 runs as 5 parallel `physics-reviewer` batches of 4 pages grouped by shared module; write
    `knownIssue`s with a scratchpad `.cjs` dry run (40–240 characters, ends with ".", refuses tiered entries).
  - When the previous handover PR is still open, branch from it; merge it first.
  - A `post-merge-check` value can be any phrase in the prerendered HTML (a `knownIssue` text, "0.499 W").
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
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals of mode fields,
  brute-force scans for optimisers, published FEM/multipole numbers. Mutate the code once to prove the test bites (the
  spec reporter prints `✖` and `ℹ fail N`, not "not ok").
- **eslint** reports ≈ 764 pre-existing warnings (its summary line starts with `✖`; don't mistake it for a test
  failure). `check` passes; lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 2–3 min, physics-reviewer ≈ 4–13 min. Background them; don't
  edit `.ts` while `check` runs. Any edit after `build` means another `build` before the push.
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min). Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`). A production redeploy needs the user.
- **Registry edits:** a single entry can take the Edit tool; bulk edits go through a scratchpad `.cjs` script with a dry
  run and anchor checks. Build references without empty keys.
- **Shell:** edit scripts are scratchpad `.cjs` files run with `< /dev/null`; normalise CRLF before matching anchors.
  Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`, run with `npx tsx`.
  `python -` hangs; use `node`. `git grep` skips untracked files.
- **`useURLState` doesn't clamp:** clamp in the page. **Plotly can't draw Infinity:** map to `null`.
