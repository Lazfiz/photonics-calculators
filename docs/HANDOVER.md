# Handover — 2026-11-07 (session 216 → session 217)

**Start here:** session 216 did 10h (AI discovery quick wins) on `phase-10/10h-ai-discovery` (PR #255, with the
10h/10i/Phase 11 ROADMAP commit). Not released. Next: 10a on a new branch, then Phase 11a. Read this file, then
`docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.

## State
- `src/app/robots.ts`: `*` allowed plus an explicit allow rule for `AI_CRAWLERS` (13 bots, exported, tested).
- `/llms.txt`: `src/app/llms.txt/route.ts` (force-static, text/plain) ← `buildLlmsTxt()` in `src/registry/llms.ts`:
  summary, tier definitions, about/verification, source, how to cite, then per category every non-hidden calculator
  as `- [title](url): description (tier)`. 110 kB. Phase 11 adds the API/MCP lines.
- `calculatorJsonLd`: WebPage (`mainEntity` → `<url>#calculator`) + `WebApplication` (free offer,
  `EducationalApplication`, category as sub-category, `citation` from `references`, moved off the WebPage) + breadcrumb.
  No rating (none exists): Google's Software App rich result wants one, so GSC may list these as "invalid" items for
  that enhancement. Harmless; don't fake ratings.
- IndexNow: `INDEXNOW_KEY` in `src/lib/site.ts`, `public/<key>.txt`; `scripts/indexnow.ts [--dry-run]` checks the
  live key file, reads the live sitemap and posts all URLs to `api.indexnow.org`. `/ship` step 5 runs it after a release.
- `tests/ai-discovery.test.ts` (robots, llms.txt lists every listed calculator once with its tier, key file). 1283 tests.
- 10g-2 left: Resend domain records + `REPORT_FROM_EMAIL` (optional).

## Next actions
1. Release only when the user asks. After it: `node scripts/post-merge-check.mjs <sha> fiber-optics/chromatic-dispersion
   laser-safety/ael-limits`; `curl -s https://photonicscalculators.com/llms.txt | head -5`; `curl -s …/robots.txt`;
   then `node --import tsx scripts/indexnow.ts` (expects HTTP 200 or 202). Optionally run Google's Rich Results Test
   on one page to see the WebApplication node.
2. 10a on a new branch: KD*P/ADP range to 1064 nm (`pockels.ts:166,171`); Stokes input and element types into
   `useURLState` on `polarization/mueller-polarimetry` (one state per field, not in a `.map`); `dichroic-polarizer`
   tier vs the (1+κ²/n²) exit-face term. Golden tests with sources; `physics-reviewer` on the changed pages.
3. Phase 11a (schemas, `/api/v1`, `/openapi.json`); read the Next 16 route-handler docs first.
4. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.

## Non-obvious facts
- **Session 216:** `devctl` refuses a foreground command while another project (Entendue) keeps the CPU busy: run it
  with `run_in_background`. `node --import tsx -e 'import("./src/x.ts")'` needs a relative path (an absolute `C:`
  path fails) and hands back CJS interop: call `m.default.fn`.
- **Session 215:** the Vercel MCP has no "update project domain" tool; `vercel api /v9/projects/<prj>/domains/<name>?teamId=…
  -X PATCH --input -` with `{"redirect":…}` works (CLI is logged in). `scripts/codemods/*` are type-checked too: don't
  remove exports they import. A `cat > file` with no heredoc waits on stdin and hangs the command. `npm run check; echo
  $?` after a pipe hides the exit code: keep `rc=$?` right after the command.
- **Session 214:** Vercel Web Analytics on the hobby plan only answers for the last 31 days (400 otherwise); project
  `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`. A new GSC property's "Request indexing" quota runs out after a few requests
  ("Quota exceeded", resets daily); the sitemap is what matters.
- **Session 212:** `page-capture.mjs` against the running dev server on 3300 works after `npm run check` ends
  (`OUT=<dir> PORT=9333 … http://localhost:3300 "/cat/slug"`).
- **Session 211:**
  - 5 physics-reviewer agents × 6 pages: 10–17 min in parallel, 70–105k tokens each; they leave files in the scratchpad.
  - Fetches that worked: ICNIRP 2013 (icnirp.org), Seibersdorf white papers, Hamamatsu data sheet, refractiveindex.info
    yml (SCHOTT AGF), Dubietis 2017. MDPI and AIP block bots.
  - A JS regex inside a CDP `evaluate` template literal broke through bash heredoc quoting: do the text cleanup on the
    Node side.
- **Session 210:** CDP probes: `scripts/page-capture.mjs` or lines 1–79 of `ui-check.mjs`; on ECONNREFUSED rerun. A
  controlled textarea needs the native value setter plus an `input` event. During `npm run check` port 3300 is too slow.
- **Session 209:** `python -I` hides the user site, so PIL is missing: use `python -E -P` for pypdfium2 renders. A
  scratchpad `.ts` probe needs absolute `C:/dev/…` imports. Port 3300 already serves this working copy.
- **PDF figures (sessions 206–208):** Read's PDF `pages` fails: render crops with pypdfium2. Vector: paths via
  `page.get_objects(max_depth=5)` + `FPDFPath_*`; raster: `PdfImage.get_bitmap(render=False)` + pixel counting. Calibrate
  on gridlines; check against the text. `python -E` ignores PYTHONIOENCODING (print `ascii()`).
- **Session 205:** pdftotext can shift table row labels. Optica blocks curl; arXiv, UCF STARS, PMC, NTRS work.
  `post-merge-check … | tail` hides its exit code.
- **Session 198:** `devctl` holds a *whole* Bash command line and gives up after 90 s: run gates with
  `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script (Write it first).
  `sed -i` with escaped regex text (`\/`, `\.`) is unreliable here: use Edit.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script. Use port 3100 or 3300.
  Prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %. `SimpleLineChart` starts axes at the data min/max and has no y2. `null` and
  non-finite values break lines.
- **Pages:** `useURLState` in `.map` breaks hooks. NaN/∞ show as "—" with a reason. JSX text needs `&apos;`. `npm run
  dev` touches `next-env.d.ts`: `git checkout` it. `src/lib/test-stats.json`: rerun `npx tsx scripts/test-stats.ts`
  after adding tests (`tests/test-stats.test.ts` fails otherwise).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips
  untracked files. CI takes ≈ 2–3 min. Wrap chrome, ui-check and server commands in `timeout <s>`.
