# Handover — 2026-10-10 (session 32 → session 33)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, laser-safety parts 3a and 3b done; 4 and 5 open).
PR #28 (part 3a) is merged and live (`840f8312`, production checked in session 31). Session 32 did part 3b on branch
`phase-4/laser-safety-apps`.

## State
- New tested modules in `src/physics/laser-safety/`: `multiple-wavelength.ts` (shares P/P_max per ICNIRP limit, added per
  tissue: retina; anterior eye), `filter-heating.ts` (Gaussian beam on an insulated plate, face or volume absorption;
  PC, PMMA, N-BK7), `surgical-laser.ts` (TRT, handpiece divergence b₀/f, 4λf/(πb₀)); `retinal-image.ts` gained
  `gaussianApparentSource` (embedded-Gaussian beam, eye accommodating 0–10 D). 12/12 mutations caught.
- Four pages fixed and tiered (97 of 464): `multiple-wavelength` exact; `medical-laser-safety`, `retinal-image-size`,
  `thermal-lens-hazard` textbook. No laser-safety page in parts 1–3 keeps a quarantine banner.

## Decisions
- Multiple wavelengths: ICNIRP 2013 p. 279 adds exposures absorbed in the same tissue ("for practical purposes" even
  for different mechanisms) and treats different tissues independently. A line's share of a tissue is its largest
  share there (one line's thermal and blue-light limits are met separately, not summed). UV + IR at the cornea add (safe).
- Medical: the OD uses the beam at the focus (all power inside the aperture, the worst case); the lens-side OD is a
  subtext. NOHD is measured beyond the focus (ANSI lens-on-laser). TRT = time for a Gaussian centre temperature of
  1/e width d to halve: d²/(16κ) cylinder, d²/(27.2κ) sphere, 3d²/(16κ) layer.
- Retinal image: α is the 63 % image diameter over 17 mm with the eye focused for the smallest image (IEC apparent
  source). Beams overfilling the pupil: max(M²/w, 2/D) keeps the image of a multimode waist (not the pupil cap).
- Filter heating: limit = glass transition − 25 °C; no cooling (errs high for long exposures); stress not modelled.

## Next actions
1. PR for `phase-4/laser-safety-apps`: CI, then ask the user to merge; after merge, `ui-check` on production and spot
   values at the defaults: multiple-wavelength retina 1.22, anterior eye 0.275, OD 0.09; retinal-image-size α 2.83 mrad,
   C_E 1.89, M² 77.8; thermal-lens-hazard +730 K at 5 s, T_g in 87.9 ms, 0.313 W max; medical NOHD 2.00 m, OD 3.02
   (lens 2.52), 31 800 W/cm², TRT 4.81 ms.
2. Laser-safety part 4 (classes and AEL; check the 1250–1400 nm anterior-segment limit against IEC 60825-1:2014 first),
   then part 5 (pulses). Green-pointer, research-lab, lidar NOHDs go on `hazard-distance.ts` there.

## Ship flow (worked twenty-five times)
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
