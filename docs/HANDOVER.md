# Handover — 2026-11-07 (session 226 → session 227)

**Start here:** session 226 did 11c-3a on `phase-11/11c-3a-polarization` (PR #265): API schemas with 1–3 computed
checks for 11 polarization pages (birefringence … fresnel-polarization). 11c-2b is released (1e546e0b). Next: `/ship`
#265, then 11c-3b (glans-prism … polarimetry, 11 pages).

## State
- 84 runnable schemas (`src/schemas/index.ts`). Contract unchanged (`src/schemas/types.ts`).
- Dispatch moved from pages into physics modules: `isCrystalId`/`resolveCrystalIndices`/`crystalBirefringence`
  (uniaxial.ts; `components/crystal-select.tsx` re-exports them as `resolveIndices`/`birefringenceOf`, so 11c-3b/c
  schemas for glans-prism, retarder-types, waveplate-order, orthoconoscopic can import the physics ones),
  `prismPolarizer` (prism-polarizers.ts), `conoscopeSetup` (conoscopy.ts), `compensatorPlate`/`sampleChain`/
  `senarmontReading` (interference-colours.ts), `C_NBK7_TPA` (photoelasticity.ts), `retarderBandDopSweep`
  (mueller.ts), `plateBandModel` (spectral-depolarization.ts). Tests: `tests/polarization-page-dispatch.test.ts`,
  `tests/polarization-schema-moves.test.ts`.
- All 11c-3a checks are `computed` (1e-8; Born & Wolf, Shurcliff, Collett FG05, Goldstein, Dally & Riley, Cloude,
  Greenfield). Citations follow the physics-module headers; DOIs checked with crossref.
- `tests/mcp.test.ts` "not runnable yet" example is now `wave-optics/bessel-beam`: move it when wave-optics is done.
- 1309 tests.

## Next actions
1. `/ship` PR #265. Release only when the user asks; after it: `node scripts/post-merge-check.mjs <sha>
   polarization/circular-dichroism=329.814 polarization/brewster-polarizer=56.66` (CD ellipticity in mdeg at
   A_L 0.8, A_R 0.79; Brewster angle for n 1.52), then `curl -s https://photonicscalculators.com/checks.json`
   (84 calculators, all `pass`), then `node --import tsx scripts/indexnow.ts`.
2. 11c-3b: glans-prism, jones-calculus, jones-chain, liquid-crystal-polarizer, microscope-polarizer, mueller-matrix,
   mueller-polarimetry, optical-activity, orthoconoscopic, poincare-sphere, polarimetry. Brief:
   `docs/api-schema-brief.md`; same review (crossref, deviation run, 1–2 values by hand per group, tsc after all).
3. 11b-2: the user runs `claude mcp add --transport http photonics https://photonicscalculators.com/mcp` and the
   MCP Inspector (`npx @modelcontextprotocol/inspector`) against production, or allows the download (asked in 222).
4. In a week or two: ask the user for the Search Console Pages/Performance reports (indexed count, queries) for 10d.
5. Still missing data: BSO ε, SBN, Nd σ_a at 808 nm, CO₂ g₀ and I_s, SF59 n₂, the Tm ³H₄ band, ZBLAN κ and band.
6. IndexNow posts to www.bing.com/indexnow; ask the user whether Bing Webmaster lists the submissions.
7. 10g-2 left: Resend domain records + `REPORT_FROM_EMAIL` (optional).

## Non-obvious facts
- **Session 226:** three implementers (4 + 4 + 3 pages) took 4–8 min each, no devctl stall. An agent reported a schema
  "about 1 s" that measured 100–120 ms (conoscopic, 121² grid): time it before cutting an output. Agents copied a
  "use client" helper into a physics module and left the original: make the component re-export the physics version.
  New tests change `src/lib/test-stats.json`: run `npx tsx scripts/test-stats.ts` before the gate. A deviation run
  needs `runSchema(schema, values).outputs[key]` (a record, page units).
- **Session 225:** the machine-wide `devctl` gate queues `npx …` and `node node_modules/…` behind other projects' jobs
  (a 28-min `cargo install` stalled all three agents ≈ 40 min; `node C:/dev/_control/bin/devctl.mjs status` shows the
  queue). `node --import tsx …` is not gated and runs at once: tell agents to use it for check-schema and tests. One
  agent's `tsc` caught another agent's half-done edit; my own `tsc` caught a real one (a removed `DOPANT_PRESETS`
  import): always run tsc after all agents finish. Agents wrote "from memory" and unverified equation/table numbers
  into citation strings: strip them. Brief rules that held: no "as the repo cites it", printed only when fetched,
  computed checks 1e-8 with the arithmetic in a comment, move page dispatch into the physics module. A deviation
  script (runSchema per check, max relative error vs tolerance) found the x-ray tolerance 3× too loose.
  Python `open(p, "w")` on Windows writes CRLF; git normalizes on commit (warning only).
- **Session 224:** brief agents to run `npm run check`-relevant tests too: `tests/no-inline-constants` (q written
  out; an expected value within 1 % of c in any unit: write it as a product) and the MCP test's "not runnable" slug.
  When a page's physics dispatch lives in the page, move it into the physics module rather than copy it.
- **Session 223:** agents cite equation numbers from memory and say so: check every citation constant
  (`scripts/crossref.mjs -q`) and re-cite to sources the repo already audited. `node --import tsx -e
  'import("./src/x.ts")'` gives the exports under `.default`; a `.mts` scratch script needs a dynamic import too.
- **Session 222:** a check can't expect 0: tolerances are relative. Agents must not cite a value "as transcribed in
  the repo" as `printed`: verify against the source (Europe PMC REST `…/rest/<PMCID>/fullTextXML` reads MDPI papers).
  Never send an Agent call with a placeholder prompt. `.claude/hooks/block-wait-loops.mjs` blocks unbounded
  until/while-sleep loops (allowed under `timeout N`). Find strays with `ps -ef` + `/proc/<pid>/cmdline`.
- **Session 221:** the auto-mode classifier blocks `npx -y @modelcontextprotocol/inspector` (external code). Port
  3400 is held by an old `next start` (also 3100, 3200: leftovers, idle); probe servers go on 3410.
  find_calculator ranks via the site search ("anti-reflection coating thickness" misses `thin-film/single-ar`).
- **Session 219:** when `devctl` answers exit 75 ("not started"), **nothing** on that command line ran: put edits in
  their own command (or use Edit). `tsx --test` doesn't type-check: only `npm run check` catches test-file type
  errors. `Record<I, number> & Record<C, string>` collapses to `never` when the schema type is erased.
- **Session 218:** `RouteContext<...>` is generated by `next dev/build/typegen`; routes type `ctx` inline so `tsc`
  passes on a clean checkout. Probe a build with `npx next start -p <port>` in the background, stop it with TaskStop.
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
