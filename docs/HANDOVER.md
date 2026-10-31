# Handover — 2026-10-31 (session 173 → session 174)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 173 did 5w-11 (free-space-comms textbook pass, 17 pages, 1 bug) on `phase-5/5w-11-free-space-comms`, PR #210.
PRs #200–#209 are merged to `main` but not released (`release` = `d82602ed`). Next: **5w-12 laser-safety** (20 slugs).

## State
- `turbulence.ts`: new `aoResidualVariance(fit, servo, open)` = min(fit + servo, open) (a first-order loop's |1 − H|² ≤ 1).
- `link-budget.ts`: new `gaussianGeometricCapture(d_t, θ, R, d_r, λ)`: embedded Gaussian, w₀ = max(d_t/2, λ/(πθ/2)),
  w² = w₀² + (θR/2)² (Siegman, SPIE 1224, 2 (1990)); golden 17.0332 dB (defaults), 1.9920 dB (d_t 100 mm, 100 m).
- `qkd.ts`: new `maxChannelLossDbOptimalMu` (GYS 29.864 dB = 142.21 km vs 142.01 km at μ 0.48); QKD charts plot against
  total channel loss when α = 0.
- New defaults: beam-wander Cn² 1e-14 (0.71 dB loss shows), receiver-fov half-angle 20 mrad (≈ equal-noise FOV 18.7 mrad).
- Rain path length capped at 5 km: ITU-R P.1814-1 §4.2 states L ≤ 5 km; Tables 4–5 in the code match the PDF.
- Open findings added: beam-wander W₀ vs W(z) in the filter, point-ahead "≈ 18 µrad" quote, DB_PER_NEPER naming.

## Next actions
1. `/ship` the 5w-11 PR. On a release (user asks), check on the local build first: `free-space-comms/geometric-loss=17.03
   free-space-comms/quantum-key-distribution=142.0` plus the 5w-8 values in PR #207, the 5w-9 values
   (`wave-optics/diffraction-integral=0.9075 wave-optics/difference-frequency=1.172 wave-optics/hermite-gaussian=3.115`)
   and the 5w-10 values (`wave-optics/supercontinuum=667.6 wave-optics/kerr-lens=49.70`).
2. 5w-12: laser-safety textbook slugs in registry order (20); `git grep -n 'tier: "textbook"' src/registry/calculators/laser-safety.ts`.
   ICNIRP 2013 PDF: `curl -sL https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`, `pdftotext -raw`.
3. Then 5w-13 materials, 5w-14 spectroscopy, 5w-15 thin-film + polarization. Last in Phase 5: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 173:** devctl intercepts a *whole* Bash command when any part is gated (`npx tsx --test`, eslint, tsc): a
  heredoc + `node edit.mjs` + test in one call never ran, and the queued test ran against old files. Write files and run
  gates in separate calls. An implementer's QKD edits again never reached disk (1 of 3): `git status --short` after each
  report. My own "hand" golden value was wrong (1.9932 vs 1.9920 dB): get goldens from a probe, then check by hand. ITU-R
  PDFs: `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf` (pattern), `pdftotext -raw`.
  Hard vs Gaussian aperture averaging asymptote 1.130 checks with GR 6.574.2 and a Gaussian filter exp(−κ²D²/16).
- **Session 172:** the Dudley RMP 2006 PDF on members.femto-st.fr 404s (HTML saved as .pdf: check `head -c 8`);
  ResearchGate downloads are blocked by the auto-mode classifier. A tsx `-e` dynamic import needs `x.default ?? x`.
- **Session 171:** a sed replacement with `&` in the new text pastes the match: do prose replacements with a node script
  using `replace(a, () => b)`. Goodman 2nd ed. (4-24) is the Fraunhofer condition, (4-25) the integral; Siegman ch. 26 is
  Q-switching. Physics reviewers can't write scratchpad probes inside a worktree; read-only reviewers need no worktree. A
  reviewer's fix formula can be wrong while the finding is right. New warnings can fire at defaults: check each.
- **Session 170:** `ChartPanel` → `SimpleChart` ignores layout `shapes`/`annotations`: mark points with a `mode: "markers"`
  trace. connector-insertion-loss still uses a `shapes` line. In Git Bash `grep -c $'\r'` is unreliable: use
  `git ls-files --eol <f>`. Implementers widening chart spans can blow up point counts: bound per-trace samples.
- **Sessions 167–169:** implementers' page text needs a physics read; they may write CRLF (git normalises). Reviewers'
  "(from memory)" attributions need checking (crossref `/works/<doi>`). `npx eslint <file>` can take > 2 min; devctl queues
  gated commands under other projects' load (eslint/tests waited ≈ 20 min this session).
- **Sessions 163–173 (5w, 141 pages, 13 bugs):** useful reviewer catches are defaults that hide the page's effect,
  stated-but-false conditions, results that ignore an input, fixed chart ranges that miss the input, and formulas past
  their limit. Brief: verdict + BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", probe prefixes, don't edit.
  Implementers: allowed files, no registry, targeted tests + eslint, no tsc; the main session runs `npm run check` once.
- **Session 162:** reviewer claims from memory were wrong (ICNIRP 2013 Table 5 has no C_A below 10 ps on purpose). One page
  per category: `shuf | awk -F/ '!seen[$1]++'`.
- **Session 161:** Git Bash rewrites `/cat/slug` args even for node scripts: `export MSYS_NO_PATHCONV=1`.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in
  `scripts/ui-check.mjs`). In the Bash tool a bare `python -` or `cat > file` with no input hangs until timeout.
- **Session 157:** a new Plotly trace type goes in both `plotly-traces.ts` and `plotly-bundle.ts`. `ui-check <base> load
  /a /b` prints `plotly svg` or `svg+gl` per chart.
- **Session 155:** React Compiler is off: a `preserve-manual-memoization` error is fixed by dropping the `useMemo`. Plotly
  data: cast to `PlotParams["data"]`, never `any[]`.
- **Sessions 151–153:** write regex-heavy scripts with the Write tool. ts-morph `sf.insertText` forgets every node: insert
  last-to-first. A `next start` left on 3100 survives TaskStop: `curl`, then `taskkill //PID <pid> //T //F`.
- **Sessions 137–138:** ITU-T PDFs: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`. Optica
  full text reads in Chrome via `get_page_text`. **Port 3000 can be another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome. Registry/JSX text can't hold `{…}`. `npm run dev`
  touches `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. ChartPanel sends
  scatter and bar traces to SVG `SimpleChart`. `null` and non-finite values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`.
  NaN/∞ show as "—" with a reason. eslint: 6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked
  files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
