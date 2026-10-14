# Handover — 2026-10-14 (session 64 → session 65)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 64 finished detectors part 1 (noise): PR #89, merged as `6c0614ae`, production check passed. This handover is on
`docs/detectors-noise-handover`. Next: **Detectors part 2: photodiode front end** (`tia.ts`, `photodiode-rc.ts`, 7 pages,
including the `hybrid-detector` → `photodiode-tia-noise` rename). `polarizer-types` stays blocked until the user is at the
laptop with Chrome.

## State
- 217 of 458 pages are tiered (detectors 8 / 54). 30 `knownIssue`s left, all in detectors. 658 tests pass.
- `src/physics/detectors/noise.ts`: `shotNoiseCurrent`, `johnsonNoise` {v,i,p}, `ktcNoise` {v,charge,electrons},
  `flickerPsd`, `flickerRms`, `flickerShotCorner`, `cornerFlickerRms`, `sensorNoiseElectrons`, `minDetectableSignal`,
  `idealSqnrDb`, `enobFromSinad`. Reuse these in parts 2–9 (NEP, TIA, sensor SNR pages); don't inline √(2qIB) again.
- Still in FSO: `excessNoiseFactor` (McIntyre) and `photonEnergy` in `src/physics/free-space-comms/background-radiance.ts`.
  Part 5 moves McIntyre to `detectors/apd.ts`.
- Old module: `src/lib/geiger-mode-avalanche.ts` (its test only asserts > 0; part 6 replaces it).
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` and `hybrid-detector` → `photodiode-tia-noise`
  (with redirects); keep `spad` and SPCM as separate pages on one module; rewrite `channel-photomultiplier` as a true CPM.

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. Detectors part 2, then parts 3–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL
   inputs + `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
3. `post-merge-check` for part 2: take the values from the ROADMAP box (e.g. `detectors/capacitance=3.273`,
   `detectors/gain-bandwidth=90.91`). Check each page's own formatting first (`toFixed` vs `toPrecision`).
4. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.

## Non-obvious facts
- **Session 64 lessons:**
  - A part of 8 small pages fits easily in one session when done inline. Pattern per page: `xRaw` from `useURLState`,
    `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input with the same `min`/`max`.
  - `src/registry/calculators/detectors.ts` is **LF**. Registry scripts must keep the file's line endings: check with
    `grep -c $'\r'`, never hard-code CRLF on write.
  - ROADMAP goldens built on rounded constants (6.02/1.76) differ from exact ones in the 4th digit. Use the exact form,
    test that the rounded one agrees, and note it in the PR.
- **Session 63 lessons:**
  - Ask `physics-reviewer` for a ready `knownIssue:` line and ≤ 20 lines per OK page. Batches of 4–8 detector pages take
    4–6.5 min each.
  - `knownIssue` text: 40–240 characters, no `{}` or HTML entities, ends with a full stop (`tests/registry.test.ts`).
  - Reviewer numbers flagged "from memory" (InGaAs α, Si APD drift, P46 phosphor, iXon 800 ke⁻ register well, InGaAs
    photocathode QE) need a source before they go into code.
- **Session 62 lessons:**
  - arXiv PDFs download with `curl -A "Mozilla/5.0"` + `pdftotext -layout`; arXiv abs pages carry `citation_doi` meta tags.
  - A "maximum distance" output needs a separate case for zero attenuation (it becomes a loss budget, not a distance).
  - Format integer outputs as integers: `fmt()` gives "10.0 lines", which breaks a post-merge string match.
  - JSX text cannot hold `{…}` (formulas with braces): wrap them in `{"…"}`.
- **Earlier:** mdpi.com gives 403 (Europe PMC `/rest/<PMCID>/fullTextXML` works). Test the extreme corner of every
  input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks
  `rules-of-hooks`.
- **Sources:**
  - radioeng.cz and URSI GA full texts download with `curl -A "Mozilla/5.0"` + `pdftotext`; `theses.eurasip.org`
    gives full PDFs. Optics Express doesn't download (JS shell); arXiv reproductions of a table work.
  - Cross-check a coefficient table against a second independent reproduction. Settle disagreements with a physical
    check, not a vote.
  - Thorlabs spec-sheet PDFs come from the public `/graphql` endpoint (storeId "Thorlabs-Website").
  - WebFetch returns PDFs as binary: use `curl` + `pdftotext -layout` (or `-raw` for tables).
- **Merges/renames:** add the redirect, run `scripts/codemods/2026-10-08-merge-duplicates.ts` (dry run, then `--write`),
  then `rm -rf .next/types .next/dev/types`.
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
- **Independent checks that worked:** RK4 of rate or coupled-mode equations, numerical integrals (Hankel transforms,
  trapezoid in f), brute-force scans, published FEM numbers. Mutate the code once to prove the test bites: the reporter
  prints `✖` and `ℹ fail N`.
- **eslint:** about 688 pre-existing warnings (the summary line starts with `✖`). Lint only the changed files. JSX text
  needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a /b`. Never
  `taskkill /IM chrome.exe`.
- **Vercel pending:** Vercel MCP `list_deployments` (project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`, team `team_LaEJuanZGFVc5UHhLD6LRaiq`).
- **Registry/shell:** bulk registry edits go through a scratchpad `.cjs` with a dry run and anchor checks, run with
  `< /dev/null`. Physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`.
  `python -` hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
