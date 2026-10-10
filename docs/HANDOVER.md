# Handover — 2026-10-10 (session 29 → session 30)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Laser-safety audit, part 1" and parts 2–5).
Session 29 audited the 44 untiered laser-safety pages on branch `phase-4/laser-safety-audit` (PR #26).

## State
- Audit (four `physics-reviewer` batches against `eye-exposure-limits.ts`, ICNIRP 2013): 2 OK, 6 questionable,
  36 bugs, 28 of them understating a hazard. Findings with numbers are in the ROADMAP part 1–5 items.
- Containment (the user's choice): registry `knownIssue` → red "Known error, under repair" box from the shell
  (`KnownIssueNotice` in `components/model-references.tsx`) and a tag on the laser-safety landing page. On the
  29 bug pages not yet fixed. A page with a `knownIssue` can't have a tier (`tests/registry.test.ts`).
- Fixed and tiered (82 of 470 tiered): shared CW suite (`src/lib/laser-safety-cw-suite.ts`: 7 mm averaging, NOHD
  from the beam's own diameter, 1/e² or 1/e via `beamDefinition`), `nohd`, `viewing-distance`, `optical-density`,
  `od-requirements` (textbook); `beam-expander`, `peak-power`, `beam-diameter-conversion`, `aversion-response`
  (new modules in `src/physics/laser-safety/`), `mpe`, `power-density` (exact).

## Decisions
- Containment = warning box only; no hiding (the user picked it over hide / box + hide).
- Beam inputs default to 1/e² (data sheets) and are ÷ √2 to the standards' 1/e: a mislabelled input errs safe.
- The CW suite stays in `src/lib` (mW/cm² units) until part 2 rebuilds it in SI on the ICNIRP module.
- The oracle's C_C = 8 + 10^(0.04(λ − 1250)) is ICNIRP 2013 / IEC 2014; a reviewer's "C₇ = 8" was IEC 2007.
- Kept: DOIs only from Crossref; a page gets a tier only once OK or fixed; mixed model → lower tier.

## Next actions
1. PR #26: CI, then ask the user to merge; after merge, `ui-check` on production and spot values (nohd 98.02 m,
   viewing-distance 443.3 m, optical-density OD 3.71, beam-expander 31.83 W/cm², peak-power 10.00 kW,
   aversion-response 0.980 mW; a red box on `/laser-safety/lidar-safety`).
2. Laser-safety part 2 (eye and skin limits on the oracle, `skinLimits`), then parts 3–5. Ask the user about the
   merge candidates first (the two skin pages; the four corneal/IR pages; `viewing-distance` → `nohd`;
   `beam-divergence-hazards` → `nohd`; the three pulse pages).

## Ship flow (worked twenty-three times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **ICNIRP oracle from the shell:** `npx tsx -e 'import { eyeLimits, exposureLimit } from
  "C:/dev/photonics-calculators/src/physics/laser-safety/eye-exposure-limits.ts"; …'` works (static absolute import).
- **Scratch scripts that import packages** (ts-morph) from the scratchpad need `NODE_PATH=C:/dev/photonics-calculators/node_modules`.
- **Registry edits by script:** ts-morph `addPropertyAssignment` mangles indentation and trailing commas; insert
  text after the last property's comma instead (`scratchpad/set-known-issues.ts` pattern), then review the diff.
- **Splitting one file across commits** (no `git add -p`): save the full file, check out HEAD's, re-apply part 1,
  commit, copy the full file back, commit.
- **refractiveindex.info data:** raw YAML at `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/
  master/database/data/main/<El>/nk/<Name>.yml`. Tables can repeat a wavelength: skip zero-width intervals.
- **CIE data files:** `https://files.cie.co.at/Publications-datasets/<file>.csv`.
- **IAPWS PDFs:** `https://iapws.org/technical-guidance/release/<name>.download`; `pdftotext -raw` reads the tables.
- **ui-check paths in Git Bash:** prefix `MSYS_NO_PATHCONV=1`, or `/laser-safety/x` becomes `C:/Program Files/Git/...`.
- **Shell quoting:** text with apostrophes breaks `node -e '…'`; write a `.cjs` script with the Write tool.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`. Check DOIs
  on Crossref (`api.crossref.org/works?query.bibliographic=…`; ≥ 1 s apart) and that `https://doi.org/<doi>` gives 302.
- **Chrome extension** may be disconnected: use `scripts/ui-check.mjs <base> load /a /b` and headless Chrome
  `--headless=new --virtual-time-budget=8000 --screenshot=C:/…/x.png --window-size=1280,2900 <url>`.
- **Dev server:** `npx next dev -p 3200`; stop it before `npm run build` (both use `.next`). Kill in Git Bash with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page (`clampToRange`). It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN; reads `null` as 0; `xaxis.type: "log"`
  works; legend names longer than ~14 characters are clipped.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
