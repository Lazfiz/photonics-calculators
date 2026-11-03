# Handover — 2026-11-03 (session 189 → session 190)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 189 did 6g-a on `phase-6/6g-a-citations` (PR #227): about 15 unverified entries in fiber, free-space comms and laser
safety, read in their sources. Next: 6g-b citation sweep (wave optics, materials; the items are in "Open findings").

## State
- Value fixes: Yb 1064 nm preset σ_a 5.7e-27, σ_e 3.1e-25 m² (Melkumov arXiv:1502.02885 App. 2, 1064 row; it was the 1068
  row). `fiber-bragg-grating-sensor` adds K_T′ = dK_T/dT (input, SMF-28 1.431e-8/K², Cosme 2026 Table 3; `braggShift`
  takes an optional 6th arg `thermalSlope`): Δλ at 1550 nm, ΔT 50 K = 505.5 pm (was 477.8); warning outside −20…100 °C.
- Re-cited: geometric-loss top-hat = ICTON 2005 eq. 1 (Sheikh Muhammad, Köhldorfer, Leitgeb, doi:10.1109/ICTON.2005.1505832);
  SPIE 4530 (Kim & Korevaar 2001) has no formula. Kim 1998 Opt. Eng. eq. 1 is the area form. Snow law first printed in the same
  ICTON paper (eqs. 6–8). G.975.1 never prints 3.8e-3 (App. I.9 Table I.22 quoted on the page).
- Confirmed: PCF DOIs, OH 62.7 dB/km/ppm (arXiv:2303.17814 Table I, 1385 nm column), G.653.A S₀ 0.085, G.655.C (+ D_max − D_min
  ≤ 5 added), G.650.1 PII MFD, Agrawal 5th-ed. §2.4.3/§5.4.4, Schulmeister 2017 p. 10, ICAO zones (CASA AC 139-23 wording).
- Unread: Barnes 1991 Er σ (closed; eprint has a proof-of-work wall), Tyler & Fried full text (per-axis NEA is our reading).
- Gate: 1215 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   fiber-optics/fiber-bragg-grating-sensor=195.6 imaging/low-coherence=97.2 detectors/photodiode-speed=13.47`
   (FBG default temperature shift 195.6 pm, was 191.1; total 813.5 pm).
2. 6g-b citation sweep (wave optics: OPO Guha 1998, injection-locking Henry/Petitbon/Banerjee α, thin-disk κ and Nd heat
   fraction, supercontinuum Dudley 2006, ring-cavity Siegman; materials: Si₃N₄ density, Peck n/Eₐ, GaAs c_p Piesbergen, KDP
   41.21°, KTP 3.8 eV edge, ZBLAN n_d, KTP r clamped). Then 6h, 6i; the hero after Phase 6.
3. Bai 2020 (APL Photonics 5, 031301): abstract says measured 79 cm/GW, 12 MHz; code keeps 60 ± 9. Ask the user for the PDF.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 189:** three parallel `general-purpose` agents (≈ 5 items each) took 4–11 min. A citation can be right in
  topic but hold no formula (SPIE 4530): read the equation, not just the DOI. Read data tables row by row (the Yb preset sat on
  the neighbouring 1068 nm row). Sources that answer: Europe PMC full text for MDPI (PMC id), Seibersdorf white papers, CASA
  AC 139-23 for ICAO zone wording, FAA JO 7400.2 TBL 29-2-1 (its HTML shows µ as m), ITU-T G.653 07/2010, G.655 11/2009,
  G.650.1 01/2024, G.975.1 02/2004. `node --import tsx -e` needs a `file:///C:/…` import and `x.default` for named exports.
  A `git commit -m` with $'…' and parentheses broke bash: write the message to a file and `git commit -F`.
- **Session 188:** four parallel `general-purpose` agents (≈ 5 items each, verdict + quote + one-line change, ≤ 40 lines)
  covered the sweep in ≈ 10 min. Agents left their downloads in the scratchpad. Choma's S is the sample illumination power,
  so a 50/50 Michelson's detector sees R_sS/2. The page's Lorentzian A/(Δ + iΓ) gives Im χ⁽²⁾ = −AΓ/(Δ² + Γ²), so A > 0
  means a negative band. Sources that answer: NIST ASD `lines1.pl?spectra=Hg+I&…&format=2`; SRM certificates at
  `tsapps.nist.gov/srmext/certificates/archives/`; Burle TP-136 at `psec.uchicago.edu/links/Photomultiplier_Handbook.pdf`;
  L&L via Google Books search-inside (id m0iOga2XE5wC); EMVA 1288 R3.1 at `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf`.
- **Session 188, editing:** one long Bash heredoc with mixed quotes failed ("unexpected EOF"). Write the edit list as JSON
  with the Write tool and apply it with a replace-once node script (`[{file, a, b}]`, fails unless `a` occurs once). To split
  one file's hunks across commits, save the file, `git checkout HEAD --` it, rerun only one topic's entries, `git add`, and
  restore the copy.
- **Session 187:** `scripts/ui-check.mjs <base> load <paths…>` loads pages and reports console errors. Optica full-text pages
  answer WebFetch with a JS challenge. arXiv PDFs + `pdftotext -layout` lose Greek letters.
- **Session 186:** ar5iv serves arXiv figures as PNG: `https://ar5iv.labs.arxiv.org/html/<id>/assets/fig2.png`. A reviewer's
  "from memory" number can be wrong: probe before planning a fix. devctl can queue `npm run check` ≈ 12 min behind another
  project's job. A data-sheet citation string can repeat across registry entries: anchor edits on the entry's modelNote.
- **Session 185:** NIST XCOM answers a plain curl POST (`xcom3_1`, ZNum, OutOpt=CSBA, Energies in MeV one per line). CXRO: POST
  `/cgi-bin/atten.pl` or `getdb.pl`, then GET the `/tmp/xray*.dat` it links. Calphad TDB: c_p = −T ∂²G/∂T².
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (their p² is 4× the standard).
  APS and Optica abstract pages via WebFetch give tables' text. OpenAlex `abstract_inverted_index` rebuilds paywalled abstracts.
- **Session 183:** the beam-wander ξ² lever arm sits at the transmitter. A Bash call that appends with a heredoc and then runs
  a gated test is swallowed by devctl: write files and run gates in separate calls.
- **Session 182:** derive overlaps for the actual geometry and check by brute quadrature. Reviewers must not try to get past
  captchas. Recompute reviewer goldens after changing defaults.
- **Session 178:** refractiveindex.info `?shelf=…` URLs can resolve to the wrong page.
- **Session 177:** reviewers' main catches are chart ranges fixed for the default while inputs span decades. devctl's CPU gate
  can silently skip an implementer edit: keep `git status --short` in briefs.
- **Session 175:** `useURLState` can't hold NaN: use an out-of-range sentinel. NIST-JANAF: `https://janaf.nist.gov/tables/<id>.txt`.
- **Session 174:** the C: drive once filled to 0 bytes (ENOSPC on Edit): `df -h /c` when writes fail. A probe `.ts` importing
  repo files needs an absolute `C:/…` path.
- **Session 173:** ITU-R PDFs: `https://www.itu.int/dms_pubrec/itu-r/rec/p/R-REC-P.1814-1-202509-I!!PDF-E.pdf`, `pdftotext -raw`.
- **Session 171:** a sed replacement with `&` pastes the match: use a node script with `replace(a, () => b)`.
- **Sessions 163–173 (5w):** brief reviewers for verdict + BUG/MINOR/UNVERIFIED, file:line, hand calcs, "(from memory)", don't edit.
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in `scripts/ui-check.mjs`).
  In the Bash tool a bare `python -` or `cat > file` with no input hangs until timeout.
- **Sessions 137–138:** ITU-T PDFs: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`. **Port 3000 can
  be another project**: use 3100.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome. Registry/JSX text can't hold `{…}`. `npm run dev` touches
  `next-env.d.ts`: `git checkout` it.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. `null` and non-finite
  values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`. NaN/∞
  show as "—" with a reason. JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `git grep` skips untracked
  files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
