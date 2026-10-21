# Handover — 2026-10-21 (session 124 → session 125)

**Start here:** read this file, then the first unchecked box in `docs/ROADMAP.md`. Don't read
`docs/archive/roadmap-history.md` whole: `grep -n` it.
Session 124: **materials audit part 0**, branch `phase-4/materials-audit`, PR #155. 41 untiered pages: 30 bugs, 9 questionable,
2 OK; 39 `knownIssue`s. Next: **materials fix part 1** (dispersion redirects into chromatic-dispersion and optical-glass-catalog).

## State
- Registry only (`src/registry/calculators/materials.ts`): 39 `knownIssue`s; 13 descriptions restored from their ledes (ledes
  dropped), titles of quartz-crystal, sapphire-properties and nonlinear-index restored (heading overrides dropped).
- ROADMAP: fix parts 1–9 with the user's merge decisions (18 pages merge away, 45 → 27), golden values and modules to reuse.
  The stale wave-optics findings block (FWM, SPM, mode-matching, abcd-matrix, filamentation, dye) is gone.
- Per-page reviewer notes (findings, DOIs, golden values) go into the PR #155 description; they are not in the repo.
- 387 of 429 tiered; page floor 429.

## Next actions
1. `/ship` this branch (no page values changed). Values for a later release check: part 13: `thin-film/bragg-reflector=432.13`,
   `spectroscopy/michelson-interferometer=0.8974`, `wave-optics/slow-light=33.36`; part 12: `wave-optics/four-wave-mixing=27.09`,
   `wave-optics/optical-waveguide=1.498429`, `wave-optics/injection-locking=-3.162`, `fiber-optics/mode-coupling=0.2297`; part 11:
   `wave-optics/sum-frequency=91.87`, `wave-optics/difference-frequency=3.361`, `wave-optics/optical-parametric-amplifier=29.10`;
   parts 1–10: see PR #141–#151 descriptions. No release unless asked.
2. Materials fix part 1 (ROADMAP item 1): read the PR #155 description for each page's findings first
   (`gh pr view 155 --json body -q .body | grep -n -A12 "materials/gvd"`).
3. Later: open findings (ROADMAP), `polarizer-types` (needs the user at the laptop with Chrome).

## Non-obvious facts
- **Session 124:** `node -e 'import("./src/…ts")'` with `--import tsx` needs a relative path (an absolute `C:/…` path fails the ESM
  loader). In the registry each entry ends with a `  },` line:
  scripts slice entries on that.
- **Session 123:** devctl exit 75 skips the *whole* chained command, a `node - <<EOF` edit before it too: grep that the edit
  landed. A user `next dev` on :3000 rewrites `.next/dev/types` right after `rm -rf`, sometimes garbled (TS1002 in validator.ts):
  `rm -rf .next/dev/types` alone again, then rerun the gate. ui-check and `--dump-dom` that server
  (a second `next dev` is refused); curl a cold page once first.
- **Sessions 120–122:** a removed page breaks tsc (TS2307 in `.next/types/validator.ts`) until `rm -rf .next/types .next/dev/types`,
  run on its own (devctl exit 75 skips a whole chained command). A merge lowers the page floor in `tests/calculator-pages.test.ts`
  (432). Chrome dumps queue behind `npm run check`. PPLN 1064 − 1550: QPM 29.95 µm, δ_si −97.7 fs/mm (Zelmon).
- **Session 119:** a `useMemo` whose callback calls a heavy function draws the React Compiler warning "Existing memoization
  could not be preserved" and the compiler skips the whole component: call a plain module-level function instead (the
  compiler memoizes it). Oscillating asymptotes (radiation beats) aren't golden values: test exact solutions instead.
- **Session 118:** a running `next dev` keeps the redirects it read at start: a new redirect 404s there until a restart
  (`tests/redirects.test.ts` covers it). An edit made while `npm run check` runs may miss tsc: re-lint that file at least.
- **Session 116:** a background `(gate; echo exit $?)` always "exits 0": read its `exit` line. `-Math.log(1)` is `-0`.
- **Sessions 114–115:** unsourceable constants: make them inputs, cite the defaults, log the gap. Render a SimpleLineChart only
  with data (empty series → NaN attributes). Mutating an **untracked** file: `cp` it to the scratchpad first.
- **Session 113:** Next redirects keep the query string, so an old link's params arrive at the merged page: reuse their names.
  `besselJ` costs 2|x| + 64 cosines: inside a quadrature use `besselJ0Fast` (|err| < 1e-7).
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
  open-access papers. Optics Express, Appl. Opt., IEEE and nature.com don't download (try the authors' repository).
- **SimpleChart:** ChartPanel sends scatter and bar traces to SVG `SimpleChart`, not Plotly. It ignores `layout.legend`,
  per-point colours, `layout.shapes` and per-trace `showlegend` (draw marker lines as traces); it supports `y2` and log axes.
  It joins the line across NaN points: split traces for real gaps. `SimpleLineChart` has no `y2`: use two charts or ratios.
- **NaN traps:** show NaN/∞ as "—" with a reason. eslint: ≈ 161 old warnings, lint only changed files; JSX text needs
  `&apos;`. Prerendered HTML shows defaults; URL params apply after hydration.
- **Hung checks:** wrap chrome, ui-check and server commands in `timeout <s>`. Port 3100 held by `next start`:
  `netstat -ano | grep :3100`, `taskkill //PID <pid> //T //F`. Never `taskkill /IM chrome.exe`. ui-check:
  `MSYS_NO_PATHCONV=1 node scripts/ui-check.mjs http://localhost:3100 load /a "/b?x=1"`.
- **Shell:** probes are scratchpad `.ts` files run from the repo (`node --import tsx <abs path>`), importing
  `C:/dev/photonics-calculators/src/…` by absolute path. Edit with `node - <<'EOF'`; `python -` hangs. `git grep` skips untracked files. A bare
  `cat > file` (no heredoc) hangs on stdin. Quote DOIs with `(`. CI ≈ 2–3 min.
