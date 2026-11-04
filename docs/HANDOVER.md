# Handover — 2026-11-04 (session 196 → session 197)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 196 did Phase 7a (small options on five pages) on `phase-7/7a-small-options` (PR #234). Next: Phase 7b
(free-space comms: aperture averaging, receiver FOV, Gaussian Schell-model antenna), on `phase-7/7b-fso`.

## State
- `fiber-optics/gaussian-coupling.ts` `gapReflectionFactor(n_f, n_g, z, λ, w)`: gap reflections as a coherent sum of multiply
  reflected Gaussian beams over the single pass (Kogelnik & Li q-parameter). Airy for z ≪ z_R, the 1/(2m+1) series for z ≫ z_R.
  `splice-loss` uses it, with a fibre phase-index input. `connector-insertion-loss` stays on Airy × Gaussian on purpose (gap
  capped at 5 µm, ≤ 0.015 dB apart).
- `nonlinear-effects`: polarization select (K: co-polarized 1/1, standard 1.5/2, scrambled 2/2), source linewidth and
  Brillouin bandwidth inputs, using the existing `sbsThreshold` options.
- `wave-optics/four-wave-mixing.ts` `fwmLossyEvolution(γ, P₀, Δβ, α, L, samples)`: frame b = B·e^(−iθ/2), constant-coefficient
  matrix per segment with P at the midpoint, exact cosh/sinh step. Steps: αh ≤ 0.01 and γP₀L(αh)² ≤ 1e-5; [] above 10⁶.
  Spectrum is plain render code (≤ 96 ms for 401 points on 5 km HNLF); no useMemo (React Compiler lint rejects it here).
- `detectors/camera-snr.ts` `emCrossoverSignal`: S* = (σ_c² − (σ_EM/G)²)/(F² − 1) − C; `em-gain` has the conventional read noise.
- `imaging/super-resolution.ts` `stedLateralFwhm(λ, NA, ζ, λ_STED = λ)` = λ/(2NA√(1 + ζ(λ/λ_STED)²)); page input λ_STED 660 nm.
- Gate: 1230 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> imaging/super-resolution=42.1 fiber-optics/splice-loss fiber-optics/nonlinear-effects wave-optics/four-wave-mixing detectors/em-gain`
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app` (expect ALL PASS, 0 console errors).
2. Phase 7b (ROADMAP). `aperture-averaging` hard aperture: GR 6.574.2 was checked in session 173.
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 196:** Harke et al., Opt. Express 16, 4154 (2008) (user's PDF): Eq. 1 uses the *inhibition* wavelength;
  Eq. 7 d = d_c/√(1 + d_c²a²ζ). Their pattern (735 nm, NA 1.36) has a = 0.00347 nm⁻¹, 0.94 × our 2NA/λ_STED: a real doughnut
  is ≈ 6 % wider at high ζ (in the note and tests). Optica PDFs behind bot checks: the user can upload them. To read a PDF
  without tools, run the scratchpad `pdftext.mjs` (inflate each stream, collect the TJ/Tj strings). Write it with the Write
  tool: a heredoc mangles the regex backslashes. Probe with the exact γ (`nonlinearCoefficient`), not a rounded one, or 1e-4
  differences look like bugs. The React Compiler rule `preserve-manual-memoization` fails `useMemo` whose deps are derived
  in render; prefer plain render code or a module-level pure function.
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
