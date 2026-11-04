# Handover — 2026-11-04 (session 195 → session 196)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 195 ported the user's Gemini home hero on `phase-5/gemini-hero` (PR #233). Phases 4–6 have no open stage left:
ask the user what comes next (open findings, Phase 2 architecture, or the PDF items below).

## State
- `src/components/home/photonic-chip-art.tsx` (≈ 1240 lines): the Gemini SVG (1600×900 viewBox), pure props, `aria-hidden`.
  `photonic-chip-hero.tsx` (client): hover/phase/λ/speed state, overlays at xl+ (in flow below xl), HUD card (md+), branch cards.
- `src/lib/home-categories.ts` `heroBranches`: spectral → spectroscopy, imaging → imaging, interference → wave-optics, each
  with 3 calculators resolved by `getCalculator` (a removed page fails the build). `featuredHero*` and the old hero map,
  `category-detail-panel.tsx` and `public/hero/photonics-hero-desktop.jpg` are gone.
- `src/lib/hero-optics.ts`: `heroPowerSplit(Δφ)` from `machZehnderBeams(0.5, 0.5)`, φ = π/2 − Δφ → ½(1 ± sin Δφ), 50/50 taps
  (imaging always ½); `wavelengthBand`, `wavelengthToColor`. `tests/hero-optics.test.ts` (6).
- Gate: 1226 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> spectroscopy/etalon-fsr` (home has no calculator value; load check), then
   `node scripts/ui-check.mjs https://photonics-calculators.vercel.app` (expect ALL PASS, 0 console errors) and look at
   the home page at 360 / 1024 / 1440 px.
2. Ask the user what's next: no ROADMAP box is open.
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 195:** ports 3100 and 3200 both hold old `next start` servers of this site (3200 serves the old hero): run the
  branch on 3300 and check the served HTML for new text before screenshotting. The CDP screenshot script (scratchpad
  `shots.mjs`) needs Windows paths (`C:/…`), not `/c/…`, for node. Bay badge labels in the SVG are ≈ 9 px at 1440 px
  (decorative, xl+ only). The user's Gemini source is `~/Downloads/photonics_calculators_interactive_hero.tsx`.
- **Session 194:** a lock-in harmonic-pair formula is quick to verify by brute force: sample sin(ω_s t + φ)·sgn(sin ω_r t)
  over a whole number of periods (2e6 points) and take the Fourier component at j·f_r. Float noise: 0.05e-6 × 1e6 =
  0.049999…, so table values stored in SI need `+x.toPrecision(6)` for display and equality checks.
- **Session 193:** headless checks without the extension: CDP `Page.captureScreenshot` with
  a `clip` of the chart card at `Emulation.setDeviceMetricsOverride` width 360; to test downloads, override
  `HTMLAnchorElement.prototype.click` and `URL.createObjectURL` in the page and record name and blob size. Plotly modebar
  icons with `path` and no `transform` use SVG y-down; `Plotly.toImage` takes `{data, layout}`, so the export can change the
  background without a relayout. Node edit scripts in a quoted heredoc turn `\r\n` inside a template into real CRLF:
  write test text with the Write tool.
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
- **Session 185:** NIST XCOM answers a plain curl POST (`xcom3_1`, ZNum, OutOpt=CSBA, Energies in MeV one per line). CXRO: POST
  `/cgi-bin/atten.pl` or `getdb.pl`, then GET the `/tmp/xray*.dat` it links. Calphad TDB: c_p = −T ∂²G/∂T².
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (their p² is 4× the standard).
  APS and Optica abstract pages via WebFetch give tables' text. OpenAlex `abstract_inverted_index` rebuilds paywalled abstracts.
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
