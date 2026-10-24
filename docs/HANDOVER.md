# Handover — 2026-10-24 (session 145 → session 146)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 145: **Findings 4g-a** done on `phase-4/findings-4g-a` (PR #176): the first three Codex review findings, fixed and
physics-reviewed. Next: **Findings 4g-b** (QKD `optimalMu`, OPA signal > idler, graded-index cap, SERS max, ui-check label).

## State
- `fluorescence-lifetime.ts` `periodicDecay`: t − t₀ reduced into [0, T); explicit sum from the first pulse within 8σ ahead.
- `lockin.ts`: `referenceMatch(f_s, f_r, φ, τ, N, filter, ref)` → {harmonic, detuning_Hz, gain}; square reference g_k = 2√2/(kπ),
  picks the largest g_k·|H| (matched within 1e-9 relative wins), then cos φ (signed). `LockinInputs` now has `signal_Hz`,
  `reference_Hz` instead of `detuning_Hz`.
- `scrambler.ts`: `combinationLock` (n·f = 0, all n_k ≠ 0, |n_k| ≤ 12), `lockedGroup` extends a locked pair through it,
  `combinationMean` (Fourier lattice sum, exported; ramps 100 terms), `combinationResonance` (Σ|n| ≤ 5, 1 %). Page warns for both.
- Tests: 1083 pass. The scrambler combination test takes ≈ 20 s under load (brute-force references).

## Next actions
1. `/ship` this branch. Defaults unchanged on all three pages; post-merge-check e.g.
   `detectors/lockin-amplifier?signalFreq=3000&reference=square` (Output X 0.2122 µV at 1 µV) and
   `polarization/polarization-scrambling?stages=3&frequency1=13&frequency2=17&frequency3=30&axis2=22.5&axis3=45`
   (long-time DOP 0.0808). No release unless asked.
2. Findings 4g-b (evidence in ROADMAP "Codex review"), then 4d-c (nonlinear and scattering media).

## Non-obvious facts
- **Session 145:** devctl queues commands when another project's cargo job holds the CPU and can skip a whole `&&` chain
  ("not started after 61 s", exit 75): heredoc writes and edits in that chain never ran. Keep edits and test runs in
  separate calls; run tests with `run_in_background`. Scratchpad probes import the repo with 9 `../` (`../../../../../../../../../dev/…`).
  Sine-drive Fourier coefficients: J_−m = (−1)^m J_m must also apply when m = j·n_k is negative.
- **Session 144:** web.archive.org holds vendor PDFs that block scripts: list captures with `web.archive.org/cdx/search/cdx?url=<url>&output=txt`,
  fetch `/web/<ts>id_/<url>` (a capture can be truncated at 1 MiB: take an older one). Amorphous Materials sheets (AMTIR-1 2024,
  AMTIR-6 = As₂S₃, comparison ver 5: `pdftotext -table` unscrambles it), Norland NOA sheets, Corning ULE and Kaye & Laby
  (`kayelaby.npl.co.uk/general_physics/…`) came that way. SCHOTT 2017 data sheets: `refractiveindex.info/download/data/2017/schott_2017-01-20.pdf`
  (Explanations: TIE-19 validity); refractiveindex.info `data/specs/schott/optical/<glass>.yml` has α and density. NIST-JANAF tables
  curl (`janaf.nist.gov/tables/Mg-008.txt` = MgO cr); NIST cryogenic pages (`trc.nist.gov/cryogenics/materials/…`) fit (L − L₂₉₃)/L₂₉₃.
  Check a data-sheet c_p against 3·atoms·R/M: Crystran's GaAs 360 J/(kg·K) exceeds Dulong–Petit.
- **Session 143:** refractiveindex.info has KTP (Kato α/β/γ), BiBO (Umemura), BaTiO₃ (Wemple, Johnston), Bi₁₂SiO₂₀ (Gospodinov) and
  LiTaO₃ (Bond) sets; list a folder with `gh api repos/polyanskiy/refractiveindex.info-database/contents/database/data/main/<M>/nk`.
  Formula 4 = `fromPoleForm(A, [B…], [C…], range, K)` when the exponents are 0/1. HAL (hal-iogs) is behind Anubis (needs a
  browser); OSTI refuses connections; git.fossee.in 502s. CASTECH's BiBO page curls (walk-off 25.6 mrad, d_eff 3.0). BaTiO₃
  Zgonik tensors: Petraru thesis `kups.ub.uni-koeln.de/1050/1/thesis_petraru_final.pdf` Table 2.2. Biaxial YZ-plane cuts: θ and
  180° − θ differ in d_eff (point group 2, d₁₄), so keep the source's convention.
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
