# Handover — 2026-10-31 (session 176 → session 177)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 176 did 5w-14 (spectroscopy textbook pass, 21 pages, 3 bugs) on `phase-5/5w-14-spectroscopy`, PR #213.
PRs #200–#212 are merged to `main` but not released (`release` = `d82602ed`). Next: **5w-15 thin-film + polarization** (24).

## State
- Grating shadowing `blazeShadowFactor` = min(1, ρ(β)/ρ(α)), ρ(x) = cos x/cos(x − φ) for x ≥ φ, else cos φ (`facetFraction`
  in `spectral-resolution.ts`). α = 0, 700 nm, 1200 l/mm, λ_B 550: k 0.728137, η₁ 0.60521 (was 0.6488 / 0.5393). Littrow
  (grating-efficiency) and the dispersive-element defaults (α 45°) are unchanged: η₁ 0.74724.
- `overlapFreeBand(λmin, λmax, m)` in `stray-light.ts` = [max(λmin, λmax(m−1)/m), min(λmax, λmin(m+1)/m)) or NaN; stray-light
  shows "none" for m = 2 on 200–1100 nm. `overlapFreeLimit` stays for spectral-range's m+1 check.
- infrared-spectroscopy: HCl capped at 1200 K (one D term: levels turn over at J = 56; sum unconverged ≥ ≈ 1230 K); spectrum
  grid ≥ 5 points/FWHM (≤ 20 000) plus every line centre.
- Minor: chart spans follow inputs on 8 pages; spectral-range order m−1 note; FP card shows exact Airy FWHM
  (2FSR/π)asin(π/2ℱ); LIBS presets set U⁺/U⁰ from ground-term weights (default 2 = Ca) and warn for H; SFG free OH −15;
  2D `transferMatrix` golden 0.56908. 1185 tests.

## Next actions
1. `/ship` the 5w-14 PR. Post-merge (on a release only): `spectroscopy/stray-light=2.699`
   `spectroscopy/dispersive-element=74.7` plus the values listed in PRs #207–#212 (5w-13: nonlinear-crystals K 0.006043 %/W,
   brillouin T_B ≈ 8 ns).
2. 5w-15: thin-film + polarization textbook slugs in registry order (24), skipping the ROADMAP's session-162 slugs:
   `awk '/slug:/{s=$2} /tier: "textbook"/{print s}' src/registry/calculators/{thin-film,polarization}.ts`.
3. Then the KRS-5 Sellmeier box, and last in Phase 5 the Gemini hero (ask the user for the files).

## Non-obvious facts
- **Session 176:** reviewer "UNVERIFIED" claims can be wrong the other way: Scholkmann & Wolf 2013 *do* recommend 0–70 y
  (fitted on 0–50 y). SPIE pages fetch empty; WebFetch of the `.pdf` URL saves it to `tool-results/` for `pdftotext -raw`.
- **Session 175:** an edit script doing `s.slice(0, start) + newText` drops everything after the block (3 functions
  vanished): replace a delimited block or append the tail. `crystal-properties.ts` imports `window-materials.ts`, so
  shared code goes in the latter. `useURLState` can't hold NaN: use an out-of-range sentinel. NIST-JANAF tables fetch as
  `https://janaf.nist.gov/tables/<id>.txt` (Al-096 sapphire, Ca-014 CaF₂). Nested golden-section `bestFocus` ≈ 50 ms
  tuned, ≈ 3 ms untuned; uncached, a 50-point chart re-ran them on every keystroke.
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
  per category: `shuf | awk -F/ '!seen[$1]++'`.
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
