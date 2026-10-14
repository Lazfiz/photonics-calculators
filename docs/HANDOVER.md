# Handover — 2026-10-14 (session 63 → session 64)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 63 ran the detectors audit, part 0: PR #87, merged as `684c52fe`. All 54 pages are audited: 32 `knownIssue`s, 22 OK.
This handover is on `docs/detectors-audit-handover`. Next: **Detectors part 1: noise** (ROADMAP box: new
`src/physics/detectors/noise.ts`, 8 pages). `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 209 of 458 pages are tiered; 32 `knownIssue`s, all in detectors (11 bugs, 21 questionable); 651 tests pass.
- `src/physics/detectors/` doesn't exist yet. Each ROADMAP fix part names its module, golden values and sources.
- Reuse, don't copy: `excessNoiseFactor` (McIntyre, guarded, tested) and `photonEnergy` live in
  `src/physics/free-space-comms/background-radiance.ts`; part 5 moves McIntyre to `detectors/apd.ts`.
- Old module: `src/lib/geiger-mode-avalanche.ts` (its test only asserts > 0; part 6 replaces it).
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` and `hybrid-detector` → `photodiode-tia-noise`
  (with redirects); keep `spad` and SPCM as separate pages on one module; rewrite `channel-photomultiplier` as a true CPM.

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. Detectors part 1 (noise), then parts 2–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, guards
   (`min` on every input that can reach ÷0/log/sqrt), move `useState` inputs to the URL, then set tier, modelNote and
   references and delete the `knownIssue`. Tier the part's OK pages in the same PR.
3. `post-merge-check` for part 1, e.g. `detectors/shot-noise=5.66` `detectors/reset-noise=40.2` (check the page's own
   formatting first: `fmt()` and `toFixed` differ).
4. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.
## Non-obvious facts
- **Session 63 lessons:**
  - Detector pages are small (40–170 lines): 9 parallel `physics-reviewer` batches of 4–8 pages finished in 4–6.5 min each,
    so all 54 pages fit one session. Ask reviewers for a ready `knownIssue:` line and ≤ 20 lines per OK page.
  - `knownIssue` text: 40–240 characters, no `{}` or HTML entities, ends with a full stop (`tests/registry.test.ts`).
  - Reviewer numbers flagged "from memory" (InGaAs α, Si APD drift, P46 phosphor, iXon 800 ke⁻ register well, InGaAs
    photocathode QE) need a source before they go into code.
- **Session 62 lessons:**
  - arXiv PDFs download with `curl -A "Mozilla/5.0"` + `pdftotext -layout`; arXiv abs pages carry `citation_doi` meta tags.
  - A "maximum distance" output needs a separate case for zero attenuation (it becomes a loss budget, not a distance).
  - Format integer outputs as integers: `fmt()` gives "10.0 lines", which breaks a post-merge string match.
  - JSX text cannot hold `{…}` (formulas with braces): wrap them in `{"…"}`.
  - Point-ahead needs the inertial velocity: in the Earth-fixed frame GEO looks stationary (2v/c ≈ 0).
- **Session 61:** mdpi.com gives 403 to curl/WebFetch; Europe PMC full text: `ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:<doi>&format=json`
  → pmcid → `/rest/<PMCID>/fullTextXML`. Recompute one row of a published table from its own equation (Giggenbach Table 2
  used Ω = 4π sin²ω). A general routine must reproduce the closed forms it generalises. Bisection must reject the lower edge.
- **Session 60:** Andrews' aperture fits are interpolations (25–33 % high at d² = 1–10); the exact weak integral is cheap.
  `erfc` ≈ 0.5 µs: give per-chart-point solvers a call budget and time each chart (< 0.3 s). Fixed iteration caps fail
  at large parameters (P(1e6, 1e6)); test the extreme corner of every input range. Check approximations against an exact
  nested integral, not only Monte Carlo. Read the page code, not an implementer's sanity script.
- **Earlier:** ROADMAP golden numbers can contradict their formula: check the physics and note it in the PR.
  `useURLState` inside `.map` breaks `rules-of-hooks`. After `next start`, wait ≈ 10 s before the first curl.
- **Sources:**
  - radioeng.cz and URSI GA full texts download with `curl -A "Mozilla/5.0"` + `pdftotext`; `theses.eurasip.org`
    gives full PDFs. Optics Express doesn't download (JS shell); arXiv reproductions of a table work.
  - Cross-check a coefficient table against a second independent reproduction. Settle disagreements with a physical
    check, not a vote.
  - Thorlabs spec-sheet PDFs come from the public `/graphql` endpoint (storeId "Thorlabs-Website").
  - WebFetch returns PDFs as binary: use `curl` + `pdftotext -layout` (or `-raw` for tables).
- **Merges:** to merge a page, add the redirect, run `scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, then
  `--write`), then `rm -rf .next/types .next/dev/types`. A `post-merge-check` value can be any phrase in the prerendered HTML.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 3 min,
  physics-reviewer ≈ 8–15 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list (`parseScene`).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` and per-point marker colours.
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces. It supports `yaxis: "y2"` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: find it with `netstat -ano | grep :3100`, kill it with
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &`.
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals (Hankel transforms,
  phase-pdf Simpson vs Craig), brute-force scans, published FEM numbers, decision-region sums. Mutate the code once to
  prove the test bites: the reporter prints `✖` and `ℹ fail N`.
- **eslint:** about 764 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never
  `taskkill /IM chrome.exe`.
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` can wait on
  "pending". Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks (normalise CRLF),
  run with `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
