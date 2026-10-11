# Handover — 2026-10-10 (session 34 → session 35)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4: laser-safety part 5a done; 5b open).
PR #30 (part 4) was merged before session 34 (`d1bb0963`). Session 34 did part 5a on branch `phase-4/laser-safety-pulses`.

## State
- New tested module `src/physics/laser-safety/pulse-train.ts`: ICNIRP 2013's three repetitive-pulse rules on the
  eye-limit oracle, Table 5's sub-ns rows (100 fs – 1 ns), C_P cases a/b/c, T_i grouping, `pulseTrainSafeDiameter`
  for NOHDs. 7 tests, 23/23 mutations caught (scratchpad `mutate-pt.cjs` pattern).
- `multiple-pulse` + `prf-correction` merged into `pulsed-mpe` (462 pages). Fixed and tiered: `pulsed-mpe`,
  `eye-safe-wavelength` (exact), `ultrafast-laser-safety`, `lidar-safety` (textbook): 105 of 462 tiered.
- Shared UI: `components/pulse-train-table.tsx`, `components/pulse-train-chart.tsx`. Landing page group
  "Pulsed lasers (ICNIRP 2013)". Only `scanning-mpe` and `interlock-design` still carry `knownIssue` in laser-safety.
- Site-wide (own commit): `SimpleChart` log axes no longer floor at 1e-10; values ≤ 0 and non-finite ones are skipped.

## Decisions
- Rule 1 is H(τ) at τ alone, the limit for one pulse (not `limitMaxPower`·τ, the CW reading that also checks shorter
  times; they differ only by joint rounding and on an extended source's t^1.25 piece).
- C_P counts n within min(T, T₂) (ICNIRP's definition). Case c (pulses ≤ T_i, T > 0.25 s) is min(1, 5 n^−0.25) with no
  floor: IEC 2014 floors it at 0.4, ICNIRP states none (stricter). Visible: ICNIRP applies case c only to intentional
  viewing, i.e. when the user picks T > 0.25 s.
- Pulses within T_i: one effective pulse of duration T_i and energy kQ for C_P (IEC 4.3 f; Schulmeister 2017 "pulse
  groups"). For a regular point-source train rule 2 is always lower then; it binds for large sources (α ≈ 100 mrad).
- Below 100 fs, and on the cornea below 1 ns, the irradiance is held at the shortest tabulated value (ICNIRP's text).
- Rule 3 with pulses inside T_i: the lower of ICNIRP's single-pulse count and IEC's T_i groups (below 10 ps the T_i
  limit has C_A and the fs one doesn't, so grouping alone was less strict and the curve jumped up).
- Part 5 split: 5a pulse trains (done), 5b scanning and interlocks.

## Next actions
1. PR for `phase-4/laser-safety-pulses`: CI, then ask the user to merge; after merge, `ui-check` on production and spot
   values at the defaults: pulsed-mpe 385 nJ max per pulse (retina, rule 3, C_P = 0.5), 2.60×, OD 0.415, max average
   0.385 mW; ultrafast OD 3.21 (single pulse alone: within), NOHD 396 m, average 1 W; lidar NOHD 146.5 m, 172× at 10 m,
   window OD 3.30 (1550 preset: NOHD 22.8 m); eye-safe 1550 nm row 1.56 mJ, "Cornea (IR) (average)", 64.3×.
   Redirects: `/laser-safety/multiple-pulse` and `/laser-safety/prf-correction` → `/laser-safety/pulsed-mpe`.
2. Laser-safety part 5b (ROADMAP): `scanning-mpe`, `scan-failure`, `interlock-design` on `pulse-train.ts` (a scanned
   beam = pulse train: pass duration (d + 7 mm)/v, rate = scan rate); then regroup the landing page.
3. Open (ROADMAP part 4 notes): IEC 60825-1 Ed. 4 (2026) not checked; Ed. 3's UV/IR Condition 3 stop and Condition 1
   outside 400–1400 nm unverified; the oracle's skin dual limit for huge open-field sources (diffuse-reflection).

## Ship flow (worked twenty-six times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Deleted pages break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **ICNIRP pulse rules:** `pdftotext -f 18 -l 18 icnirp.pdf` (reading order) for p. 287; Table 5's sub-ns rows need
  `pdftotext -f 14 -l 14 -raw`. Symbols: `e` ≤, `G` <, `9` >, `Q` ≥, `j` minus, `ms` in T_i is µs.
- **Shell edits:** backticks inside a double-quoted `node -e "…"` run as commands; write the script to a file with
  a quoted heredoc (`<<'EOF'`).
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
- **ui-check** failed with `webSocketDebuggerUrl` of undefined: this Chrome starts `--headless=new` without a page
  target, so the script now opens one (`/json/new`). Never `taskkill /IM chrome.exe` (kills the user's browser).
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
