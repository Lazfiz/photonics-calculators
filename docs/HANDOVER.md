# Handover — 2026-10-23 (session 138 → session 139)

**Start here:** read this file, then `docs/ROADMAP.md`. Don't read `docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 138: **Findings 4a** (fibre leftovers), branch `phase-4/fiber-smf-consistency`, PR #169. Each claim went through an
adversarial `physics-reviewer` pass, then the primary source (ITU PDF, Optica full text). Next: Findings 4b (FSO/comms bugs).

## State
- `macro-bending-loss.ts`: `MFD_FIT_V_RANGE = [1.2, 2.4]` (Marcuse 1977), shared with mode-field-diameter; macro-bending page
  default n₁ 1.4494 (was the group index 1.4682): 0.0852 dB/turn at 15 mm, 2.62 at 10 mm (1550 nm).
- `g657.ts`: ITU-T G.657 (08/2024) Tables 1–2. Categories `"B3" | "A2" | "A1"` (B2 withdrawn in 2024, no A3);
  `G657_MIN_MFD_UM = 8.2` (was `G657A_…`) applies to B3 too. bend-insensitive appends "but its MFD is below 8.2 µm".
- Elasto-optic factor written as ≈ 1.27× everywhere (n = 1.444, Nagano 1978); multi-core keeps the physical R_b (Hayashi 2011
  eq. 2; the 2019 erratum fixes only eq. 1 and a table). birefringence-fiber keeps Sakai–Kimura 1981 "as quoted in Rashleigh".
- 1063 tests. Fibre open findings removed from ROADMAP.

## Next actions
1. `/ship` this branch. Post-merge value: `fiber-optics/macro-bending-loss=0.0852`. No release unless asked.
2. Findings 4b: ber and bpsk-qpsk log axes, bpsk-qpsk RF noise floor, diversity-reception (fixed 3σ, equal SC/EGC/MRC gain,
   Fenton–Wilkinson margin). Same loop: reviewer attacks the claims → check primary sources → fix + golden tests → reviewer on diff.

## Non-obvious facts
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
  a leftover listener on :3100 gives ChunkLoadError. Check `netstat -ano | grep :3100` and allow ≥ 300 s. Doherty's NV review is
  arXiv:1302.3288. Barnes 1991 (Er σ): Southampton eprints blocks scripts; rp-photonics.com 403s to WebFetch; the Optica abstract
  of Moulton 1986 returned only "Please wait".
- **Session 132:** archive.org hosts the whole Bell System Technical Journal as OCR text:
  `https://archive.org/download/bstj<vol>-<issue>-<page>/bstj<vol>-<issue>-<page>_djvu.txt` (retry on a 500). Humbach 1996
  (J. Non-Cryst. Solids) is closed; its band positions are in arXiv:1402.0466 Table 2. The inline-constant test flags any literal
  within 1 % of a constant (1246e-9 ≈ μ₀): write such wavelengths as `1246 * NM`. devctl exit 75 skips a heredoc that writes a
  script too: write scripts with the Write tool, then run them.
- **Session 131:** CREOL papers download (`curl -L -A "Mozilla/5.0" https://api.creol.ucf.edu/Publications/<n>.pdf`). A garbled
  `pdftotext -layout` table often reads column by column without `-layout`. A `next start` left on :3100 serves the old build.
- **Session 126:** Crystran data sheets and refractiveindex.info YAML (via `gh api`) download; amorphousmaterials.com does not.
  Export a table as `Record<Id, Interface>` (not `as const satisfies`). Round long floats in a `style` to 3 decimals.
  Background `npm run check` "exit code 0" can hide a red tsc: read the log's `exit` line.
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
