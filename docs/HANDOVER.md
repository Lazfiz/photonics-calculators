# Handover — 2026-10-24 (session 147 → session 148)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 147: **Findings 4d-c-a** done on `phase-4/findings-4d-c-a` (PR #178): sourced n₂ and β presets (DeSalvo 1996, Bristow 2007).
Next: **Findings 4d-c-b** (`brillouin-scattering`, `raman-scattering`, rare-earth σ, `acousto-optic`).

## State
- `kerr-index.ts`: `n2FromEsu` (40π n₂/(c n₀)); + MgF₂, KBr, LiNbO₃, KTP, tellurite (1064 nm), silicon (1800 nm): 19 media.
- `two-photon.ts`: `TpaMedium.gap` direct | effective (DeSalvo E′_g) | indirect; `absorptionEdge_eV`, `linearEdge_eV`,
  `indirectF2`, `indirectBeta` (Bristow C = 43 cm/GW), `mediumBeta`, `mediumRegime` ("outside-fit" < 850 nm); 14 media.
- Tests: 1089 pass.

## Next actions
1. `/ship` this branch. Defaults unchanged; post-merge-check e.g. `materials/two-photon-absorption?material=silicon&wavelength=1220`
   (β 1.839), `materials/nonlinear-index?material=ktp&wavelength=1064` (2.37e-15 cm²/W). No release unless asked.
2. Findings 4d-c-b, then 4e (wave-optics defaults from memory), then 4f (cross-cutting).

## Non-obvious facts
- **Session 147:** CREOL papers download as `api.creol.ucf.edu/Publications/<n>.pdf` (DeSalvo 1996 = 1814, Sheik-Bahae PRL 1990 = 1805;
  find numbers by web search); van Driel's papers at `physics.utoronto.ca/~vandriel/papers/`. No pdftoppm here, so the Read tool can't
  render PDFs: render a page with `uv run -q --with pymupdf python <script>` (fitz `page.get_pixmap(dpi, clip).save(png)`) and Read the PNG.
  Scanned IEEE tables OCR to garbage with pdftotext. The DTIC copy returned HTML.
- **Session 146:** editing files while a background `npm run check` runs leaves its result stale: `TaskStop` it and rerun.
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
