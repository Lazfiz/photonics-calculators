# Handover — 2026-10-22 (session 134 → session 135)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 134: **materials fix part 8a** (heat-capacity, thermal-conductivity-optics, damage-threshold, radiation-damage), branch
`phase-4/materials-fix-8a`, PR #165 to open. Next: part 8b (merge aging-effects, contamination, humidity-effects into
thin-film/environmental-stability, each with a redirect). 414 pages.

## State
- `src/physics/materials/heat-capacity.ts`: `debyeFunction(x)` (Simpson, T³ law beyond x = 50), `debyeMolarHeatCapacity(θ, T, atoms)`,
  `scaledHeatCapacity(cRef, tRef, θ, T)`, `heatInput(…, mass, T1, T2)`; `HEAT_CAPACITY_MATERIALS` si/ge/caf2/lif. Golden: D(1) 0.95173,
  D(10) 0.075821, Si Debye 300 K 0.71248 J/(g·K), Si 200 K = Desai 556.9 J/(kg·K), Q 10 g 293.15→473.15 K 1387.28 J.
- `thermal-conduction.ts`: `slabConductionRise` Pd/(kA), `cylinderCentreRise` P/(4πkL), `rodThermalLens` 2kA/(P dn/dT) (Koechner rod;
  the slab `slabThermalLens` has half that f). k and dn/dT from `WINDOW_MATERIALS` (Crystran). FS 1 W, 10 mm, 100 mm²: 72.46 K, 5.766 K, 21.40 m.
- `laser-damage.ts`: `scaleDamageThreshold(F, τref, τ, a = ½)`, `gaussianPeakFluence` 2E/(πw²), `energyAtFluence`,
  `THERMAL_SCALING_MIN_TAU` 20 ps. `radiation-induced-loss.ts`: `inducedAttenuation` A₁D^f (dB/m), `internalTransmission`, `doseForLoss`.
- URL keys: heat-capacity `material`, `cRef`/`thetaD`/`density` (0 = preset), `temp`, `mass` (g), `t1`/`t2` (K; old °C `tempFrom`/`tempTo`
  dropped); thermal-conductivity `material`, `k`, `dndT` (1e-6/K, 0 = preset), `thickness`, `area`, `power`; damage-threshold `fRef`,
  `tauRef`, `tau` (ns), `exponent`, `energy`, `diameter` (mm, 1/e²); radiation-damage `a1`, `exponent`, `dose` (Gy), `length` (mm), `lossBudget`.
- Tests: `tests/materials-thermal-damage.test.ts`. Materials 24 / 30 tiered, 5 `knownIssue`s; 407 / 414 total.

## Next actions
1. `/ship` this branch. Release-check values: `materials/thermal-conductivity-optics` "72.46", `materials/damage-threshold` "7.071",
   `materials/radiation-damage` "3.162", `materials/heat-capacity` "0.7143"; older ones in PR #141–#164. No release unless asked.
2. Materials fix part 8b (ROADMAP item 8). PR #155 findings: `gh pr view 155 --json body -q .body | grep -n -E "aging|contamination|humidity"`.
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
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
- **Session 130:** EKSMA data sheets download (`https://eksmaoptics.com/out/media/EKSMA_Optics_<BBO|LBO|KTP>_Crystals.pdf`);
  WebFetch of an Optica abstract page can read its tables (small model: cross-check the numbers).
- **Session 128:** MDPI PDFs 403 to curl and WebFetch; the Semantic Scholar cache sometimes works. Crossref every DOI and
  article number; add no sign convention a source doesn't state.
- **Session 127:** `git add` a new page directory or test before the gate (page tests list via git). A redirect can't add a
  query, so a merged preset page lands on the default.
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
- **Sources:** arXiv, TI notes, PDG, JACoW, APS PRAB, Europe PMC XML download; Optics Express, Appl. Opt., IEEE, Elsevier, nature.com don't.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`). `python -` hangs. `git grep`
  skips untracked files. CI ≈ 2–3 min. Wrap chrome/ui-check/server commands in `timeout <s>`; port 3100: `netstat -ano | grep :3100`,
  `taskkill //PID <pid> //T //F`; never `taskkill /IM chrome.exe`.
