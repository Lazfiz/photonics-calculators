# Handover — 2026-11-03 (session 185 → session 186)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 185 did 6d-b materials values on `phase-6/6d-b-materials` (PR #223): x-ray Compton term, GaAs and diamond heat-capacity
presets, SGTE melting points for evaporation. Next: 6e fiber + detectors (see ROADMAP).

## State
- `x-ray-optics.ts`: `incoherentCrossSection(id, E)` (m², log-log) from the new `xcom-incoherent.ts` (NIST XCOM σ_inc, barn/atom,
  34 energies 1–30 keV); `xrayIndex` returns `betaCompton` and β = photo + Compton. Within 0.2 % of CXRO: Be 10 keV β 1.02840e-9,
  Be 30 keV L 33354.8 µm, C (3.515) 20 keV L 7794.74 µm, Kapton 30 keV β 1.15305e-10, Si 30 keV β 9.89384e-10. Rayleigh out, as in CXRO.
- `heat-capacity.ts`: + `gaas` (46.855/144.645e-3, θ 344 K, 5317) and `diamond` (6.1197/12.011e-3, θ 1860 K caloric, 3515); Ge 23.347
  (SGTE GHSERGE) and LiF 41.815 (JANAF F-021) per mol. Tests evaluate the Calphad c_p = −T G″ in the test file.
- `thermal-evaporation.ts`: T_m from SGTE breakpoints (Al 933.47, Ag 1234.93, Au 1337.33, Cu 1357.77, Ni 1728, Ti 1941, Pd 1828,
  In 429.75 K); the solid/liquid jump at T_m is ≤ 4.1 % (Al). Gate: 1209 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   materials/x-ray-optics materials/heat-capacity thin-film/thermal-evaporation` (load checks: prerendered HTML shows defaults; check
   Be at 30 keV, L ≈ 33.4 mm, and the diamond preset at 600 K, 1341 J/(kg·K), by hand).
2. Bai 2020 (APL Photonics 5, 031301): abstract says measured 79 cm/GW, 12 MHz; code keeps 60 ± 9. Ask the user for the PDF.
3. 6e fiber + detectors: adversarial `physics-reviewer` pass against primary literature first.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 185:** NIST XCOM answers a plain curl POST: `curl -s -X POST https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
  --data-urlencode ZNum=4 --data-urlencode OutOpt=CSBA --data-urlencode NumAdd=1 --data-urlencode $'Energies=0.001
0.01'
  --data-urlencode WindowXmin=0.001 --data-urlencode WindowXmax=100000 --data-urlencode ResizeFlag=on` (MeV, one per line; columns
  E, coh, incoh, photo, pair-nuc, pair-el, total with/without coh). CXRO: POST `/cgi-bin/atten.pl` or `getdb.pl` (`Material=Enter+Formula&
  Formula=Be&Density=1.848&Scan=Energy&Min=..&Max=..&Npts=1&Output=Text+File`), then GET the `/tmp/xray*.dat` it links. Calphad TDB
  files (SGTE unary 5.0, Chatillon GaAs) give c_p = −T ∂²G/∂T² exactly; GHSER breakpoints are the melting points. Pässler 2021
  (Recent Prog. Mater., open access) has diamond's caloric θ_D(T). A Debye preset's θ_D must be the caloric one at the working T, not
  the elastic/low-T one. To split one file's hunks across commits, rerun the edit script on a `git show HEAD:` copy, `git hash-object -w`.
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (arXiv:1807.00240 supp. eq. 3), so
  their p² is 4× the standard one. APS and Optica abstract pages via WebFetch give tables' text. OpenAlex `abstract_inverted_index`
  rebuilds paywalled abstracts. Inline `node -e` with backticks inside bash double quotes runs them: write scripts with a quoted heredoc.
- **Session 183:** the beam-wander ξ² lever arm sits at the transmitter (ξ = 1 − z/L), F = 0.979. Hudgin's zonal law is ≈ 10 %
  *below* exact Noll Δ_N for every N ≤ 5000: use one law. A Bash call that appends with a heredoc and then runs a gated test is
  swallowed whole by devctl: write files and run gates in separate calls. Point-ahead chapter: arXiv:2012.13166 §8.1.2. Near the
  QKD cutoff the key is a 1e-4 difference of two terms: recheck such goldens with a from-scratch scan.
- **Session 182:** a reviewer's "from memory" fix can be wrong: derive the overlap for the actual geometry and check it by brute
  quadrature. Reviewers must not try to get past captchas. Recompute reviewer goldens after changing defaults. Two reviewers in
  parallel took ≈ 11 and 24 min.
- **Session 181:** ICNIRP 2013 PDF text: `curl -A "Mozilla/5.0 …"` then `pdftotext -layout`; Table 5 notes at ≈ line 910, Table 7
  at ≈ 990, Table 8 at ≈ 1200. Old test comments' hand values can be mis-rounded: recompute.
- **Session 178:** Optica's abstract page (`opg.optica.org/<journal>/abstract.cfm?uri=…`) gives tables' text through WebFetch even
  for paywalled papers. refractiveindex.info `?shelf=…` URLs can resolve to the wrong page. `refractiveIndex()` doesn't range-check.
- **Session 177:** reviewers' main catches are chart ranges fixed for the default while inputs span decades. A band average expanded
  about σ₀ must take its phase at 1/σ₀. devctl's CPU gate can silently skip an implementer edit: keep `git status --short` in briefs.
- **Session 175:** an edit script doing `s.slice(0, start) + newText` drops the tail: replace a delimited block. `crystal-properties.ts`
  imports `window-materials.ts`, so shared code goes in the latter. `useURLState` can't hold NaN: use an out-of-range sentinel.
  NIST-JANAF tables: `https://janaf.nist.gov/tables/<id>.txt` (Al-096 sapphire, Ca-014 CaF₂).
- **Session 174:** the C: drive once filled to 0 bytes (ENOSPC on Edit): `df -h /c` when writes fail. A probe `.mts` importing repo
  files needs `file:///C:/…` URLs (or a `.ts` with an absolute `C:/…` path). devctl queues tests behind implementers' eslint for
  10+ min: run them in the background. ICNIRP 2013 sub-ns rules (p. 282, p. 287) are both in `pulseLimits`. The IEC 2001 text and
  Schulmeister white papers were checked in sessions 30–33 (archive ≈ line 446).
- **Session 173:** an implementer's edits may never reach disk: `git status --short` after each report. Get goldens from a probe,
  then check by hand. ITU-R PDFs: `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf`, `pdftotext -raw`.
- **Session 171:** a sed replacement with `&` pastes the match: use a node script with `replace(a, () => b)`. Goodman 2nd ed. (4-24)
  is the Fraunhofer condition; Siegman ch. 26 is Q-switching. Read-only reviewers need no worktree. New warnings can fire at defaults.
- **Sessions 163–173 (5w):** brief reviewers for verdict + BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", don't edit.
  Implementers: allowed files, no registry, targeted tests + eslint, no tsc; the main session runs `npm run check` once.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in `scripts/ui-check.mjs`).
  In the Bash tool a bare `python -` or `cat > file` with no input hangs until timeout.
- **Sessions 137–138:** ITU-T PDFs: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`. **Port 3000 can be
  another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome. Registry/JSX text can't hold `{…}`. `npm run dev` touches
  `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. ChartPanel sends scatter and
  bar traces to SVG `SimpleChart`. `null` and non-finite values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`. NaN/∞ show
  as "—" with a reason. JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked files.
  CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
