# Handover — 2026-11-03 (session 192 → session 193)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 192 did 6i-a on `phase-6/6i-a-ui-check` (PR #230): a production chart crash fixed, ui-check brought current, three
performance hot spots fixed. Next: 6i-b chart layout (ROADMAP "Cross-cutting (6i-b)"), then the Gemini hero.

## State
- **Production bug, fixed on the branch, live until a release:** `ChartPanel`'s `LazySimpleChart` passed the cached component
  to `useState(loadedSimpleChart)`; React calls a function argument as an initializer, so every SVG chart remounted after the
  chunk loaded (client navigation, Back) threw "Cannot destructure property 'data'" into the error boundary. Now `() => …`.
- `scripts/ui-check.mjs`: all checks pass on the branch build; production fails only the new "no console errors after
  navigating back" check (the bug above). Pages without inputs wait on other controls or the `<h1>`.
- `poissonQuantile` (math.ts) starts at Cornish–Fisher and steps (identical on 135 cases); `periodicDecay` has a Fourier branch
  (Poisson summation) used when it needs fewer terms; Fabry-Perot chart ≤ 2000 uniform + 161 sinh-spaced points per peak.
- Accepted (ROADMAP Known limitations, "Performance and page weight"): gradient-index 0.35 s at the cap; metal-page JS is
  data (ASTM G173 8.3 KB gz, TMM 5.2 KB, n,k 3.7 KB).
- Gate: 1215 tests, 5 eslint warnings (unchanged). Build green.

## Next actions
1. `/ship`; merge on the user's yes. Suggest a release soon (the chart crash is user-visible). After a release (on request):
   `node scripts/post-merge-check.mjs <sha> fiber-optics/fiber-bragg-grating-sensor=195.6 imaging/low-coherence=97.2
   detectors/photodiode-speed=13.47`, then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app` (expect ALL PASS).
2. 6i-b: chart double padding (pages wrapping ChartPanel in their own bordered `p-4` box; >10 files → `/codemod`), PNG/CSV
   row height above SVG charts, Plotly charts without export buttons.
3. Then the Gemini hero (ask the user for the files).
4. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages.
5. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 192:** `ui-check` printed console errors without failing on them, so a production crash sat unnoticed: read its
  "console errors" line. Full stacks: copy the script to the scratchpad and print `logs` whole. Minified Next chunks are
  readable with `curl …/_next/static/chunks/<file>.js | cut -c<from>-<to>` at the stack's column. A second ui-check run right
  after another can hit ECONNREFUSED on port 9333: wait a few seconds. `useState(x)` with a function x calls it.
- **Session 191:** a registry modelNote can lag its page text after a value fix (Brillouin "74"): when a value
  changes, grep the registry entry too. Print notes for many slugs with a scratchpad script importing
  `src/registry/index` (`calculators`, filter by slug).
- **Session 190:** four parallel `general-purpose` agents (≈ 4 items each) took 6–11 min. Wayback `id_` URLs
  (`web.archive.org/web/<ts>id_/<url>`) open PDFs that sit behind bot checks (zfn.mpdl.mpg.de, pdx.edu, Hindawi). CREOL hosts
  DeSalvo 1996 at `api.creol.ucf.edu/Publications/1814.pdf`; Dudley RMP 2006 at members.femto-st.fr (john-dudley). archive.org
  full-text search over book items compares a table across editions. Google Books' API quota runs out and search-inside
  shows a captcha. To commit one hunk of a file without touching the tree: build the partial file in the scratchpad,
  `git hash-object -w` it, then `git update-index --cacheinfo 100644,<sha>,<path>`.
- **Session 189:** a citation can be right in topic but hold no formula (SPIE 4530): read the equation, not just the DOI.
  Read data tables row by row (the Yb preset sat on the neighbouring 1068 nm row). Sources that answer: Europe PMC full text
  for MDPI, Seibersdorf white papers, CASA AC 139-23, FAA JO 7400.2 TBL 29-2-1 (its HTML shows µ as m), ITU-T G.653 07/2010,
  G.655 11/2009, G.650.1 01/2024, G.975.1 02/2004. `node --import tsx` probes: `import * as x from "C:/dev/…/module"`.
  A `git commit -m` with $'…' and parentheses broke bash: write the message to a file and `git commit -F`.
- **Session 188:** Choma's S is the sample illumination power, so a 50/50 Michelson's detector sees R_sS/2. The page's
  Lorentzian A/(Δ + iΓ) gives Im χ⁽²⁾ = −AΓ/(Δ² + Γ²), so A > 0 means a negative band. Sources: NIST ASD
  `lines1.pl?spectra=Hg+I&…&format=2`; SRM certificates at `tsapps.nist.gov/srmext/certificates/archives/`; Burle TP-136 at
  `psec.uchicago.edu/links/Photomultiplier_Handbook.pdf`; EMVA 1288 R3.1 at `emva.org/wp-content/uploads/EMVA1288-3.1a.pdf`.
- **Editing:** long Bash heredocs with mixed quotes fail. Write the edit list as JSON with the Write tool and apply it with a
  replace-once node script (`[{a, b}]`, fails unless `a` occurs once; session 190's is in the scratchpad pattern).
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
- **Session 175:** `useURLState` can't hold NaN: use an out-of-range sentinel. NIST-JANAF: `https://janaf.nist.gov/tables/<id>.txt`.
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
