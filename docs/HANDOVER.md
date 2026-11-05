# Handover — 2026-11-05 (session 203 → session 204)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 203 did Phase 7g-a (Si α(T) on `thermal-expansion`, BaTiO₃ on `electro-optic`) on `phase-7/7g-materials-data`
(PR #241, to open with `/ship`). 7g-b (BaTiO₃ on `photorefractive`) is blocked on PDFs; Phase 7 is otherwise done.

## State
- `materials/thermal-expansion.ts`: `siliconAlpha(T)` (Okada & Tokumaru 1984 abstract fit, 120–1500 K, NaN outside),
  `siliconMeanAlpha(T1, T2)` written with expm1(−cΔT)/(cΔT) (no cancellation for tiny ΔT), `siliconAlphaIntegral` = mean × ΔT,
  `siliconExpansion(L, T1, T2)` = L·expm1(∫α dT). Page: T₀ input (`t0`, °C), 4 cards, α(T) chart.
- `materials/pockels.ts`: `batio3`, `batio3-clamped` (transverse z-field, n_e³r₃₃ − n_o³r₁₃), Wemple 1968 n via
  `fromResonanceWavelengths`, range 0.4–0.7 µm. r₄₂ noted, not modelled.
- Golden: α(300 K) 2.56806e-6, α(1500) 4.55606e-6, α(293.15) 2.51 (Hartwig via Paszkowicz 1995), mean 300–400 K 2.91863e-6,
  100 mm 20→120 °C 28.7412 µm; BaTiO₃ 632.8 nm n_o 2.40431, n_e 2.36059, V_π (d 1 mm, L 20 mm) 24.9137 V unclamped,
  80.655 V clamped, phase-only 22.9081 V.
- Gate: 1255 tests, 5 eslint warnings (unchanged); build green. 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "materials/thermal-expansion=Silicon: α(T) integrated" "materials/electro-optic=BaTiO₃ (unclamped)"`,
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
2. 7g-b (blocked): BaTiO₃ on `photorefractive` needs ε₁₁, ε₃₃ (Zgonik 1994 PRB 50, 5941) and the e-polarized r_eff(β)
   (Yeh 1989 IEEE JQE 25, 484, or Feinberg et al. 1980). Ask the user for these PDFs.
3. Other PDFs still wanted: Bai 2020 (APL Photonics 5, 031301), Patel 2001 (Yb:YAG κ), Siegman "Lasers" ch. 11/21,
   Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24).
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.
5. After Phase 7, user's choice: phone hero, or a traffic/SEO pass (ROADMAP).

## Non-obvious facts
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
