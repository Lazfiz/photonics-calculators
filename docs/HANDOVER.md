# Handover — 2026-10-15 (session 70 → session 71)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 70 finished detectors part 5 (linear APD) on branch `phase-4/detectors-apd`, PR #100 with this handover.
Next: **Detectors part 6: single-photon**. `polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 241 of 458 pages are tiered (detectors 31 / 54). 15 `knownIssue`s left, all in detectors.
- New `src/physics/detectors/apd.ts`: `millerGain`, `millerExponent` (one-point fit), `excessNoiseFactor` (moved from
  FSO `background-radiance.ts`, which now imports it), `excessNoiseIndex` (F = M^x), `APD_K_TABLE` + `parseApdMaterial`,
  `driftExponent` / `gainAtTemperature` / `gainTemperatureCoefficient` (V_br(T) at fixed bias), `apdReceiver`
  (shot + 4k_B·T·B/R) and `optimumGain` (root of kM³ + (1 − k)M = 4k_B·T/[qR(I_p + I_d)], Newton from an upper bound).
- k table: Si 0.02 (Excelitas C30902EH k_eff), InGaAs/InP 0.5, Ge 0.85 inside Agrawal 4th ed. Table 4.2 ranges.
  No open peer-reviewed source for the InP and Ge numbers was found; US 7,233,051 B2 quotes the same ranges.
- `gain-temperature` defaults are the Excelitas C30662 (M = 10 at 4 V below 50 V, 0.14 V/°C → n = 1.264, −3.18 %/°C).
  `linear-mode-avalanche` lost its "override F" toggle (enter k instead) and gained R_L, T, M_opt.
- Still in FSO: `photonEnergy`. Part 6 replaces `src/lib/geiger-mode-avalanche.ts`.
- User decisions (session 63): keep `spad` and SPCM as separate pages on one module; rewrite `channel-photomultiplier` as a
  true CPM. Session 68: Vercel builds only `main`; the handover goes on the feature branch, one PR per stage.

## Next actions
1. `/ship` this branch. post-merge-check: `detectors/excess-noise="3.9502"` `detectors/linear-mode-avalanche="208.9"`
   `detectors/avalanche-gain="5.349"` `detectors/gain-temperature="-3.18 %/°C"`.
2. Detectors part 6, then 7–9 in ROADMAP order. Each part: module + golden tests, rewire the pages, clamp URL inputs +
   `min`/`max` on inputs, "—" for NaN, then tier, modelNote and references, and delete the `knownIssue`.
   `/handover` on the feature branch before `/ship`.
3. `post-merge-check` takes default-page values only (no query strings). Grep the prerendered
   `.next/server/app/<cat>/<slug>.html` after `build` for a distinctive default string.
4. Later: fiber and FSO open findings (ROADMAP), the imaging/spectroscopy findings, Chrome-only checks.

## Non-obvious facts
- **Session 70 lessons:**
  - Excelitas datasheets (`excelitas.com/sites/default/files/assets/product/document/<id>.pdf`): `pdftotext -layout`
    scrambles their tables; `-raw` keeps rows intact. C30902EH = 24781, C30902SH = 24828, C30645/C30662 = 27873.
  - The Hamamatsu PMT handbook (3rd ed.) is at `wp.optics.arizona.edu/milster/.../pmt_handbook_complete.pdf`; it gives
    no number for the dynode-gain temperature coefficient. rp-photonics.com is 403 to WebFetch, but curl with a UA works.
  - Mutation checks on an **untracked** file: `git diff --quiet` sees nothing, so restore from the backup copy.
  - A datasheet operating point (M at V_br − ΔV) fixes Miller's n; n = 3 at M = 150 would put V 0.5 V from breakdown.
- **Session 69:** `SimpleChart` maps `null` y to 0; use `NaN` for gaps. On log axes, y ≤ 0 is skipped.
- **Session 68:** Vurgaftman 2001 PDF: `ursemiconductors.web.illinois.edu/ECE536/Vurgaftman(2001).pdf`. The Ioffe NSM
  archive needs `curl -k` over http. Registry text can't contain `{…}` (`tests/registry.test.ts`). Write
  `0 − x·expm1(…)` to avoid `-0`. Vercel MCP `list_deployments` returns only the ~9 newest.
- **Session 67:** refractiveindex.info data is on GitHub raw
  (`polyanskiy/refractiveindex.info-database/master/database/data/main/<El>/nk/<Author-Year>.yml`).
- **Session 65:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`: no stale deps, no eslint-disable.
  - A slug rename touching < 10 files: `git mv` the folder, change `href` in `page.tsx`, move the registry entry to its
    sorted place (old title into `keywords`), add the redirect, `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts: write regexes with backslashes via the Write tool, not `node -e`/heredoc edits.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. Selects: map the raw string onto an id list with a default.
  `src/registry/calculators/detectors.ts` is **LF**. Registry scripts must keep the file's line endings.
- **Earlier:** "from memory" reviewer numbers need a source. Format integer outputs as integers. JSX text cannot hold
  `{…}`: wrap it in `{"…"}`. Test the extreme corner of every input range. A general routine must reproduce the closed
  forms it generalises. `useURLState` inside `.map` breaks `rules-of-hooks`.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and SRS manuals. mdpi.com gives 403
  (Europe PMC `/rest/<PMCID>/fullTextXML` works); Optics Express and nature.com don't download. Thorlabs spec sheets come
  from the public `/graphql` endpoint (storeId "Thorlabs-Website"). Cross-check a table against a second source.
- **Fits:** empirical fits can go unphysical inside their stated range. Check signs, orderings and joins. Timings: CI ≈ 2–3
  min, physics-reviewer ≈ 8–15 min, `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives 0·∞ = NaN. Show NaN/∞ as "—" with a reason. Plotly can't draw Infinity.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. Check pages on `next start` after
  `build`. A `next start` can hold port 3100: `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **eslint:** about 665 pre-existing warnings. Lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Shell:** physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`. `python -`
  hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin.
