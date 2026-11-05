# Handover — 2026-11-05 (session 201 → session 202)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 201 did Phase 7f-a (`mtf` exact-phase high-NA defocus, `spinning-disk` pinhole crosstalk) on `phase-7/7f-imaging`
(PR #239). Next: Phase 7f-b (FPbase-sampled spectra in `imaging/fluorophores.ts` and its pages).

## State
- `imaging/diffraction-mtf.ts`: `highNaDefocusOtf(ν, D = nΔz/λ, s = NA/n)` (2D overlap on Gauss–Legendre grids, x = (1−ν)(1−τ²),
  y = Y·t(2−t); NaN past `MAX_HIGH_NA_PHASE` = 250 rad), `highNaDefocusStrehl(D, s)` (closed form, series for z < 0.5).
  Page: paraxial and exact rows, exact curve on the chart. Default (NA 0.4, 3 µm): OTF(0.5) paraxial 0.1343, exact 0.1202.
- `imaging/confocal.ts`: `pinholeSectionFourier(u, P)`, `spinningDiskSection(P, pitchAU)` → `{response(u), floor,
  halfWidthU}` (lattice sum ≤ `SPINNING_DISK_MAX_PITCH_AU` = 20, floor only above), `confocalAxialCoordinate` (high-NA u),
  private fast `hopkinsOtf`. Page: disk section FWHM, floor 4.45 %, "≈ 39 µm" thick-sample line, response-vs-z chart.
- Gate: 1252 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "imaging/spinning-disk=4.45 %" "imaging/mtf=0.1202"`,
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
2. Phase 7f-b (ROADMAP): FPbase spectra are CC BY-SA; fetch sampled spectra for the 8 FPs, keep the FPbase fits as fallback.
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21, Degnan 1989, Egner, Andresen & Hell 2002 (J. Microsc. 206, 24: Nipkow floor value).
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 201:** in ρ = sin θ/s pupil coordinates the aplanatic weight is (1 − s²ρ²)^(−1/4) (√cos θ times dθ ∝ dρ/cos θ),
  which brightens the rim; it is not modelled (uniform pupil, disclosed). The defocused-pupil OTF is real and even in Δz,
  so only cos of the phase difference is integrated over a quadrant. Strehl = ∫OTF ν dν / ∫MTF₀ ν dν (∫MTF₀ν dν = 1/8)
  checks any OTF quadrature. FT of |h|² in v units is 4π·OTF(q/2): lattice sums over pinholes become finite reciprocal
  sums (|G| < 2). A brute Simpson over √(1 − ρ²) at s = 1 is wrong at 3e-4; substitute ρ = sin φ. React Compiler lint
  (`preserve-manual-memoization`) failed a `useMemo` in spinning-disk; a module-level function called in render passed.
  Port 3300 already had this repo's dev server (serving the working tree): `next dev -p 3300` then exits 1.
- **Session 200:** scanned PDFs: `python -E -P` (not `-I`, which hides the user-site pypdf and PIL) extracts page strips;
  stitch with PIL and Read the PNG. arXiv: `curl` + `pdftotext` works; headless Chrome screenshots of PDFs come out blank.
  ρ_Nebraska = conj(−r_p/r_s) of the characteristic-matrix r's. `csqrt` of a k = 0 argument has Im −0 and can return the
  growing branch. L&L joined h-factors with D_a: eqs. (5.3.16)–(5.3.17).
- **Session 199:** for a unimodal f, Σ f(x₀ + kΔx)·Δx ≤ ∫f + Δx·max f (each sample bounded by its outer interval; the two
  around the mode share one): a rigorous worst-phase bound for pulse trains over an aperture. η (disc ⊛ Gaussian) is
  log-concave (Prékopa). It is up to 1.7× loose when Δx ≈ L (one centred pulse per pass). Scanned evaluations can't
  exceed the stationary beam's limit (no window carries more); the FWHM pass convention can make the levels 2 % stricter,
  hence the floor. Watch NaN in "Q > limit" searches: it reads as safe; write `!(Q <= limit)`. At small r the pass
  (W/v, v ∝ r) can outlast the exposure → scannedBeamLimits "invalid". A dev server of this repo may already run on 3300
  (`next dev` refuses a second one); SSR doesn't apply URL state, so read values with headless CDP (ui-check pattern;
  scratchpad scripts need `C:/…` paths and must not end mid-function when sliced from ui-check).
- **Session 198:** `devctl` (CPU scheduler shared with another project) holds a *whole* Bash command line while it waits:
  in `a && b` neither part runs (exit 75), so an edit can silently not happen. Run edits and tests in separate calls, or
  long ones with `run_in_background`, and check `git diff --stat` before trusting a test count.
- **Session 197:** check a quadrature against an independent brute-force integral rather than its own refinement;
  Mellin–Barnes (GR 6.574.2) gives both asymptotic ends of ∫w(t)[2J₁(dt)/(dt)]²dt. A variable `m2` holds M²: M⁴ is `m2*m2`.
- **Session 196:** Optica PDFs behind bot checks: the user can upload them; read one with the scratchpad `pdftext.mjs`
  (inflate streams, collect TJ/Tj; write it with the Write tool). The React Compiler rule `preserve-manual-memoization`
  fails `useMemo` whose deps are derived in render; prefer plain render code or a module-level pure function.
- **Session 195:** ports 3100 and 3200 can hold old `next start` servers of this site: run a branch on 3300 and check the
  served HTML for new text before screenshotting. The CDP screenshot script needs Windows paths (`C:/…`) for node.
- **Session 194:** verify a lock-in harmonic formula by brute force (sample, take the Fourier component at j·f_r). Table
  values stored in SI need `+x.toPrecision(6)` for display and equality checks.
- **Session 193:** headless checks: CDP `Page.captureScreenshot` with a `clip` at `Emulation.setDeviceMetricsOverride` width
  360; to test downloads, override `HTMLAnchorElement.prototype.click` and `URL.createObjectURL`. Node edit scripts in a quoted
  heredoc turn `\r\n` inside a template into real CRLF: write test text with the Write tool.
- **Session 192:** read ui-check's "console errors" line (it once didn't fail on them). Minified Next chunks are readable with
  `curl …/_next/static/chunks/<file>.js | cut -c<from>-<to>`. A second ui-check right after another can hit ECONNREFUSED on 9333.
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
