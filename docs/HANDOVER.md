# Handover — 2026-10-15 (session 73 → session 74)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 73 checked PR #102 in production (ALL PASS), split part 7 into 7a and 7b, and finished **detectors part 7a
(electron multipliers)** on branch `phase-4/detectors-vacuum-a`, PR #103 with this handover. Next: **Detectors part 7b**.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 250 of 458 pages are tiered (detectors 40 / 54). 8 `knownIssue`s left, all in detectors.
- New `src/physics/detectors/electron-multiplier.ts`: `uniformDynodes`, `dynodeGain`, `dynodeExcessNoise`
  (1 + 1/δ₁ + 1/(δ₁δ₂) + …), `analogSnr` (R_s/√(2B(R_s+R_d)F)), `photonCountingSnr`, `anodeSensitivity`,
  `excessNoiseFromFwhm`, `pulseResolutionFwhm` (2.355√(F/N)), `channelYieldPerStrike`, `channelGain` (Schagen, Wiza eq. 1),
  `channelStrikes`, `optimumLdRatio`, `maximumChannelGain` (exp(A²V/2e)), `stackedGain`, `saturatedChannelGain`
  (10⁸·d/1 mm), `hexagonalPitch`.
- Pages: `pmt` (F 1.4000, SNR 0.0286), `microchannel-plate` (A 0.2, V₀ 1 eV inputs; 1.02e3 per plate at 1 kV, L/d 50),
  `channel-photomultiplier` rewritten as a single-channel CPM (counting SNR 49.90, analog 35.28, pulse 66.6 % FWHM;
  linear limit 10⁷ e⁻ from the data sheet's saturation onset; gain 10⁵ default).
- User decisions: one PR per stage, handover inside (session 68).

## Next actions
1. `/ship` this branch. post-merge-check: `detectors/pmt="0.0286"` `detectors/microchannel-plate="1.02e+3"`
   `detectors/channel-photomultiplier="49.90"`.
2. Detectors part 7b: new `photoemission.ts` (Richardson A₀ from constants, phosphor gain η·eV/E_ph), and reuse
   `channelGain`/`stackedGain` for the ICCD's MCP. Then parts 8–9 in ROADMAP order. Each part: module + golden tests,
   rewire the pages, clamp URL inputs + `min`/`max`, "—" for NaN, then tier, modelNote, references; delete the `knownIssue`.
   `/handover` on the feature branch before `/ship`.
3. `post-merge-check` takes default-page values only. Grep `.next/server/app/<cat>/<slug>.html` after `build`.
4. Later: fiber and FSO open findings (ROADMAP), the imaging/spectroscopy findings, Chrome-only checks.

## Non-obvious facts
- **Session 73 lessons:**
  - Wiza 1979 (`psec.uchicago.edu/Papers/mcpwiza.PDF`, curl + `pdftotext -raw`) gives the channel-gain law, the optimum
    α_M = 60 / G_M = 1635 at 1 kV (rounded; exact 1568), exponential PHD unsaturated, saturation ∝ bore. It credits the
    model to Schagen, not Eberhardt; Eberhardt 1979 (Appl. Opt.) doesn't download, so it isn't cited.
  - With A = 0.2 the model gives ~10³ per plate where real plates give ~10⁴: say so in the modelNote, don't fudge A.
  - Hamamatsu PMT handbook v4E downloads from `hamamatsu.com/content/dam/.../etd/PMT_handbook_v4E.pdf`. Its equations
    are images; the numbers survive in `pdftotext` (F Eq. 4-25, δ/(δ−1) 4-26, SNR 4-29/4-30, 1.75e3√(I/B) 4-31, 2I_d 4-32).
  - The PerkinElmer CPM data sheet DS-291 (2001) is mirrored page by page at `pdf.jiepei.com/c983p-9414641.html?page=N`;
    its spec tables are images. It gives >10⁸ at 3000 V, 10 cps bialkali, saturation above 10⁷, 3e6 A/W at 410 nm.
  - A saturated channel clips multi-photoelectron pulses: pulse resolution with F needs N_pe·G below the linear limit.
  - The reviewer's hand values can be off in the 5th digit, and so can mine: run the module before writing 1e-7 asserts.
- **Session 72:** Otte 2017 arXiv `1606.05186`, Korzh 2014 arXiv `1312.2636`, Excelitas SPCM-AQRH = doc `27464`. Check a
  doubling interval centred on T. State the systematic bias of a "statistical only" SNR in the modelNote.
- **Session 71:** Ziarkash 2018 (Europe PMC `PMC5864738` fullTextXML) tabulates P_ap for 16 SPADs. A NP dead-time
  corrected rate has relative error 1/√N_recorded. Monte Carlo: `Math.random` and ≥ 1000 counts/gate.
- **Session 70:** Excelitas datasheets (`excelitas.com/sites/default/files/assets/product/document/<id>.pdf`): use
  `pdftotext -raw`. rp-photonics.com is 403 to WebFetch, but curl with a UA works.
- **Session 69:** `SimpleChart` maps `null` y to 0; use `NaN` for gaps. On log axes, y ≤ 0 is skipped.
- **Session 68:** Vurgaftman 2001 PDF: `ursemiconductors.web.illinois.edu/ECE536/Vurgaftman(2001).pdf`. Registry text
  can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
- **Session 65:**
  - Probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see `ℹ fail N`.
  - Charts of ≤ 300 points: compute them in the render, not in `useMemo`.
  - A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the redirect,
    `rm -rf .next/types .next/dev/types`.
  - Scratchpad `.cjs` scripts for multi-line edits; write regexes via the Write tool or a quoted heredoc.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` is **LF**; scripts must keep line endings.
- **Earlier:** "from memory" reviewer numbers need a source. JSX text cannot hold `{…}`. Test the extreme corner of every
  input range. A general routine must reproduce the closed forms it generalises. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and SRS manuals. mdpi.com gives 403
  (Europe PMC `/rest/<PMCID>/fullTextXML` works); Optics Express, Appl. Opt. and nature.com don't download.
- **Fits:** empirical fits can go unphysical inside their stated range. Timings: CI ≈ 2–3 min, physics-reviewer ≈ 9 min,
  `npm run check` ≈ 4 min, build ≈ 6 min.
- **URL strings:** `s in OBJ` is true for prototype keys; use `Object.hasOwn` or `find` over an id list.
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** `q·exp(big)` with q = 0 gives NaN. Show NaN/∞ as "—" with a reason. Plotly can't draw Infinity.
- **Hung checks:** wrap every chrome, ui-check and server command in `timeout <s>`. A `next start` can hold port 3100:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`.
- **eslint:** about 665 pre-existing warnings. Lint only the changed files. JSX text needs `&apos;`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never
  `taskkill /IM chrome.exe`.
- **Shell:** physics probes are scratchpad `.ts` files importing `"C:/dev/photonics-calculators/src/…"`. `python -`
  hangs. `git grep` skips untracked files. A bare `cat > file` with no heredoc hangs on stdin. Quote DOIs with `(`.
