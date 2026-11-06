# Handover — 2026-11-06 (session 208 → session 209)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 208 did Phase 8d (Ho³⁺ on `rare-earth-absorption`, `rare-earth-doped`, `fiber-amplifier`) on `phase-8/8d-ho-absorption`
(PR #246, merged, not released). Next: Phase 8e BSO + ZBLAN (user's pick), branch `phase-8/8e-bso-zblan` (exists, holds
the ROADMAP box). Get sources first: Efremidis 2009 (BSO), Poulain 2024 APL Photonics 9, 091103 (ZBLAN).

## State
- `fiber-optics/doped-fiber-gain.ts`: DOPANT_PRESETS + `Ho` (Le Gouët et al. 2020, Opt. Express 28, 22307; values from
  arXiv:2003.14188v1; silica, τ 0.7 ms, M 0.16493): pumps 1908 nm 1.9/1.6 (text), 1946 nm 4.3 (text)/5.9; signals 2120 nm
  0.18/1.30 (first: the amplifier preset), 1995 nm 1.93/4.38 (σ_e = (58/57)·4.3 from the measured gain), e-25 m².
  `id` union is "Er" | "Yb" | "Tm" | "Ho". Raster Fig. 1 digitized; it reproduces five text values to ±0.05e-25 m².
- `fiber-amplifier` preset `ho1908`: fibre #1 N 3.7e25 (±16 %), r 4 µm, Γ_p 0.78 (1908 nm), Γ_s 0.72 (2120 nm), both from
  the paper's eq. (1) 1 − exp(−2a²/w²) with Marcuse w; L 2 m → 7.9 dB at 200 mW. `rare-earth-doped` preset `ho1908`;
  `rare-earth-absorption` has 4 Ho lines (4th chart colour added).
- Golden: fibre #2 (N 2.7e26, Γ 0.85) 428.58 dB/m vs measured 425 ± 5; fibre #1 1908 nm 23.7 vs 25.2 ± 0.3 dB/m (10 %);
  1000 wt-ppm α(1946) 15.0080 dB/m, T(10 cm) 0.707815; inversion limit 1.9/3.5. Gate: 1268 tests. 411/411 tiered.
  physics-reviewer: all values confirmed; Γ_p fixed 0.76 → 0.78 (1908 nm), N mismatch noted in a comment.

## Next actions
1. 8d is merged, not released. Release only on request, then
   `node scripts/post-merge-check.mjs <sha> materials/rare-earth-absorption fiber-optics/fiber-amplifier fiber-optics/rare-earth-doped`
   (load only: defaults unchanged), and a URL-state check: `/materials/rare-earth-absorption?line=Ho1946` shows 15.01 dB/m.
2. Next stage, user's choice: Phase 8 "open but partial" items (BSO Efremidis 2009, ZBLAN) only with a go; or the "Later"
   items (phone hero, traffic/SEO pass). Still missing data: SBN indices/ε, Nd σ_a at 808 nm, CO₂ I_s and g₀, SF59 n₂,
   Tm ³H₄ band (Jackson & King 1999).
3. Still wanted from before: Bai 2020 (APL Photonics 5, 031301), Patel 2001 (Yb:YAG κ), Siegman "Lasers" ch. 11/21,
   Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24).

## Non-obvious facts
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
- **Session 204:** JBIG2 scans (old AIP/APS PDFs): `pdftoppm` is absent and pypdf needs jbig2dec; `pip install --target
  <scratchpad>/pylib pypdfium2` renders them (run with `python -E -P`, add the pylib dir to sys.path). HAL
  (hal-iogs.archives-ouvertes.fr) runs Anubis: ask the user to upload. Test a tensor contraction at θ ≠ 0. Wemple indices
  extrapolate silently: range-guard them.
- **Session 203:** Crossref's `/works/<doi>` often carries the abstract (`message.abstract`, JATS). `kups.ub.uni-koeln.de`
  runs Anubis and the Wayback Machine refuses curl: don't drive Chrome through bot checks; ask the user to upload.
  refractiveindex.info YAML (CC0): `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/master/database/data/main/<mat>/nk/<set>.yml`;
  "formula 1" is n² − 1 = C1 + Σ Bλ²/(λ² − C²) = our `fromResonanceWavelengths(1, B, C, range)`. A difference of
  antiderivatives of size ≈ 1e-2 loses a tiny-interval mean: write the mean with expm1(x)/x. To commit one file's hunks
  separately: stage `git show HEAD:<f>` + the wanted edit, then restore the working copy.
- **Session 202:** FPbase API `https://www.fpbase.org/api/proteins/spectra/?slug=<slug>&format=json`; CC BY-SA 4.0.
  `tests/no-inline-constants.test.ts` flags data samples near constants (377 ≈ Z₀): add data files to its `dataTables`.
  `x·1e9` of a whole-nm λ can sit 1e-13 off: snap it before interpolating.
- **Session 198:** `devctl` (CPU scheduler shared with other projects) holds a *whole* Bash command line while it waits and
  gives up after 90 s with exit 75: run tests and gates with `run_in_background` (they queue), and check `git diff --stat`
  before trusting a test count.
- **Session 193:** headless checks: CDP `Page.captureScreenshot` with a `clip` at `Emulation.setDeviceMetricsOverride` width
  360. Node edit scripts in a quoted heredoc turn `\r\n` inside a template into real CRLF: write test text with the Write tool.
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
