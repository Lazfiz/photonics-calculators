# Handover — 2026-10-09 (session 25 → session 26)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Audit the unreviewed pages"). Session 25 did the
thin-film audit, part 1, on branch `phase-4/thin-film-audit` (PR #22). PR #21 (stage 2c) is merged and live.

## State
- 40 pages audited by four `physics-reviewer` batches (39 thin-film pages on the modules + `wave-optics/gires-tournois`):
  9 OK, 14 questionable, 17 bugs. Findings and fixes per page are in ROADMAP Phase 4 (thin-film parts 1–4).
- Part 1 (this PR): 21 pages fixed where needed, with trust data (14 exact, 6 textbook, 1 illustrative), so 55 of 472
  pages have a tier. New tested modules `physics/thin-film/quarter-wave-stack.ts` and `graded-index.ts`; `interference.ts`
  gained `airyPeakNear`. The registry's `thin-film.ts` has `macleod()`, `bornWolf()` and `hecht()` citation helpers.
- The other 19 pages stay "Not yet reviewed" until fixed: part 2 (edge filters), part 3 (readouts, phase), part 4 (metals, one-offs).

## Decisions
- The user picked the thin-film audit over Phase 3 charts, top-50 tests and the Phase 2 lint box.
- A page gets a tier only once it is OK or fixed; bug pages wait for their batch (no interim "illustrative").
- Ad hoc readouts were replaced by tested closed forms, not just relabelled: the angle shift is λ₀(cos θ_H + cos θ_L)/2,
  the Fabry-Perot cards use the nearest order and its exact FWHM, and the graded index is a midpoint staircase.
- Defaults changed where they hid the physics: `gradient-index` n_surface 1.1; `ellipsometry-measurement` bulk Si at 70°
  (Ψ 10.573°, Δ 179.230°; its Brewster input, unrelated to Ψ and Δ, is gone); `wavelength-separation` λ₂/λ₁ = 1.4 (URL key
  `sepRatio`; the stop bands overlap below 1.359).
- Kept from session 24: DOIs only from Crossref (volume, first page and year match); books without a verifiable edition get
  no DOI; a mixed model takes the lower tier. Tier rules are test-enforced (exact/textbook need ≥ 1 reference, https URLs,
  DOIs as `https://doi.org/10.…`, no URL inside a citation).

## Next actions
1. Done: PR #22 merged (`96cdcbc0`); production `ui-check` suite + the 21 pages passed (comment on the PR).
2. Thin-film part 2 on branch `phase-4/thin-film-edge-filters` (created from `main` after #22): an `edge-filter.ts`
   module, then the 9 pages in ROADMAP part 2. **The user decided: merge `long-pass` and `short-pass` into `edge-filter`**
   (add them to `src/registry/redirects.json`, run `scripts/codemods/2026-10-08-merge-duplicates.ts --write`; their old
   titles become keywords). Then part 3 and part 4, one session each. Other tracks: Phase 3 charts, top-50 golden tests.

## Ship flow (worked nineteen times)
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
- **Book chapters:** Crossref lists a book's chapters as `<book doi>-c<N>` (`api.crossref.org/works/10.1201/9781420073034-c7`
  → "Edge Filters"). Check chapter numbers there instead of trusting a reviewer's memory.
- **`useURLState` doesn't clamp:** `?numPairs=1e9` hung `environmental-stability`. Clamp layer counts in the page.
- **`ChartPanel` → `SimpleChart`** for plain scatter charts; it reads `null` as 0, so break a line by splitting it into traces.
