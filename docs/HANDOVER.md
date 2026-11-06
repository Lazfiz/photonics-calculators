# Handover — 2026-11-06 (session 210 → session 211)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 210 did Phase 9a (the "Report a problem" form and the About fix) on `phase-9/9a-report-button`, PR #248. It is not
released. Next: 9b, the blind audit.

## State
- `src/lib/report.ts`: `REPORT_LIMITS`, `parseReport(raw, knownHref)`, `reportEmail(report, origin, sha)` and `RateLimiter`.
  It has no registry import, because the client form reads the limits.
- `src/app/api/report/route.ts`: `POST` is the only dynamic route (ƒ in the build).
  - Without `RESEND_API_KEY` or `REPORT_TO_EMAIL` it answers 503 `not-configured`.
  - It limits 5 reports per IP per 10 min, per instance only.
  - A filled honeypot gets 200 and no email is sent.
  - Bad input gets 400; a Resend error gets 502.
  - The sender is `REPORT_FROM_EMAIL` or `onboarding@resend.dev`.
  - The body is the page URL with its query, `VERCEL_GIT_COMMIT_SHA`, the reply-to address and the message.
- `src/components/report-problem.tsx` is a client component: a `<details id="report">` placed in the shell after
  `ModelReferences`, and opened on About.
  - On a 503, 5xx or network error it shows a prefilled GitHub issue link instead.
  - It sets `suppressHydrationWarning` on `<details>`: a click on the summary before hydration toggles `open` natively.
- About:
  - Removed "being reviewed one by one".
  - Charts are now described as SVG, or Plotly where a plot needs zoom.
  - New `#verification` section: 411/411 tiered; 1205 physics tests in 182 files out of 1279; 969 distinct references
    (1293 citations), 819 of them linked. The section includes the form.
  - The home footer links `/about#report`.
- `src/lib/test-stats.json` is written by `npx tsx scripts/test-stats.ts`. **`tests/test-stats.test.ts` fails whenever
  the test count changes**, so rerun the script after adding tests.
- Gate: 1279 tests; the build is green.

## Next actions
1. `/ship` PR #248. There are no physics pages, so there are no post-merge-check values. After a release, check
   production by hand:
   - `/about#report` loads;
   - a test report from a calculator page arrives at `REPORT_TO_EMAIL`.
   Resend's `onboarding@resend.dev` sender only delivers to the Resend account owner's address. If `REPORT_TO_EMAIL` is
   a different address, verify a domain in Resend and set `REPORT_FROM_EMAIL`.
2. Next: 9b, the blind audit:
   - recompute 25–30 random tiered pages by hand against their cited references;
   - fix the findings;
   - publish the error rate on About, in the `#verification` section.
3. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

## Non-obvious facts
- **Session 210:**
  - For a CDP probe, copy lines 1–79 of `scripts/ui-check.mjs` (Chrome launch, `send`, `evaluate`, console logs) and
    append the steps. Chrome sometimes fails to open its debug port (`fetch failed`, ECONNREFUSED 9333); rerun it.
  - Set a controlled textarea from CDP with the native value setter plus an `input` event.
  - While `npm run check` runs, the dev server on port 3300 is too slow for probes. A probe that clicks before hydration
    triggers attribute mismatches.
- **Session 209:** `python -I` hides the user site, so PIL is missing: use `python -E -P` for pypdfium2 renders. A
  scratchpad `.ts` probe needs absolute `C:/dev/…` imports. Port 3300 already serves this working copy.
- **Session 208:** raster figures:
  - Extract the image with pypdfium2 `PdfImage.get_bitmap(render=False).to_pil()`.
  - Find the frame and gridlines by counting dark and grey pixels per row and column.
  - Take a colour-weighted centroid per column: blue b − r, red r − g.
  - Check the result against every value the text states.
  devctl may end a background task with only its "waiting" line: write to a log and wait on the log.
- **Session 207:** figures in vector PDFs can be read exactly:
  - Get the path objects with pypdfium2 `page.get_objects(max_depth=5)` (type 2), then `FPDFPath_*` segments with
    `FPDFPageObj_GetStrokeColor`.
  - Calibrate on the gridlines and the tick-label positions.
  `python -E` ignores PYTHONIOENCODING, so print with `ascii()`.
- **Session 206:** Read's PDF `pages` fails here: render a crop with pypdfium2 and run it with `python -E -P`. One
  file's hunks can go into two commits: `git diff -U1 f > p`, cut the hunks, then `git apply --cached --unidiff-zero`. n
  is nearly linear in 1/λ², so interpolate tabulated indices there.
- **Session 205:** pdftotext can shift a table's row labels; cross-check a row against a stated property. Curl gets
  Radware-blocked on Optica; arXiv, UCF STARS, PMC and NTRS work. A URL-state value on production: `chrome
  --headless=new --dump-dom --virtual-time-budget=8000 <url>`. `post-merge-check … | tail` hides its exit code.
- **Session 198:** `devctl` holds a *whole* Bash command line and gives up after 90 s (exit 75): run gates with
  `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script. Port 3000 can be
  another project: use 3100 or 3300. Prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %. `SimpleLineChart` starts axes at the data min/max and has no y2. `null` and
  non-finite values break lines.
- **Pages:** `useURLState` in `.map` breaks hooks. NaN/∞ show as "—" with a reason. JSX text needs `&apos;`. `npm run
  dev` touches `next-env.d.ts`: `git checkout` it.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips
  untracked files. CI takes ≈ 2–3 min. Wrap chrome, ui-check and server commands in `timeout <s>`.
