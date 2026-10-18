# Handover — 2026-10-18 (session 87 → session 88)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
PR #117 (part 8) was already merged. Session 87 finished **imaging part 9 (Gaussian optics)** on branch
`phase-4/imaging-gaussian-optics` (with this handover). Next: **imaging part 10a (microscope)**.

## State
- New `src/physics/imaging/gaussian-optics.ts` (SI, real-is-positive): `thinLensImage(f, o)` → {i, M = −i/o},
  `conjugatesFromMag(f, M)` → {o = f(1 − 1/M), i = f(1 − M)}, `opticalPower(f, n)`, `twoElementPower(φ₁, φ₂, t, n)`,
  `twoLensABCD(f₁, f₂, t)`, `focalDistances(abcd)` → {efl −1/C, bfd −A/C, ffd −D/C}, `ocularRefraction(φ₁, φ₂, t, n, L)`
  (vergence traced back from the retina), `emmetropicAxialLength`, `spectacleCorrection(K, d)` = K/(1 + dK).
- Test: `tests/imaging-gaussian-optics.test.ts` (5 tests). 295 of 456 pages are tiered; 19 `knownIssue`s, all imaging.
- `working-distance` merged into `image-distance` (redirect + merge codemod; its title is now a keyword).
- URL keys: `image-distance` (`focalLengthMm` signed, new `solve` = object | mag, `objectDistMm`, new `mag` signed,
  default −2); `afocal` (new `beamDiameterMm`; `objectAngleDeg` is now the field half-angle, min 0); `optical-power`
  (defaults Gullstrand 43.05 / 19.11 D; new `separationMm` 5.73, `n` 1.336, `axialLengthMm` 24, `vertexMm` 12).
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`. The user still has to set
  Vercel's Production Branch to `release` (not confirmed).
- **User decisions (session 78):** merge, each with a redirect, `strehl-ratio` + `wavefront-error` → one page,
  `sensor-ccm` + `sensor-cmos` → one page with CCD/CMOS presets (`selective-plane`, `working-distance` done). Keep
  dynamic-range, stimulated-raman-microscopy and resolution separate unless the user says otherwise.

## Next actions
1. `/ship` this branch. Values for a later release check: part 9: `imaging/image-distance=66.67`,
   `imaging/afocal=-0.5`, `imaging/optical-power=58.63`; part 8: `imaging/stimulated-raman-microscopy=5.778`,
   `imaging/sum-frequency-microscopy=452.17`, `imaging/photoacoustic=271.0`; part 7: `imaging/optical-coherence=5.694`,
   `imaging/low-coherence=6.658`, `imaging/digital-holography=7.993`, `imaging/computer-generated-holography=39.56`;
   parts 1–6: `git show 51e062f0:docs/HANDOVER.md`. Don't release unless asked.
2. Imaging part 10a (microscope; goldens in ROADMAP).
3. Later: open findings (part 8 leftovers, local `sinc` copies, `fluorophores.ts` cutoff, `optical-sectioning-thickness`,
   detectors 7b, fiber, FSO), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 87:** Gullstrand's exact eye: 43.05 + 19.11 D, principal planes 5.7286 mm apart in n 1.336 → 58.635 D. As
  thin elements its rear focus is at 24.31 mm (thick eye ≈ 24.4 mm), so 24 mm reads +0.80 D. No source confirmed 24.0 mm
  as Gullstrand's axial length, so the page calls it typical. The merge codemod drops the last entry's trailing comma.
  **Never put Markdown backticks in a `node -e "…"` string**: bash runs them (a `git push` nearly ran). Use Write.
- **Session 86:** Wang & Hu 2012 is readable at `pmc.ncbi.nlm.nih.gov/articles/PMC3322413/` with a full Chrome
  User-Agent. Boyd's SFG in SI: I₃ = 2d²ω₃² I₁I₂L²/(n₁n₂n₃ε₀c³); degenerate it is 4× the SHG formula.
- **Session 85:** Choma 2003 is open at Caltech (`authors.library.caltech.edu/records/yx529-g3n22/files/CHOoe03.pdf`);
  its SNR is a power ratio. Coherence length conventions differ by 2. A mutation probe on an untracked file can't be
  undone with `git checkout`: copy the file first.
- **Session 84:** FPbase's API needs a full Chrome User-Agent plus `Accept: application/json`. Förster prefactor
  0.021084 nm (textbooks: 0.0211).
- **Session 83:** Koppel's SNR is the N → ∞ limit. With e^(−iωt), δ = −π/2 is positive phase contrast. A `positive()`
  guard rejects an `Infinity` default. devctl exit 75: queue with `run_in_background`.
- **Session 82:** `SimpleChart` skips NaN points but joins the line across them; for real gaps split traces. A Git Bash
  heredoc can drop a backslash: write scripts with Write.
- **Sessions 79–81:** TIRF d is the intensity depth. A pinhole of x AU is a diameter. Lint `preserve-manual-memoization`
  fires on a `useMemo` over clamped values: drop it.
- **Session 78:** reviewer stalls come from a hung shell: batches of 7 pages, `timeout 60`. Crossref returns 429 when
  hit too often. `tier-status.ts` takes > 2 min: run it in the background.
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the
  redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Earlier:** registry and JSX text can't hold `{…}`; write `0 − x·expm1(…)` to avoid `-0`. "From memory" reviewer
  numbers need a source. Test the extreme corner of every input range. `useURLState` inside `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
