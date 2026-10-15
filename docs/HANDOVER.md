# Handover — 2026-10-15 (session 66 → session 67)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 66 finished detectors part 3 (dark current and signal recovery): PR #93, merged as `1d46ac23`, production check
passed. This handover is on `docs/detectors-dark-current-handover`. Next: **Detectors part 4a: silicon QE**.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 229 of 458 pages are tiered (detectors 20 / 54). 23 `knownIssue`s left, all in detectors. 675 tests pass.
- `src/physics/detectors/noise.ts`: shot, Johnson, kTC, 1/f, sensor noise, ADC SQNR/ENOB, `responsivity`,
  `noiseEquivalentPower(i, ℛ, M)`, `specificDetectivity(A_cm², B, NEP)`.
- `photodiode-rc.ts` (C_j, depletion width, RC/transit bandwidth, `rcFilteredNoise`), `tia.ts` (SBOA122 bandwidth and noise).
- `dark-current.ts`: `VARSHNI` (Si 1.17/4.73e-4/636, Ge 0.7437/4.774e-4/235; Sze 1981), `varshniBandGap`,
  `intrinsicDensityRatio(T, T_ref, E_g, E_g_ref = E_g)`, `darkCurrentRatio(…, mechanism, E_g_ref)`, `doublingLawRatio`,
  `localDoublingTemperature(T, E_g | VarshniParams, mechanism)`.
- `lockin.ts`: `lowPassEnbw(τ, N, "rc" | "butterworth")`, `lowPassMagnitude`, `REFERENCE_GAIN` (sine 1, square 2√2/π),
  `lockinSnrGain`. `boxcar.ts`: `gaussianGateAverage`, `gateNoiseBandwidth`, `gateNoiseRms` (single-pole input band),
  `optimalGateWidthRatio` (1.18904).
- Still in FSO: `excessNoiseFactor` (McIntyre) and `photonEnergy` in `src/physics/free-space-comms/background-radiance.ts`.
  Part 5 moves McIntyre to `detectors/apd.ts`. Part 6 replaces `src/lib/geiger-mode-avalanche.ts`.
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` (part 4b); keep `spad` and SPCM as separate pages on
  one module; rewrite `channel-photomultiplier` as a true CPM.

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. Detectors part 4a, then 4b–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL inputs +
   `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
3. `post-merge-check` takes default-page values only (no query strings). Grep the prerendered
   `.next/server/app/<cat>/<slug>.html` after `build` for a distinctive default string (e.g. `detectors/responsivity=1.000`).
4. Part 4b also folds the inline Varshni copies (`silicon-photodiode`, `materials/semiconductor-bandgap`) into
   `materials/bandgap.ts` (see the ROADMAP box).
5. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.

## Non-obvious facts
- **Session 66 lessons:**
  - A part with 3 modules and 5 pages fit in one session inline, without a physics-reviewer pass. Each function was
    probed against an independent numeric check (ENBW integral, trapezoid gate average, noise double integral,
    brute-force optimum) before the tests were written.
  - Sources: the SR830 manual (`thinksrs.com/downloads/pdfs/manuals/SR830m.pdf`, pdftotext) has the ENBW table at
    "Slope ENBW Wait Time". Palankovski's TU Wien thesis (`iue.tuwien.ac.at/phd/palankovski/node37.html`) tabulates Varshni
    sets with sources; its GaAs set differs from Sze's, so GaAs was left out.
  - The fixed-gap n_i scaling understates the cooling gain: Si 25 → −40 °C is ×630 with 1.12 eV and ×950 with Varshni,
    since the activation energy is ≈ E_g(0) + αβT²/(T+β)² = 1.20 eV.
- **Session 65 lessons:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`: no stale deps, no eslint-disable.
  - A slug rename touching < 10 files: `git mv` the folder, change `href` in `page.tsx`, move the registry entry to its
    sorted place (old title into `keywords`), add the redirect, `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts: write regexes with backslashes via the Write tool, not `node -e`/heredoc edits.
- **Session 64 lessons:**
  - Pattern per page: `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input with the
    same `min`/`max`. Selects: map the raw string onto an id list with a default.
  - `src/registry/calculators/detectors.ts` is **LF**. Registry scripts must keep the file's line endings.
- **Earlier:** "from memory" reviewer numbers need a source. Format integer outputs as integers. JSX text cannot hold `{…}`: wrap it in `{"…"}`. A "maximum distance"
  output needs a zero-attenuation case. Test the extreme corner of every input range. A general routine must reproduce
  the closed forms it generalises. `useURLState` inside `.map` breaks `rules-of-hooks`.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext -layout` works for arXiv, radioeng.cz, URSI GA, `theses.eurasip.org`,
  TI app notes (`ti.com/lit/an/<id>/<id>.pdf`) and SRS manuals. mdpi.com gives 403 (Europe PMC
  `/rest/<PMCID>/fullTextXML` works); Optics Express doesn't download. Thorlabs spec sheets come from the public `/graphql`
  endpoint (storeId "Thorlabs-Website"). Cross-check a coefficient table against a second independent source; settle
  disagreements with a physical check, not a vote.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 2–3
  min, physics-reviewer ≈ 8–15 min, `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: find it with `netstat -ano | grep :3100`, kill it with
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &`.
- **eslint:** about 665 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Vercel pending:** Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks, run with
  `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
