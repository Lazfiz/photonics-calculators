# Handover — 2026-10-24 (session 150 → session 151)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 150: **Findings 4e-b** done on `phase-4/findings-4e-b` (PR #181): sourced OPO, thin-disk and dye-laser defaults.
Next: **Findings 4f** (cross-cutting: URL clamping codemod, `erf`/`sinc` copies, search relevance floor).

## State
- `uniaxial-data.ts`: `BBO_TAMOSAUSKAS` (Opt. Mater. Express 8, 1410 (2018)), kept out of `UNIAXIAL_CRYSTALS` so dropdowns don't change.
  `nonlinear-crystals.ts`: `BBO_D` (EKSMA d22 2.2, d31 0.08 pm/V).
- `optical-parametric-oscillator.ts`: `bboTypeICut(λp, λs)` → θ, n_p/n_s/n_i, walk-off, d_eff (NaN out of Sellmeier range). Page card
  "BBO type I cut" + "Use these BBO values". Defaults 532 → 800 nm: θ 22.12°, n 1.6555/1.6604/1.64576, ρ 3.114°, d_eff 2.068 pm/V.
- Thin-disk Yb:YAG: σ_e 2.4, σ_a 0.16, σ_ap 0.76, σ_ep 0.22 (×1e-20 cm², Chanteloup 2014 Table 1), τ 0.951 ms, η_h 0.087 = 1 − λ_p/λ,
  κ 7 W/(m·K) (Chénais 2006): P_th 41.68 W, slope 0.6507, ΔT 33.35 K.
- Dye Rh6G: σₑ 1.1e-16 cm², τ 4.2 ns (Falkenstein 1978), σ_T 3.7e-17 (Pavlopoulos 1988, 77 K glass), k_ST 3.4e6/s, τ_T 0.25 µs
  (Webb 1970, air-saturated): triplet factor 0.7199, K_T 0.286 (Phillion 1974 measured 0.35 ± 0.02).
- Tests: 1101 pass. Build green; ui-check load of the 3 pages: 0 console errors.

## Next actions
1. `/ship` this branch. Post-merge-check (only after a release the user asks for): `wave-optics/thin-disk-laser=41.68`
   `wave-optics/optical-parametric-oscillator=2.068`. No release unless asked.
2. Findings 4f (cross-cutting): URL clamping via codemod, merge local `erf`/`sinc` copies into `src/physics/math.ts`, search
   relevance floor.

## Non-obvious facts
- **Session 150:** Chénais 2006 (Yb thermal review) is open at arXiv:0704.0701; Chanteloup 2014 (HPL) is open at researching.cn.
  Falkenstein 1978 and Penzkofer papers are OCR PDFs at epub.uni-regensburg.de: digitize figures by pixel analysis and check the tick
  calibration against a tabulated value. Pavlopoulos 1988 is the DTIC ADA208291 reprint on archive.org. Tamošauskas BBO coefficients
  are in arXiv:2111.01212's supplement code. Optica abstract pages show tables of paywalled papers to WebFetch; OpenAlex
  (`api.openalex.org/works/doi:<doi>`) gives abstracts. Subagent numbers need checking against the rendered source. Node 24 test
  output prints `ℹ pass N`, not TAP `# pass`. A double-quoted `node -e` with backticks is shell-expanded: write a .cjs file.
  Headless `--dump-dom` wrote empty files under devctl CPU load.
- **Session 148:** patents.google.com holds full text of old patents (US 3,661,441 tables of TeO₂/LiNbO₃ M₂); Isomet app notes are PDFs
  at `isomet.com/App-Manual_pdf/`. Melkumov 2004 is arXiv:1502.02885 (Appendix 2, pm²); its pdftotext rows are shifted by one, so
  render the page. Markevich & Chulkov 2016 is CC BY at vestifm.belnauka.by. 2005 Opt. Express DOIs use `OPEX` (10.1364/OPEX.13.010266):
  check with `crossref.mjs -q`. pdftotext scrambles Opt. Express table rows: render them.
- **Session 147:** CREOL papers download as `api.creol.ucf.edu/Publications/<n>.pdf` (DeSalvo 1996 = 1814, Sheik-Bahae PRL 1990 = 1805;
  find numbers by web search); van Driel's papers at `physics.utoronto.ca/~vandriel/papers/`. No pdftoppm here, so the Read tool can't
  render PDFs: render a page with `uv run -q --with pymupdf python <script>` (fitz `page.get_pixmap(dpi, clip).save(png)`) and Read the PNG.
  Scanned IEEE tables OCR to garbage with pdftotext. The DTIC copy returned HTML.
- **Session 145:** devctl queues commands when another project's cargo job holds the CPU and can skip a whole `&&` chain
  ("not started after 61 s", exit 75): heredoc writes and edits in that chain never ran. Keep edits and test runs in
  separate calls; run tests with `run_in_background`. Scratchpad probes import the repo with 9 `../` (`../../../../../../../../../dev/…`).
- **Session 144:** web.archive.org holds vendor PDFs that block scripts: list captures with `web.archive.org/cdx/search/cdx?url=<url>&output=txt`,
  fetch `/web/<ts>id_/<url>` (a capture can be truncated at 1 MiB: take an older one). Amorphous Materials sheets (AMTIR-1 2024,
  AMTIR-6 = As₂S₃, comparison ver 5: `pdftotext -table` unscrambles it), Norland NOA sheets, Corning ULE and Kaye & Laby
  (`kayelaby.npl.co.uk/general_physics/…`) came that way. SCHOTT 2017 data sheets: `refractiveindex.info/download/data/2017/schott_2017-01-20.pdf`
  (Explanations: TIE-19 validity); refractiveindex.info `data/specs/schott/optical/<glass>.yml` has α and density. NIST-JANAF tables
  curl (`janaf.nist.gov/tables/Mg-008.txt` = MgO cr); NIST cryogenic pages (`trc.nist.gov/cryogenics/materials/…`) fit (L − L₂₉₃)/L₂₉₃.
  Check a data-sheet c_p against 3·atoms·R/M: Crystran's GaAs 360 J/(kg·K) exceeds Dulong–Petit.
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
