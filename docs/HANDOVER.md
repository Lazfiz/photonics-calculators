# Handover — 2026-11-06 (session 211 → session 212)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 211 did 9b-1, the blind audit of 30 random pages, on `phase-9/9b-blind-audit` (PR #249). Result: 0 ERROR,
7 MINOR, 23 OK. Next: 9b-2 fixes the 7 MINOR pages; 9b-3 publishes the result on About. 9a (PR #248) is merged, not released.

## State
- `scripts/audit-sample.ts [seed] [perCategory]` draws the sample: mulberry32 PRNG, partial Fisher–Yates on the sorted
  hrefs of the tiered pages in each category.
- `scripts/page-capture.mjs` saves a page as text (inputs ⟦value⟧, results, formulas, model note, references; no
  charts):
  - Usage: `OUT=<dir> PORT=<n> MSYS_NO_PATHCONV=1 node scripts/page-capture.mjs <base> "/cat/slug?k=v"`.
  - Use a different PORT per parallel run.
- `docs/audit/9b-blind-audit.md` holds the method, the limits (AI reviewers; 8 pages against fetched text, 22 from the
  recalled standard result), the table and the follow-up. Captures are `docs/audit/9b/<cat>__<slug>.{default,second}.txt`.
- Error-rate claim: 0/30 means < 9.5 % at 95 % (Clopper–Pearson, 1 − 0.05^(1/30)).

## Next actions
1. `/ship` PR #249 (docs and scripts only: no post-merge-check values).
2. 9b-2: fix the 7 MINOR pages. The file:line pointers are from the reviewers; confirm each before editing.
   - `detectors/afterpulsing`:
     - registry `detectors.ts:9` modelNote → "first order in P_ap (no afterpulse cascades) and in R·τ (no trap
       saturation)";
     - η₁+η₂ up to 2: cap it, or relabel "mean afterpulses per avalanche".
   - `fiber-optics/dispersion-comp` `page-client.tsx:134/139/187`:
     - the "4Bσ" subtext uses the added broadening σ_b (4πc), but B_max uses the total width √(σ_D²+|β₂|L) (2πc);
     - name them differently, and say 2πc sets the B_max limit.
     - The penalty correctly uses the added broadening (Agrawal's Bellcore form).
   - `free-space-comms/fade-probability` `:84,:103`: "≫ max(√(λL), L/(kρ₀))".
   - `free-space-comms/link-budget`:
     - `:103/107`: label "Friis (capped at P_t)" whenever it is capped;
     - `:124/128`: θ half- or full-angle consistency (2D²/(θ²R²) with the full angle).
   - `spectroscopy/libs-analysis`:
     - "ground-term weights" (~:165);
     - add Griem 1974, *Spectral Line Broadening by Plasmas* (Academic Press), or reword.
   - `spectroscopy/penetration-depth` `:36`: "attenuated total reflection (ATR)", not "frustrated TIR".
   - `thin-film/narrow-bandpass`:
     - `src/physics/thin-film/cavity-filter.ts` `cavityPassband` (:91-105): refine the peak by golden section.
     - Golden test: default stack (1550 nm, 2.35/1.45/1.52, spacer 2.1, 6 pairs, 3 cavities) → peak T 0.996913 at
       1549.586 and 1550.414 nm, T(λ₀) 0.957420, FWHM 1.13437 nm (transfer matrix; Macleod 2010 ch. 8).
     - post-merge-check: `thin-film/narrow-bandpass=99.69`.
   - Optional: KD*P/ADP range to 1064 nm (`pockels.ts:166,171`); Stokes input and element types into `useURLState` on
     `mueller-polarimetry`.
3. 9b-3: in About `#verification`, state the sample, method, limits and "0 errors in 30 (below 9.5 % at 95 %)", plus
   that 7 minor issues were found and fixed. Link the results file on GitHub.
4. After a release, check `/about#report` and send a test report (see `REPORT_TO_EMAIL` and the Resend sender note:
   `onboarding@resend.dev` only delivers to the Resend account owner).
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

## Non-obvious facts
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
