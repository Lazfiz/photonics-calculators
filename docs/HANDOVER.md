# Handover — 2026-11-05 (session 205 → session 206)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 205 released Phase 7 (`main` e27df432 → `release`, PRs #234–#242 live, checks passed) and did Phase 8a (Kerr data on
`nonlinear-index`) on `phase-8/8a-kerr-data` (PR #243, to open with `/ship`). Phase 8 = data-blocked limitations.

## State
- `materials/kerr-index.ts`: + `nitrogen`, `oxygen`, `argon`, `air` (Zahedpour 2015 Table 1, 800 nm, 1 atm electronic;
  air = Σ xᵢ n₂,ᵢ with U.S. Std Atm 1976 fractions; n₀ `standardAirIndex` from free-space-comms/atmospheric-attenuation),
  `cs2` (2.0e-19 m²/W) and `cs2-long` (2.86e-18, > 10 ps; Reichert 2014 Table 1, Eq. 18; n₀ Kedenburg 2012 = 1.605957),
  `fused-silica-1024` (2.18e-20, Wahlstrand & Cruz 2026). 26 media.
- Golden: P_cr N₂ 1.21488e10 W; air n₂ 7.959726e-24; DeSalvo FS 7.4e-14 esu at 1064 nm → 2.13921e-20 m²/W (n₀ 1.45).
- physics-reviewer: one bug (mine, fixed before commit). Gate: 1260 tests, 5 eslint warnings (unchanged). 411/411 tiered.
- Production: e27df432; post-merge-check, full ui-check, BaTiO₃ Γ 26.73 and KRS-5 n 2.3707 / T 71.6 % verified live.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> materials/nonlinear-index` (load only: the default medium is unchanged).
2. Phase 8 next: 8b (LiTaO₃ on `electro-optic` + sapphire n₂(λ)), then 8c (Tm³⁺). The user uploaded six papers; they
   are in `C:devphotonics-calculators-refs` (outside git). ROADMAP Phase 8 lists their values and what is still
   missing (SBN indices/ε, Nd σ_a at 808 nm, absolute CO₂ I_s and g₀, SF59 n₂).
3. Still wanted from before: Bai 2020 (APL Photonics 5, 031301), Patel 2001 (Yb:YAG κ), Siegman "Lasers" ch. 11/21,
   Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24).

## Non-obvious facts
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
- **Session 201:** Strehl = ∫OTF ν dν / ∫MTF₀ ν dν (∫MTF₀ν dν = 1/8) checks any OTF quadrature. React Compiler lint
  (`preserve-manual-memoization`) fails a `useMemo` whose deps are derived in render; a module-level pure function passes.
- **Session 200:** scanned PDFs: `python -E -P` (not `-I`) extracts page strips; arXiv: `curl` + `pdftotext` works;
  headless Chrome screenshots of PDFs come out blank. `csqrt` of a k = 0 argument has Im −0 and can return the growing branch.
- **Session 199:** for a unimodal f, Σ f(x₀ + kΔx)·Δx ≤ ∫f + Δx·max f. Watch NaN in "Q > limit" searches: write
  `!(Q <= limit)`. A dev server of this repo may already run on 3300; SSR doesn't apply URL state.
- **Session 198:** `devctl` (CPU scheduler shared with other projects) holds a *whole* Bash command line while it waits and
  gives up after 90 s with exit 75: run tests and gates with `run_in_background` (they queue), and check `git diff --stat`
  before trusting a test count.
- **Session 197:** check a quadrature against an independent brute-force integral rather than its own refinement.
- **Session 196:** Optica PDFs behind bot checks: the user can upload them; read one with `pdftotext -layout`.
- **Session 194:** verify a lock-in harmonic formula by brute force. Table values stored in SI need `+x.toPrecision(6)`.
- **Session 193:** headless checks: CDP `Page.captureScreenshot` with a `clip` at `Emulation.setDeviceMetricsOverride` width
  360. Node edit scripts in a quoted heredoc turn `\r\n` inside a template into real CRLF: write test text with the Write tool.
- **Session 192:** read ui-check's "console errors" line. A second ui-check right after another can hit ECONNREFUSED on 9333.
- **Session 191:** a registry modelNote can lag its page text after a value fix: when a value changes, grep the registry too.
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
