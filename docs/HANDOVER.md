# Handover — 2026-11-06 (session 209 → session 210)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 209 did Phase 8e (BSO on `electro-optic`, ZBLAN Knoop and dn/dT on `infrared-glass`) on `phase-8/8e-bso-zblan`.
PR: see Next actions 1. Not released. Sources are in `C:/dev/photonics-calculators-refs`: efremidis2009-sillenite.pdf and
poulain2024-hmfg.pdf.

## State
- `materials/pockels.ts`: crystal `bso`, geometry "cubic" (field along [110], light along [1̄10]), with tables every 20 nm
  over 500–800 nm digitized from Efremidis 2009 (Appl. Phys. B 95, 467), Fig. 3 (vector paths):
  - r₄₁ 4.14→2.03 pm/V;
  - n 2.6656→2.5016;
  - ρ 40.05→12.14 °/mm.
  New functions: `cubicCoefficients`, `cubicHalfWaveVoltage` (V_π = λd/(2n³r₄₁L)) and `gyrotropicTransmission(Γ, ρL)`.
  The last is a closed-form Jones result (exp(−i(Γ/2 σ₁ + ρL σ₂)), analyzer at 90° + ρL); a test compares it with a
  4000-slab product. The page draws curves with and without ρL out to 4·V_π.
- The ROADMAP's "4.2 ± 2.0 pm/V" and "40 ± 12 °/mm" were misreads: they are the 500→800 nm ranges.
- Goldens at 633 nm: r₄₁ 2.7285, n 2.560005, ρ 21.1825 °/mm, V_π 691.397 V (d 1 mm, L 10 mm).
- Caveats:
  - Fig. 3 uses its own n (2.560 at 633 nm, vs Gospodinov's 2.528), so n³r₄₁ stays the measured product.
  - Screening of the dc field below 560 nm is stated on the page.
  - BSO has no ε yet.
  - physics-reviewer: OK, and its fixes are applied.
- `window-materials.ts` ZBLAN, from Poulain 2024 (APL Photonics 9, 091103):
  - Knoop 250 kg/mm² ("around 250 for ZBLAN"; Table IV gives 190–250 for fluorozirconates).
  - dn/dT −11.5e-6/K: the midpoint of the −8 to −15 range given for fluoride glasses (his ref. 32, Izumitani 1987).
  - No band or conductivity.
  - Golden: n(2 µm) 1.487990, and 1.487070 at 100 °C.
- Gate: 1269 tests; 411/411 pages tiered.

## Next actions
1. Ship 8e: push, open the PR, wait for CI, then merge on the user's yes. Release only on request, then
   `node scripts/post-merge-check.mjs <sha> materials/electro-optic materials/infrared-glass` (load only; defaults unchanged).
   URL-state check: `/materials/electro-optic?material=bso&wavelength=633` shows ρ 21.18 °/mm.
2. Next stage, user's choice:
   - The "Later" items: phone hero, traffic/SEO pass.
   - A Phase 8 upload. Still missing data: BSO ε/n (Gunter & Huignard vol. 2), SBN indices and ε, Nd σ_a at 808 nm,
     CO₂ I_s and g₀, SF59 n₂, the Tm ³H₄ band (Jackson & King 1999), ZBLAN κ and band.
3. Still wanted from before: Bai 2020 (APL Photonics 5, 031301), Patel 2001 (Yb:YAG κ), Siegman "Lasers" ch. 11/21,
   Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24).

## Non-obvious facts
- **Session 209:** `python -I` hides the user site, so PIL is missing: use `python -E -P` for pypdfium2 renders. A scratchpad
  `.ts` probe needs absolute `C:/dev/…` imports. Port 3300 already serves this working copy (dev server): reuse it.
- **Session 208:** raster figures: extract the image (pypdfium2 `PdfImage.get_bitmap(render=False).to_pil()`), find the frame
  and gridlines by counting dark/grey pixels per row and column, then take a colour-weighted centroid per column (blue b − r,
  red r − g). Check against every value the text states. devctl may end a background task with only its "waiting" line
  while the command still runs later: write to a log and wait on the log (Monitor until-loop); two queued runs share it.
- **Session 207:** figures in vector PDFs (Optics Express) can be read exactly: pypdfium2 `page.get_objects(max_depth=5)`, path
  objects (type 2) → `raw.FPDFPath_CountSegments` / `FPDFPath_GetPathSegment` / `FPDFPathSegment_GetPoint`, colour from
  `FPDFPageObj_GetStrokeColor`; calibrate on the gridline paths and tick-label text positions, map colours via the legend
  segments. Check against a value stated in the text (here σ_a(1600) 3.504 vs 3.5). `python -E` ignores PYTHONIOENCODING: print
  with `ascii()`. `tsx --test` prints `ℹ tests/pass/fail` and `✖`, not TAP `# pass`.
- **Session 206:** Read's PDF `pages` fails here (no pdftoppm). Render a crop with pypdfium2 (`pip install --target
  <scratchpad>/pylib pypdfium2`; Pillow is installed): `pdfium.PdfDocument(p)[i].render(scale=2).to_pil().crop(box)`, run with
  `python -E -P`. devctl holds a whole `a && b` line: if it gives up, later steps (a heredoc file write) never ran. One file's
  hunks in two commits: `git diff -U1 f > p`, cut the wanted hunks, `git apply --cached --unidiff-zero`. n is nearly linear
  in 1/λ²: interpolate tabulated indices there. A fit with a range needs defined edges: hold or NaN, never snap back.
- **Session 205:** pdftotext can shift a table's row labels when a row's name cell is empty: DeSalvo 1996 Table I printed
  "SiO₂" on BaF₂'s row. Cross-check a row against a stated property (band gap, a worked example in the text) before
  trusting it. Open-access Optica papers (Optics Express, OL via arXiv) are blocked to curl by Radware; arXiv, UCF STARS,
  PMC and NTRS work. A URL-state value on production: `chrome --headless=new --dump-dom --virtual-time-budget=8000 <url>`
  then strip tags and grep (no CDP script needed). `post-merge-check … | tail` hides its exit code: read its MISSING lines.
  refractiveindex.info "formula 2" is n² − 1 = Σ Bλ²/(λ² − C) with C already squared.
- **Session 198:** `devctl` (CPU scheduler shared with other projects) holds a *whole* Bash command line while it waits and
  gives up after 90 s with exit 75: run tests and gates with `run_in_background` (they queue), and check `git diff --stat`
  before trusting a test count.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script (fails unless the old
  text occurs exactly once).
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in `scripts/ui-check.mjs`).
  A bare `python -` or `cat > file` with no input hangs. Port 3000 can be another project: use 3100 or 3300.
  Prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. `null` and non-finite
  values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`. NaN/∞
  show as "—" with a reason. JSX text needs `&apos;`; registry/JSX text can't hold `{…}`. `npm run dev` touches
  `next-env.d.ts`: `git checkout` it.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`, imports as `C:/dev/…`).
  `git grep` skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
