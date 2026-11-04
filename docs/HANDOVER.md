# Handover — 2026-11-04 (session 197 → session 198)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 197 did Phase 7b (free-space comms: hard-aperture averaging, field-stop clipping, Gaussian Schell-model antenna) on
`phase-7/7b-fso` (PR #235). Next: Phase 7c (lasers: `q-switched-laser` g₀l and Degnan coupling, OPO PPLN preset) on `phase-7/7c-lasers`.

## State
- `physics/math.ts`: `besselJ1Fast` (A&S 9.4.4/9.4.6, < 1e-7), `besselI0ScaledFast` (e^(−x)I₀, A&S 9.8.1/9.8.2, ≤ 5e-7 rel),
  `integrateGaussLegendre8(f, a, b)` (one 8-point panel; tile it yourself).
- `free-space-comms/turbulence.ts`: `hardApertureFactor(d²)` (exact weak plane-wave A, hard aperture; ≈ 0.5 ms),
  `fieldStopFraction(θ, D, λ, r₀, method)` (long-exposure EE, large-v series beyond 100 periods), `fieldStopHalfAngle(f, D, λ, r₀)`,
  `sphericalFriedParameter` (1.8011× plane r₀). `aperture-averaging` has a hard/Gaussian select (default hard);
  `receiver-fov` has Cn², distance and a plane/spherical r₀ select (default spherical) and multiplies the signal by EE.
- `free-space-comms/link-budget.ts` `gsmFarField(α, γ, M²)` → {efficiency g, width u at 1/e², intensity(u)}: Gori tilted-copy
  average of the clipped coherent pattern; coherent (Klein–Degnan) for M² − 1 < 1e-6; Q grid step min(0.05, 0.2/σ),
  ≤ 0.2 s at α 3, M² 10. `optical-antenna` M² input is 1–10.
- Gate: 1234 tests, 5 eslint warnings (unchanged). 411/411 tiered, 0 known issues.

## Next actions
1. `/ship`; merge on the user's yes. Release only on request, then:
   `node scripts/post-merge-check.mjs <sha> free-space-comms/aperture-averaging free-space-comms/receiver-fov free-space-comms/optical-antenna`
   then `node scripts/ui-check.mjs https://photonics-calculators.vercel.app` (expect ALL PASS, 0 console errors).
2. Phase 7c (ROADMAP).
3. Ask the user for PDFs: Bai 2020 (APL Photonics 5, 031301: abstract 79 cm/GW vs body 60 ± 9), Patel 2001 (Yb:YAG κ at
   10 at.%), Siegman "Lasers" ch. 11/21 pages.
4. KRS-5 by hand: `materials/transparency-range?material=krs5` at 10 µm: n 2.3707, loss 28.4 %.

## Non-obvious facts
- **Session 197:** the GSM convention: σ_g = w/√(M⁴ − 1) with w the 1/e² *intensity* radius (Mandel & Wolf §5.6.4, w = 2σ_S);
  a variable named `m2` already holds M², so M⁴ is `m2*m2` (one bug from `m2 ** 4`). Simpson on a Q grid with |A(Q)|² fringes
  needs step ≈ 0.05 for 1e-6; check a quadrature against an independent brute-force integral (4-D on-axis CSD, 2-D Cartesian
  convolution) rather than its own refinement. Oscillatory Bessel tails: integrate the mean envelope analytically past a cutoff
  and subtract the end term. Horizontal links take the spherical-wave r₀ (point source); plane wave is for downlinks.
  Mellin–Barnes (GR 6.574.2) gives both asymptotic ends of ∫w(t)[2J₁(dt)/(dt)]²dt: good golden values for any filter integral.
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
