# Handover — 2026-10-23 (session 143 → session 144)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 143: Findings 4d was split into a/b/c; **4d-a** done on `phase-4/findings-4d-a` (PR #174): KTP on `electro-optic`, BiBO
indices on `nonlinear-crystals`; the physics reviewer passed both. Next: **Findings 4d-b** (glasses and polymers).

## State
- New `src/physics/materials/biaxial-data.ts`: `BIAXIAL_CRYSTALS` (ktp: Kato & Takaoka 2002; bibo: Umemura 2007, with K term),
  `biaxialIndices(id, λ)` → {nx, ny, nz} (NaN outside the fit), `biaxialRange`. `tests/materials-biaxial.test.ts`.
- `pockels.ts`: `POCKELS.ktp` (transverse; `indices` returns {no: n_y, ne: n_z}, r₂₃ stored in `r13`, labels in the new `perp` field).
- `nonlinear-crystals.ts`: `yzPlaneMatchingAngle(ny, nz, target)`, `BIBO_THETA` (11.196° from Z, shown as 168.8°). 1075 tests.

## Next actions
1. `/ship` this branch. No default value changed (KTP, BiBO aren't defaults); `?material=ktp` shows V_π ≈ 213.6 V. No release unless asked.
2. Findings 4d-b: `optical-glass-catalog` TIE-19 limits in Chrome, `infrared-glass`, `thermal-expansion`, `polymer-optics`,
   `heat-capacity` θ_D; reviewer pass per claim first.

## Non-obvious facts
- **Session 143:** refractiveindex.info has KTP (Kato α/β/γ), BiBO (Umemura), BaTiO₃ (Wemple, Johnston), Bi₁₂SiO₂₀ (Gospodinov) and
  LiTaO₃ (Bond) sets; list a folder with `gh api repos/polyanskiy/refractiveindex.info-database/contents/database/data/main/<M>/nk`.
  Formula 4 = `fromPoleForm(A, [B…], [C…], range, K)` when the exponents are 0/1. HAL (hal-iogs) is behind Anubis (needs a
  browser); OSTI refuses connections; git.fossee.in 502s. CASTECH's BiBO page curls (walk-off 25.6 mrad, d_eff 3.0). BaTiO₃
  Zgonik tensors: Petraru thesis `kups.ub.uni-koeln.de/1050/1/thesis_petraru_final.pdf` Table 2.2. Biaxial YZ-plane cuts: θ and
  180° − θ differ in d_eff (point group 2, d₁₄), so keep the source's convention.
- **Session 142:** Hamamatsu C16910 sheet (SHSS0026E) and the Guide to Streak Cameras (SHSS0006E) download with curl;
  `pdftotext -layout` puts specs in columns ≈ 160+ (`cut -c160-330`). AIP APL reprints sometimes sit on university servers
  (Shakya & Chang 2005 at `api.creol.ucf.edu/Publications/4970.pdf`). devctl blocks a whole `&&` chain when the CPU is busy,
  so edits chained before a test never ran: edit first, run tests in a separate call (background).
- **Session 141:** Photek PDFs download with curl (`photek.com/wp-content/uploads/2021/08/PH-DS039-ImageDiode-Rev02-Aug21.pdf`
  gives photons/e⁻ at 5 kV; the intensifier sheet PH-DS001 only relative efficiencies), as does the Andor iStar spec
  (`andor.oxinst.com/downloads/uploads/andor-istar-ccd-imaging-specifications.pdf`); ipo.exosens.com doesn't resolve. Data-sheet
  intensifier noise factors are amplitude ratios (EMCCD 1.4 = √2): square them. A spot read through its matched filter collects
  even background from κ ≈ N_eff/2 pixels. Monte Carlo probes: `Math.random`, not an LCG (it biased a variance by 1–2 %).
  Backticks inside a bash-quoted `node -e` script get command-substituted: write a .mjs file or use Edit.
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
- **Session 133:** `timeout N npx next start` kills the server after N s (ui-check then says "not hydrated"; a leftover :3100 listener gives ChunkLoadError): allow ≥ 300 s. rp-photonics.com 403s to WebFetch.
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
