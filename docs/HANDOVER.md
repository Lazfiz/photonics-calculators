# Handover — 2026-10-24 (session 149 → session 150)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 149: merged PR #179; **Findings 4e-a** done on `phase-4/findings-4e` (PR #180 to open): sourced χ⁽²⁾ d_eff, diode laser, injection locking.
Next: **Findings 4e-b** (thin-disk Yb:YAG, dye Rh6G, OPO BBO-like defaults), then 4f (cross-cutting).

## State
- `three-wave.ts`: `LINBO3_D33_1313` (19.5 pm/V, Shoji 1997 Table 10, congruent), `qpmDeff` = 2d/π. SFG/DFG/OPA default d_eff 14 → 12.4 pm/V.
- `diode-laser.ts`: `radiativeShare` BN²/R. Page defaults g₀ 1200/cm, N_tr 1.8, B 1e-10, C 3.5e-30 (De Koninck 2025 Suppl. Table 1),
  A 4e8/s, n_g 3.9 (Wenzel 2021 Table I): N_th 3.505e18 cm⁻³, I_th 12.031 mA, share 44.17 %.
- `injection-locking.ts`: `facetCouplingRate` (1 − R)c/(2n_gL√R); page has L/R/n_g inputs and a "Use this k_c" button; k_c/2π 24.51 GHz,
  α 1; range −3.466 … +2.451 GHz at ρ = 0.01.
- Tests: 1096 pass. Build green; ui-check load of the 5 pages: 0 console errors.

## Next actions
1. `/ship` this branch. Post-merge-check (only after a release the user asks for): `wave-optics/diode-laser-resonator=12.03`
   `wave-optics/injection-locking=24.51` `wave-optics/sum-frequency=72.07`. No release unless asked.
2. Findings 4e-b: thin-disk (Koerner 2012 JOSA B is paywalled; try open Opt. Express Yb:YAG papers or theses), dye laser (Webb 1970
   paywalled), OPO page (n 1.65/1.53, d_eff 2.0, walk-off 0.5° are BBO-like guesses: compute from BBO Sellmeier + tensor, as in materials).
3. Findings 4f (cross-cutting).

## Non-obvious facts
- **Session 149:** Optica abstract pages (`opg.optica.org/josab/abstract.cfm?uri=josab-14-9-2268`) show the tables of paywalled papers to
  WebFetch (Shoji Tables 6, 10, 12). OpenAlex gives abstracts of paywalled IEEE papers: `api.openalex.org/works/doi:<doi>`,
  `abstract_inverted_index`. A subagent's numbers needed checking: it read Wenzel's g′N_tr (a modal gain, m⁻¹) as 3170 cm⁻¹ and the
  nano-ridge "4 × 10⁷ s" A as a lifetime. pdftotext scrambles Wenzel's Table I: render it. Chrome `--dump-dom` exits 75 when devctl
  queues behind another project's cargo job: rerun with `run_in_background`. Stop a background check before editing (stale).
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
