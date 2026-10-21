# Handover — 2026-10-21 (session 126 → session 127)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 126: **materials fix part 2**, branch `phase-4/materials-fix-2`, PR #157. chalcogenide-glass, fluoride-glass →
infrared-glass; uv-materials → transparency-range (3 redirects, 424 → 421 pages). Next: **materials fix part 3** (uniaxial).

## State
- `src/physics/materials/window-materials.ts`: `WINDOW_MATERIALS` (20 materials: Crystran bands, dn/dT, conductivity, Knoop;
  dispersion = a `sellmeier-data` set, the ordinary ray of `uniaxial-data` sapphire/quartz, or a data-sheet n),
  `windowIndex`, `transmits`, `surfaceReflectance`, `fresnelLimitTransmission` = 2n/(n² + 1).
- `sellmeier-data.ts` gained lif, kbr, csi (Li 1976), as2s3 (Rodney 1958), zblan (Gan 1995); they show on chromatic-dispersion
  and optical-glass-catalog too. `src/components/transmission-bands.tsx`: log-axis band rows (HTML, not a chart).
- transparency-range keeps `wavelength` in **nm** (old links); infrared-glass keeps µm. Both clamp and hold `material` in the URL.
- `tests/materials-windows.test.ts`: Rodney 2.4777/2.4112, CsI Li vs Rodney 1955 < 6e-4, Crystran 2-surface losses (16 materials).
- Materials 5 / 37 tiered, 30 `knownIssue`s; 388 / 421 total; page floor 421; 988 tests.

## Next actions
1. `/ship` this branch. Values for a later release check: `materials/transparency-range=47.0` (`?material=ge&wavelength=10000`,
   T_max %), `materials/infrared-glass=2.4112` (`?material=as2s3`). Part 1: `materials/chromatic-dispersion=1.46260`,
   `materials/optical-glass-catalog=64.17`; older: PR #141–#156 descriptions. No release unless asked.
2. Materials fix part 3 (ROADMAP item 3): read the PR #155 description for each page's findings first
   (`gh pr view 155 --json body -q .body | grep -n -A3 "birefringent"`). `uniaxial-data.ts` already has quartz, calcite, MgF₂,
   sapphire, YVO₄, LiNbO₃, rutile; BBO (Eimerl) and KDP (Zernike) are to add.
3. Later: open findings (ROADMAP; new: As₂S₃/ZBLAN/AMTIR-1 data), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 126:** sources that download: Crystran data sheets (`curl -L -A "Mozilla/5.0" https://www.crystran.com/optical-materials/<slug>`,
  slugs from that index page; its "reflection loss (2 surfaces)" is 1 − 2n/(n²+1), a free golden value); refractiveindex.info
  YAML via `gh api "repos/polyanskiy/refractiveindex.info-database/git/trees/main?recursive=1"` and raw.githubusercontent
  (`formula 1`: n² − 1 = c₀ + ΣBλ²/(λ² − λᵢ²), i.e. `fromResonanceWavelengths(1 + c₀, …)`; `formula 2`: Cᵢ already squared).
  amorphousmaterials.com does not. A `const … as const satisfies Record<…>` table loses optional fields in its union type:
  export it as `Record<Id, Interface>` (TS2339 on `note`). Long floats in a `style` (`left: 53.40199…%`) fail hydration
  (server HTML shortens them): round to 3 decimals. Background `npm run check` "exit code 0" again hid a red tsc: read the log's `exit` line.
- **Session 125:** a long `node - <<'EOF'` script with backticks and apostrophes fails: write the script to the scratchpad and
  run `node <file>`. In a template-literal RegExp `\.` is a bare `.`: write `\\.`. The merge codemod dry run lists the keywords
  it carries over; run it after editing `redirects.json` (append entries; don't re-sort the file).
- **Session 124:** `node -e 'import("./src/…ts")'` with `--import tsx` needs a relative path. In the registry each entry ends with
  a `  },` line: scripts slice entries on that.
- **Session 123:** devctl exit 75 skips the *whole* chained command, a `node - <<EOF` edit before it too: grep that the edit
  landed. A user `next dev` on :3000 rewrites `.next/dev/types` right after `rm -rf`, sometimes garbled (TS1002 in validator.ts):
  `rm -rf .next/dev/types` alone again, then rerun the gate. ui-check and `--dump-dom` that server; curl a cold page once first.
- **Sessions 120–122:** a removed page breaks tsc (TS2307 in `.next/types/validator.ts`) until `rm -rf .next/types .next/dev/types`,
  run on its own. A merge lowers the page floor in `tests/calculator-pages.test.ts`. Chrome dumps queue behind `npm run check`.
- **Session 119:** a `useMemo` whose callback calls a heavy function draws the React Compiler warning "Existing memoization
  could not be preserved" and the compiler skips the whole component: call a plain module-level function instead.
  Oscillating asymptotes aren't golden values: test exact solutions instead.
- **Session 118:** a running `next dev` keeps the redirects it read at start: a new redirect 404s there until a restart
  (`tests/redirects.test.ts` covers it). An edit made while `npm run check` runs may miss tsc: re-lint that file at least.
- **Session 116:** `-Math.log(1)` is `-0`.
- **Sessions 114–115:** unsourceable constants: make them inputs, cite the defaults, log the gap. Render a SimpleLineChart only
  with data (empty series → NaN attributes). Mutating an **untracked** file: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names
  and units. `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
- **Session 111:** tiers.ts calls paraxial / Gaussian-beam models "textbook"; "exact" fits definitions (M², ISO 11146).
  Chrome: `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--dump-dom` reads hydrated values, `--screenshot=` needs `C:/…`.
- **Session 107:** Git Bash rewrites `/a/b` arguments to Windows paths: prefix `MSYS_NO_PATHCONV=1` (ui-check, chrome). Python has no Pillow:
  shrink screenshots with chrome `--force-device-scale-factor=0.5`. Registry/JSX text can't hold `{…}`. `npm run dev` touches `next-env.d.ts`: `git checkout` it.
- **Sessions 95–98:** charts put the axis minimum at the data minimum, so round plotted values (6 decimals). `SimpleChart`
  colours a markers-only trace from `line.color`, not `marker.color`: give both. Book section numbers are not cited.
- **Session 65:** `useURLState` in `.map` breaks hooks. Probe the module before writing the test, then mutate it once to see `ℹ fail N`. A slug rename (< 10
  files): `git mv` the folder, change `href`, move the registry entry, add the redirect, `rm -rf .next/types .next/dev/types`.
- **Session 64:** per page, `xRaw` from `useURLState`, `x = clamp(xRaw, lo, hi, default)`, and pass `xRaw` to the input
  with the same `min`/`max`. `src/registry/calculators/detectors.ts` and `imaging.ts` are **LF**; scripts must keep line endings.
- **Sources:** `curl -A "Mozilla/5.0"` + `pdftotext` works for arXiv, TI app notes and PDG; JACoW and APS PRAB/PRSTAB PDFs too; Europe PMC full-text XML for
  open-access papers. Optics Express, Appl. Opt., IEEE, Elsevier and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes`, tick text and per-trace `showlegend` (an unnamed trace has no legend entry); it supports
  `y2` and log axes. It joins the line across NaN points: split traces for real gaps. `SimpleLineChart` has no `y2`.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 91 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"` (it hides attribute diffs it can't
  parse: copy it to the scratchpad and print the whole log entry).
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` (no heredoc) hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
