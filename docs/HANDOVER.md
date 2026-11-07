# Handover — 2026-11-07 (session 224 → session 225)

**Start here:** session 224 did 11c-2a on `phase-11/11c-2a-materials` (PR #263): API schemas with 1–3 reference
checks for 14 materials pages (acousto-optic … nonlinear-index). 11c-1b is released (6e088107). Next: `/ship` #263, then
11c-2b (materials O–X, 13 pages: optical-glass-catalog … x-ray-optics).

## State
- 60 runnable schemas (`src/schemas/index.ts`). Contract unchanged (`src/schemas/types.ts`).
- `src/physics/materials/pockels.ts` exports `modulator()` + `Modulator` (moved from the electro-optic page, unchanged).
- New `scripts/page-defaults.ts`: the page's useURLState defaults, shared by `tests/api-schemas.test.ts` and
  `scripts/check-schema.ts`. It resolves literals, file-level `const X = "…"`, and `NAME.member` / `NAME[i]` imported
  from a relative module. Not resolved yet: local objects (`imaging/sensor-cmos` `D.x`) — extend it when those come.
- `tests/mcp.test.ts` "not runnable yet" example is now `polarization/birefringence`; move it when polarization gets done.
- 1302 tests.

## Next actions
1. `/ship` PR #263. Release only when the user asks; after it: `node scripts/post-merge-check.mjs <sha>
   materials/diamond-optics=2.4173 materials/damage-threshold=7.07` (defaults n 2.41730, LIDT 7.0711 J/cm²; match
   the page's rounding), then
   `curl -s https://photonicscalculators.com/checks.json` (60 calculators, all `pass`), then
   `node --import tsx scripts/indexnow.ts`.
2. 11c-2b: materials O–X, same brief (three implementers of 4–5 pages, each runs `scripts/check-schema.ts` on its
   own files, doesn't touch `index.ts`); review = citation constants + 1–2 values by hand per group.
3. 11b-2: the user runs `claude mcp add --transport http photonics https://photonicscalculators.com/mcp` and the
   MCP Inspector (`npx @modelcontextprotocol/inspector`) against production, or allows the download (asked in 222).
4. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.
6. IndexNow posts to www.bing.com/indexnow; ask the user whether Bing Webmaster lists the submissions.
7. 10g-2 left: Resend domain records + `REPORT_FROM_EMAIL` (optional).

## Non-obvious facts
- **Session 224:** brief agents to run `npm run check`-relevant tests too: two failures only showed in the full gate —
  `tests/no-inline-constants` (q written out; an expected value 2.98e11 within 1 % of c in mm/s: write it as a product)
  and the MCP test's "not runnable" slug. Agents (8–11 min, 150–160k tokens each) left "as the repo cites it" inside
  citation strings and a 1 % tolerance on a wavelength: read every check's expect/tolerance pair. When a page's
  physics dispatch lives in the page, move it into the physics module rather than letting the schema copy it.
- **Session 223:** `npx tsx scripts/check-schema.ts <files>` runs the schema test's assertions on unregistered
  schema files: give it to parallel agents, keep `src/schemas/index.ts` for the main session. Agents then took 5–8 min
  and 100–135k tokens each (4–5 pages). They cite equation numbers from memory and say so: check every citation
  constant (`scripts/crossref.mjs -q`) and re-cite to sources the repo already audited (the IEC "Tables 3–4" became
  ICNIRP 2013 Tables 5, 8). `node --import tsx -e 'import("./src/x.ts")'` gives the exports under `.default`.
- **Session 222:** a check can't expect 0: tolerances are relative ("a relative check needs a nonzero value").
  `api-schemas` and `mcp` tests stop at the first failing schema, so parallel agents saw each other's half-written
  files fail: tell them to run their own schemas through `parseInputs`/`runSchema` in scratch. Agents must not cite a
  value "as transcribed in the repo" as `printed`: verify against the source (Europe PMC REST
  `…/rest/<PMCID>/fullTextXML` reads MDPI papers; use `offset` for tables near the end). Never send an Agent call
  with a placeholder prompt: stop it at once with TaskStop. An implementer left `until grep -q "eslint-done" …; do
  sleep 5; done` running after it finished (also in 221): `.claude/hooks/block-wait-loops.mjs` now blocks unbounded
  until/while-sleep loops (allowed under `timeout N`). Find strays with `ps -ef` + `/proc/<pid>/cmdline`.
- **Session 221:** the auto-mode classifier blocks `npx -y @modelcontextprotocol/inspector` (external code); a node
  fetch script doing the handshake over HTTP stood in. Port 3400 was held by a process from elsewhere: dev/probe
  servers went on 3410. find_calculator ranks via the site search, so "anti-reflection coating thickness" doesn't
  surface `thin-film/single-ar` in the top 5 (search-tag issue, not MCP).
- **Session 219:** when `devctl` answers exit 75 ("not started"), **nothing** on that command line ran: put edits in
  their own command (or use Edit). `tsx --test` doesn't type-check: only `npm run check` catches test-file type
  errors. `Record<I, number> & Record<C, string>` collapses to `never` when the schema type is erased.
- **Session 218:** `RouteContext<...>` is generated by `next dev/build/typegen`; routes type `ctx` inline so `tsc`
  passes on a clean checkout. `new NextRequest(url, { headers })` and plain `Request` work under `node:test`. Probe a
  build with `npx next start -p <port>` in the background, stop it with TaskStop or taskkill.
- **Session 216:** `devctl` refuses a foreground command while another project keeps the CPU busy: run it with
  `run_in_background`. `node --import tsx -e 'import("./src/x.ts")'` needs a relative path and gives CJS interop.
- **Session 215:** the Vercel MCP has no "update project domain" tool; `vercel api /v9/projects/<prj>/domains/<name>?teamId=…
  -X PATCH --input -` works. `scripts/codemods/*` are type-checked too. Keep `rc=$?` right after a command.
- **Session 214:** Vercel Web Analytics on hobby answers only for the last 31 days; project
  `prj_wTWqQ2nFEuhYGHa06aUYA6Cb4XIH`. GSC "Request indexing" quota runs out fast; the sitemap matters.
- **Session 211:** physics-reviewer agents: 10–17 min, 70–105k tokens each. Fetches that worked: ICNIRP 2013,
  Seibersdorf, Hamamatsu, refractiveindex.info yml. MDPI, AIP and Optica block bots; arXiv, PMC, NTRS work.
- **Sessions 205–210:** CDP probes: `scripts/page-capture.mjs` or lines 1–79 of `ui-check.mjs`. `python -E -P` for
  pypdfium2. PDF figures: render crops with pypdfium2, calibrate on gridlines.
- **Session 198:** `devctl` holds a whole Bash command line and gives up after 90 s: run gates with
  `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Editing:** a node replace script inside a bash heredoc mangles `\/` and `\n` in regex text: edit such lines with
  Edit. `sed -i` with escaped regex text is unreliable.
- **Session 160:** Chrome extension screenshots time out on this site; use headless CDP. Prefix
  `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %. `SimpleLineChart` starts axes at the data min/max and has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks. JSX text needs `&apos;`. `npm run dev` touches `next-env.d.ts`:
  `git checkout` it. After adding tests rerun `npx tsx scripts/test-stats.ts`.
- **Shell:** probes are scratchpad scripts run from the repo. `git grep` skips untracked files. CI ≈ 2–3 min.
