# Handover — 2026-10-20 (session 113 → session 114)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 113: **wave-optics fix part 3**, branch `phase-4/wave-optics-fix-3`, PR #144. Next: **fix part 4** (cavities).

## State
- Wave-optics modules: `gaussian-beam.ts`, `abcd.ts` (part 1); `mode-matching.ts`, `spatial-filter.ts` (part 2); new
  `higher-order-modes.ts` (`hermiteH`, `laguerreL`, `hgAmplitude1D`, `hgIntensity`, `lgIntensity`, second-moment radii,
  `lgRingRadius`, `modeGouyPhase`), `bessel-beam.ts` (`radialWavenumber`, `coreRadius`, `coreFwhm`,
  `maxPropagationDistance`), `diffraction-integral.ts` (Fresnel–Hankel quadrature, N_F ≤ 20; slit via Fresnel integrals;
  Fraunhofer forms). `math.ts` gained `besselJ0Fast` and `fresnelIntegrals`. Test: `tests/wave-optics-modes.test.ts`.
  Reuse `gaussianOverlap`/`qAfterLens` and `modeGouyPhase` for cavities (part 4: transverse-mode spacing).
- laguerre-gaussian merged into hermite-gaussian (redirect; page `?family=lg`). bessel-beam has `?R=` (input radius, mm).
  diffraction-integral has `?aperture=slit` and an observation-radius input.
- 360 of 438 pages tiered, 33 `knownIssue`s. **Per-page findings for parts 4–13 are in the PR #141 description**
  (`gh pr view 141`): read the part's section first, don't re-audit.
- **User decisions (session 110), merges with redirects, 3 of 12 done:** parametric-amplification → optical-parametric-amplifier;
  fiber-laser-resonator → fiber-optics/fiber-laser; etalon-finesse → spectroscopy/etalon-fsr; cavity-stability →
  cavity-mode-spacing; chirped-pulse + pulse-compression; coupled-mode → fiber-optics/mode-coupling; cep-stabilization →
  optical-frequency-comb; photonic-bandgap → thin-film/bragg-reflector; interferometer → spectroscopy/michelson-interferometer.
  sum-frequency and spectroscopy/sum-frequency-gen share a module. Session 78: keep dynamic-range, stimulated-raman-microscopy, resolution apart.
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/hermite-gaussian=5.067`,
   `wave-optics/bessel-beam=24.22`, `wave-optics/diffraction-integral=0.9075`; part 2: `wave-optics/mode-matching=36.22`,
   `wave-optics/spatial-filter=67.74`; part 1: `wave-optics/gaussian-beam=0.2027`, `wave-optics/m2-factor=1.476`,
   `wave-optics/abcd-matrix=100.0000`. No release unless asked.
2. Wave-optics fix part 4 (two-mirror-resonator.ts; cavity-stability → cavity-mode-spacing; ring-cavity), then parts 5–13.
   Part 4's merge drops the page count to 437: lower the floor in `tests/calculator-pages.test.ts` (now ≥ 438).
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 113:** Next redirects keep the query string, so `/wave-optics/laguerre-gaussian?l=3` arrives with `l=3`; the HG/LG
  page reads `p`/`l` with a NaN default to tell an old LG link from a bare one. `besselJ` costs 2|x| + 64 cosines: inside a
  quadrature use `besselJ0Fast` (|err| < 1e-7). `cmd; echo exit $?` hides a failed gate:
  use `(a && b); code=$?`.
- **Session 112:** Crossref has only the first page of old Appl. Opt. papers: cite "Appl. Opt. 22, 658.". `node - <<'EOF'`
  edits work (`python -` hangs). Chrome `--screenshot=` needs a `/` path; an `rm` on `"$W"/*.png` is blocked: use `${W:?}`.
  Simpson + `besselJ` is ~0.3 ms per point at 400 panels: scale panels with a/w and κa, cap the inputs that grow them.
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  `chrome --headless=new --dump-dom <url> | grep -o "<label>[^<]*<?[^<]*"` reads a hydrated value without a screenshot.
- **Session 110:** reviewer reports arrive as agent messages and vanish on compaction: save each to a scratchpad file at
  once. Values the reviewers quoted from memory, to verify before use: Yb:YAG σ_a ≈ 0.75e-20 cm² at 940 nm, HeNe g₀ ≈
  0.1 /m, CO₂ 0.5–1 /m, diode fast-axis divergence 30–40°, LCLS ρ ≈ 5e-4. Kerr thin lens checked: 1/f = 8n₂PL/(πw⁴).
- **Session 107:** NIST WebBook keeps higher constants in footnotes: grep the saved HTML.
  Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Session 106:** after a merge removes a page, tsc fails on stale `.next/types` validators: `rm -rf .next/types .next/dev/types`.
  Plotly 3 (heatmaps) ignores string axis/colorbar titles: use `title: { text }`. EMG for z > 0 must use erfcx.
- **Sessions 101–102:** `assert.equal(-0, 0)` fails (Object.is). eslint's `preserve-manual-memoization` fires on `useMemo`
  over derived values: drop the `useMemo`. NIST ASD DOI is DataCite (`crossref.mjs` 404); ASTM DOIs (10.1520/…) are in Crossref.
- **Sessions 99–100:** point a chained redirect at the final page. Run headless Chrome with a fresh `--user-data-dir`.
  A wavenumber through `toPrecision(4)` prints "2.002e+4": use `toFixed(0)` for cm⁻¹.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Sessions 86–89:** run gates with `run_in_background` from the start. The merge codemod drops the last entry's trailing
  comma. **Never put Markdown backticks in a `node -e "…"` string**: bash runs them; use Write.
- **Session 65:** probe the module (scratchpad `.ts`) before writing the test; then mutate the code once to see
  `ℹ fail N`. A slug rename touching < 10 files: `git mv` the folder, change `href`, move the registry entry, add the
  redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Earlier:** registry/JSX text can't hold `{…}`. Reviewer numbers need a source. `useURLState` in `.map` breaks hooks.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
  It joins the line across NaN points: split traces for real gaps.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 279 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
