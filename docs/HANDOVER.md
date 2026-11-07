# Handover — 2026-11-07 (session 217 → session 218)

**Start here:** session 217 did 10a (audit fixes) on `phase-10/10a-audit-fixes` (PR #256). 10h (PR #255) is released
(e4e1aa49); 10a is not. Next: Phase 11a. It is too big for one session: split it into 11a-1 (schema type, `/api/v1`
route, `/openapi.json`, 3–4 pages, checks test) and 11a-2 (the rest of the 20 pages) before starting.

## State
- `pockels.ts`: KD*P n_o = Kirby & DeShazer 1987 (266–1064 nm), ADP = Zernike 1964 (213.8–1529 nm), both via the local
  `kdpFamily` → `fromSquaredForm`; n_e stays NaN (longitudinal cells only need n_o). Fixed-index note gone from the page.
- `sheet-polarizer.ts`: `slabLogTransmittance` adds log1p((κ/n)²) (exit face, |tt′|²) and guards n > 0;
  `slabLogTransmittanceFrom` (polymer-polarizer) keeps (1 − R)², fine for κ ≪ n. Page warns when d < 10λ.
- `mueller-polarimetry`: URL keys `s0`–`s3`, `element1`, `element2` (unknown names fall back to the defaults).
- 1286 tests; `physics-reviewer` passed all three pages (its wording and guard notes applied).

## Next actions
1. `/ship` this branch (PR #256). Release only when the user asks; after it: `node scripts/post-merge-check.mjs <sha>
   materials/electro-optic polarization/dichroic-polarizer`, `curl -s https://photonicscalculators.com/llms.txt | head -5`,
   then `node --import tsx scripts/indexnow.ts` (HTTP 200/202).
2. Split 11a in the ROADMAP, then 11a-1 on a new branch; read `node_modules/next/dist/docs/` route-handler guide first.
3. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
4. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.
5. IndexNow still answers 403 SiteVerificationNotCompleted (third try, session 217): ask the user to check that Bing
   Webmaster lists the key; retry after the next release.
6. 10g-2 left: Resend domain records + `REPORT_FROM_EMAIL` (optional).

## Non-obvious facts
- **Session 217:** refractiveindex.info has no KD*P (GitHub API: `contents/database/data/main`); nlo.ipfran.ru fails TLS
  (curl and WebFetch; `curl -k` is blocked). WebFetch saves PDFs it can't parse under `~/.claude/projects/…/tool-results/`:
  `pdftotext -raw` on that file reads vendor tables (EKSMA's CDN PDF too). Vendor index tables are probably computed
  from the same Sellmeier: call them "tabulated", not independent measurements.
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
