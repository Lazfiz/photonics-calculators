# Handover — 2026-10-29 (session 171 → session 172)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 171 did 5w-9 (wave-optics textbook pass 1/2) on `phase-5/5w-9-wave-optics`, PR #208: 16 pages, 3 bugs.
PRs #200–#207 are merged to `main` but not released (`release` = `d82602ed`). Next: **5w-10 wave-optics 2/2**.

## State
- `diffraction-integral.ts`: new `circularOnAxisIntensityExact(a, λ, z)` = |1 − (z/R)e^{ik(R−z)}|² (Heurtley 1973, Rayleigh–Sommerfeld)
  and `fresnelEdgePhaseError` ≈ −πa⁴/(4λz³); the page shows the exact on-axis value and warns above 0.1 rad.
- `free-electron-laser.ts`: saturationLength NaN when 9P_sat ≤ P_n. `diode-laser.ts`: `MAX_LOG_GAIN_RATIO` = 3 (was 20).
- New defaults: abcd-matrix d150_f100_d300 (A = −2), chirped-pulse ΔG 0.2 mm, difference-frequency w 150 µm (P_i 1.172 µW),
  four-wave-mixing seed 0.01 mW, free-electron-laser L_u 15 m, gas-laser bore 3.2 mm, hermite-gaussian TEM₂₁ at z = 5 mm.
- Gates on the 5w-9 commit: `npm run check` 1169 pass; build: see the PR.

## Next actions
1. `/ship` the 5w-9 PR. On a release (user asks), check on the local build first: `wave-optics/diffraction-integral=0.9075
   wave-optics/difference-frequency=1.172 wave-optics/hermite-gaussian=3.115` (plus the 5w-8 values in PR #207).
2. 5w-10: wave-optics textbook slugs 17–33 in registry order (injection-locking … thin-disk-laser), skipping
   optical-parametric-oscillator (162); `git grep -n 'tier: "textbook"' src/registry/calculators/wave-optics.ts`.
3. Last in Phase 5: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 171:** implementers reported edits that never reached disk on 2 of 3 runs (dye + filamentation, hermite-gaussian +
  gaussian-beam): run `git status --short` after each report and count files. Physics reviewers can be blocked from writing
  scratchpad probes inside a worktree (they fall back to `node --import tsx -e`); worktree isolation is not needed for read-only
  reviewers. A reviewer fix formula can be wrong while the finding is right (abcd EFL: −1/(n_out C), not −n_out/C). New warnings
  can fire at the defaults (DFG idler b_i < L at w 100 µm): check each new flag against the default inputs.
- **Session 170:** `ChartPanel` → `SimpleChart` ignores layout `shapes`/`annotations` (only Plotly draws them): mark an
  operating point with a `mode: "markers"` trace. connector-insertion-loss still uses a `shapes` line (likely invisible).
  An implementer again reported an edit (otdr help line) that has no diff: check `git diff --stat` per allowed file. In Git
  Bash `grep -c $'\r'` matched lines with the letter r: check line endings with `git ls-files --eol <f>` or `od -c`.
  Implementers widening chart spans can blow up point counts (96 traces × 20 000): bound per-trace samples.
- **Session 169:** devctl queues gated commands under another project's CPU load. Implementers' page text needs a physics
  read (one wrote that bending "lowers the index on the compressed side").
- **Session 168:** implementers wrote CRLF into LF files (git normalises on commit). Check chart-span widenings against poles.
  Three implementers in parallel take ≈ 5–15 min each (shared eslint queue).
- **Session 167:** reviewers' "(from memory)" source attributions need checking (crossref API `/works/<doi>`, field
  `abstract`). Implementers: brief warning conditions with abs() when a quantity is signed. `npx eslint <file>` can take > 2 min.
- **Sessions 163–170 (5w, 124 pages, 12 bugs):** reviewers' useful catches are defaults that hide the page's effect,
  stated-but-false conditions, results that ignore an input or a selector that changes nothing, fixed chart ranges that miss
  the input, and formulas past their limit or fit range. Brief: verdict + BUG/MINOR/UNVERIFIED, file:line, hand calcs,
  "(from memory)", unique probe prefixes (probeA-…), don't edit. Implementers: allowed files, no registry, targeted tests +
  eslint, no tsc; the main session runs `npm run check` once.
- **Session 162:** reviewer claims from memory were wrong again (ICNIRP 2013 Table 5 has no C_A below 10 ps on purpose).
  ICNIRP 2013 PDF: `curl -sL https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`, `pdftotext -raw`.
  One page per category: `shuf | awk -F/ '!seen[$1]++'`.
- **Session 161:** CLS probe = scratchpad CDP script: `Page.addScriptToEvaluateOnNewDocument` with a `layout-shift`
  PerformanceObserver (skip `hadRecentInput`), read `window.__cls` 5 s after navigate; 3000 px tall viewport. Git Bash rewrites
  `/cat/slug` args even for node scripts: `export MSYS_NO_PATHCONV=1`.
- **Session 160:** the Chrome extension's screenshots time out on this site; use a headless CDP script (pattern in
  `scripts/ui-check.mjs`): `Emulation.setDeviceMetricsOverride` for a true 360 px viewport, `Input.dispatchMouseEvent` for
  hover, `Page.captureScreenshot` clips in page coordinates (add `scrollY`). In the Bash tool a bare `python -` or
  `cat > file` with no input hangs until timeout.
- **Session 157:** `plotly.js/lib/<trace>` builds under Turbopack with no loader. A new Plotly trace type goes in both
  `plotly-traces.ts` and `plotly-bundle.ts`. `ui-check <base> load /a /b` prints `plotly svg` or `svg+gl` per chart.
- **Session 155:** React Compiler is off, so a `preserve-manual-memoization` error is fixed by dropping the `useMemo`. Plotly
  data: cast to `PlotParams["data"]` (`src/types/plotly.d.ts`), never `any[]`.
- **Sessions 151–153:** write regex-heavy scripts with the Write tool (a quoted bash heredoc drops doubled backslashes).
  ts-morph `sf.insertText` forgets every node: insert last-to-first; scripts live under `scripts/`. A `next start` left on
  3100 survives TaskStop: check with `curl`, then `taskkill //PID <pid> //T //F`.
- **Session 138:** ITU-T PDFs: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`.
  Optica full text reads in Chrome via `get_page_text`.
- **Session 137:** Thorlabs uses slug URLs, client-rendered. `javascript_tool` results truncate at ≈ 1000 characters.
  **Port 3000 can be another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome. Registry/JSX text can't hold `{…}`. `npm run dev`
  touches `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, so round plotted values.
  ChartPanel sends scatter and bar traces to SVG `SimpleChart` (y2, log, category axes, grouped bars, fill, marker symbols).
  `null` and non-finite values break lines. `SimpleLineChart` has no y2. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`.
  NaN/∞ show as "—" with a reason. eslint: 6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked
  files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
