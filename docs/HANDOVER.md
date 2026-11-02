# Handover — 2026-11-02 (session 184 → session 185)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 184 did 6d-a materials values on `phase-6/6d-a-materials` (PR #222): diamond Brillouin p, Raman 532/1064 nm spread,
DeSalvo 2PA scaling rule. Next: 6d-b materials values (heat capacity GaAs/diamond, x-ray Compton term, evaporation T_m).

## State
- `brillouin.ts`: diamond `p12` = (p₁₁ + 2p₁₂ − 2p₄₄)/3 = (−0.1640 + 2·0.172)/3 = 0.0600 (Grimsditch & Ramdas 1975 abstract:
  p₄₄ −0.172, p₁₁ − p₁₂ −0.292, p₁₁ + 2p₁₂ −0.1640); g_B 532 nm, 11.9 MHz = 17.42 cm/GW (Bai's p² 0.0153 gives 74.03).
- `two-photon.ts`: `effectiveScalingValid(m, λ)` (DeSalvo rows: 2ħω ≥ 1.1 E′_g at λ_ref and λ); `mediumBeta` gives the measured β
  within 1e-3 of λ_ref, NaN in the 2PA band otherwise. BBO 300 nm 0.72749, limit 331.5 nm; the page draws the other five as points.
- `raman-gain.ts`: values unchanged; header and page note the 2× 532/1064 spread (±50 %). Gate: 1203 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   materials/brillouin-scattering materials/two-photon-absorption materials/raman-scattering` (load checks only: the defaults,
   silica and GaAs, are unchanged and prerendered HTML shows defaults; check diamond and BBO 300 nm by hand).
2. Bai 2020 (APL Photonics 5, 031301, CC BY): the abstract says "measured to be 79 cm GW⁻¹ with a linewidth of 12 MHz"; the code
   keeps 60 ± 9 from the threshold (session 148's reading of the body). pubs.aip.org shows a Cloudflare check to curl and
   Chrome: ask the user for the PDF, then settle the measured value.
3. 6d-b materials (see ROADMAP): adversarial `physics-reviewer` pass against primary literature first.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (arXiv:1807.00240 supplement eq. 3,
  readable on arXiv), so their p² is 4× the standard one. APS abstract pages via WebFetch give Grimsditch & Ramdas's constants.
  Optica abstract pages give Basiev 1999 Table 1 (relative peak cross-sections, diamond = 100; Ba(NO₃)₂ 63). Raman gain checks:
  g ∝ ω_s, and Savitski's diamond falls faster (532 → 1064: 0.40 vs 0.46). OpenAlex `abstract_inverted_index` rebuilds abstracts
  of paywalled papers. Inline `node -e` with backticks inside a bash double-quoted string runs them as command substitution:
  write edit scripts to the scratchpad with a quoted heredoc. To split one file's hunks across commits: `git hash-object -w` a
  partial version and `git update-index --cacheinfo`.
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
