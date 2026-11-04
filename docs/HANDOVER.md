# Handover — 2026-11-04 (session 199 → session 200)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 199 did Phase 7d (scanned mode on `lidar-safety`, safety-critical) on `phase-7/7d-lidar-scan` (PR #237).
Next: Phase 7e (thin film: ellipsometry transparent-film thickness, sputtering thermalisation, plasma h-factor).

## State
- New `laser-safety/scanned-pulse-train.ts`: `scannedPulseLimits(λ, d, {duration, prf}, scan, α)` → per limit `within`
  (trainLimit over the half-power pass duration, pulses centred), `pass` (scannedBeamLimits at P̄; per pulse P_max/(fρ),
  ρ = 1 + Δx·η(0)/L, or 1 + Δx/(d√(π/8)) under the actual-exposure rule), `reduced` (retinal C_P, n = passes in
  min(T, T₂) × ⌈(D + d)/Δx⌉, T_i grouping), `stationary` floor; levels pulse | pass | reduced | stationary.
  `lidarMaxEnergyAt` (stationary for any non-ok scan status), `lidarHazardDistance` (96-point log grid + bisection,
  NaN counts as over). `pulse-train.ts` now exports `pulsesIn`.
- `lidar-safety`: `mode` = stationary (default, old links unchanged) | scanned; keys `scanAngle` (360), `scanRate` (10 Hz),
  `scanDirection` (one). Default scanned: 9.14× at 10 m, max 1.09 µJ (within-pass rule 2 at the 5 µs joint), NOHD
  32.9 m vs stationary 146 m; ρ 1.15, C_P 0.833 (n 1300). Registry cites Schulmeister 2025 too.
- Gate: 1245 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> "laser-safety/lidar-safety=146"` (stationary default NOHD 146 m; the scanned
   values need `?mode=scanned`: 32.9 m, 9.14×) and `node scripts/ui-check.mjs https://photonics-calculators.vercel.app`.
2. Phase 7e (ROADMAP).
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages, Degnan 1989 (to cite its equation numbers).
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
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
- **Session 190:** Wayback `id_` URLs (`web.archive.org/web/<ts>id_/<url>`) open PDFs behind bot checks. CREOL hosts DeSalvo
  1996 at `api.creol.ucf.edu/Publications/1814.pdf`. To commit one hunk without touching the tree: `git hash-object -w` the
  partial file, then `git update-index --cacheinfo 100644,<sha>,<path>`.
- **Session 189:** a citation can be right in topic but hold no formula: read the equation, not just the DOI. Read data
  tables row by row. Sources that answer: Europe PMC full text for MDPI, ITU-T G.653/G.655/G.650.1/G.975.1. Commit messages
  with parentheses: write them to a file and `git commit -F`.
- **Session 188:** NIST ASD `lines1.pl?spectra=Hg+I&…&format=2`; SRM certificates at `tsapps.nist.gov/srmext/certificates/archives/`;
  Burle TP-136 at `psec.uchicago.edu/links/Photomultiplier_Handbook.pdf`; EMVA 1288 R3.1 at `emva.org`.
- **Editing:** long Bash heredocs with mixed quotes fail. Apply edits with a replace-once node script (fails unless the old
  text occurs exactly once).
- **Session 185:** NIST XCOM answers a plain curl POST (`xcom3_1`); CXRO: POST `/cgi-bin/atten.pl`, then GET the `/tmp/xray*.dat`.
- **Session 184:** Bai's group writes the [110] Brillouin tensor without the ½ of a unit strain (their p² is 4× standard).
  OpenAlex `abstract_inverted_index` rebuilds paywalled abstracts.
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
