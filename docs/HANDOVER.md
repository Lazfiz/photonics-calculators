# Handover — 2026-10-13 (session 52 → session 53)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 52 finished fiber-optics fix part 10 in two PRs: #64 (taper merge and silica attenuation) and #65 (OTDR and
link budget). Both passed the production check. **Next: fix part 11**, `photonic-crystal` and `specialty-fiber`.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 182 of 459 pages are tiered, 2 `knownIssue`s (both part 11), 565 tests pass.
- New in session 52:
  - `fiber-taper.ts`: Birks–Li shape, three-layer LP0m solver, core–cladding transition, Love delineation.
  - `silica-attenuation.ts`: A/λ⁴ plus Keiser's IR and UV tails and the OH band; CWDM grid.
  - `otdr.ts`: `twoPointResolution`, `captureFraction` (Brinkmeyer), `backscatterRatio` (sinh form when given α),
    `noisePower`, `dynamicRangeDb`, `fresnelReflectance`, `reflectivePeakDb`, `otdrTrace`.
  - `link-budget.ts`: `linkBudget` (Agrawal P_tx = P_rx + C_L + M_s; reach NaN when the link can't close).
  - `math.ts` gained `besselY` and scaled I_n/K_n pairs.
- Other fiber modules: `coupled-mode.ts`, `step-index-modes.ts`, `microbend.ts`, `g657.ts`, `macro-bending-loss.ts`,
  `fiber-birefringence.ts`, `doped-fiber-gain.ts`, `sagnac.ts`, `fiber-bundle.ts`, `fiber-bragg-grating.ts`,
  `fiber-sensors.ts`, `fiber-nonlinear.ts`, `chromatic-dispersion.ts`, `gaussian-coupling.ts`, `dispersion-comp.ts`, PMD.
- Per-page reviewer evidence for part 11 is in the PR #43 description: `gh pr view 43 --json body -q .body`.

## Next actions
1. Fix part 11 (ROADMAP box): `photonic-crystal` (Saitoh–Koshiba effective V) and `specialty-fiber`. Both are data
   pages, so label them illustrative where the numbers are typical rather than modelled. Each fixed page: remove its
   `knownIssue`, set tier, `modelNote` (≤ 220 chars), references (`scripts/crossref.mjs`).
2. One `physics-reviewer` pass before the PR; ask about conventions and in-range inputs that give NaN/∞ or 0·∞.
3. `/ship`: `post-merge-check <sha> fiber-optics/<slug>=<default value as rendered>` per page (toFixed renders "-").
4. After part 11, fiber-optics is fully tiered. Then do the thin-film leftovers, or the fiber open findings (SMF core
   and D(1550) unification, the 1.4682 phase/group mix on ≈ 20 pages).
5. Open: G.657.A3 and the MCF photoelastic R_eq (ROADMAP open findings) once Chrome is available.

## Non-obvious facts
- **Part 10 lessons:**
  - Brinkmeyer S = (3/2)(λ/2πnw)² follows from the dipole pattern 3/(8π) × (λ/n)² ∫I_norm² dA.
  - η = Sα_sΔz needs sinh(αΔz)/α once αΔz ≳ 0.3 (100 µs pulses).
  - OTDRs display one-way dB: 5 log₁₀. DR uses SNR = 1; the 98 % convention is 1.56–1.83 dB lower.
  - Corning SMF-28 Ultra: −82 dB (1 ns) at 1550 nm, MFD 10.4 µm. The PDFs return 403 to curl; search snippets
    quote them.
  - The Agrawal 4th-ed. section number for the power budget is unverified (cite "Ch. 5").
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly.
  - It ignores `layout.legend` (the legend is pinned right; long names clip) and the marker colours of markers traces.
  - It has no `layout.shapes` or per-trace `showlegend`; draw marker lines as traces.
  - It supports `yaxis: "y2"` with `layout.yaxis2`, but curves that are both straight lines in log τ coincide.
  - Use `showlegend: false` and a caption (also the chart's text alternative).
- **Part 9 lessons:**
  - Snyder κ is exact for the CMT overlap at any D ≥ 2a; check it against a 2-D overlap integral.
  - Compute Bessel ratios as one scaled ratio times e^(…): separate K's underflow to 0/0 at W ≳ 350.
  - Smooth, decaying tail integrals converge spectrally with Simpson. Sample oscillating plots adaptively.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on `NaN > 0` silently converges to a wrong finite
  answer. Skip zero terms. Show NaN/∞ as "—" with a reason, never "NaN dB".
- **tsx doesn't type-check:** `npx tsx --test` passes code that `tsc` rejects. Run `npm run check` before trusting a test.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`, never `next dev`. A `timeout`-wrapped `next start` can outlive its timeout and hold port 3100: `netstat -ano |
  grep :3100`, `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &` (no completion notice).
- **Stale `.next`:** a removed page breaks `tsc` via `.next/types` and `.next/dev/types` (`rm -rf` both); a stale
  `.next/dev` cache made every route 404 (`rm -rf .next/dev`).
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals of mode fields,
  brute-force scans for optimisers, coupler-matrix sums. Mutate the code once to prove the test bites (the spec reporter
  prints `✖` and `ℹ fail N`, not "not ok").
- **eslint** reports ≈ 800 pre-existing warnings. `check` passes; lint only the changed files.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never run
  `taskkill /IM chrome.exe`.
- **Timings:** `check` ≈ 6 min, `build` ≈ 6–10 min, CI ≈ 3 min, physics-reviewer ≈ 4–13 min. Background them; don't
  edit `.ts` while `check` runs.
- **SMF-28 index:** 1.4682 is its *group* index (delay, OTDR, gyro transit). Bragg λ, Fresnel, V and n_eff need the
  phase index ≈ 1.447 (ROADMAP open finding for the other pages).
- **Vercel status:** GitHub often gets no commit status for production deploys, so `post-merge-check` waits on
  "pending" (up to 20 min). Check with Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, filter `sha`). A production redeploy needs the user.
- **Registry edits** go through a scratchpad `.cjs` script with a dry run and anchor checks (`slug: "<x>",` → entry ends
  at the next `\n  },`). Strip an existing `tier:` block first so it re-runs. Build references without empty keys.
- **Screenshots:** `chrome.exe --headless=new --virtual-time-budget=8000 --window-size=1280,2600 --screenshot=<png>
  <url>`, then crop with `sharp` before reading.
- **Sources:** Agrawal FOCS 4th ed. `10.1002/9780470918524`; Erdogan `10.1109/50.618322`; Born & Wolf 7th ed.
  `10.1017/CBO9781139644181`. WebFetch returns PDFs as binary: `curl` + `pdftotext -layout`.
- **Shell:** edit scripts are scratchpad `.cjs` files run with `< /dev/null`; normalise CRLF before matching anchors.
  Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`, run with `npx tsx`.
  `python -` hangs; use `node`. `git grep` skips untracked files.
- **`useURLState` doesn't clamp:** clamp in the page. **Plotly can't draw Infinity:** map to `null`.
