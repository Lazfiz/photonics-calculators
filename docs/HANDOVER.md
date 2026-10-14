# Handover — 2026-10-14 (session 58 → session 59)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 58 did FSO part 2, precipitation (PR #77, CI green). **PR #77 may still await the user's merge**: check
`gh pr view 77`; if open, ask, merge, then run the post-merge check below. This handover PR is branched from it.
Next: **FSO part 3, link budget** (ROADMAP box). `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 194 of 458 pages are tiered (free-space-comms 11/26), 15 `knownIssue`s (all FSO), 613 tests pass.
- New `precipitation.ts`: `rainPowerLaw(µ)`, `rainSpecificAttenuation(R, µ)` (dB/m, R in m/s), `rainPathReduction`,
  `rainMultipleScatteringGain`, `rainPathAttenuation(R, L, µ)` → {specific, reduction, reduced, gainFit, gain,
  attenuation}; `snowPowerLaw(λ, type)`, `snowSpecificAttenuation(S, λ, type)`; `MM_PER_HOUR`, `RAIN_PATH_MAX` 5 km.
- Other FSO modules: `atmospheric-attenuation.ts` (Kim/Kruse, Al Naboulsi), `wavelength-selection.ts`, `turbulence.ts`,
  `pointing-loss.ts`, `ber.ts`, `bpsk-qpsk.ts`. Planned: `link-budget.ts` (3), `background-radiance.ts` (5), `qkd.ts` (6).

## Next actions
1. If PR #77 is unmerged: merge on the user's yes, then `node scripts/post-merge-check.mjs <sha>
   free-space-comms/rain-attenuation="10.1 dB" free-space-comms/snow-attenuation="5.58 dB/km"`. Then ship this docs PR.
2. FSO part 3: link budget (ROADMAP box). Verify each coefficient and DOI before code; one `physics-reviewer` pass
   before the PR. Rain/snow dB can feed the budget from `precipitation.ts`.
3. Each fixed page: drop the `knownIssue`; tier, `modelNote` (≤ 220 chars, `[...s].length`), references (`crossref.mjs`).
4. Later: the fiber open findings (SMF D(1550) unification, 1.4682 as a phase index on ≈ 20 pages), G.657.A3, MCF R_eq,
   the snow-law origin (need Chrome); the small thin-film findings.

## Non-obvious facts
- **Session 58 lessons:**
  - **Check for a newer ITU revision first.** The ROADMAP's P.1814 rain law (1.076·R^0.67) was superseded in 09/2025 by
    P.1814-1 (µ table, path reduction, multiple-scattering gain). `itu.int/rec/R-REC-<rec>/en` lists versions.
  - ITU PDFs: `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf` downloads with curl; the
    old -0 version 404s. Equations come out garbled in pdftotext; fetch `…!!MSW-E.docx`, unzip, and read the OMML
    in `word/document.xml` (watch `<m:d>` delimiters: default parentheses have no characters in the XML).
  - Theses on `theses.eurasip.org` download as full PDFs (Awan 2010 reproduces the Graz FSO fog/snow laws).
  - Empirical fits with ln R terms can misbehave below their data (P.1814-1 G_ms < 0 or rising as R → 0): scan the
    whole input range of every fitted term, not just the main law.
  - The `auto mode` classifier refuses `gh pr merge` on a bare "Continue": ask for an explicit merge yes.
- **Earlier lessons (57):**
  - radioeng.cz and URSI GA full texts download with `curl -A "Mozilla/5.0"` + `pdftotext`. When reproductions
    disagree, settle it with a physical check (e.g. ≈ 3.912/V at 550 nm), not a vote.
  - A page merge: add the redirect, run `scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, `--write`), then
    `rm -rf .next/types .next/dev/types`.
  - A `post-merge-check` value can be any phrase in the prerendered HTML.
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
