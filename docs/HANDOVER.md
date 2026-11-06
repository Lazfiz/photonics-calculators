# Handover — 2026-11-06 (session 212 → session 213)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 212 did 9b-2, the 7 MINOR fixes from the blind audit, on `phase-9/9b-2-minor-fixes` (PR #250). Next: 9b-3
publishes the audit on About. 9a (PR #248), 9b-1 (PR #249) and 9b-2 are merged or pending, none released.

## State
- `goldenSectionMax(f, a, b)` in `src/physics/math.ts` (tested in `tests/math.test.ts`). `chromatic-dispersion.ts`
  still has its own local golden section (`optimumOutputRmsWidth`); it could move to the shared helper.
- `cavityPassband` (`src/physics/thin-film/cavity-filter.ts`): log scan → golden-section peak between the samples
  either side → `firstCrossing` from the refined peak to the first sample below half. Narrow-bandpass default: peak
  99.69 % at 1549.586/1550.414 nm, FWHM 1.134 nm; bandpass-filter 3×2 FWHM 19.1376 nm.
- `docs/audit/9b-blind-audit.md` "Follow-up (9b-2, done)" lists each fix.
- 1280 tests. 5 pre-existing eslint warnings (unused imports, thin-film pages); not errors.

## Next actions
1. `/ship` PR #250. post-merge-check: `thin-film/narrow-bandpass=99.69` (peak T), optionally
   `thin-film/narrow-bandpass=1549.586`.
2. 9b-3: in About `#verification`, state the sample (30 random tiered pages, seed 20261106, 3 per category), the
   method (blind recompute from the rendered page against the cited references), the limits (AI reviewers; 8 pages
   against fetched text, 22 from the recalled standard result), and "0 errors in 30 (below 9.5 % at 95 %,
   Clopper–Pearson)", plus that 7 minor issues were found and fixed. Link `docs/audit/9b-blind-audit.md` on GitHub.
3. After a release, check `/about#report` and send a test report (see `REPORT_TO_EMAIL` and the Resend sender note:
   `onboarding@resend.dev` only delivers to the Resend account owner).
4. Optional from the audit: KD*P/ADP range to 1064 nm (`pockels.ts:166,171`); Stokes input and element types into
   `useURLState` on `mueller-polarimetry`; the `dichroic-polarizer` tier.
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

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
