# Handover — 2026-11-01 (session 178 → session 179)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 178 did KRS-5 (PR #215, merged and released: `release` = `fbc4e714`, post-merge check all pass) and triaged the ≈ 88
open findings into ROADMAP Phase 6 (`phase-6/findings-triage`, PR #216). Next: 6a (laser safety). The user wants the fixes
before the Gemini hero ("accuracy matters").

## State
- `MATERIALS.krs5` in `sellmeier-data.ts`: Rodney & Malitson 1956 Table III, 25 °C, 0.577–39.38 µm; `WINDOW_MATERIALS.krs5` uses
  it (band 0.6–40 µm, so 39.38–40 µm shows "outside the formula's range"). No material uses `DataSheetIndex` any more; the type
  and the pages' `!hasFormula` branches remain for future data-sheet-only entries.

## Next actions
1. Merge PR #216 (triage, docs only) on the user's yes, if not done.
2. 6a laser safety on `phase-6/6a-laser-safety`: physics-reviewer pass on the three items first (primary sources), then fixes
   with golden tests. Then 6b–6i in order; the hero last.
3. KRS-5 isn't a default, so it was not in the post-merge check: `materials/transparency-range?material=krs5` at 10 µm should show
   n 2.3707, loss 28.4 % (not yet looked at by hand).

## Non-obvious facts
- **Session 178:** Optica's abstract page (`opg.optica.org/josa/abstract.cfm?uri=josa-46-11-956`) gives the tables' text through
  WebFetch even for paywalled 1950s JOSA papers: coefficients, measured and computed indices. refractiveindex.info `?shelf=…`
  URLs can resolve to the wrong page (it returned Johnson & Christy). `refractiveIndex()` doesn't range-check; `inRange` does.
- **Session 177:** the 5w-15 reviewers found no wrong formulas in 24 pages; nearly all findings were chart ranges fixed for the
  default while inputs span decades. Check new pages for that. A band average expanded about σ₀ must take its phase at
  1/σ₀, not at the wavelength centre. devctl's CPU gate silently skipped one implementer edit (it re-ran it): keep the
  `git status --short` check in briefs.
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
