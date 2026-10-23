# Handover — 2026-10-23 (session 141 → session 142)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 141: **Findings 4c-b**, branch `phase-4/findings-4c-b` (PR #172), `intensified-ccd` only. The reviewer on the diff
found the background under-counted through the matched filter (fixed). Next: Findings 4c-c (`streak-camera`; data in ROADMAP).

## State
- `photoemission.ts`: `phosphorEfficiency` (inverse of `phosphorGain`), `PHOSPHOR_SCREENS` (Photek PH-DS039: P43 240, P46 55
  photons/e⁻ at 5 kV, 548/530 nm), `SpotStatistics` + `POINT_SPOT`, `gaussianSpotShares(fwhm ≤ 1000)` → peak, Σh²,
  c₃ = Σh³/(Σh²)², κ = Σ(h⋆h)²/(Σh²)² (separable sums). `intensifiedSnr(S, B, G_e, F_MCP, σ_r, spot)`: the 4th argument is now
  the tube's variance factor K_f², not F_MCP + 1/G_e. Var = S·G_e²(F + c₃/G_e) + B·G_e²(F·κ + N_eff/G_e) + N_eff·σ_r².
- Goldens (2 px spot): peak 0.1970835, Σh² 0.0988504, c₃ 1.3538208, κ 5.0565663 (brute-force 2-D); κ·Σh² → ½ for a wide
  spot; page defaults SNR 1.140756 (was 1.3163); B = S gives 0.475103.
- Page: URL key `mcpNoise` → `kf` (amplitude, default 1.6), new `spotFwhm` (px, default 2), screen 3–10 kV.

## Next actions
1. `/ship` this branch. Post-merge value: `detectors/intensified-ccd=1.14`. No release unless asked.
2. Findings 4c-c: `streak-camera` (M ≈ 2.8, 968 × 9.75 µm pixels, 35 lp/mm blur against the 0.8 ps tube default; see the
   ROADMAP note), then the imaging/spectroscopy leftovers if they fit.

## Non-obvious facts
- **Session 141:** Photek PDFs download with curl (`photek.com/wp-content/uploads/2021/08/PH-DS039-ImageDiode-Rev02-Aug21.pdf`
  gives photons/e⁻ at 5 kV; the intensifier sheet PH-DS001 only relative efficiencies), as does the Andor iStar spec
  (`andor.oxinst.com/downloads/uploads/andor-istar-ccd-imaging-specifications.pdf`); ipo.exosens.com doesn't resolve. Data-sheet
  intensifier noise factors are amplitude ratios (EMCCD 1.4 = √2): square them. A spot read through its matched filter collects
  even background from κ ≈ N_eff/2 pixels. Monte Carlo probes: `Math.random`, not an LCG (it biased a variance by 1–2 %).
  Backticks inside a bash-quoted `node -e` script get command-substituted: write a .mjs file or use Edit.
- **Session 140:** Burle Photomultiplier Handbook PDF: `psec.uchicago.edu/links/Photomultiplier_Handbook.pdf`; read its tables
  with `pdftotext -table` (`-layout` misaligns Table I; no pdftoppm). Hamamatsu PMT handbook 4th ed.: `…/etd/PMT_handbook_v4E.pdf`;
  C16910 data sheet SHSS0026E downloads. A data-sheet streak resolution is a system value, not a tube term. React Compiler skips a
  `useMemo` whose deps are clamped render values: compute the chart in an IIFE. Reviewer numbers from memory were wrong again
  (bialkali dark emission), check each.
- **Session 139:** tanh-sinh is too coarse in the middle (≈ 2.6σ spacing) for Gaussian-times-CDF integrands; a uniform rule is
  spectral only when the integrand is smooth and ≈ 0 at both ends. ∫φ(v)F(ln(y − e^v))dv has a sharp edge as e^v → y: substitute
  r = ln(1 − e^(v−u)). Brute-force references need a convergence check (linear-interp bias 8e-3 at 20 points/σ). Tune quadrature
  with an env-parametrised scratch copy of the module (`sed` the constants to `Number(process.env.K ?? …)`). `exp` round-off:
  1 − e^(−18σ) is exactly 1 for σ ≳ 1.85, so a log of it went −∞ and Simpson looped forever: cap panel counts.
- **Session 138:** ITU-T PDFs download with curl: `https://www.itu.int/rec/dologin_pub.asp?lang=e&id=T-REC-G.657-202408-I!!PDF-E&type=items`
  (the edition list at `/rec/T-REC-G.657/en`; check which is in force, 2016 is superseded). Optica full text (Opt. Express) reads in
  Chrome via `get_page_text` on `opg.optica.org/oe/fulltext.cfm?uri=oe-<vol>-<issue>-<page>`; WebFetch gets "Please wait".
  `javascript_tool` results holding URLs with query strings come back BLOCKED: use `find` or a known URL pattern. Reviewer
  claims from memory were wrong twice (A3 is not in G.657 (2024); G(V) attribution held), so check each before editing.
- **Session 137:** the Chrome extension works once Chrome is signed in to claude.ai (the Google popup failed "Couldn't verify your
  browser"; email sign-in worked). Thorlabs moved to slug URLs (`https://www.thorlabs.com/<family-slug>?tabName=Specs` or
  `Damage%20Thresholds`); old `objectgroup_id` links redirect to wrong products; index pages (`/polarizers`, `/crystal-polarizers`,
  `/polarizing-beamsplitters`) list the slugs. Pages are client-rendered (fetch returns a 1.3 KB shell). `javascript_tool` results
  truncate at ≈ 1000 characters: filter lines, or use `get_page_text`. Chrome tabs freeze when devctl runs another project's
  `cargo nextest` (CPU 100 %): fall back to headless `ui-check` / `--dump-dom`. **Port 3000 can be another project** (Planet
  Incubator): run this repo on 3100 and check the page title.
- **Session 136:** CXRO serves Henke tables (`https://henke.lbl.gov/optical_constants/sf/<el>.nff`) and its calculator by POST to
  `/cgi-bin/getdb.pl` (Formula, Density (-1 = default), Min, Max, Npts, Output=Text+File; the reply links `/tmp/xrayNNNN.dat`). Its β
  includes Compton, the .nff f₂ does not. refractiveindex.info YAML: `gh api -H "Accept: application/vnd.github.raw"
  repos/polyanskiy/refractiveindex.info-database/contents/database/data/<path>` (URL-encode each path segment). Acta Phys. Pol. A PDFs
  download (`przyrbwn.icm.edu.pl/APP/PDF/116/a116z442.pdf`). norlandprod.com refuses connections. A Crystran slug list is on
  `/optical-materials` (e.g. sapphire-al2o3, silicon-si). `.sort()` on an array literal drops its contextual type (string-literal fields
  fail tsc): declare the typed array, then sort a copy.
- **Session 134:** Crystran pages fetch with curl (`https://www.crystran.com/optical-materials/<slug>`, slugs from that index page; strip
  tags, grep "Specific Heat Capacity|Density"); no Debye temperatures there. NIST JPCRD reprints download
  (`https://srd.nist.gov/jpcrdreprint/<doi suffix>.pdf`, e.g. 1.555761 Desai). Heredocs halve backslashes (a regex `\s` arrives as `s`): write such scripts with Write.
- **Session 133:** `timeout N npx next start` kills the server after N s, so a later ui-check reports "not hydrated" on every page;
  a leftover listener on :3100 gives ChunkLoadError. Check `netstat -ano | grep :3100` and allow ≥ 300 s. rp-photonics.com 403s to WebFetch.
- **Sessions 120–125:** registry entries end with a `  },` line. A removed page breaks tsc (TS2307 in `.next/types/validator.ts`)
  until `rm -rf .next/types .next/dev/types`. A merge lowers the page floor. The merge codemod runs after appending to
  `redirects.json`. A user `next dev` on :3000 can garble `.next/dev/types`: delete it again.
- **Session 119:** a `useMemo` calling a heavy function makes the React Compiler skip the component: call a module-level function.
- **Sessions 113–115:** unsourceable constants: make them inputs or drop them, cite the defaults, log the gap. Next redirects keep
  the query string. Render a SimpleLineChart only with data. `besselJ0Fast` inside quadratures.
- **Session 107:** prefix `MSYS_NO_PATHCONV=1` for ui-check and chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `--dump-dom` reads hydrated values). Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Charts:** axis minimum at the data minimum, so round plotted values (6 decimals). ChartPanel sends scatter and bar traces to SVG
  `SimpleChart` (no legend layout, per-point colours, shapes; supports y2 and log axes; joins lines across NaN). Markers need
  `line.color` too. `SimpleLineChart` has no y2.
- **Pages:** `useURLState` in `.map` breaks hooks; per page `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, pass
  `xRaw` to the input. `detectors.ts`, `imaging.ts`, `materials.ts` registries are LF. NaN/∞ show as "—" with a reason. eslint:
  ≈ 85 old warnings, lint only changed files; JSX text needs `&apos;`. Prerendered HTML shows defaults.
- **Sources:** arXiv, TI notes, PDG, JACoW, APS PRAB, Europe PMC XML download; Appl. Opt., IEEE, Elsevier, nature.com don't (Opt. Express: Chrome).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
