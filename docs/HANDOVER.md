# Handover — 2026-10-10 (session 28 → session 29)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Audit the unreviewed pages"). Session 28 merged
PR #24 (part 3, production checked) and did thin-film part 4 (metals and one-offs) on branch
`phase-4/thin-film-metals`.

## State
- New modules (all tested): `materials/lorentz-drude.ts` (Rakić 1998 LD: Ag, Al, Cr), `materials/silver.ts` +
  `silver-yang-2015.ts` (Yang 2015 Ag table + matched Drude tail), `blackbody.ts`, `cie-photometry.ts`,
  `thin-film/low-emissivity.ts`, `metal-mirror.ts`, `dual-band-ar.ts`, `anti-fog.ts`; `stoney.ts` +`delaminationThickness`.
- 7 pages rewritten: `enhanced-aluminum`, `protected-silver`, `heat-mirror`, `emissivity-control`, `dual-band-ar`,
  `hard-coating`, `anti-fog`. All have trust data: 72 of 470 pages tiered.
- The user keeps `bandpass-filter` and `narrow-bandpass` as two pages (asked this session).

## Decisions
- **Ag = Yang et al. 2015** (template-stripped) on every page; Rakić LD Ag is 95.4 % at 550 nm vs ≈ 98 % measured.
  Al and Cr stay Rakić LD (Al gives the expected 91.5 % at 550 nm). Below 0.27 µm `silverIndex` returns NaN.
- Emittance = Planck-weighted **normal** 1 − R of an opaque substrate (glass treated as opaque in the IR). Not
  hemispherical; pages say so. Bare glass with constant n gives 0.957 (no 9 µm reststrahlen); pages say so.
- Pane values (τ_v D65×V, τ_e G173 280–4000 nm) include the glass back face incoherently, no glass absorption.
- `dual-band-ar` fit: thicknesses ≤ half wave at the longer λ; with the default indices there is no double zero.
- `hard-coating`: URL key `stressMPa` (tensile > 0) replaces `stressGPa` (old sign was inverted); hardness gone.
- `anti-fog`: droplet TIR share only for θ ≤ 90° (beyond, the drop overhangs its footprint).
- Kept: DOIs only from Crossref; a page gets a tier only once OK or fixed; mixed model → lower tier.

## Next actions
1. Part 4 PR: CI, then ask the user to merge; after merge, `ui-check` on production and spot values
   (enhanced Al 96.58 %, heat mirror τ_v 91.9 % / ε 0.033, dual-band 0.037 %).
2. Next Phase 4 tracks: audit another category's unreviewed pages (physics-reviewer batches), Phase 3 charts,
   top-50 golden tests.

## Ship flow (worked twenty-two times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **refractiveindex.info data:** raw YAML at `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/
  master/database/data/main/<El>/nk/<Name>.yml`; model scripts (with parameters) in `refractiveindex.info-scripts`.
  Tables can repeat a wavelength (rounding): interpolators must skip zero-width intervals.
- **CIE data files:** `https://files.cie.co.at/Publications-datasets/<file>.csv` (the old root path 404s).
- **IAPWS PDFs:** `https://iapws.org/technical-guidance/release/<name>.download`; `pdftotext -raw` reads the tables.
- **Printed blackbody tables** (Incropera) are off by up to 4e-5 at λT = 10⁴ µm·K; trust direct integration.
- **ui-check paths in Git Bash:** prefix `MSYS_NO_PATHCONV=1`, or `/thin-film/x` becomes `C:/Program Files/Git/...`.
- **tsx scratch scripts:** static `import … from "C:/dev/..."` works; dynamic `import("C:/...")` fails (needs file://).
- **Shell quoting:** text with apostrophes breaks `node -e '…'`; write a `.cjs` script with the Write tool.
- **Whole-quarter-wave symmetry:** R(g) = R(2 − g) in g = λ₀/λ for lossless whole-QW stacks at normal incidence.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`. Check DOIs
  on Crossref (`api.crossref.org/works?query.bibliographic=…`; ≥ 1 s apart) and that `https://doi.org/<doi>` gives 302.
- **Chrome extension** may be disconnected: use `scripts/ui-check.mjs <base> load /a /b` and headless Chrome
  `--headless=new --virtual-time-budget=8000 --screenshot=C:/…/x.png --window-size=1280,2900 <url>`.
- **Dev server:** `npx next dev -p 3200`; stop it before `npm run build` (both use `.next`). Kill in Git Bash with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp counts in the page (`clampToRange`). It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN; reads `null` as 0; `xaxis.type: "log"`
  works; legend names longer than ~14 characters are clipped.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
