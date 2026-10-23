# Handover — 2026-10-23 (session 140 → session 141)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 140: **Findings 4c-a**, branch `phase-4/findings-4c-leftovers` (PR #171). Reviewer on the claims → sources → fixes +
goldens → reviewer on the diff (no formula bugs; four text claims corrected). Next: Findings 4c-b (`intensified-ccd` first).

## State
- `scrambler.ts`: `lockedGroup` finds stages locked at q·f_i = p·f_j (p, q ≤ 12, 1e-9 relative) and their common period;
  `scramblerMeanMueller` averages E_T[… M_locked(t) … E[M_free] …] (trapezoid for sines, N from the bandwidth; Simpson
  between ramp flybacks). Stages have a drive phase φ (page input, deg). Goldens: 1:1 in phase 0.884815608, antiphase
  0.371442 (A&S J₀), product of means J₀(1.5) = 0.5118; brute-force agreement 1e-10 (sine), 1e-6 (ramp).
- `optical-sectioning-thickness`: wave-optical section (`confocal.ts`) beside Wilhelm; Wilhelm 23 % (low NA) to ≈ 140 %
  (NA → n) above it; 45 % at the defaults (3.54 vs 2.43 µm).
- `photoemission.ts`: `PHOTOCATHODE_DARK_EMISSION` (Burle TP-136 Table I, 25 °C), `effectiveThermionicBarrier` (K₂CsSb
  0.02 fA/cm² → ψ 1.40371 eV), `streakWindow` = min(N·p, L_screen)/v. vacuum-photodiode: dark from the measured value, stray C
  input (Hamamatsu PMT handbook Eq. 5-7). streak-camera: screen 18 mm and tube spread 0.8 ps (C16910), undersampling flag.

## Next actions
1. `/ship` this branch. Post-merge value: `imaging/optical-sectioning-thickness=2.43`. No release unless asked.
2. Findings 4c-b: `intensified-ccd` (spot spread, SNR label, F, P43 η; notes and refs in ROADMAP), then the
   imaging/spectroscopy leftovers if they fit.

## Non-obvious facts
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
- **Session 135:** NASA NTRS PDFs download (`https://ntrs.nasa.gov/api/citations/<id>/downloads/<id>.pdf`; metadata at
  `/api/citations/<id>`): Macleod's "Moisture adsorption in optical coatings" is 19890003956. GSFC CCMPP presentations download via
  WebFetch (binary saved, then `pdftotext`): Edwards 2021 quotes Ma et al. eqs. 17a–e. The pdx.edu Peck 1986 PDF 403s.
  `npx tsx --test` on one file can take > 2 min on this disk: run it in the background.
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
