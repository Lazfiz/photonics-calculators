# Handover — 2026-10-10 (session 30 → session 31)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Laser-safety part 2" done; parts 3–5 open).
Session 30 did laser-safety part 2 on branch `phase-4/laser-safety-limits`.

## State
- The user approved every merge candidate: `skin-hazard` → `skin-mpe` and `corneal-limits`, `infrared-corneal`,
  `infrared-thermal` → `infrared-hazard` (done; 466 pages), `viewing-distance` + `beam-divergence-hazards` → `nohd`
  (part 3), `pulsed-mpe` + `multiple-pulse` + `prf-correction` → one page (part 5).
- Oracle `src/physics/laser-safety/eye-exposure-limits.ts` now has extended sources (optional α: C_E, α_max(t), T₂),
  `limitMaxPower` (inverse of `limitMaxDuration`) and `photochemicalCrossover` (Table 4's T₁). New
  `skin-exposure-limits.ts` (Table 7) and `retinal-image.ts` (17 mm eye, 25.5 µm floor). UI helpers:
  `components/eye-limit-labels.ts` (labels, colours, formatters, `finiteXY`).
- Seven pages fixed and tiered (89 of 466): `skin-mpe`, `infrared-hazard`, `thermal-vs-photochemical`,
  `extended-source`, `eye-safe-wavelength` exact; `corneal-vs-retinal`, `retinal-hazard` textbook. Landing page has a
  new "ICNIRP 2013 limits" group. `retinal-image-size` moved to part 3.

## Decisions
- Merged pages keep `skin-mpe` and `infrared-hazard` (old titles became keywords via the merge codemod).
- Max power = least H/(t·E₁) over all durations up to t (consistent with the first-crossing duration); the rounded
  table joints make it ≤ 2.5 % below the limit at t alone. Pages say so.
- `eye-safe-wavelength` is single-pulse until part 5's pulse-train module; its rep-rate input fed nothing.
- Skin limit for beams < 1 mm: the page shows the peak-irradiance comparison (Table 7 note b) next to the 3.5 mm one.
- Kept: DOIs only from Crossref; a page gets a tier only once OK or fixed; mixed model → lower tier.

## Next actions
1. PR for `phase-4/laser-safety-limits`: CI, then ask the user to merge; after merge, `ui-check` on production and spot
   values at the defaults: skin-mpe 1.00e5 J/m², max 151 mW, 6.64×; infrared-hazard max 15.4 mW, 649×;
   thermal-vs-photochemical photochemical governs from 10 s (480 nm: 39.8 s); extended-source C_E 33.3, T₂ 31.1 s,
   1.69e4 J/m² (33.7× the point source: Table 5 rounds 18·10^−0.25 to 10); corneal-vs-retinal retina 208 mW, cornea
   201 mW; eye-safe-wavelength 1064 nm 785 nJ, 1550 nm 102 mJ; retinal-hazard 25.5 µm, 1.96e7 W/m², max 0.980 mW.
2. Laser-safety part 3 (beam and application pages, merges into `nohd`, `retinal-image-size`), then parts 4–5.
3. Stale `.next/types` after deleting pages breaks local `tsc`: delete `.next/types` and `.next/dev/types`.

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
