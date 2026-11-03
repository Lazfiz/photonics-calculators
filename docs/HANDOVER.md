# Handover — 2026-11-03 (session 187 → session 188)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 187 did 6e-b on `phase-6/6e-b-photodiode-diffusion` (PR #225): the `photodiode-speed` diffusion tail. Phase 6e is
done. Next: 6f citation sweep a (thin film, polarization, imaging, spectroscopy, detectors); split it into a/b if > 4 pages.

## State
- `photodiode-rc.ts`: `driftFraction(α, W, L)` = (1 − e^−αW)/(1 − e^−αW/(1 + αL)) (Gärtner 1959); `diffusionResponse(f, α, W, L, D)`
  complex, diffusion term e^−αW·αL/(αL + √(1 + iωτ)), τ = L²/D (Peter 1990; Bisquert 2002; Laird et al. Small Methods 6,
  2200493 (2022), Eq. 15 of arXiv:2201.10133); `diffusionBandwidth` (Infinity when the share ≥ 1/√2 or the crossing lies past
  ±8 decades); `photodiodeResponse(f, {alpha, width, diffusionLength, diffusivity, fTransit, fRC})` = |H_int|·|sinc|/√(1 + (f/f_RC)²)
  and `photodiodeBandwidth`; a private `firstCrossing` (0.01-decade scan + 100 bisections).
- Page: inputs `absorptionDepth` (µm, 0 = Si at λ via `siliconAbsorption`), `diffusionLength` 35 µm, `diffusivity` 36 cm²/s;
  cards Drift Share 53.7 %, Diffusion −3 dB 13.59 MHz, Total −3 dB @ 1 mm² 13.47 MHz; warning below a share of 1/√2; new
  frequency-response chart; diffusion corner line on the area chart. Closed form = finite-difference solve to 1e-7.
- Reviewer (Opus) verdict OK; fixed: total −3 dB instead of quoting the intrinsic corner (10 kΩ: 1.31 MHz), Infinity past the
  scan, α > 0 guard, published citation. Gate: 1214 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   detectors/photodiode-speed=13.47 fiber-optics/photonic-crystal=5.11 detectors/detectivity=2.616e12
   detectors/linear-mode-avalanche=215.5` (the page prints "13.47 MHz", "13.59 MHz"; use 13.59, not the test's 13.60).
2. 6f citation sweep a; then 6g, 6h, 6i; the hero after Phase 6.
3. Bai 2020 (APL Photonics 5, 031301): abstract says measured 79 cm/GW, 12 MHz; code keeps 60 ± 9. Ask the user for the PDF.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 187:** `scripts/ui-check.mjs <base> load <paths…>` loads pages and reports console errors; a scratchpad copy that
  prints card text after each load checks values on the dev server (`npx next dev -p 3100` wrapped in `timeout`). Optica
  full-text pages answer WebFetch with a JS challenge; arXiv PDFs + `pdftotext -layout` lose Greek letters. Electrochemistry
  (IMPS, Gerischer impedance) is where the AC diffusion–recombination solution with √(1 + iωτ)/L is published.
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
