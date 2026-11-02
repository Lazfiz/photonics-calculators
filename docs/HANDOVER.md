# Handover — 2026-11-02 (session 183 → session 184)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 183 did 6c free-space comms on `phase-6/6c-fso` (PR #221): diffracting beam wander, FSO AO fitting from the DM pitch,
LEO point-ahead with the station's rotation, QKD exact in Y₀, `DB_PER_NEPER` → `DB_PER_E_FOLD`. Next: 6d-a materials values.

## State
- `turbulence.ts`: `beamWanderDiffractionFactor(L/z_R)` = 3∫ξ²(1 + ((1 − ξ)L/z_R)²)^(−1/6)dξ (asinh substitution, 2000 Simpson panels,
  < 1e-8 to 1e9) and `beamWanderVarianceDiffracting(cn2, L, W₀, λ)`; `actuatorPitch(D, N)` = D√(π/4N). FSO AO uses
  `dmFittingVariance(actuatorPitch(D, N), r₀)`, N ≥ 10. `fittingErrorVariance` (Noll fit) stays for tests and the cap test.
- `point-ahead.ts`: `zenithPassVelocity(altitude, inclinationDeg)` (equatorial station); presets prograde 47.68, polar 50.88 µrad.
- `qkd.ts`: Q_μ = 1 − (1 − Y₀)e^(−ημ), E_μQ_μ = ½Y₀e^(−ημ) + e_d(1 − e^(−ημ)), e₁Y₁ = ½Y₀(1 − η) + e_dη; page Y₀ ≤ 1.
- Codemod `scripts/codemods/2026-11-02-db-per-e-fold.ts` (language-service rename, 14 files). Gate: 1203 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   free-space-comms/beam-wander=8.73e-5 free-space-comms/adaptive-optics=6.05e-3 free-space-comms/point-ahead=46.7`
   (beam-wander variance m²; AO σ²_fit in the Strehl subtext; point-ahead default 7 km/s → 46.7 µrad, unchanged).
2. 6d-a materials (see ROADMAP): adversarial `physics-reviewer` pass against primary literature first.
3. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 183:** the ROADMAP's own beam-wander factor (0.90) put the ξ² lever arm at the receiver: the large eddies near the
  transmitter matter (ξ = 1 − z/L), F = 0.979. Hudgin's zonal law is ≈ 10 % *below* exact Noll Δ_N for every N ≤ 5000, so
  max(zonal, Δ_N) just jumps at 5001; use one law. A Bash call that appends with a heredoc and then runs a gated test is
  swallowed whole by devctl (append lost): write with node/Write, test in a separate call. The point-ahead chapter is
  arXiv:2012.13166 (§8.1.2: eq. 8.4, 51 and 18 µrad). Near the QKD cutoff the key is a 1e-4 difference of two terms, so
  O(Y₀η) terms move it 3 %: recheck such goldens with a from-scratch scan.
- **Session 182:** a reviewer's "from memory" fix (BK h ∝ L·l_a, 10× lower P_th) was wrong for an SRO: derive the overlap for the
  actual geometry and check it by brute 2-D quadrature before trusting a scaling. Optica abstract pages via WebFetch gave
  Körner 2012 Table 4; reviewers must not try to get past captchas (classifier denies it). Reviewer goldens computed at an old
  default (0.567 nJ) failed at the new one: recompute goldens after changing defaults. Two reviewers in parallel took ≈ 11 and 24 min.
- **Session 181:** ICNIRP 2013 PDF text: `curl -A "Mozilla/5.0 …"` then `pdftotext -layout`; Table 5 notes at ≈ line 910, Table 7
  at ≈ 990, Table 8 at ≈ 1200. Note d's IR sentence is unconditional, the visible one conditional. Old test comments' hand values can be mis-rounded (1.264 vs 1.2622 mm): recompute.
- **Session 178:** Optica's abstract page (`opg.optica.org/josa/abstract.cfm?uri=josa-46-11-956`) gives the tables' text through
  WebFetch even for paywalled 1950s JOSA papers: coefficients, measured and computed indices. refractiveindex.info `?shelf=…`
  URLs can resolve to the wrong page (it returned Johnson & Christy). `refractiveIndex()` doesn't range-check; `inRange` does.
- **Session 177:** the 5w-15 reviewers found no wrong formulas in 24 pages; nearly all findings were chart ranges fixed for the
  default while inputs span decades. Check new pages for that. A band average expanded about σ₀ must take its phase at
  1/σ₀, not at the wavelength centre. devctl's CPU gate silently skipped one implementer edit (it re-ran it): keep the
  `git status --short` check in briefs.
- **Session 175:** an edit script doing `s.slice(0, start) + newText` drops everything after the block (3 functions
  vanished): replace a delimited block or append the tail. `crystal-properties.ts` imports `window-materials.ts`, so
  shared code goes in the latter. `useURLState` can't hold NaN: use an out-of-range sentinel. NIST-JANAF tables fetch as
  `https://janaf.nist.gov/tables/<id>.txt` (Al-096 sapphire, Ca-014 CaF₂). Nested golden-section `bestFocus` ≈ 50 ms
  tuned, ≈ 3 ms untuned; uncached, a 50-point chart re-ran them on every keystroke.
- **Session 174:** the C: drive filled to 0 bytes mid-session (ENOSPC on Edit; Edit's temp-then-rename left the
  originals whole). Check `df -h /c` when writes fail. A probe `.mts` importing repo files needs `file:///C:/…` URLs
  (or a `.ts` with an absolute `C:/…` path; top-level await needs `.mts`). devctl queues tests behind implementers'
  eslint for 10+ min: run them in the background. node:test's spec reporter prints `ℹ tests N`, not `# pass`.
  ICNIRP 2013 has two sub-ns rules: p. 282 holds the 1 ns irradiance, p. 287 adds "< 10 % of the 1 ns limit" below
  400 / above 1400 nm; both are now in `pulseLimits`. The IEC 2001 text and Schulmeister white papers were checked in
  sessions 30–33 (archive line ≈ 446); don't re-flag their values as unverified.
- **Session 173:** devctl intercepts a *whole* Bash command when any part is gated (`npx tsx --test`, eslint, tsc): a
  heredoc + `node edit.mjs` + test in one call never ran, and the queued test ran against old files. Write files and run
  gates in separate calls. An implementer's QKD edits again never reached disk (1 of 3): `git status --short` after each
  report. My own "hand" golden value was wrong (1.9932 vs 1.9920 dB): get goldens from a probe, then check by hand. ITU-R
  PDFs: `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf` (pattern), `pdftotext -raw`.
  Hard vs Gaussian aperture averaging asymptote 1.130 checks with GR 6.574.2 and a Gaussian filter exp(−κ²D²/16).
- **Session 171:** a sed replacement with `&` in the new text pastes the match: do prose replacements with a node script
  using `replace(a, () => b)`. Goodman 2nd ed. (4-24) is the Fraunhofer condition, (4-25) the integral; Siegman ch. 26 is
  Q-switching. Physics reviewers can't write scratchpad probes inside a worktree; read-only reviewers need no worktree. A
  reviewer's fix formula can be wrong while the finding is right. New warnings can fire at defaults: check each.
- **Sessions 163–173 (5w, 141 pages, 13 bugs):** useful reviewer catches are defaults that hide the page's effect,
  stated-but-false conditions, results that ignore an input, fixed chart ranges that miss the input, and formulas past
  their limit. Brief: verdict + BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", probe prefixes, don't edit.
  Implementers: allowed files, no registry, targeted tests + eslint, no tsc; the main session runs `npm run check` once.
  per category: `shuf | awk -F/ '!seen[$1]++'`.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in
  `scripts/ui-check.mjs`). In the Bash tool a bare `python -` or `cat > file` with no input hangs until timeout.
- **Sessions 137–138:** ITU-T PDFs: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`. Optica
  full text reads in Chrome via `get_page_text`. **Port 3000 can be another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome. Registry/JSX text can't hold `{…}`. `npm run dev`
  touches `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. ChartPanel sends
  scatter and bar traces to SVG `SimpleChart`. `null` and non-finite values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`.
  NaN/∞ show as "—" with a reason. eslint: 6 old warnings; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked
  files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
