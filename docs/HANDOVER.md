# Handover — 2026-10-20 (session 111 → session 112)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 111: **wave-optics fix part 1**, branch `phase-4/wave-optics-fix-1`, PR #142. Next: **fix part 2** (ROADMAP).

## State
- New `src/physics/wave-optics/gaussian-beam.ts` (`rayleighRange`, `divergenceHalfAngle`, `beamParameterProduct`,
  `beamRadius`, `wavefrontRadius`, `gouyPhase`, `m2FromWaistDivergence`; `GaussianBeam` takes an optional `m2`) and
  `abcd.ts` (`AbcdElement`, `elementMatrix`, `systemMatrix`, `traceRay`, `expectedDeterminant`; real angles, det =
  n_in/n_out). Test: `tests/wave-optics-gaussian-beam.test.ts`. Reuse both in parts 2–4 (mode matching, cavities).
- gouy-phase merged into gaussian-beam (redirect; `z` input, ψ(z) chart). abcd-matrix keeps its elements in
  `?elements=d100_f50_m_r200_n1x1.5` (`_` between elements, "0" = empty list).
- 355 of 440 pages tiered, 40 `knownIssue`s. **Per-page findings for parts 2–13 are in the PR #141 description**
  (`gh pr view 141`): read the part's section first, don't re-audit.
- **User decisions (session 110), 12 merges with redirects:** mode-matching + beam-waist-matching;
  parametric-amplification → optical-parametric-amplifier; fiber-laser-resonator → fiber-optics/fiber-laser;
  etalon-finesse → spectroscopy/etalon-fsr; cavity-stability → cavity-mode-spacing; chirped-pulse + pulse-compression;
  coupled-mode → fiber-optics/mode-coupling; cep-stabilization → optical-frequency-comb; gouy-phase → gaussian-beam (done);
  hermite-gaussian + laguerre-gaussian; photonic-bandgap → thin-film/bragg-reflector; interferometer →
  spectroscopy/michelson-interferometer. No merge for sum-frequency vs spectroscopy/sum-frequency-gen (share the module).
- **Release flow:** merges to `main` deploy nothing. Production deploys only from `release`, and only when the user asks:
  `git push origin main:release`, then `node scripts/post-merge-check.mjs <release sha> …`.
- **Earlier user decisions:** (96) merges with redirects; (78) keep dynamic-range, stimulated-raman-microscopy, resolution apart.

## Next actions
1. `/ship` this branch. Values for a later release check: `wave-optics/gaussian-beam=0.2027`,
   `wave-optics/m2-factor=1.476`, `wave-optics/abcd-matrix=100.0000`; part 12b: `spectroscopy/sum-frequency-gen=457.73`,
   `spectroscopy/blackbody=501.5`, `spectroscopy/wavenumber-converter=10000.00`. No release unless asked.
2. Wave-optics fix part 2, then parts 3–13 in order. Part 2's merge drops the page count to 439: lower the floor in
   `tests/calculator-pages.test.ts` (now ≥ 440).
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  `chrome --headless=new --dump-dom <url> | grep -o "<label>[^<]*<?[^<]*"` reads a hydrated value without a screenshot.
  Build screenshot paths in a variable (`out="$W\shot-$n.png"`); an `rm` on `"$W"/*.png` is blocked: use `${W:?}`.
- **Session 110:** reviewer reports arrive as agent messages and vanish on compaction: save each to a scratchpad file at
  once. Values the reviewers quoted from memory, to verify before use: Yb:YAG σ_a ≈ 0.75e-20 cm² at 940 nm, HeNe g₀ ≈
  0.1 /m, CO₂ 0.5–1 /m, diode fast-axis divergence 30–40°, LCLS ρ ≈ 5e-4. Kerr thin lens checked: 1/f = 8n₂PL/(πw⁴).
- **Session 108:** `python -` with a heredoc hangs. The merge codemod adds the old title as a keyword: extend it by hand.
- **Session 107:** NIST WebBook keeps higher constants in footnotes: grep the saved HTML.
  Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Session 106:** after a merge removes a page, tsc fails on stale `.next/types` validators: `rm -rf .next/types .next/dev/types`.
  Plotly 3 (heatmaps) ignores string axis/colorbar titles: use `title: { text }`. EMG for z > 0 must use erfcx.
- **Session 105:** a command that starts a server in the background keeps devctl "busy": run later chrome jobs with
  `run_in_background`. devctl blocks a whole foreground command while a gate runs.
- **Sessions 101–102:** fit polynomials in a scaled variable u ∈ [−1, 1]. `assert.equal(-0, 0)` fails (Object.is). In
  `sed` replacements `&` is the match and a backslash-n a newline: use Edit. eslint's `preserve-manual-memoization` fires on
  `useMemo` over derived values: drop the `useMemo`. NIST ASD DOI is DataCite (`crossref.mjs` 404); astm.org 403s,
  ASTM DOIs (10.1520/…) are in Crossref. ar5iv HTML gives LaTeX.
- **Sessions 99–100:** a merge can leave a chained redirect: point it at the final page. `tests/calculator-pages.test.ts` has a
  page-count floor (now ≥ 440); the 12 wave-optics merges will trip it, so lower it as pages go.
  devctl queues headless Chrome behind other projects' jobs: run screenshots with a fresh `--user-data-dir`.
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
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 536 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Headless screenshot: chrome `--headless=new
  --screenshot=… --virtual-time-budget=6000` with a scratchpad `--user-data-dir`, crop with `sharp`.
- **ui-check:** `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`. Never `taskkill /IM chrome.exe`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
