# Handover — 2026-10-11 (session 36 → session 37)

**Start here:** read this file, then `docs/ROADMAP.md`. Laser safety is done, loose ends included. PR #32 (part 5b) is
merged and was checked on production in session 35 (the `scan-failure` redirect is live). Session 36 cleared the laser-safety
loose ends on branch `phase-4/laser-safety-loose-ends` (PR: see `gh pr list`). Next: the user picks the next Phase 4
track (another category audit, Phase 3 charts or top-50 golden tests).

## State
- Oracle (`eye-exposure-limits.ts`): Table 5 note d over 400–1400 nm. The anterior-eye limit is the skin limit below
  700 nm and twice it above (was 1150–1400 nm only). It binds only at 1150–1400 nm or for a large open-field source.
- `mpe` and `optical-density` now use the tested modules (180 nm – 1 mm, 1 ns – 30 ks); `od-requirements` uses
  `apertureIrradiance` with an aperture input. The "bounded CW suite" is gone: `lib/laser-safety-mpe.ts`,
  `lib/laser-safety-cw-suite.ts`, `tests/laser-safety-cw.test.ts`, the cw-bounds/references/scope boxes.
- The quarantine banner component is deleted. The shared disclaimer, the category description and the
  blue-light/UV descriptions are rewritten.

## Decisions
- Visible lines' anterior-eye shares add to the cornea's in `multiple-wavelength` (same tissue, conservative; ICNIRP
  p. 279). Default cornea 0.275 → 0.279.
- `mpe`: the MPE is the lowest H among the limits in force at t; "max power, narrow beam" is the lowest
  `limitMaxPower(limit, 0, t)`. `optical-density` tier exact (as `nohd`); `od-requirements` exact (Gaussian average).
- IEC 60825-1 Ed. 4 isn't published: the July 2026 BSI item is a draft for comment (DC 26/30510571); IEC's series
  package lists 60825-1:2014. Re-check the classes when it appears.

## Next actions
1. PR for `phase-4/laser-safety-loose-ends`: CI, ask the user to merge. After the merge, run `ui-check` on production
   and spot-check these values. mpe 6.36 J/m², 0.980 mW, "Retina, thermal". optical-density OD 3.71, OD 4 rounded,
   2.71 without the factor. od-requirements 1.30 W/cm², OD 2.72. diffuse-reflection hazard distance 2.85 mm.
   multiple-wavelength cornea 0.279. The blue-light-hazard, uv-exposure and uv-hazard pages show no "Quarantined" box.
2. Optional: a scanned-lidar mode on `lidar-safety`.

## Ship flow (worked twenty-seven times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.
- **Spot values on production:** `curl -s <url> | sed 's/<[^>]*>/ /g'` and grep: the prerendered HTML has the defaults.

## Non-obvious facts
- **Deleted pages or modules break `tsc`** through stale `.next/types/validator.ts`: `rm -rf .next/types`, then `npm run check`.
- **Shell:** a heredoc with apostrophes in its body fails in this Bash tool ("unexpected EOF"): write scripts with the
  Write tool, or a quoted heredoc (`<<'EOF'`) into a scratchpad `.mjs`. Backticks inside a double-quoted `node -e "…"` run as commands.
- **Seibersdorf PDFs** need a browser user agent and the `www.seibersdorf-laboratories.at/fileadmin/user_upload/docs/
  le/las/publ/<file>.pdf` path (the `laser-led-lamp-safety.` host returns HTML).
- **ICNIRP 2013 text:** `curl -sL -o x.pdf https://www.icnirp.org/cms/upload/publications/ICNIRPLaser180gdl_2013.pdf`;
  Table 5 and its notes: `pdftotext -f 14 -l 15 -raw` (symbols: `e` ≤, `G` <, `9` >, `j` minus, `ms` in T_i is µs);
  additivity p. 279 (`-f 9 -l 11`).
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
