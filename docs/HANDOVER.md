# Handover — 2026-10-16 (session 76 → session 77)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 76 checked PR #106 in production (ALL PASS) and finished **detectors part 9a (sensor noise)** on branch
`phase-4/detectors-sensor-noise`, PR #107 with this handover. Next: **Detectors part 9b (MTF and cosmic rays)**.
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 261 of 458 pages are tiered (detectors 51 / 54). 2 `knownIssue`s left (`cosmic-rays`, `pixel-crosstalk`), both part 9b.
- New `src/physics/detectors/sensor-noise.ts`: `sensorNoise` → {shot, darkShot, read, quantization, prnu, dsnu,
  temporal, spatial, total} (EMVA 1288 Eq. 48), `shotReadCrossover` (σ_r²), `shotPrnuCrossover` (1/P²), `prnuPattern(n)`
  (seeded mulberry32, zero mean, unit sample sd). New `antiblooming.ts`: `antiblooming` → {collected, drained, spilled},
  `bloomingOnset` = T + (W − T)/(1 − η).
- Pages: `photon-transfer` (+ `prnu` input, 5 curves, total 547.81 e⁻ / temporal 223.83 e⁻ at full well), `uniformity`
  (DSNU now e⁻ rms, URL key `dsnuPercent` → `dsnu`; 547.84 e⁻; map rms 500.0), `antiblooming` (illustrative; onset 1.040e+6).
- PR #104 (`devctl/t1`, by the user: production deploys only from a `release` branch, `/ship` ends at merge) is still
  open. Ask the user when to merge it; it changes the "Vercel builds only `main`" rule.
- User decisions: one PR per stage, handover inside (session 68).

## Next actions
1. `/ship` this branch. post-merge-check: `detectors/photon-transfer="547.81"` `detectors/uniformity="547.84"`
   `detectors/antiblooming="1.040e+6"` (verify the rendered strings in `.next/server/app/detectors/<slug>.html` first).
2. Detectors part 9b (ROADMAP): `sensor-mtf.ts`; `modulation-transfer`, `pixel-crosstalk`, `cosmic-rays`.
3. Later: the part 7b leftovers, fiber and FSO open findings (ROADMAP), imaging/spectroscopy findings, Chrome-only checks.

## Non-obvious facts
- **Session 76:** EMVA 1288 PDFs download with curl: `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf` (Eq. 23–25, 45–48;
  `pdftotext -raw`) and `EMVA1288General_4.0Release.pdf`. DSNU₁₂₈₈ is absolute (e⁻), PRNU₁₂₈₈ relative; σ_q² = 1/12 DN².
  Random patterns in a client page must be seeded (module-level const) so the prerender and hydration agree.
- **Session 75:** Robbins–Hadwen F² = 2(1 − 1/G)/(1 + p) + 1/G is the Galton–Watson result for a binomial stage. With
  N = 604, F² peaks (1.978) near G = 300, so SNR is not monotonic in G. EMCCD DR = 20·log₁₀(W_reg/σ_r) for G > W_reg/W_pix.
  Andor iXon Ultra spec PDF: `andor.oxinst.com/downloads/uploads/andor-ixon-ultra-emccd-specifications.pdf`.
- **Session 74:** rect ⊗ rect is a trapezoid of FWHM max(a, b), so rectangles don't add in quadrature (`rectGaussFwhm`).
  Johnson noise of a 50 Ω load beats shot noise below 2k_BT/(qR) ≈ 1 mA. Hamamatsu streak guide SHSS0006E:
  `hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/sys/SHSS0006E_STREAK.pdf`.
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
