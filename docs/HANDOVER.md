# Handover — 2026-10-14 (session 61 → session 62)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 61 did FSO part 5, receiver: PR #83, merged as `773ee46d`; the production check passed. This handover is on
`docs/fso-part5-handover`. Next: **FSO part 6, pointing and QKD** (4 pages + `qkd.ts`, see the ROADMAP box).
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 205 of 458 pages are tiered (free-space-comms 22/26), 4 `knownIssue`s (all FSO part 6), 645 tests pass.
- New `background-radiance.ts`: Giggenbach 2022 Table 1 sky/cloud radiance (850–1550 nm, log-log), `solarDiscRadiance`
  (5772 K, `SUN_SOLID_ANGLE` 6.794e-5 sr), `backgroundPower` (L·A·π sin²θ·Δλ·T·η), `responsivity`, `excessNoiseFactor`,
  `receiverNoise` (PIN/APD SNR), `equalNoiseHalfAngle`, `BACKGROUND_SCENES` + `parseScene` for page selects.
- New `channel-capacity.ts`: `shannonCapacity`, `phaseTail` (Craig), `mpskGrayBer`, `bitErrorRate` (OOK/BPSK/QPSK/8PSK/
  16QAM), `requiredSnrDb`, `netRate`, `binaryEntropy`, `minimumHardDecisionOverhead`, `shannonEbN0`.
- Other FSO modules: `atmospheric-attenuation`, `precipitation`, `wavelength-selection`, `link-budget`, `pointing-loss`,
  `turbulence`, `ber`, `bpsk-qpsk`. Planned: `qkd.ts` (part 6).

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. FSO part 6 (ROADMAP box). Verify each coefficient and DOI before code; one `physics-reviewer` pass before the PR.
   Post-merge check: `free-space-comms/point-ahead="46.7"` (7 km/s → 46.70 µrad; confirm the page's default first) plus
   the acquisition-tracking, quantum-key-distribution and security defaults you derive.
3. For each fixed page: drop the `knownIssue`; add the tier, a `modelNote` (≤ 220 chars, `[...s].length`) and references
   (`crossref.mjs`). That empties the FSO `knownIssue` list.
4. Later: fiber and FSO open findings, G.657.A3, MCF R_eq, snow law, Kim & Korevaar text (need Chrome), thin-film findings.

## Non-obvious facts
- **Session 61 lessons:**
  - mdpi.com returns 403 to curl and WebFetch. Europe PMC has the full text: search
    `ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:<doi>&format=json` for the pmcid, then fetch
    `/rest/<PMCID>/fullTextXML`; tables come out of `<table-wrap>` with sed.
  - Recompute one example row of a published table from its own equation: Giggenbach's Table 2 uses Ω = 4π sin²ω (16×
    too big). Sanity-check "typical" radiances with physics: his Moon row is ≈ 10× E_sun·albedo/π, so it was dropped.
  - A general routine (Gray M-PSK by sectors) should reproduce the closed forms it generalises (BPSK, QPSK) in a test.
  - Bisection on a fixed bracket must reject the lower edge too, or it silently returns the edge.
- **Session 60:** Andrews' aperture fits are interpolations (25–33 % high at d² = 1–10); the exact weak integral is cheap.
  `erfc` ≈ 0.5 µs: give per-chart-point solvers a call budget and time each chart (< 0.3 s). Fixed iteration caps fail
  at large parameters (P(1e6, 1e6)); test the extreme corner of every input range. Check approximations against an exact
  nested integral, not only Monte Carlo. Read the page code, not an implementer's sanity script.
- **Session 59:** a clipped Gaussian (α = 1) has a 1.44× wider far-field lobe than λ/(πW₀). ROADMAP golden numbers can
  contradict their formula: check the physics and note the deviation in the PR. `useURLState` inside `.map` breaks
  `rules-of-hooks`. Crossref gives only the first page. After `next start`, wait ≈ 10 s before the first curl.
- **Session 58:** check for a newer ITU revision first (`itu.int/rec/R-REC-<rec>/en`); read ITU equations from the OMML in
  `…!!MSW-E.docx` → `word/document.xml`. Fits with ln R terms misbehave below their data: scan every term over the input
  range. Auto mode refuses `gh pr merge` without an explicit merge yes.
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
