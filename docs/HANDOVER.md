# Handover — 2026-10-11 (session 35 → session 36)

**Start here:** read this file, then `docs/ROADMAP.md`. Laser safety is done (parts 1–5b): all 40 pages tiered, no
`knownIssue` left anywhere. Next: the next unchecked ROADMAP item (the audit of other categories, or Phase 3/5 items).
PR #31 (part 5a) was merged and checked on production in session 35. Session 35 did part 5b on branch
`phase-4/laser-safety-scanning` (PR: see `gh pr list`).

## State
- New `src/physics/laser-safety/scanned-beam.ts` (11 tests): each pass of a CW beam over an aperture is a pulse of
  half-power duration W/v carrying P·L/v (L = ∫η dx); per-limit apertures; rules via `trainLimit` in watts.
- `pulse-train.ts`: per-limit rules extracted as `trainLimit(lambda, limit, train, G, alpha)` (behaviour unchanged).
- New `src/physics/laser-safety/interlock.ts` (3 tests): eye in the beam for max(0, T − S/K) vs `exposureDuration`.
- Pages: `scanning-mpe` (textbook, absorbs `scan-failure`: 461 pages), `interlock-design` (textbook). Landing page
  regrouped into six groups. `PulseTrainTable` has `value` + `unit="pass"`; new `components/exposure-time-chart.tsx`
  (also used by `exposure-duration`).

## Decisions
- Pulse per pass (ICNIRP p. 287; Schulmeister 2025 white paper on scanned emission): duration = FWHM of the power
  behind the aperture (IEC 60825-1 3.69), energy = the whole pass. Not (d + 7 mm)/v as the ROADMAP planned.
- Stationary retinal image (eye focused on the scan pivot): IEC's default evaluation and the most restrictive one.
- Eye on the centre of the scan line; triangle = 2 passes per period, sawtooth/polygon = 1. Turning points, sinusoidal,
  raster and pulsed scanned lasers are stated as not modelled.
- Interlock: ISO 13855's S = K·T without intrusion allowance; K is an input (2.0 m/s default, 1.6 m/s body).
- `interlock-design` t_max at 1064 nm is 157 ns (Table 5: 20 C_C mJ/m²); the old ROADMAP's 78.5 ns was wrong.

## Next actions
1. PR for `phase-4/laser-safety-scanning`: CI, ask the user to merge; after merge `ui-check` on production and spot
   values: scanning-mpe 7.68 mW max (rule 1), 0.651×, 66.2 µs pass, 7.84×, still beam 0.980 mW, stopped 368 µs;
   interlock-design 157 ns, 250 ms, "Fast enough", 10.0 cm. Redirect `/laser-safety/scan-failure` → `scanning-mpe`.
2. Small follow-up: the registry descriptions of `blue-light-hazard` and `uv-exposure` are stale ("Simplified
   educational estimate"); optional scanned-lidar mode on `lidar-safety`.
3. Open (ROADMAP part 4 notes): IEC 60825-1 Ed. 4 (2026) not checked; the oracle's skin dual limit for huge sources.

## Ship flow (worked twenty-seven times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.
- **Spot values on production:** `curl -s <url> | sed 's/<[^>]*>/ /g'` and grep: the prerendered HTML has the defaults.

## Non-obvious facts
- **Deleted pages break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **Shell:** a heredoc with apostrophes in its body fails in this Bash tool ("unexpected EOF"): write scripts with the
  Write tool. Backticks inside a double-quoted `node -e "…"` run as commands.
- **Seibersdorf PDFs** need a browser user agent and the `www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/
  le/las/publ/<file>.pdf` path (the `laser-led-lamp-safety.` host returns HTML).
- **ICNIRP 2013 text:** `curl -sL -o x.pdf https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`;
  Table 5 rows: `pdftotext -f 14 -l 14 -raw` (symbols: `e` ≤, `G` <, `9` >, `j` minus, `ms` in T_i is µs).
- **IEC 60825-1:** Ed. 3 isn't public; use Schulmeister's white papers. Don't link the Ed. 1.2 copy (licensed file).
- **ISO 13855** isn't public: K = 2000 mm/s (S ≤ 500 mm), else 1600 mm/s; the 2024 edition adds D_DS and Z terms.
- **Registry scripts:** an entry sliced up to `\n  },` has no newline after its last property; match `(?=\n|$)`.
- **Oracle from the shell:** a scratch `.ts` with absolute imports (`C:/dev/photonics-calculators/src/...`); `npx tsx`.
- **Mutation check:** scratchpad script: string-replace one mutation, run the one test file, restore.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`.
- **ui-check:** `scripts/ui-check.mjs <base> load /a /b`; in Git Bash prefix `MSYS_NO_PATHCONV=1`. Never
  `taskkill /IM chrome.exe`. Headless screenshot: `--headless=new --virtual-time-budget=8000 --screenshot=… <url>`.
- **Dev/prod server:** stop it before `npm run build` (both use `.next`); kill with
  `MSYS_NO_PATHCONV=1 taskkill /PID <pid> /F /T`; a stopped `next start` leaves its `node` child on the port.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`; untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp in the page. It also takes string defaults.
- **`SimpleChart`**: no `shapes` (use a `mode: "markers"` trace); skips NaN and values ≤ 0 on log axes.
