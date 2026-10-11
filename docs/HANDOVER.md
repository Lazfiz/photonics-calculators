# Handover — 2026-10-11 (session 37 → session 38)

**Start here:** read this file, then the polarization items in `docs/ROADMAP.md` Phase 4 ("Polarization audit, part 0"
and parts 1–4). Laser safety is finished: PR #33 is merged and was checked on production (ui-check passed on 8 pages,
and every spot value matched). Session 37 audited the 33 polarization pages on branch `phase-4/polarization-audit`
(PR: see `gh pr list`). **Next: polarization part 1 (Jones, Mueller, Stokes).**

## State
- Audit: 1 OK (`polarizer-extinction`), 11 questionable, 21 bugs. The 21 bug pages carry a registry `knownIssue`
  (red "Known error, under repair" box). Nothing is tiered yet: 107 of 461 pages have a tier.
- The ROADMAP parts list each page's findings and golden values. The four full reviewer reports aren't kept; each
  part re-runs `physics-audit` on its pages only if it needs more detail than the ROADMAP gives.
- No `src/physics/polarization/` yet. `src/physics/complex.ts` exists; `jones-calculus` and `jones-chain` carry local
  copies of the complex helpers, so delete those.

## Decisions
- **Sign convention: Goldstein/Collett on every page.** e^{i(ωt−kz)}; RCP = [1, i]/√2, clockwise seen by the receiver;
  S3 = 2 Im(Ex* Ey), positive for RCP; fast axis at 0°: diag(1, e^{−iΓ}); +θ is counter-clockwise looking into the
  beam, for polarizers, retarders and rotators. Mueller rotator(+θ) = [[c, −s], [s, c]] in the (S1, S2) block, c = cos 2θ.
  The Mueller QWP block [[0, 1], [−1, 0]] in (S2, S3) already matches. Put one `CONVENTION` note in the module header.
- Flag only the bug pages: the notice tells readers "Don't use this page's numbers", which is too strong for the
  questionable ones.
- The reviewers had no web access. Verify each citation (Goldstein 3rd ed., Chipman/Lam/Young 2018, Born & Wolf, Hecht,
  Collett's Field Guide, Jones 1941 doi:10.1364/JOSA.31.000488) before it goes in `references`.

## Next actions
1. PR for `phase-4/polarization-audit` (knownIssue × 21, ROADMAP, this file): CI, then ask the user to merge.
2. Part 1 on a new branch `phase-4/polarization-jones`. Write `physics/polarization/{jones,mueller,stokes}.ts` with golden
   tests (the ROADMAP values plus Malus and HWP 22.5° → S2 = 1). Then move the nine pages onto them, drop each
   `knownIssue`, and set tier, `modelNote` and references. Hand the page wiring to `implementer` once the modules pass.
3. Parts 2–4 follow in later sessions, one part per session.

## Ship flow (worked twenty-eight times)
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
