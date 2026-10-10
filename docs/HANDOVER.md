# Handover — 2026-10-10 (session 33 → session 34)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, laser-safety parts 3a, 3b and 4 done; 5 open).
PR #29 (part 3b) was merged in session 33 (`5798ba64`); production `ui-check` and the spot values passed. Session 33 did
part 4 on branch `phase-4/laser-safety-classes`.

## State
- New tested modules in `src/physics/laser-safety/`: `laser-classes.ts` (IEC 60825-1:2014 AELs of Classes 1/1M/2/2M/3R/
  3B, time bases, CW classification under Conditions 3 and 1; 18/18 mutations caught) and `visual-interference.ts`
  (ICAO flight-zone dazzle ranges). `eye-exposure-limits.ts` now exports `CORNEAL_APERTURE`.
- Six pages fixed and tiered textbook (102 of 464 carry a tier): `classification` (unhidden), `ael-limits`,
  `ansi-iec-comparison` (re-scoped to MPE vs AEL with the user), `green-laser-pointer`, `research-lab-safety`,
  `enclosure-class`. They form a new landing-page group "Laser classes (IEC 60825-1:2014)".

## Decisions
- AELs are rebuilt from the limits (MPE × stop area): ICNIRP 2013 from 400 nm (= IEC 2014), IEC's own UV values over a
  1 mm stop below 400 nm. Tier textbook: IEC's tables round to two figures (0.385 vs 0.39 mW; 9.62 vs 10 mW).
- 1250–1400 nm: IEC 2014 caps Classes 1, 1M, 3R at the 3B AEL (0.5 W, 7 mm) instead of ICNIRP's anterior-segment
  limit; EN A11:2021 skin AEL (≈0.1 W, corneal stop) is an EU option. Source: Schulmeister white papers 2017/2022.
- CW only. Visible Classes 2/3R use C₆ × 1 mW / 5 mW from 0.25 s (IEC's Class 1 piece just below 0.25 s gives 0.99 mW).
- Condition 3: each AEL's own stop 100 mm from the waist (302.5 nm – 4 µm); Condition 1 (50 mm at 2 m) at 400–1400 nm
  only. Class 3B measured through 7 mm. A 1e-9 relative tolerance on class boundaries (5 mW is 3R).
- `ansi-iec-comparison`: ANSI Z136.1 tables aren't public, so no ANSI numbers; Schulmeister 2017's two ANSI differences
  are stated in words.

## Next actions
1. PR for `phase-4/laser-safety-classes`: CI, then ask the user to merge; after merge, `ui-check` on production and spot
   values at the defaults: classification Class 3R (Class 1 9.62 mW, 3R 48.1 mW); ael-limits Class 1 7.70×10⁻⁸ J (10 ns,
   633 nm), CW 0.385 mW; MPE vs AEL 7.85 mJ vs 96.2 mJ, ratio 0.0816 (355 nm, 100 s); green pointer Class 3R, NOHD 16.4 m,
   flash-blind 92.8 m, glare 419 m, distraction 4.20 km; research lab Class 3B, NOHD 197 m, OD 2.95, diffuse 1.54 cm;
   enclosure Class 1 (500 µW accessible), OD 3.41 for Class 1, 2.72 for 3R.
2. Laser-safety part 5 (pulses and scanning, ROADMAP): pulse-train module (single pulse, average, N^−0.25, T_i grouping;
   the 3B pulse values are in `laser-classes.ts`), then lidar NOHD on `hazard-distance.ts`.
3. Open (ROADMAP part 4 notes): IEC 60825-1 Ed. 4 (2026) not checked; Ed. 3's UV/IR Condition 3 stop and Condition 1
   outside 400–1400 nm unverified; the oracle's skin dual limit for huge open-field sources (diffuse-reflection).

## Ship flow (worked twenty-six times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **IEC 60825-1 sources:** Ed. 3 isn't public. Schulmeister's white papers (Seibersdorf, `.../publ/whitepaper_iec-60825-1.pdf`,
  `.../whitepaper_a11_to_en_60825-1.pdf`, need a browser user agent for curl) and the Ed. 1.2 text (Tables 1–4, 10; its
  rotated pages read with `pdftotext -f N -l N -raw`). Don't link the Ed. 1.2 copy (licensed file).
- **ICNIRP 2013 text:** `curl -sL -o x.pdf https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`,
  then `pdftotext -layout`. Extended sources and eqn 5 near line 340, additivity near line 570, dual limit near 1668.
- **Registry scripts:** an entry sliced up to `\n  },` has no newline after its last property; match `(?=\n|$)`.
  `git checkout -- src/registry/...` also reverts a merge codemod run: re-run the (idempotent) codemod.
- **Oracle from the shell:** `npx tsx -e '…'` or a scratch `.ts` with static absolute imports
  (`C:/dev/photonics-calculators/src/...`); `npx tsx probe.ts`.
- **Mutation check:** scratchpad `mutate.cjs` pattern: string-replace one mutation, run the one test file, restore.
- **Scratch scripts that import packages** (ts-morph) need `NODE_PATH=C:/dev/photonics-calculators/node_modules`.
- **Registry edits by script:** ts-morph `addPropertyAssignment` mangles indentation; edit text, then review the diff.
- **Splitting one file across commits** (no `git add -p`): save the full file, check out HEAD's, re-apply part 1,
  commit, copy the full file back, commit.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`. Check DOIs
  on Crossref (`api.crossref.org/works?query.bibliographic=…`; ≥ 1 s apart) and that `https://doi.org/<doi>` gives 302.
- **Chrome extension** may be disconnected: use `scripts/ui-check.mjs <base> load /a /b` and headless Chrome
  `--headless=new --virtual-time-budget=8000 --screenshot=C:/…/x.png --window-size=1280,2900 <url>`.
- **ui-check paths in Git Bash:** prefix `MSYS_NO_PATHCONV=1`.
- **Dev server:** `npx next dev -p 3200`; stop it before `npm run build` (both use `.next`). Kill in Git Bash with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`; a stopped `next start` leaves its `node` child on the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN; reads `null` as 0; log axes work.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
