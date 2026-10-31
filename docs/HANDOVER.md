# Handover — 2026-10-31 (session 174 → session 175)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 174 did 5w-12 (laser-safety textbook pass, 20 pages, 2 bugs) on `phase-5/5w-12-laser-safety`, PR #211.
PRs #200–#210 are merged to `main` but not released (`release` = `d82602ed`). Next: **5w-13 materials** (22 slugs).

## State
- `laser-classes.ts`: new `escapingBeam(P, d, D, od)` → { power: P(1 − e^(−2D²/d²))·10^−od, d: min(d, D) }; golden
  5 W, 50 mm beam, 3 mm opening at 1064 nm: 35.87 mW, Class 3B (was 1M at the full width).
- `pulse-train.ts` `pulseLimits`: cornealUv/cornealIr below 1 ns = min(H(1 ns)·t/1 ns, 0.1·H(1 ns)) (ICNIRP p. 287);
  1550 nm 500 ps 0.785 mJ (was 3.93 mJ), 10 ps 78.5 µJ unchanged. Retina unchanged.
- `hazard-distance.ts` `requiredOpticalDensity(λ, P, d, t, { actualExposure })`: Table 5 note c (d < 1 mm, t < 0.35 s,
  1 mm aperture) scales P_max by 2(D/d)²/(1 − e^(−2D²/d²)); only the medical focus uses it. 10.6 µm, 10 W, 0.2 mm, 0.25 s:
  OD 4.604 (2.905 without).
- retinal-hazard: verdict over every eye limit; anterior segment binds from 1299 nm at 10 s (1350 nm, 2 mm: 0.1886 W).
- Defaults: classification 20 mW (10 mW at 1550 nm sat in IEC's 4 % rounding gap; near-limit warning added),
  research-lab 300 mW (500 mW was on the 3B/4 boundary), atmospheric-attenuation 1064 nm. thermal-lens-hazard heading
  "Eyewear Filter Heating". 1180 tests.

## Next actions
1. `/ship` the 5w-12 PR. On a release (user asks), check on the local build first: `laser-safety/classification=3R` and
   `laser-safety/atmospheric-attenuation=0.296` (dB/km, new defaults) plus the values listed in PRs #207–#210.
2. 5w-13: materials textbook slugs in registry order (22); skip raman-scattering (session 162);
   `awk '/slug:/{s=$2} /tier: "textbook"/{print s}' src/registry/calculators/materials.ts`.
3. Then 5w-14 spectroscopy, 5w-15 thin-film + polarization. Last in Phase 5: the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 174:** the C: drive filled to 0 bytes mid-session (ENOSPC on Edit; Edit's temp-then-rename left the
  originals whole). Check `df -h /c` when writes fail. A probe `.mts` importing repo files needs `file:///C:/…` URLs
  (or a `.ts` with an absolute `C:/…` path; top-level await needs `.mts`). devctl queues tests behind implementers'
  eslint for 10+ min: run them in the background. node:test's spec reporter prints `ℹ tests N`, not `# pass`.
  ICNIRP 2013 has two sub-ns rules: p. 282 holds the 1 ns irradiance, p. 287 adds "< 10 % of the 1 ns limit" below
  400 / above 1400 nm; both are now in `pulseLimits`. The IEC 2001 text and Schulmeister white papers were checked in
  sessions 30–33 (archive line ≈ 446); don't re-flag their values as unverified.
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
