# Handover — 2026-10-14 (session 59 → session 60)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 59 did FSO part 3, the link budget: PR #79, merged as `05f36543`. This handover is on `docs/fso-part3-handover`.
Next: **FSO part 4, turbulence** (4 pages, see the ROADMAP box). `polarizer-types` stays blocked until the user is at the
laptop with Chrome.

## State
- 198 of 458 pages are tiered (free-space-comms 15/26), 11 `knownIssue`s (all FSO), 623 tests pass.
- New `link-budget.ts`: `toDb`, `freeSpacePathLoss`, `apertureGain(D, λ, ε, η)`, `gaussianTxGain(θ_half)` = 8/θ²,
  `kleinDegnanEfficiency(α, γ)`, `optimumTruncation(γ)` (α 1.1209, g 0.81453 at γ = 0), `fraunhoferDistance`,
  `friisReceivedPower(Pt, Gt, Gr, R, λ, maxFraction)` → {power, fraction, capped}, `topHatGeometricLoss`,
  `truncatedGaussianFarField(u, α, γ)`, `truncatedGaussianWidth(α, γ)` (u at 1/e²; 2.8733 at α = 1).
- Other FSO modules: `atmospheric-attenuation.ts`, `precipitation.ts`, `wavelength-selection.ts`, `turbulence.ts`,
  `pointing-loss.ts` (`pointingCapture`, the exact Gaussian capture), `ber.ts`, `bpsk-qpsk.ts`. Planned:
  `background-radiance.ts` (5), `qkd.ts` (6).

## Next actions
1. Post-merge check of PR #79, if the session didn't log it: `node scripts/post-merge-check.mjs 05f36543
   free-space-comms/lasercom-link="-33.42" free-space-comms/link-budget="-18.02 dBm"
   free-space-comms/geometric-loss="17.03 dB" free-space-comms/optical-antenna="101.95 dBi"`. Then ship this docs PR.
2. FSO part 4: turbulence (ROADMAP box). Verify each coefficient and DOI before code. Run one `physics-reviewer` pass
   before the PR.
3. For each fixed page: drop the `knownIssue`; add the tier, a `modelNote` (≤ 220 chars, `[...s].length`) and references
   (`crossref.mjs`).
4. Later: the fiber open findings, G.657.A3, MCF R_eq, the snow-law origin and the Kim & Korevaar top-hat text (all need
   Chrome), and the small thin-film findings.

## Non-obvious facts
- **Session 59 lessons:**
  - **Clipped Gaussians:** λ/(πW₀) is the divergence of an untruncated beam. A beam clipped at its 1/e² radius
    (α = a/W₀ = 1) has a 1/e² far-field lobe 1.44× wider; the two agree from α ≈ 2. Use `truncatedGaussianWidth`.
  - **Friis inside z_R:** 8/θ² with FSPL is the far-field, small-aperture limit of 1 − exp(−2a²/w²). Inside the Rayleigh
    range it overestimates by up to 9 dB at slider limits, so link-budget shows the exact `pointingCapture`.
  - The ROADMAP's own golden numbers can be inconsistent with its formula (optical-antenna: 49.43 mm used D√(1−ε²),
    the formula said D/2). Check the physics, then note the deviation in the PR.
  - `useURLState` inside `.map` breaks `rules-of-hooks`; write explicit calls and clamp after.
  - Crossref gives only the first page; don't add end pages from memory.
  - After `next start`, wait ≈ 10 s before the first curl; an early one returns an empty page.
- **Session 58:** check for a newer ITU revision first (`itu.int/rec/R-REC-<rec>/en`). ITU PDFs download with curl, but
  equations come out garbled; read the OMML in `…!!MSW-E.docx` → `word/document.xml`. Fits with ln R terms misbehave
  below their data: scan every fitted term over the whole input range. Auto mode refuses `gh pr merge` without an
  explicit merge yes.
- **Sources:**
  - radioeng.cz and URSI GA full texts download with `curl -A "Mozilla/5.0"` + `pdftotext`; `theses.eurasip.org`
    gives full PDFs. Optics Express doesn't download (JS shell); arXiv reproductions of a table work.
  - Cross-check a coefficient table against a second independent reproduction. Settle disagreements with a physical
    check, not a vote.
  - Thorlabs spec-sheet PDFs come from the public `/graphql` endpoint (storeId "Thorlabs-Website").
  - WebFetch returns PDFs as binary: use `curl` + `pdftotext -layout` (or `-raw` for tables).
- **Merges:** to merge a page, add the redirect, run `scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, then
  `--write`), then `rm -rf .next/types .next/dev/types`. A `post-merge-check` value can be any phrase in the prerendered HTML.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and piecewise joins.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` and per-point marker colours.
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces. It does support `yaxis: "y2"`.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
- **tsx doesn't type-check:** run `npm run check` before trusting a test.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: find it with `netstat -ano | grep :3100`, kill it with
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &`.
- **Independent checks that worked:**
  - RK4 of rate or coupled-mode equations, numerical integrals (Hankel transforms vs Airy and annulus closed forms),
    brute-force scans, published FEM numbers.
  - Mutate the code once to prove the test bites: the reporter prints `✖` and `ℹ fail N`.
- **eslint:** about 764 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never
  `taskkill /IM chrome.exe`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 2–3 min, physics-reviewer ≈ 5–13 min. Don't edit `.ts` while
  `check` runs.
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` can wait on
  "pending". Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks (normalise CRLF),
  run with `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files.
