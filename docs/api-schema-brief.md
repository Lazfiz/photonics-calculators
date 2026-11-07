# Brief: API schemas for a category (ROADMAP 11c, implementer agents)

Repo C:\dev\photonics-calculators, on the stage branch (already checked out; don't switch, don't commit).
Read CLAUDE.md "Search and read in small pieces" and `.claude/rules/physics.md` first.

## Goal
For each page in your group write `src/schemas/<category>/<slug>.ts`: a `defineSchema({...})` (contract:
`src/schemas/types.ts`) with the page's inputs/choices (same `useURLState` keys, units, defaults, min/max as the
page), the page's main outputs (in the page's display units), `compute` through the same `src/physics/` functions the
page calls (SI in, SI out), warnings where the page warns, and 1–3 reference `checks`.
Models to copy: `src/schemas/materials/diamond-optics.ts` (numeric), `infrared-glass.ts` / `nonlinear-crystals.ts`
(choices), `electro-optic.ts`.

## Rules (from earlier sessions; each one was broken before)
- **Do not touch `src/schemas/index.ts`** (the main session registers schemas). Other agents write other files in
  parallel: don't edit any file outside your list.
- If the page does physics dispatch inline (switch on material, unit juggling) that the schema would have to copy,
  move it into the page's physics module as an exported function, make the page call it (behaviour unchanged), and
  call it from the schema. Report each such move.
- Validate your files with `node --import tsx scripts/check-schema.ts src/schemas/<category>/<slug>.ts …` (runs the schema
  test's assertions on unregistered files, incl. defaults vs the page). Don't rely on `tests/api-schemas.test.ts`.
- Also run `node --import tsx --test tests/no-inline-constants.test.ts`. Use `node --import tsx` for these: `npx …`
  and `node node_modules/…` wait in the machine-wide devctl queue, sometimes for half an hour. Run
  `npx eslint <your files>` once at the end if it starts; skip `tsc`: the main session runs eslint, tsc and the full
  gate after every agent has finished (parallel agents see each other's half-done files). No inline physical constants: import from `src/physics/constants.ts`. An expected value within 1 % of c (any
  unit) trips that test: write it as a product.
- Checks: tolerances are relative and an expected value can't be 0. Read every expect/tolerance pair you write:
  `computed` checks use ≈1e-8 with the hand-worked arithmetic in a comment; `printed` checks use the printed
  rounding (e.g. 5e-4 for 4 digits), never a loose 1 % to make it pass.
- `basis: "printed"` only when you have **verified the value in the source itself** (fetch it: Crystran,
  refractiveindex.info yml, SCHOTT, NIST, arXiv, Europe PMC REST `…/rest/<PMCID>/fullTextXML`, NTRS work; MDPI/AIP/
  Optica block bots). Never cite a value "as transcribed in the repo" as printed; never put "as the repo cites it"
  in a citation string. Otherwise use `basis: "computed"` from the cited equation.
- Citation strings: authors, year, title, venue, doi, equation/table number. Check each doi/citation with
  `node scripts/crossref.mjs <doi>` or `-q "<citation>"`. Prefer the reference the page's registry entry already
  cites (`src/registry/calculators/<category>.ts`) or the physics module's header comment. Say in the report which
  equation numbers you took from memory.
- An output that is NaN at the page defaults can't be in the schema (test wants finite defaults); leave it out and say so.
- Long commands in the background; never write unbounded `until`/`while … sleep` loops (use `timeout N`).
- Keep output small: `| tail`, `cut -c1-160`.

## Report (≤40 lines)
Per page: file, inputs/choices/outputs count, each check (source short name, basis, inputs → expected, tolerance),
moved functions, anything left out and why. Then gate results (check-schema, no-inline-constants, eslint, tsc lines
for your files). List every file you changed.
