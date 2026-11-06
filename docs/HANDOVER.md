# Handover — 2026-11-06 (session 213 → session 214)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 213 did 9b-3 on `phase-9/9b-3-about-audit` (PR #251): About `#verification` now states the blind audit.
Phase 9 is done. 9a, 9b-1, 9b-2 and 9b-3 are on `main` (or pending in #251); none is released. No open ROADMAP stage
is left: ask the user what comes next (a release, the optional items below, or a new phase).

## State
- About `#verification` bullet (`src/app/about/page.tsx`): 30 tiered pages, 3 per category, seed 20261106; recomputed
  from the live page at two input sets before reading code; 0 wrong, < 9.5 % at 95 % (Clopper–Pearson); 7 minor, all
  fixed; limits (Claude reviewers, 8 pages against source text, 22 against the textbook result); links
  `docs/audit/9b-blind-audit.md` on GitHub (`blob/main`). The numbers are hard-coded, not computed.
- `goldenSectionMax(f, a, b)` in `src/physics/math.ts`; `chromatic-dispersion.ts` still has its own local golden
  section (`optimumOutputRmsWidth`) that could move to it.
- 1280 tests. 5 pre-existing eslint warnings (unused imports, thin-film pages); not errors.

## Next actions
1. `/ship` PR #251. No physics changed: no post-merge-check values (after a release:
   `thin-film/narrow-bandpass=99.69` still covers 9b-2).
2. Release only when the user asks (push `main` to `release`). Then check `/about#verification` and `/about#report`
   and send a test report (see `REPORT_TO_EMAIL` and the Resend sender note: `onboarding@resend.dev` only delivers to the
   Resend account owner).
3. Optional from the audit: KD*P/ADP range to 1064 nm (`pockels.ts:166,171`); Stokes input and element types into
   `useURLState` on `mueller-polarimetry`; the `dichroic-polarizer` tier.
4. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

## Non-obvious facts
- **Session 212:** `page-capture.mjs` against the running dev server on 3300 works after `npm run check` ends
  (`OUT=<dir> PORT=9333 … http://localhost:3300 "/cat/slug"`). The afterpulsing card already switches to "Afterpulses
  per Avalanche" above P_ap = 1, so no cap was needed.
- **Session 211:**
  - 5 physics-reviewer agents × 6 pages: 10–17 min in parallel, 70–105k tokens each; they leave files in the scratchpad.
  - Fetches that worked: ICNIRP 2013 (icnirp.org), Seibersdorf white papers, Hamamatsu data sheet, refractiveindex.info
    yml (SCHOTT AGF), Dubietis 2017. MDPI and AIP block bots.
  - A JS regex inside a CDP `evaluate` template literal broke through bash heredoc quoting: do the text cleanup on the
    Node side.
- **Session 210:**
  - CDP probes: `scripts/page-capture.mjs` or lines 1–79 of `ui-check.mjs`; on ECONNREFUSED rerun. A controlled textarea
    needs the native value setter plus an `input` event. During `npm run check` port 3300 is too slow for probes.
- **Session 209:** `python -I` hides the user site, so PIL is missing: use `python -E -P` for pypdfium2 renders. A
  scratchpad `.ts` probe needs absolute `C:/dev/…` imports. Port 3300 already serves this working copy.
- **PDF figures (sessions 206–208):** Read's PDF `pages` fails: render crops with pypdfium2. Vector: paths via
  `page.get_objects(max_depth=5)` + `FPDFPath_*`; raster: `PdfImage.get_bitmap(render=False)` + pixel counting. Calibrate
  on gridlines; check against the text. `python -E` ignores PYTHONIOENCODING (print `ascii()`).
- **Session 205:** pdftotext can shift table row labels. Optica blocks curl; arXiv, UCF STARS, PMC, NTRS work.
  `post-merge-check … | tail` hides its exit code.
- **Session 198:** `devctl` holds a *whole* Bash command line and gives up after 90 s: run gates with
  `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script. Use port 3100 or 3300.
  Prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %. `SimpleLineChart` starts axes at the data min/max and has no y2. `null` and
  non-finite values break lines.
- **Pages:** `useURLState` in `.map` breaks hooks. NaN/∞ show as "—" with a reason. JSX text needs `&apos;`. `npm run
  dev` touches `next-env.d.ts`: `git checkout` it. `src/lib/test-stats.json`: rerun `npx tsx scripts/test-stats.ts`
  after adding tests (`tests/test-stats.test.ts` fails otherwise).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips
  untracked files. CI takes ≈ 2–3 min. Wrap chrome, ui-check and server commands in `timeout <s>`.
