# Handover — 2026-10-14 (session 60 → session 61)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 60 did FSO part 4, turbulence: PR #81, merged as `ed067ea5`; the production check passed. This handover is on
`docs/fso-part4-handover`. Next: **FSO part 5, receiver** (3 pages + `background-radiance.ts`, see the ROADMAP box).
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 202 of 458 pages are tiered (free-space-comms 19/26), 7 `knownIssue`s (all FSO), 634 tests pass.
- `turbulence.ts` gained `apertureParameter`, `logIrradianceVariances`, `weakApertureFactor` (exact Gaussian-aperture
  integral), `andrewsApertureFactor`, `gammaGammaParameters`/`gammaGammaCdf`, `irradianceCorrelation` (table from
  `scripts/gen-irradiance-covariance.ts`), `diversityOutage`/`diversityThreshold` (SC/EGC/MRC), `beamWanderVariance`/`LossDb`.
- `math.ts` gained `lnGamma`, `regularizedGammaP` (Temme for a ≥ 1e5), `integrateTanhSinh`.
- Other FSO modules: `atmospheric-attenuation`, `precipitation`, `wavelength-selection`, `link-budget`, `pointing-loss`,
  `ber`, `bpsk-qpsk`. Planned: `background-radiance.ts` (5), `qkd.ts` (6).

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. FSO part 5: receiver (ROADMAP box). Verify each coefficient and DOI before code; one `physics-reviewer` pass before the
   PR. Post-merge check to include `free-space-comms/channel-capacity="6.658"` plus the background-noise and receiver-fov
   defaults you derive.
3. For each fixed page: drop the `knownIssue`; add the tier, a `modelNote` (≤ 220 chars, `[...s].length`) and references
   (`crossref.mjs`).
4. Later: fiber and FSO open findings, G.657.A3, MCF R_eq, snow law, Kim & Korevaar text (need Chrome), thin-film findings.

## Non-obvious facts
- **Session 60 lessons:**
  - **Interpolations vs integrals:** Andrews' aperture fits are interpolations (spherical 0.333 is 25–33 % high at
    d² = 1–10). The exact weak integral is cheap: closed κ-integral (Γ(−5/6) kernel) + tanh-sinh over ξ.
  - **Speed:** `erfc` costs ≈ 0.5 µs (series/CF). A page that solves thresholds per chart point needs a call budget:
    a tight analytic bracket + Illinois on ln P, not 70-step bisection. Time each chart in a probe (target < 0.3 s);
    the reviewer found a 5–40 s freeze.
  - **Large parameters:** fixed iteration caps fail at a ≳ 2e5 (P(1e6, 1e6) gave 0.34); a ln a − lnΓ(a) cancels, so use
    Stirling; scan grids must shrink with the 1/√a peak width. Test the extreme corner of every input range.
  - **Fenton–Wilkinson** on ΣI² is much worse than on ΣI; bound MRC by EGC and SC (Cauchy–Schwarz, max ≤ √ΣI²).
  - Check approximations against an exact nested integral, not only Monte Carlo: MC said ≤ 0.4 dB, exact said ≈ 1 dB.
  - An implementer's sanity script printed wrong defaults while the page was right: read the page code.
  - Bash: a bare `cat > file` with no heredoc hangs on stdin; write scripts with the Write tool or a quoted heredoc.
- **Session 59:** a clipped Gaussian (α = 1) has a 1.44× wider far-field lobe than λ/(πW₀) (`truncatedGaussianWidth`);
  Friis 8/θ² overestimates inside z_R, so show the exact capture. ROADMAP golden numbers can contradict their formula:
  check the physics and note the deviation in the PR. `useURLState` inside `.map` breaks `rules-of-hooks`. Crossref
  gives only the first page. After `next start`, wait ≈ 10 s before the first curl.
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
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 2–3 min, physics-reviewer ≈ 5–15 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn`.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` and per-point marker colours.
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces. It does support `yaxis: "y2"`.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
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
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` can wait on
  "pending". Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks (normalise CRLF),
  run with `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files.
