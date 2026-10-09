# Handover — 2026-10-09 (session 24 → session 25)

**Start here:** read this file, then `docs/ROADMAP.md`. Stage **2c** (trust data) is done on branch
`phase-2/trust-data` (PR below). Phase 2 has one box left (`useMemo` deps and `any`). Merge the PR only after the
user approves, then run `ui-check` on production and look at one reviewed and one unreviewed page (badge and section).

## State
- `phase-2/trust-data` (on `main` 04e825f9, PR #20 merged): `feat(registry)` infrastructure, `feat(registry)` data
  for 34 pages, `docs` (skills, `physics.md`, ROADMAP, this file). `check` green (204 tests), `build` green.
- Every calculator page now shows a "Model: …" badge under the lede (it links to `#model`) and a "Model and
  references" section after the calculator, then the related links. 34 pages have a tier (12 exact, 22 textbook);
  438 say "Not yet reviewed". `/about#model-tiers` explains the tiers with counts. JSON-LD lists references as `citation`.

## Decisions (this session)
- The user chose "Not yet reviewed" for unaudited pages, rather than showing nothing or auditing all 472 first.
- Only audited pages get a tier: Phase 1 (`ber`, `bpsk-qpsk`) and sessions 18–23. The ~40 thin-film pages on
  `transfer-matrix.ts` (plus `interference`, `cavity-filter`, `ellipsometry`) and `gires-tournois` stay unreviewed:
  the matrix is exact, but the rest of each page was never audited. They're the obvious next audit batch.
- Sources come from the modules' headers and tests only. DOIs come from Crossref, accepted only when volume, first page
  and year match; titles and page ranges are from Crossref too. Books without a verifiable edition keep none (Agrawal NLFO,
  Saleh & Teich). Boyd *Nonlinear Optics* is cited as the 3rd ed. (2008): §2.7–2.10 match it, and the OPO module says so.
- A mixed model takes the lower tier and says what is exact in `modelNote` (e.g. `coherent-raman`: wavelengths exact).
- `infrared-glass` is textbook, not illustrative: the index is verified, and the note flags the unchecked dn/dT, κ and Knoop values.
- Tier rules (test-enforced): exact/textbook need ≥ 1 reference; no references or note without a tier; URLs are https,
  DOIs as `https://doi.org/10.…`; no URL inside a citation. Illustrative may have no reference.

## Next actions
1. Push `phase-2/trust-data`, open the PR, CI, ask before merging, then `ui-check` production plus
   `/laser-safety/exposure-duration` (badge "Model: Exact", two references, a doi link) and `/about#model-tiers`.
2. Then the user's pick: Phase 4 audits that fill trust data (thin-film batch first, `physics-reviewer` in batches of
   ≤ 10, then a registry edit per page), Phase 3 charts, or golden tests for the top 50.

## Ship flow (worked eighteen times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO (302 to `vercel.com/sso-api`). Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Trust data in an audit:** `physics-audit` now ends with a "Registry:" line; the fixing session copies tier,
  `modelNote` (≤ 220 chars) and references into `src/registry/calculators/<category>.ts`. Check DOIs with Crossref
  (`api.crossref.org/works?query.bibliographic=…`, match volume and first page; space requests ≥ 1 s or it returns an
  empty body) and that `https://doi.org/<doi>` answers 302. Never take a DOI from memory.
- **Rendering in tests:** `renderToStaticMarkup(createElement(Component, props))` works in `node:test` via tsx,
  `next/link` included (`tests/calculator-pages.test.ts`). Test files are `.ts`, so no JSX.
- **tsx scratch scripts:** top-level `await` fails (cjs output) and `.mts` with `C:/…` imports fails (ESM wants
  file URLs); wrap the body in `async function main()`.
- **`ui-check` load mode** waits for an `<input>` with a React fiber; pages without inputs (e.g.
  `optical-glass-catalog`) fail with "not hydrated". Use a scratchpad copy that probes `button` instead. Wrap each
  run in `timeout 200`: a Chrome-startup hang otherwise blocks forever. Flake: loop up to 3 times.
  In Git Bash set `MSYS_NO_PATHCONV=1`, or the `/category/slug` args become Windows paths ("invalid URL").
- **Screenshots without the extension:** headless Chrome `--headless=new --screenshot=<png> --window-size=W,H <url>`.
- **Mutation check:** a scratchpad `mutate.cjs` (exact string replace → run one test → restore, in `try/finally`).
  Use it only while no `check` is running.
- **PDFs:** `pdftotext` is on the PATH (Git Bash `/mingw64/bin`); use `-raw` for tables. WebFetch can't read PDFs.
- **TS syntax:** `-x ** 2` is a parse error (esbuild "Unexpected **"); write `-(x ** 2)` or `-x * x`.
- **Redirect test:** `tests/redirects.test.ts` greps `src/` for removed hrefs (whole `/<category>/<slug>` matches).
- **λ in m → nm:** `lambda * 1e9` gives 700.0000000000001 for 700e-9; the laser-safety modules round (`toNm`).
- **Physics modules:** SI in, SI out; pages convert at the boundary. Conventions are in the module headers.
- **Scratch scripts** that import repo modules need absolute paths (`C:/dev/photonics-calculators/src/...`);
  run them with `npx tsx`. Never start a Bash command with a bare `cat > file` (it waits on stdin); use a heredoc.
  No `python3` in Git Bash; use node. `node -e '…'` with template literals can drop regex backslashes: use Edit.
- **`SimpleChart`**: no `shapes`, no second x axis; skips NaN; log axis clamps below 1e-10. Filter NaN/∞ in the page.
- **Local production server:** `npx next start -p 3100`. Kill it with
  `netstat -ano | grep ':3100 .*LISTENING'` → `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Run long ones in the background. Don't edit
  `.ts` files while `check` runs (draft in the scratchpad instead).
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
