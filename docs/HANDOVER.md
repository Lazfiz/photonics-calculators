# Handover — 2026-10-14 (session 65 → session 66)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 65 finished detectors part 2 (photodiode front end): PR #91, merged as `da902707`, production check passed.
This handover is on `docs/detectors-front-end-handover`. Next: **Detectors part 3: dark current and signal recovery**
(extend `dark-current.ts`, new `lockin.ts`). `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 224 of 458 pages are tiered (detectors 15 / 54). 26 `knownIssue`s left, all in detectors. 667 tests pass.
- `src/physics/detectors/noise.ts`: shot, Johnson, kTC, 1/f, sensor noise, ADC SQNR/ENOB, plus `responsivity`,
  `noiseEquivalentPower(i, ℛ, M)`, `specificDetectivity(A_cm², B, NEP)`.
- `photodiode-rc.ts`: `junctionCapacitance`, `GRADING_EXPONENT`, `depletionWidth`, `rcBandwidth`, `transitBandwidth`
  (0.443·v/W), `combinedBandwidth`, `rcFilteredNoise` (S₀·f_c·atan(B/f_c)).
- `tia.ts`: `singlePoleClosedLoop`, `closedLoopMagnitude`, `tiaBandwidth` (SBOA122 eq. 12), `tiaButterworthCf`,
  `tiaSpotNoise` / `tiaBandNoise` (eq. 13).
- `dark-current.ts`: `intrinsicDensityRatio`, `darkCurrentRatio(T, T_ref, E_g, "generation" | "diffusion")`, fixed E_g.
  Part 3 adds the doubling law and Varshni E_g(T) here.
- Still in FSO: `excessNoiseFactor` (McIntyre) and `photonEnergy` in `src/physics/free-space-comms/background-radiance.ts`.
  Part 5 moves McIntyre to `detectors/apd.ts` (then `detectivity` can take k). Part 6 replaces `src/lib/geiger-mode-avalanche.ts`.
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` (still to do, part 4b); keep `spad` and SPCM as
  separate pages on one module; rewrite `channel-photomultiplier` as a true CPM. `hybrid-detector` rename done.

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. Detectors part 3, then parts 4–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL
   inputs + `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
3. `post-merge-check` for part 3: take the values from the ROADMAP box (e.g. `detectors/lockin-amplifier=0.1768`,
   `detectors/dark-noise-temperature=…`). Grep the prerendered HTML on `next start` first to get the exact strings.
4. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.

## Non-obvious facts
- **Session 65 lessons:**
  - A part of 7 pages with 3 modules fit in one session inline. Probe the module (scratchpad `.ts`) before writing the
    test: two hand values were off in the 5th digit and the probe caught them.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`: no stale deps, no eslint-disable.
  - A slug rename touching < 10 files: `git mv` the folder, change `href` in `page.tsx`, move the registry entry to its
    sorted place (old title into `keywords`), add the redirect, `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts: write regexes with backslashes via the Write tool, not `node -e`/heredoc edits.
- **Session 64 lessons:**
  - Pattern per page: `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input with the
    same `min`/`max`.
  - `src/registry/calculators/detectors.ts` is **LF**. Registry scripts must keep the file's line endings.
  - ROADMAP goldens built on rounded constants (6.02/1.76) differ from exact ones in the 4th digit. Use the exact form.
- **Session 63 lessons:**
  - Reviewer numbers flagged "from memory" (InGaAs α, Si APD drift, P46 phosphor, iXon 800 ke⁻ register well, InGaAs
    photocathode QE) need a source before they go into code.
- **Earlier:** format integer outputs as integers (`fmt()` gives "10.0 lines"). JSX text cannot hold `{…}`: wrap it in
  `{"…"}`. A "maximum distance" output needs a zero-attenuation case. Test the extreme corner of every input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks
  `rules-of-hooks`.
- **Sources:**
  - `curl -A "Mozilla/5.0"` + `pdftotext -layout` works for arXiv, radioeng.cz, URSI GA, `theses.eurasip.org` and TI app
    notes (`ti.com/lit/an/<id>/<id>.pdf`). mdpi.com gives 403 (Europe PMC `/rest/<PMCID>/fullTextXML` works); Optics
    Express doesn't download.
  - Cross-check a coefficient table against a second independent reproduction. Settle disagreements with a physical
    check, not a vote.
  - Thorlabs spec-sheet PDFs come from the public `/graphql` endpoint (storeId "Thorlabs-Website").
- **Merges:** add the redirect, run `scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, then `--write`), then
  `rm -rf .next/types .next/dev/types`.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 3 min,
  physics-reviewer ≈ 8–15 min, `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list (`parseScene`).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN, and bisection on NaN converges to a wrong finite answer. Show
  NaN/∞ as "—" with a reason. Plotly can't draw Infinity: map it to `null`.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: find it with `netstat -ano | grep :3100`, kill it with
  `taskkill //PID <pid> //T //F`. Use `run_in_background`, not `( … ) &`.
- **Independent checks that worked:** RK4 of rate equations, numerical integrals (Hankel, trapezoid in f), brute-force
  scans, published FEM numbers, a full closed-loop TIA transfer function (session 65). Mutate the code once to prove the test bites: the reporter
  prints `✖` and `ℹ fail N`.
- **eslint:** about 688 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never
  `taskkill /IM chrome.exe`.
- **Vercel pending:** Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks, run with
  `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
