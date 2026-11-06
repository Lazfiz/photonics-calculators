# Handover — 2026-11-06 (session 214 → session 215)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 214 planned Phase 10 (user: "plan fixes … other ideas, improvements"; all four groups chosen) and did 10c on
`phase-10/10c-get-found` (PR #252, merged + released) and `phase-10/10c-handover` (PR #253, this handover).
Next stage: **10a** audit fixes, then 10e → 10d → 10b → 10f.

## State
- Released: `release` = 54d6990b (Phase 9 + the Search Console tag). The report form works in production (user's
  test email arrived with page and commit).
- Google Search Console: URL-prefix property `https://photonics-calculators.vercel.app/` verified by
  `metadata.verification.google` in `src/app/layout.tsx`; `sitemap.xml` read, 423 pages discovered. Bing import from
  GSC is the user's (optional).
- Baseline (Vercel Web Analytics 2026-10-07 → 11-06): 9 visitors, 55 pageviews, no search referrers, ≈ half mobile.
- 1280 tests. 5 eslint warnings (10b).

## Next actions
1. 10a on a new branch: KD*P/ADP range to 1064 nm (`pockels.ts:166,171`); Stokes input and element types into
   `useURLState` on `polarization/mueller-polarimetry` (one state per field, not in a `.map`); `dichroic-polarizer`
   tier vs the (1+κ²/n²) exit-face term. Golden tests with sources; `physics-reviewer` on the changed pages.
   post-merge-check: the changed pages' new default values (read them from the built HTML).
2. Release only when the user asks.
3. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
4. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

## Non-obvious facts
- **Session 214:** Vercel Web Analytics on the hobby plan only answers for the last 31 days (400 otherwise); team
  `team_LaEJuanZGFVc5UHhLD6LRaiq`, project `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`. A new GSC property's "Request
  indexing" quota runs out after a few requests ("Quota exceeded", resets daily); the sitemap is what matters.
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
