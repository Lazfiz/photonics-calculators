# Handover — 2026-11-05 (session 202 → session 203)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 202 did Phase 7f-b (sampled FPbase spectra in `imaging/fluorophores.ts`) on `phase-7/7f-b-fpbase-spectra`
(PR #240, to open with `/ship`). Next: Phase 7g materials data (`thermal-expansion` Si α(T), BaTiO₃ on electro-optic pages).

## State
- `imaging/fpbase-spectra.ts` (new, 19 KB, **CC BY-SA 4.0**, noted in its header and the README licence line): `FPBASE_SPECTRA`
  by protein name, `{ ex, em }` of `SampledSpectrum { start_nm, values }`, 1 nm samples scaled to 10000 at the max.
- `imaging/fluorophores.ts`: `Fluorophore.ex/em` are `Spectrum` (= sampled | `LogNormalBand`); the catalogue holds the sampled
  ones, the old fits sit in `exFit`/`emFit` (tests only). `spectrumAt(s, λ)`: linear between samples, linear ramp to 0 over
  the 1 nm past each end, λ·1e9 snapped to whole nm within 1e-9. `integrateSpectrum` node count uses `ceil(x − 1e-9)`, so
  whole-nm limits make Simpson equal the trapezoid sum. All three pages call `spectrumAt`; `bandAtWavelength` is fits only.
- Golden (raw FPbase API JSON, independent trapezoid): R₀ EGFP→mCherry 5.109 nm (fit 5.055), EGFP em 500–550 nm 0.70648,
  450–480 nm 0.005492 (fit 0), mCherry 572.5–647.5 nm 0.66266, EGFP ex 405 nm 0.1732, mCherry ex 640 nm 0.0043.
- Gate: 1253 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "imaging/fluorescence-spectra=5.11 nm" "imaging/fluorescence-spectra=70.6 %"`,
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
2. Phase 7g (ROADMAP): Si α(T) from Okada & Tokumaru 1984; BaTiO₃ via Zgonik 1994 (Petraru thesis Table 2.2; needs ε, r_eff(β)).
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21, Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24: Nipkow floor value).
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 202:** FPbase API `https://www.fpbase.org/api/proteins/spectra/?slug=<slug>&format=json` (states `default_ex`,
  `default_em`, 1 nm steps); site licence CC BY-SA 4.0 (footer of /about/). The sampled argmax differs from FPbase's `max`
  field by up to 4 nm (catalogue peaks are literature values). miRFP670's ex record starts at 520 nm (no Soret band).
  `tests/no-inline-constants.test.ts` flags data samples near constants (377 ≈ Z₀): add data files to its `dataTables`.
  `x·1e9` of a whole-nm λ can sit 1e-13 off: interpolation then leaves 1e-16 residue that beats `> 0` guards (snap it).
- **Session 201:** in ρ = sin θ/s pupil coordinates the aplanatic weight is (1 − s²ρ²)^(−1/4), which brightens the rim; it is
  not modelled (uniform pupil, disclosed). The defocused-pupil OTF is real and even in Δz. Strehl = ∫OTF ν dν / ∫MTF₀ ν dν
  (∫MTF₀ν dν = 1/8) checks any OTF quadrature. FT of |h|² in v units is 4π·OTF(q/2): lattice sums over pinholes become
  finite reciprocal sums (|G| < 2). A brute Simpson over √(1 − ρ²) at s = 1 is wrong at 3e-4; substitute ρ = sin φ.
  React Compiler lint (`preserve-manual-memoization`) fails a `useMemo` whose deps are derived in render; a module-level
  pure function called in render passes.
- **Session 200:** scanned PDFs: `python -E -P` (not `-I`, which hides the user-site pypdf and PIL) extracts page strips;
  stitch with PIL and Read the PNG. arXiv: `curl` + `pdftotext` works; headless Chrome screenshots of PDFs come out blank.
  ρ_Nebraska = conj(−r_p/r_s) of the characteristic-matrix r's. `csqrt` of a k = 0 argument has Im −0 and can return the
  growing branch. L&L joined h-factors with D_a: eqs. (5.3.16)–(5.3.17).
- **Session 199:** for a unimodal f, Σ f(x₀ + kΔx)·Δx ≤ ∫f + Δx·max f: a rigorous worst-phase bound for pulse trains over an
  aperture. Watch NaN in "Q > limit" searches: it reads as safe; write `!(Q <= limit)`. A dev server of this repo may already
  run on 3300 (`next dev` refuses a second one); SSR doesn't apply URL state, so read values with headless CDP (ui-check
  pattern; scratchpad scripts need `C:/…` paths).
- **Session 198:** `devctl` (CPU scheduler shared with another project) holds a *whole* Bash command line while it waits:
  in `a && b` neither part runs (exit 75), so an edit can silently not happen. Run edits and tests in separate calls, or
  long ones with `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Session 197:** check a quadrature against an independent brute-force integral rather than its own refinement.
- **Session 196:** Optica PDFs behind bot checks: the user can upload them; read one with the scratchpad `pdftext.mjs`
  (inflate streams, collect TJ/Tj; write it with the Write tool).
- **Session 195:** ports 3100 and 3200 can hold old `next start` servers of this site: run a branch on 3300 and check the
  served HTML for new text before screenshotting. The CDP screenshot script needs Windows paths (`C:/…`) for node.
- **Session 194:** verify a lock-in harmonic formula by brute force. Table values stored in SI need `+x.toPrecision(6)`.
- **Session 193:** headless checks: CDP `Page.captureScreenshot` with a `clip` at `Emulation.setDeviceMetricsOverride` width
  360; to test downloads, override `HTMLAnchorElement.prototype.click` and `URL.createObjectURL`. Node edit scripts in a quoted
  heredoc turn `\r\n` inside a template into real CRLF: write test text with the Write tool.
- **Session 192:** read ui-check's "console errors" line. Minified Next chunks are readable with `curl … | cut -c<from>-<to>`.
  A second ui-check right after another can hit ECONNREFUSED on 9333.
- **Session 191:** a registry modelNote can lag its page text after a value fix: when a value changes, grep the registry too.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script (fails unless the old
  text occurs exactly once).
- **Session 160:** Chrome extension screenshots time out on this site; use a headless CDP script (pattern in `scripts/ui-check.mjs`).
  A bare `python -` or `cat > file` with no input hangs. ITU-T PDFs: `itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-…!!PDF-E&type=items`.
  Port 3000 can be another project: use 3100. Prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome.
- **Charts:** `SimpleChart` pads axes 5 %; `SimpleLineChart` starts axes at the data min/max, has no y2. `null` and non-finite
  values break lines. `SimpleChart` draws nothing until measured.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`. NaN/∞
  show as "—" with a reason. JSX text needs `&apos;`; registry/JSX text can't hold `{…}`. `npm run dev` touches
  `next-env.d.ts`: `git checkout` it.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`, imports as `C:/dev/…`).
  `git grep` skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; never `taskkill /IM chrome.exe`.
