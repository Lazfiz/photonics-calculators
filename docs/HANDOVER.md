# Handover — 2026-11-05 (session 204 → session 205)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 204 did Phase 7g-b (BaTiO₃ on `photorefractive`) on `phase-7/7g-b-batio3-photorefractive` (PR #242, to open
with `/ship`). PR #241 (7g-a) is merged into `main`, not released. Phase 7 is done.

## State
- `materials/pockels.ts`: BaTiO₃ entries carry r₄₂ and `epsilon11` (Zgonik 1994 Table III free: ε 4400/129, r 8/105/1300;
  Table II clamped: 2200/56, 10.2/40.6/730 pm/V). New `extraordinaryIndex(no, ne, ψ)`, `gratingPermittivity(ε₁₁, ε₃₃, β)`,
  `eWaveEffectiveCoefficient(no, ne, r13, r33, r42, β, θ)` (Feinberg 1980 eq. 19, cos 2θ contrast and 1/n⁴ included).
- Page: material LiNbO₃ (β = 0) / BaTiO₃ free / clamped / custom; `beta` URL param (0–90°, BaTiO₃ only), β chart,
  out-of-range "—" plus a warning outside the 400–700 nm index fit.
- Golden (632.8 nm): ε_K(45°) 2264.5, n_e(45°) 2.382146, r_eff β 45° θ 0 958.28 pm/V, θ 10° 898.29; β 0 → r₃₃;
  chain 2θ 20°, β 45°, 295 K, N 1e22: E_q 23172.7 V/m, r_eff 947.69 pm/V, Γ 23.375 cm⁻¹. Page default (532 nm) Γ 26.73 cm⁻¹,
  clamped 25.81, LiNbO₃ 3.897. Closed form = brute 4mm tensor sum (rel 5e-13). physics-reviewer: formula correct.
- Gate: 1259 tests, 5 eslint warnings (unchanged); build green. 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "materials/photorefractive?material=batio3=BaTiO₃"`,
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
2. Phase 7 is done. User's choice: phone hero (cropped layout + touch) or a traffic/SEO pass (ROADMAP), or open findings.
3. PDFs still wanted: Bai 2020 (APL Photonics 5, 031301), Patel 2001 (Yb:YAG κ), Siegman "Lasers" ch. 11/21,
   Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24); SBN/BSO/LiTaO₃ data (Casson 2004 JOSA B) for photorefractive.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 204:** JBIG2 scans (old AIP/APS PDFs): `pdftoppm` is absent and pypdf needs jbig2dec; `pip install --target
  <scratchpad>/pylib pypdfium2` renders them (run with `python -E -P`, add the pylib dir to sys.path). HAL
  (hal-iogs.archives-ouvertes.fr) runs Anubis: ask the user to upload. MacDonald 1985 (uploaded) is not needed for r_eff.
  Feinberg's DOI is 10.1063/1.327824. Test a tensor contraction at θ ≠ 0 (K = 0 at θ = 0 gives NaN). Γ's optimum β moves
  from 53° to 0° as E_q limits (ε₁₁ ≫ ε₃₃): don't state one peak angle. Wemple indices extrapolate silently: range-guard them.
- **Session 203:** Crossref's `/works/<doi>` often carries the abstract (`message.abstract`, JATS) when publishers elide
  it elsewhere: Okada & Tokumaru's α(T) formula came from there. `kups.ub.uni-koeln.de` runs Anubis (proof-of-work bot
  check) and the Wayback Machine refuses curl: both are bot checks, don't drive Chrome through them; ask the user to upload.
  Petraru's thesis gives Zgonik's r (Table 2.2) and n_o 2.412, n_e 2.360 (Nikogosyan) but no ε and no photorefractive r_eff.
  refractiveindex.info YAML (CC0): `raw.githubusercontent.com/polyanskiy/refractiveindex.info-database/master/database/data/main/<mat>/nk/<set>.yml`;
  "formula 1" is n² − 1 = C1 + Σ Bλ²/(λ² − C²) (C squared in the formula) = our `fromResonanceWavelengths(1, B, C, range)`.
  A difference of antiderivatives of size ≈ 1e-2 loses a tiny-interval mean: write the mean with expm1(x)/x.
  To commit one file's hunks separately: stage `git show HEAD:<f>` + the wanted edit, then restore the working copy.
- **Session 202:** FPbase API `https://www.fpbase.org/api/proteins/spectra/?slug=<slug>&format=json`; site licence CC BY-SA 4.0.
  `tests/no-inline-constants.test.ts` flags data samples near constants (377 ≈ Z₀): add data files to its `dataTables`.
  `x·1e9` of a whole-nm λ can sit 1e-13 off: snap it before interpolating.
- **Session 201:** in ρ = sin θ/s pupil coordinates the aplanatic weight is (1 − s²ρ²)^(−1/4) (not modelled). Strehl =
  ∫OTF ν dν / ∫MTF₀ ν dν (∫MTF₀ν dν = 1/8) checks any OTF quadrature. Near √(1 − ρ²) at s = 1 substitute ρ = sin φ.
  React Compiler lint (`preserve-manual-memoization`) fails a `useMemo` whose deps are derived in render; a module-level
  pure function called in render passes.
- **Session 200:** scanned PDFs: `python -E -P` (not `-I`, which hides the user-site pypdf and PIL) extracts page strips;
  arXiv: `curl` + `pdftotext` works; headless Chrome screenshots of PDFs come out blank. `csqrt` of a k = 0 argument has
  Im −0 and can return the growing branch.
- **Session 199:** for a unimodal f, Σ f(x₀ + kΔx)·Δx ≤ ∫f + Δx·max f. Watch NaN in "Q > limit" searches: write
  `!(Q <= limit)`. A dev server of this repo may already run on 3300 (`next start` then fails with EADDRINUSE, but the
  dev server serves the working tree); SSR doesn't apply URL state, so read values with headless CDP (ui-check pattern).
- **Session 198:** `devctl` (CPU scheduler shared with another project) holds a *whole* Bash command line while it waits:
  in `a && b` neither part runs (exit 75), so an edit can silently not happen. Run edits and tests in separate calls, or
  long ones with `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Session 197:** check a quadrature against an independent brute-force integral rather than its own refinement.
- **Session 196:** Optica PDFs behind bot checks: the user can upload them; read one with `pdftotext -layout` (the
  scratchpad `pdftext.mjs` fallback inflates streams and collects TJ/Tj).
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
