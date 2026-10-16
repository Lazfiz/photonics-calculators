# Handover — 2026-10-16 (session 77 → session 78)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 77 checked PR #107 in production (ALL PASS) and finished **detectors part 9b (MTF and cosmic rays)** on branch
`phase-4/detectors-mtf-cosmic`, with this handover in the PR. **Detectors is done: 54/54 tiered, 0 `knownIssue`s.**
Next: **ask the user which category to audit next** (wave-optics 2/49, materials 4/45, spectroscopy 5/54, imaging 9/65).
`polarizer-types` stays blocked until the user is at the laptop with Chrome.

## State
- 264 of 458 pages are tiered. No `knownIssue`s left anywhere.
- New `src/physics/detectors/sensor-mtf.ts`: `pixelApertureMtf`, `exponentialSpreadMtf`, `gaussianBlurMtf`,
  `crosstalkKernelMtf` ([X/2, 1 − X, X/2]), `seibCollection` / `seibDiffusionMtf` / `seibDiffusionFloor` (Seib 1974,
  semi-infinite field-free region), `columnShares(mtf, p, floor)` → [C₀, C₁, C₂] (8-point Gauss–Legendre, ≈ 1 ms),
  `neighbourFraction`.
- New `src/physics/detectors/cosmic-rays.ts`: `SI_MEAN_PAIRS_PER_M` (106.18 /µm), `mostProbableLoss` (PDG Eq. 34.13),
  `pathLength`, `projectedLength`, `pixelsPerTrack` (1 + 4ℓ/(πp)), `hitPixelFraction`, `MEAN_SEC_ZENITH` = 4/3,
  `K_BETHE`. `math.ts` gained `poissonQuantile(p, mu)`.
- Pages: `modulation-transfer` (label "charge spread length ℓ", URL key `diffusionLength` kept), `pixel-crosstalk`
  (new `diffusionLength` key, L₀ = 20 µm default; Green 2008 α), `cosmic-rays` (new `thickness` key; `trackLength` and
  `energyDeposit` dropped). Tests: `tests/detectors-sensor-mtf.test.ts`.
- PR #104 (`devctl/t1`, by the user: production deploys only from a `release` branch, `/ship` ends at merge) is still
  open. Ask the user when to merge it; it changes the "Vercel builds only `main`" rule.
- User decisions: one PR per stage, handover inside (session 68).

## Next actions
1. `/ship` this branch. post-merge-check values: see the PR description (strings taken from `.next/server/app`).
2. Ask the user for the next category audit; part 0 = `physics-reviewer` batches → `knownIssue`s + fix parts.
3. Later: the detectors part 7b leftovers, fiber and FSO open findings (ROADMAP), imaging/spectroscopy findings,
   Chrome-only checks.

## Non-obvious facts
- **Session 77:** Seib semi-infinite: η(f) = 1 − e^(−αW)/(1 + α L_f) comes from n'' = n/L_f² − (α/D)e^(−αz), n(W) = 0;
  derive it rather than hunt for the IEEE paper. Its MTF has a floor (depletion charge), so subtract the floor before
  integrating line-spread shares. The exponential line spread gives closed-form shares: C₁ = (ℓ/2p)(1 − e^(−p/ℓ))².
  PDG 2024 dropped the sea-level muon section; cite the 2022 review §30.3.1 (1 cm⁻² min⁻¹, cos²θ). PDG PDFs download
  with curl: `pdg.lbl.gov/<year>/reviews/rpp<year>-rev-<name>.pdf` (`cosmic-rays`, `passage-particles-matter`,
  `particle-detectors-accel`). Use `node --import tsx --test <file>`: `npx tsx --test` stalled for > 2 min here.
- **Session 76:** EMVA 1288 PDFs download with curl: `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf`. DSNU₁₂₈₈ is
  absolute (e⁻), PRNU₁₂₈₈ relative; σ_q² = 1/12 DN². Random patterns in a client page must be seeded (module-level const).
- **Session 75:** Robbins–Hadwen F² = 2(1 − 1/G)/(1 + p) + 1/G; with N = 604 F² peaks near G = 300, so SNR is not
  monotonic in G.
- **Session 74:** rect ⊗ rect is a trapezoid of FWHM max(a, b). Johnson noise of 50 Ω beats shot noise below ≈ 1 mA.
- **Session 73:** Hamamatsu PMT handbook v4E: numbers survive `pdftotext`. Run the module before writing 1e-7 asserts.
- **Session 70–72:** Excelitas datasheets and rp-photonics: curl with a UA + `pdftotext -raw`. Europe PMC
  `/rest/<PMCID>/fullTextXML` works where mdpi.com gives 403.
- **Session 69:** `SimpleChart` maps `null` y to 0; use `NaN` for gaps. On log axes, y ≤ 0 is skipped.
- **Session 68:** Registry text can't contain `{…}` (`tests/registry.test.ts`). Write `0 − x·expm1(…)` to avoid `-0`.
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
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes, SRS manuals and PDG. Optics Express,
  Appl. Opt., IEEE and nature.com don't download. `node scripts/crossref.mjs -q "<citation>"` finds book-chapter DOIs.
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
