# Handover — 2026-11-04 (session 194 → session 195)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 194 did 6j on `phase-6/6j-findings` (PR #232): the last open physics findings (lock-in pair sum, OPA degeneracy and
PPLN hint) and three cleanups (CTE table, kerr-lens title, "nepers"). Phase 6 is done. Next: the Gemini hero.

## State
- `lockin.ts` `referenceMatch`: square reference, f_s = 2m·f_r → harmonics a = 2m − j, b = 2m + j beat at one |Δf|; envelope
  |H|·√(g_a² + g_b² + 2g_a g_b cos 2φ); result carries `pairedHarmonic`. The page names both harmonics.
- `three-wave.ts`: `degeneracyLimits(λp, λs)` (signal-side detuning range up to ν_p/2) and `pplnOpaParameters(λp, λs)` (Zelmon
  e-ray n and δ_si, NaN outside 0.4–5 µm). The OPA page warns when the gain band reaches 2λ_p and offers PPLN values.
- `thermal-expansion.ts`: `CTE_TABLE` (1/K, sorted) and `alphaPpm()` (display without float noise).
- Gate: 1220 tests, 5 eslint warnings (unchanged). Build green on the branch. 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> materials/thermal-expansion=0.0710 materials/thermal-expansion=18.85
   wave-optics/kerr-lens=Self-Focusing detectors/lockin-amplifier wave-optics/optical-parametric-amplifier`, then
   `node scripts/ui-check.mjs https://photonics-calculators.vercel.app` (expect ALL PASS, 0 console errors).
2. The Gemini hero (Phase 5 leftover): ask the user for the files.
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 194:** a lock-in harmonic-pair formula is quick to verify by brute force: sample sin(ω_s t + φ)·sgn(sin ω_r t)
  over a whole number of periods (2e6 points) and take the Fourier component at j·f_r. Float noise: 0.05e-6 × 1e6 =
  0.049999…, so table values stored in SI need `+x.toPrecision(6)` for display and equality checks.
- **Session 193:** port 3100 is held by an old `next start` of this site (PID 20608, "411 tools"): don't kill it; serve the
  branch build on 3200 and stop it with TaskStop. Headless checks without the extension: CDP `Page.captureScreenshot` with
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
- **Session 187:** `scripts/ui-check.mjs <base> load <paths…>` loads pages and reports console errors. Optica full-text pages
  answer WebFetch with a JS challenge. arXiv PDFs + `pdftotext -layout` lose Greek letters.
- **Session 185:** NIST XCOM answers a plain curl POST (`xcom3_1`, ZNum, OutOpt=CSBA, Energies in MeV one per line). CXRO: POST
  `/cgi-bin/atten.pl` or `getdb.pl`, then GET the `/tmp/xray*.dat` it links. Calphad TDB: c_p = −T ∂²G/∂T².
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (their p² is 4× the standard).
  APS and Optica abstract pages via WebFetch give tables' text. OpenAlex `abstract_inverted_index` rebuilds paywalled abstracts.
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
