# Handover — 2026-11-04 (session 200 → session 201)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 200 did Phase 7e (ellipsometry film thickness, plasma high-pressure h-factors, sputtering thermalisation from the
user's Westwood PDF) on `phase-7/7e-thin-film` (PR #238). Next: Phase 7f (imaging: FPbase spectra, spinning-disk crosstalk, mtf).

## State
- `thin-film/ellipsometry.ts`: `filmPsiDelta(d, θ, λ, n₁, {n, k}, n₀)` (three-phase, Nebraska), `filmThicknessPeriod`,
  `transparentFilmThickness(Ψ, Δ, θ, λ, n₁, sub)` → `{thickness ∈ [−D/100, 0.99 D), period, absX}`. Page keys `lambdaNm`
  (632.8), `filmN` (1.457), `subN` (3.882), `subK` (0.019); white Ψ-Δ film curve on the heatmap. Defaults stay bare Si (d 0.00).
- `thin-film/plasma-global-model.ts`: `geometry(R, l, n_g, Tₑ, T_g)` now with D_a (new field `Da`, `ambipolarDiffusion`);
  `electronTemperature` takes a number or a function of Tₑ; `argonDischarge` solves Tₑ with h. Defaults: Tₑ 2.5528 eV
  (was 2.59), D_a 97.0 m²/s. Page: regime note instead of a cut, sweep 0.1–100 mTorr, points outside the 1–7 eV fits left out.
- `thin-film/sputtering.ts`: Westwood 1978 `sputteredMeanFreePath` (eq. 2), `velocityPersistence` (eq. 7, Jeans),
  `thermalisationDistance(E₀, p, T, m_s, σ_s)` (eqs. 8, 13), `thermalisationEnergy` (eq. 13 inverted), `thompsonFractionBelow`
  ((E/(E+U))²), `sputteredAtomDiameter` (0.30–0.45 nm over 20–150 u). Page: thermalised share card and regime note; Al default 72 %.
- Gate: 1250 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "thin-film/plasma-deposition=2.55"` (default Tₑ, eV) and
   `"thin-film/ellipsometry-measurement=3.8820"` (default ⟨n⟩; film case `?psiDeg=41.055&deltaDeg=79.787` → 100.00 nm),
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
   Sputtering default: `"thin-film/sputtering-deposition=72 %"` (thermalised share).
2. Phase 7f (ROADMAP).
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301:
   abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at 10 at.%), Siegman "Lasers" ch. 11/21, Degnan 1989; L&L 2nd ed.
   §5.1 and §10.2 pages (check ν_i and the h_l equation, ROADMAP open finding).
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 200:** Westwood's eq. (7) typesetting is ambiguous: only 2M/(1+M)·[ln-term + polynomial-term] gives 0.406 at
  M = 1, → 1 as M → 0 and → 0 as M → ∞; his thermal end point is E_g = k_BT (Fig. 3 intercepts), not the gas mean speed.
  Scanned PDFs: `python -E -P` (not `-I`, which hides the user-site pypdf and PIL) extracts the page strips with pypdf; stitch
  them with PIL and Read the PNG.
- stackResponse ↔ Nebraska: ρ_Nebraska = conj(−r_p/r_s) of the characteristic-matrix r's (independent check
  for any ellipsometry formula). `csqrt` of a k = 0 argument has Im −0 and can return the growing branch: flip the sign after
  the root when the decaying one is needed. Keller & Simmons 1979 is open at bitsavers (`IBM_Journal_of_Research_and_Development/231/ibmrd2301E.pdf`)
  but its equations are CCITT scans: `pdftotext` gives only the OCR text, and headless Chrome `--screenshot` of a PDF (native
  viewer, or pdf.js from cdnjs on a local server) came out blank; no pdftoppm or PyMuPDF here. arXiv: `curl` + `pdftotext` works.
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
