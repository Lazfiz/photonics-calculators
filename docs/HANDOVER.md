# Handover — 2026-10-15 (session 74 → session 75)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 74 checked PR #103 in production (ALL PASS) and finished **detectors part 7b (photoemission)** on branch
`phase-4/detectors-vacuum-b`, PR #105 with this handover. Next: **Detectors part 8 (EM and camera SNR)**.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 253 of 458 pages are tiered (detectors 43 / 54). 5 `knownIssue`s left, all in detectors (parts 8–9).
- New `src/physics/detectors/photoemission.ts`: `RICHARDSON_A0` (4π·m_e·k_B²·q/h³), `thermionicCurrentDensity`,
  `thresholdWavelength`, `planarTransitTime`, `vacuumTransitBandwidth` (0.5533/τ, Ramo ramp), `childLangmuirCurrentDensity`,
  `phosphorGain` (η·qV/E_ph), `intensifierNoiseFactor` (F_MCP + 1/G_e), `intensifiedSnr`, `streakTime`,
  `quadratureFwhm`, `rectGaussFwhm` (exact FWHM of ≤ 2 rectangles ⊗ a Gaussian).
- Pages: `intensified-ccd` (defaults 10 photons, MCP 10³, coupling 0.1 → G_e 1.65e4, SNR 1.3163 vs bare 0.9129; full-well
  flag), `vacuum-photodiode` (gap input, load Johnson noise at 25 °C, Child limit on photo + dark; SNR −18.7 dB),
  `streak-camera` (7.500 ps; quadrature 7.870 shown for comparison; dynamic-range input dropped, screen-blur added).
- PR #104 (`devctl/t1`, "production deploys only from the release branch") was open and not from this session: check
  with the user whether it changes the "Vercel builds only `main`" rule before shipping.
- User decisions: one PR per stage, handover inside (session 68).

## Next actions
1. `/ship` this branch. post-merge-check: `detectors/intensified-ccd="1.32"` `detectors/vacuum-photodiode="-18.7"`
   `detectors/streak-camera="7.500"` (verify the rendered strings in `.next/server/app/detectors/<slug>.html` first).
2. Detectors part 8: new `camera-snr.ts` (Robbins & Hadwen F²), then part 9, in ROADMAP order. Each part: module + golden
   tests, rewire the pages, clamp URL inputs + `min`/`max`, "—" for NaN, then tier, modelNote, references; delete the
   `knownIssue`. `/handover` on the feature branch before `/ship`.
3. Later: the part 7b leftovers, fiber and FSO open findings (ROADMAP), imaging/spectroscopy findings, Chrome-only checks.

## Non-obvious facts
- **Session 74 lessons:**
  - Rectangles (slit image, pixel) don't add in quadrature: rect ⊗ rect is a trapezoid of FWHM max(a, b). Use
    `rectGaussFwhm`; it matches a brute-force convolution to 1e-9.
  - A uniformly accelerated electron's Ramo current is a ramp; its −3 dB point 0.5533/τ happens to equal the triangle's.
  - Johnson noise of a 50 Ω load beats shot noise below 2k_BT/(qR) ≈ 1 mA. Keep the load at room temperature when the
    cathode temperature is an input.
  - Richardson at the photoemission threshold underestimates semiconductor-photocathode dark current by orders.
  - ICCD defaults must keep N_pe·G_e under a CCD well; the old 100 photons × 10⁶ e⁻/pe gave 300× full well.
  - Phosphor efficiencies: Stanford Computer Optics quotes P43 ≈ 200 and P46 ≈ 95 photons/e (no voltage given); the
    Exosens phosphor PDF doesn't download. Hamamatsu streak guide SHSS0006E: `hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/sys/SHSS0006E_STREAK.pdf`.
- **Session 73:** Wiza 1979 at `psec.uchicago.edu/Papers/mcpwiza.PDF`; Hamamatsu PMT handbook v4E at
  `hamamatsu.com/content/dam/.../etd/PMT_handbook_v4E.pdf` (numbers survive `pdftotext`). With A = 0.2 Schagen gives
  ~10³ per plate, real ~10⁴: say so, don't fudge. Run the module before writing 1e-7 asserts.
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
