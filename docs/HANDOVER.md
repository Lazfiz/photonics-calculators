# Handover — 2026-10-15 (session 67 → session 68)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 67 finished detectors part 4a (silicon QE): PR #95, merged as `f631d6b8`, production check passed. This
handover is on `docs/detectors-silicon-qe-handover`. Next: **Detectors part 4b: InGaAs and back-illumination**.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 233 of 458 pages are tiered (detectors 24 / 54). 20 `knownIssue`s left, all in detectors. 686 tests pass.
- `materials/silicon-absorption.ts`: Green 2008 n, k at 300 K, 250–1450 nm (`siliconIndex(λ)`, `siliconAbsorption(λ)` in
  1/m; NaN outside). `detectors/photodiode-qe.ts`: `photodiodeQe({alpha, reflectance, depletionWidth, diffusionLength,
  deadLayer})` (Gärtner; L = 0 is a slab), `normalReflectance(n, k)`.
- `detectors/responsivity.ts`: `responsivity` (re-exported by `noise.ts`), `quantumEfficiencyFromResponsivity`,
  `photonsPerJoule`. `dark-current.ts` adds `SILICON_NI_300K` (9.65e15 m⁻³), `siliconIntrinsicDensity(T)`,
  `generationCurrent`. `photodiode-rc.ts` adds `EPS_R_SILICON` 11.9 and `depletionCapacitance(A, W, ε_r)`.
- Still in FSO: `excessNoiseFactor` (McIntyre) and `photonEnergy` in `src/physics/free-space-comms/background-radiance.ts`.
  Part 5 moves McIntyre to `detectors/apd.ts`. Part 6 replaces `src/lib/geiger-mode-avalanche.ts`.
- User decisions (session 63): rename `si-vs-inge` → `si-vs-ingaas` (part 4b); keep `spad` and SPCM as separate pages on
  one module; rewrite `channel-photomultiplier` as a true CPM. Session 67: the user merged #95 with the InGaAs preset
  dropped from `quantum-efficiency` and the temperature input dropped from `spectral-response`.

## Next actions
1. Ship this docs PR (`/ship`, merge on the user's yes).
2. Detectors part 4b, then 5–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL inputs +
   `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
3. `post-merge-check` takes default-page values only (no query strings). Grep the prerendered
   `.next/server/app/<cat>/<slug>.html` after `build` for a distinctive default string. Part 4a used
   `detectors/responsivity=1.0001 A/W` `detectors/silicon-photodiode=0.563 A/W` `detectors/spectral-response=82.7%`
   `detectors/quantum-efficiency=89.8%`.
4. Later: fiber and FSO open findings (ROADMAP), the two imaging/spectroscopy findings from part 0, Chrome-only checks.

## Non-obvious facts
- **Session 67 lessons:**
  - Optical tables: the refractiveindex.info database is on GitHub raw
    (`polyanskiy/refractiveindex.info-database/master/database/data/main/<El>/nk/<Author-Year>.yml`). pveducation.org's
    silicon table is Green & Keevers 1995, not Green 2008: a usable second source (agrees within 2.3 %).
  - Green 2008's temperature coefficients aren't in the refractiveindex.info file; α(T) is left at 300 K, as the pages say.
- **Session 66 lessons:**
  - Parts of 3–4 modules and 4–5 pages fit one session inline (sessions 66, 67), without a physics-reviewer pass, when
    each function is probed against an independent numeric or hand check before the tests are written.
  - Sources: the SR830 manual (`thinksrs.com/downloads/pdfs/manuals/SR830m.pdf`, pdftotext) has the ENBW table at
    "Slope ENBW Wait Time". Palankovski's TU Wien thesis (`iue.tuwien.ac.at/phd/palankovski/node37.html`) tabulates Varshni
    sets with sources; its GaAs set differs from Sze's, so GaAs was left out.
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
