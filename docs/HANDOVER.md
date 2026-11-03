# Handover — 2026-11-03 (session 188 → session 189)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 188 did 6f-a on `phase-6/6f-a-citations` (PR #226): about 20 "unverified" / "from memory" entries in thin film,
polarization, imaging, spectroscopy and detectors, read in their sources. Next: 6g citation sweep b (fiber, free-space comms,
wave optics, materials, laser safety); split it into a/b if it grows.

## State
- Value fixes: `low-coherence` TD-OCT SNR uses Choma's P_s = R_s·P₀/2 (R_s × the power on the sample), default 97.2 dB, up
  from 94.2; `ccd-vs-cmos` uses `EM_REGISTER_STAGES_CCD97 = 536` (F² −0.10 %); `plasma-deposition` warns outside
  `TE_FIT_MIN`–`TE_FIT_MAX` = 1–7 eV (L&L Table 3.3 note a). `optical-coherence`: κ relabelled "interferometer efficiency".
- Citations reworded or added: AO κ 0.28 = pyramid (Gaussian 0.23), SRS amplitude SNR + Cheng 2001 10 cm⁻¹, photoacoustic
  k from Jacques 1998 eq. 12 (≈ 2.8–6), FPM NA wording, plenoptic §6.3, Zipfel ω_z, Hg lines from Sansonetti 1996, SFG water signs
  (Nihonyanagi 2015, Tang 2020), SRM 17e lot 99.965 °Z, Goldstein DOI, Benjamin–Weaver k 0.2–1 (Bull 2006), PMT gain
  coefficient (Photonis −0.1, Burle ≈ −0.5 %/°C).
- Confirmed unchanged: Akondi & Dubra eq. 2, EMVA 1288 R3.1 eqs. (11)/(48), Hamamatsu handbook eqs., S-20 0.4 fA/cm², Alcock
  coefficients (all 8 metals), Choma eq. 10. Unread (paywalled): Hudgin 1977, Benjamin–Weaver 1960, Zipfel main text.
- Gate: 1215 tests, 5 eslint warnings.

## Next actions
1. `/ship`; merge on the user's yes. After a release (on request): `node scripts/post-merge-check.mjs <sha>
   imaging/low-coherence=97.2 detectors/photodiode-speed=13.47 fiber-optics/photonic-crystal=5.11 detectors/detectivity=2.616e12`.
2. 6g citation sweep b; then 6h, 6i; the hero after Phase 6.
3. Bai 2020 (APL Photonics 5, 031301): abstract says measured 79 cm/GW, 12 MHz; code keeps 60 ± 9. Ask the user for the PDF.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
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
- **Session 181:** ICNIRP 2013 PDF text: `curl -A "Mozilla/5.0 …"` then `pdftotext -layout`; Table 5 notes at ≈ line 910.
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
