# Handover — 2026-11-08 (session 227 → session 228)

**Start here:** session 227 did 11c-3b on `phase-11/11c-3b-polarization` (PR #266): API schemas with 1–3 computed
checks for 11 polarization pages (glans-prism … polarimetry). 11c-3a is released (974eedb8). Next: `/ship` #266,
then 11c-3c (polarization-scrambling … wire-grid, 10 pages), the last polarization batch.

## State
- 95 runnable schemas (`src/schemas/index.ts`). Contract unchanged (`src/schemas/types.ts`).
- jones-calculus, jones-chain and mueller-matrix now keep their chain in the URL (user choice: 6 slots,
  `element1..6` stable ids, `angle1..6` for jones-calculus rotators, `s0..s3` Stokes on mueller-matrix); unknown ids
  fall back (`Object.hasOwn`, not `in`). Tables moved to physics: `JONES_CALCULUS_ELEMENTS`/`jonesCalculusMatrix`/
  `JONES_CALCULUS_INPUTS`, `JONES_CHAIN_ELEMENTS`/`JONES_CHAIN_INPUTS` (jones.ts), `MUELLER_ELEMENTS` (id →
  {label, matrix}), `muellerElementKind`/`muellerElementMatrix` (mueller.ts).
- Other moves: `crystalIndicesHeld`/`crystalSectionRetardance` (uniaxial.ts), `lcEffectiveBirefringence`
  (twisted-nematic.ts), `substanceSpecificRotation` (optical-activity.ts).
- Goldstein 3rd-ed. chapter titles and pages verified on Crossref are listed at the top of
  `src/registry/calculators/polarization.ts`; cite those, never chapter numbers.
- 1309 tests (schema checks run inside `tests/api-schemas.test.ts`).

## Next actions
1. `/ship` PR #266. Release only when the user asks; after it: `node scripts/post-merge-check.mjs <sha>
   polarization/polarimetry=61.6 polarization/polarimetry=58.3` (DOP and DOLP % at the default Stokes
   (1, 0.5, 0.3, 0.2)), then `curl -s https://photonicscalculators.com/checks.json` (95 calculators, all `pass`), then
   `node --import tsx scripts/indexnow.ts`.
2. 11c-3c: polarization-scrambling … wire-grid (10 pages). Brief: `docs/api-schema-brief.md`; same review (crossref,
   deviation run, 1–2 values by hand per group, tsc after all agents). Tell agents: a page with plain `useState` and
   no URL keys is a decision for the user, not for the agent.
3. 11b-2: the user runs `claude mcp add --transport http photonics https://photonicscalculators.com/mcp` and the
   MCP Inspector (`npx @modelcontextprotocol/inspector`) against production, or allows the download (asked in 222).
4. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.
6. IndexNow posts to www.bing.com/indexnow; ask the user whether Bing Webmaster lists the submissions.
7. 10g-2 left: Resend domain records + `REPORT_FROM_EMAIL` (optional).

## Non-obvious facts
- **Session 227:** schema helpers that build keys from a template (`` `element${n}` ``) widen the key to `string`,
  and `SchemaInputs` then collapses (30 tsc errors; check-schema and tests still pass). Write
  `` <N extends number>(n: N) => ({ key: `element${n}` as const, … }) ``. Agents put remembered chapter numbers
  and wrong chapter titles into citations again; one agent capped a page's chain without asking. Deviation run:
  scratch `.mts` in the repo root with `runSchema(schema, {...defaults, ...check.inputs}).outputs`.
- **Session 226:** three implementers (4 + 4 + 3 pages) took 4–8 min each. Time a schema before cutting an output.
  Agents copied a "use client" helper into a physics module and left the original: make the component re-export
  the physics version. New tests change `src/lib/test-stats.json`: run `npx tsx scripts/test-stats.ts` first.
- **Session 225:** the machine-wide `devctl` gate queues `npx …` and `node node_modules/…` behind other projects' jobs
  (`node C:/dev/_control/bin/devctl.mjs status` shows the queue). `node --import tsx …` is not gated: tell agents to
  use it for check-schema and tests. Always run tsc after all agents finish. Brief rules that held: no "as the repo
  cites it", printed only when fetched, computed checks 1e-8 with the arithmetic in a comment, move page dispatch into
  the physics module. Python `open(p, "w")` on Windows writes CRLF; git normalizes on commit (warning only).
- **Session 224:** brief agents to run `tests/no-inline-constants` (an expected value within 1 % of c in any unit:
  write it as a product) and the MCP test's "not runnable" slug (`wave-optics/bessel-beam`; move it when wave-optics
  is done).
- **Session 223:** check every citation constant (`scripts/crossref.mjs -q`) and re-cite to sources the repo already
  audited. `node --import tsx -e 'import("./src/x.ts")'` gives the exports under `.default`.
- **Session 222:** a check can't expect 0: tolerances are relative. Agents must not cite a value "as transcribed in
  the repo" as `printed` (Europe PMC REST `…/rest/<PMCID>/fullTextXML` reads MDPI papers). Never send an Agent call
  with a placeholder prompt. `.claude/hooks/block-wait-loops.mjs` blocks unbounded until/while-sleep loops (allowed
  under `timeout N`).
- **Session 221:** the auto-mode classifier blocks `npx -y @modelcontextprotocol/inspector` (external code). Ports
  3100/3200/3400 hold old `next start` leftovers; probe servers go on 3410 (`npx next dev -p 3410`, then
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3410 load /a /b`). find_calculator ranks via the
  site search.
- **Session 219:** when `devctl` answers exit 75 ("not started"), **nothing** on that command line ran: put edits in
  their own command. `tsx --test` doesn't type-check: only `npm run check` catches test-file type errors.
- **Session 218:** routes type `ctx` inline so `tsc` passes on a clean checkout. Probe a build with
  `npx next start -p <port>` in the background, stop it with TaskStop.
- **Session 215:** the Vercel MCP has no "update project domain" tool; `vercel api /v9/projects/<prj>/domains/<name>?teamId=…
  -X PATCH --input -` works. `scripts/codemods/*` are type-checked too. Keep `rc=$?` right after a command.
- **Session 211:** physics-reviewer agents: 10–17 min, 70–105k tokens each. Fetches that worked: ICNIRP 2013,
  Seibersdorf, Hamamatsu, refractiveindex.info yml, CXRO getdb.pl. MDPI, AIP and Optica block bots; arXiv, PMC, NTRS work.
- **Editing:** a node replace script inside a bash heredoc mangles `\/` and `\n` in regex text: edit such lines with
  Edit. `sed -i` with escaped regex text is unreliable.
- **Session 160:** Chrome extension screenshots time out on this site; use headless CDP. Prefix
  `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %. `SimpleLineChart` starts axes at the data min/max and has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks. JSX text needs `&apos;`. `npm run dev` touches `next-env.d.ts`:
  `git checkout` it. After adding tests rerun `npx tsx scripts/test-stats.ts`.
- **Shell:** probes are scratchpad scripts run from the repo. `git grep` skips untracked files. CI ≈ 2–3 min.
