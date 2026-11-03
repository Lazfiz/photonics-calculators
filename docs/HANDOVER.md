# Handover — 2026-11-03 (session 186 → session 187)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 186 did 6e-a fiber + detectors on `phase-6/6e-fiber-detectors` (PR #224): PCF MFD from Nielsen 2003, detector D* from J_d
and R₀A, C30902EH bulk I_d, streak note. Next: 6e-b `photodiode-speed` diffusion tail (design and reviewer numbers in the box).

## State
- `photonic-crystal.ts`: `nielsenSpotSize(vPcf)` = w/Λ = 0.7078 V^−0.2 + 0.2997 V^−1.5 + 0.0037 V^−6 (Nielsen et al. OL 28, 2309,
  Eq. 2, g = 8); `pcfMode` returns `vPcf` = √3·W (Mortensen's V on Λ and n_eff); MFD NaN below `NIELSEN_V_RANGE[0]` = 0.5 (Fig. 2 data
  0.5–5; the card says "extrapolated" above 5). Defaults 5.109 µm (Marcuse 5.076); LMA-5 4.03 µm (spec 4.1); HF1 A_eff 194 µm² (FEM 200).
  `MARCUSE_MIN_V` is gone from this module (`specialty-fiber.ts` keeps its own for step-index fibres).
- `noise.ts`: `detectorDetectivity({responsivity, darkCurrentDensity (A/cm²), r0a (Ω·cm²), temperature, gain, excessNoiseFactor})`
  = ℛM/√(2qJ_dM²F + 4kT/R₀A). Detectivity page: new `r0a` input (default 1e7 Ω·cm², illustrative); "Detector D*" 2.616e12 and
  "System D* (incl. load R_L)" 2.668e9 (the old number; R₀A = R_L·A reproduces it exactly). Both curves on both charts; the T chart
  scales R₀A by 1/ratio.
- `linear-mode-avalanche` default bulk I_d 2.2e-13 A (data sheet i_N 0.1 pA/√Hz, I_D 7 nA at M 150 → I_DB 0.2175 pA); M_opt 215.45.
- Streak note: 2.63·√Δε/E ps verified in Shakya & Chang (E in kV/mm); added the 3.37 ps bound and Chang et al. APL 69, 133 (1996).
- Gate: 1212 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   fiber-optics/photonic-crystal=5.11 detectors/detectivity=2.616e12 detectors/linear-mode-avalanche=215.5` (prerendered HTML
   shows defaults; check the strings the page prints, e.g. "5.11 µm", "2.616e+12").
2. 6e-b `photodiode-speed`: find a source for the diffusion frequency response before coding (reviewer's L_ω = L/√(1 + iωτ) is
   the reviewer's own derivation). Candidates in the box.
3. Bai 2020 (APL Photonics 5, 031301): abstract says measured 79 cm/GW, 12 MHz; code keeps 60 ± 9. Ask the user for the PDF.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 186:** ar5iv serves arXiv figures as PNG: `https://ar5iv.labs.arxiv.org/html/<id>/assets/fig2.png`; Read them to get
  axis ranges (no pdftoppm/mutool on this machine). A reviewer's "from memory" number in a finding (PCF 6.69 µm) was wrong: probe
  before planning a fix. devctl can queue `npm run check` ≈ 12 min behind another project's job; it then runs on the tree as it is.
  A data-sheet citation string can repeat across registry entries (C30902EH ×3, Dereniak ×n): anchor edits on the entry's
  modelNote. To split one file's hunks across commits: save the full file, `git show HEAD:` it back, rerun only one topic's
  edit script, commit, restore the copy.
- **Session 185:** NIST XCOM answers a plain curl POST: `curl -s -X POST https://physics.nist.gov/cgi-bin/Xcom/xcom3_1
  --data-urlencode ZNum=4 --data-urlencode OutOpt=CSBA --data-urlencode NumAdd=1 --data-urlencode $'Energies=0.001
0.01'
  --data-urlencode WindowXmin=0.001 --data-urlencode WindowXmax=100000 --data-urlencode ResizeFlag=on` (MeV, one per line). CXRO:
  POST `/cgi-bin/atten.pl` or `getdb.pl`, then GET the `/tmp/xray*.dat` it links. Calphad TDB files give c_p = −T ∂²G/∂T²
  exactly; GHSER breakpoints are the melting points. A Debye preset's θ_D must be the caloric one at the working T.
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (arXiv:1807.00240 supp. eq. 3), so
  their p² is 4× the standard one. APS and Optica abstract pages via WebFetch give tables' text. OpenAlex `abstract_inverted_index`
  rebuilds paywalled abstracts. Inline `node -e` with backticks inside bash double quotes runs them: write scripts with a quoted heredoc.
- **Session 183:** the beam-wander ξ² lever arm sits at the transmitter (ξ = 1 − z/L), F = 0.979. A Bash call that appends with a
  heredoc and then runs a gated test is swallowed whole by devctl: write files and run gates in separate calls. Near the QKD cutoff
  the key is a 1e-4 difference of two terms: recheck such goldens with a from-scratch scan.
- **Session 182:** a reviewer's "from memory" fix can be wrong: derive the overlap for the actual geometry and check it by brute
  quadrature. Reviewers must not try to get past captchas. Recompute reviewer goldens after changing defaults. A detectors
  reviewer of 4 items took ≈ 8 min (session 186).
- **Session 181:** ICNIRP 2013 PDF text: `curl -A "Mozilla/5.0 …"` then `pdftotext -layout`; Table 5 notes at ≈ line 910.
- **Session 178:** Optica's abstract page (`opg.optica.org/<journal>/abstract.cfm?uri=…`) gives tables' text through WebFetch even
  for paywalled papers (not equations). refractiveindex.info `?shelf=…` URLs can resolve to the wrong page.
- **Session 177:** reviewers' main catches are chart ranges fixed for the default while inputs span decades. devctl's CPU gate can
  silently skip an implementer edit: keep `git status --short` in briefs.
- **Session 175:** an edit script doing `s.slice(0, start) + newText` drops the tail: replace a delimited block. `useURLState` can't
  hold NaN: use an out-of-range sentinel. NIST-JANAF tables: `https://janaf.nist.gov/tables/<id>.txt`.
- **Session 174:** the C: drive once filled to 0 bytes (ENOSPC on Edit): `df -h /c` when writes fail. A probe `.ts` importing repo
  files needs an absolute `C:/…` path. devctl queues tests behind implementers' eslint: run them in the background.
- **Session 173:** an implementer's edits may never reach disk: `git status --short` after each report. ITU-R PDFs:
  `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf`, `pdftotext -raw`.
- **Session 171:** a sed replacement with `&` pastes the match: use a node script with `replace(a, () => b)`.
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
