# Handover — 2026-10-10 (session 31 → session 32)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Laser-safety part 3a" done; 3b, 4, 5 open).
Session 31 merged PR #27 (part 2; production checked) and did laser-safety part 3a on branch `phase-4/laser-safety-beams`.

## State
- New `src/physics/laser-safety/hazard-distance.ts`: `limitSafeDiameter` (closed-form inverse of `limitMaxPower` in d),
  NOHD for round/elliptical beams with linear or Gaussian spread, `requiredOpticalDensity`, `limitMaxIrradiance`,
  diffuse viewing (`diffuseExposure`, `diffuseHazardDistance`). Oracle gained an optional open field of view
  (`eyeLimits(λ, α, "open")`, ICNIRP 2013 eqn 5), default unchanged.
- `viewing-distance` + `beam-divergence-hazards` merged into `nohd` (464 pages). Five pages rebuilt and tiered (93 of 464):
  `nohd` exact; `diffuse-reflection`, `diode-laser-safety`, `fiber-laser-safety`, `industrial-laser-safety` textbook. They
  moved to the landing page's "ICNIRP 2013 limits" group. Shared UI: `components/hazard-ratio-chart.tsx`, `fmtDistance`.

## Decisions
- NOHD averages the Gaussian beam over each limit's aperture (as the oracle does), so it is a little shorter than the
  standards' peak-irradiance (√(4P/(πE)) − a)/φ: 97.77 vs 98.02 m at the `nohd` defaults. Pages say so.
- Diffuse viewing counts the whole spot (open field of view, C_E = α²/(α_min α_max) above α_max): conservative for
  Gaussian spots and for blue light (γ_ph not modelled). Far-field ρP/(πr²); pages warn below 10 spot diameters.
- Diode: elliptical beam = round beam of equal peak irradiance √(d_x d_y); default t 10 s (invisible NIR), FWHM option.
- Fiber: default single-mode (λ/(πw₀) from the MFD, conservative); multimode fills the NA (2 tan asin NA). Old links
  with only `na` now open as single-mode.
- Part 3 split: 3b (medical, multiple-wavelength, thermal-lens, retinal-image-size) next session.

## Next actions
1. PR for `phase-4/laser-safety-beams`: CI, then ask the user to merge; after merge, `ui-check` on production and spot
   values at the defaults: nohd 97.8 m (gaussian 99.8 m); diffuse-reflection 0.637 W/m², α 7.07 mrad, ratio 2.67e-3,
   no hazard distance; diode 16.0 m, OD 2.90; fiber 1.66 m (multi 0.933 m); industrial 7.13 km, OD 6.31, diffuse 2.76 m.
   Redirects: `/laser-safety/viewing-distance` and `/laser-safety/beam-divergence-hazards` → `/laser-safety/nohd`.
2. Laser-safety part 3b. `multiple-wavelength`: ICNIRP 2013 p. 279 — additive only for the same absorption site and
   mechanism (retina thermal, retina photochemical, cornea); different tissues count independently.
3. Parts 4–5 (classes/AEL; pulses). Green-pointer, research-lab, lidar NOHDs go on `hazard-distance.ts` there.

## Ship flow (worked twenty-four times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **ICNIRP 2013 text:** `curl -sL -o x.pdf https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`,
  then `pdftotext -layout`. Extended sources and eqn 5 near line 340, additivity near line 570.
- **Registry scripts:** an entry sliced up to `
  },` has no newline after its last property; match `(?=
|$)`.
  `git checkout -- src/registry/...` also reverts a merge codemod run: re-run the (idempotent) codemod.
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
  Stopping a background `next start` task leaves its `node` child on the port: find it with `netstat -ano | grep :3100`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page (`clampToRange`). It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN; reads `null` as 0; `xaxis.type: "log"`
  works; legend names longer than ~14 characters are clipped.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
