# Handover — 2026-10-09 (session 26 → session 27)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Audit the unreviewed pages"). Session 26 did
thin-film part 2 (edge filters) on branch `phase-4/thin-film-edge-filters` (PR #23).

## State
- New tested modules: `physics/thin-film/edge-filter.ts` (symmetric-period edge filters, design λ₀ from the edge,
  50 % point of the actual stack, stacks in series covering a band, incoherent two-face sum), `physics/astm-g173.ts`
  (ASTM G173 global tilt, 2002 points) and `math.ts` `firstCrossing` / `intervalStats` (part 3 needs the half-maximum
  search: use `firstCrossing`).
- `long-pass` and `short-pass` merged into `edge-filter` (472 → 470 pages). `cold-mirror`, `ir-blocking`, `uv-blocking`
  share `components/blocking-filter-calculator.tsx`; `wide-bandpass` and `solar-protection` use one coating per face.
- 6 pages got trust data (all exact), so 61 of 470 pages have a tier. `heat-mirror` moved to part 4 (needs Ag/ITO).
- Also in the PR, as its own commit: the site-wide `SimpleChart` tick bug (Phase 3). `niceTicks` stepped by the bare
  multiplier (2, not 200), crowding x labels and leaving one y tick; `formatTick` now prints the digits the step
  needs. Both exported and tested (`tests/simple-chart.test.ts`). Checked on `gires-tournois` and the new pages.

## Decisions
- Stacks in series, not a linear chirp: 2 × 10 periods give mean R 99.5 % over 400–700 nm, a 20-period geometric chirp
  93 % with soft edges (the end periods are few). The stack next to the pass band faces the incident medium (less
  pass-band ripple on glass; a design choice, stated in the module).
- Blocking pages take a blocked band and a pass band as inputs and report mean/min R, mean/min T and the 50 % point.
  They warn when a stack's third-order zone (λ₀/(3 ± Δg)) falls in the pass band.
- `uv-blocking` defaults to n_H 2.1 / n_L 1.47 (TiO₂-like 2.3 absorbs in the UV). `solar-protection` defaults to IR
  720–1300 nm: wider (1800 nm) puts a third-order zone in the blue and drops visible T to 63 %.
- The G173 table is loaded with a dynamic `import()` after hydration (rule: no large static data in `page-client`).
- Kept from earlier sessions: DOIs only from Crossref; a page gets a tier only once OK or fixed; mixed model → lower tier.

## Next actions
1. PR #23: CI, local production check, then ask the user to merge; after merge, `ui-check` against production.
2. Thin-film part 3 (readouts and phase): `narrow-bandpass`, `dielectric-high-reflector`, `bandpass-filter`,
   `phase-shift-coating`, `notch-filter`, `beamsplitter` (ROADMAP part 3). Then part 4 (metals, `heat-mirror`).
   Other tracks: Phase 3 charts, top-50 golden tests.

## Ship flow (worked twenty times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Removing pages leaves stale `.next/types/validator.ts`** that fails `tsc` ("Cannot find module …/page.js").
  Delete `.next/types` (ignored build output) and re-run `check`.
- **Merge codemod** (`scripts/codemods/2026-10-08-merge-duplicates.ts`): add redirects, dry run, `--write`
  (it `git rm`s the page dirs). It now finds the entry array after citation helpers.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`. Check DOIs
  on Crossref (`api.crossref.org/works?query.bibliographic=…`, volume + first page; ≥ 1 s between requests) and that
  `https://doi.org/<doi>` answers 302. ASTM standards have DOIs (`10.1520/G0173-03R20`). Never take a DOI from memory.
- **Network:** `www.nrel.gov` doesn't resolve from this machine; GitHub raw does (G173 came from pvlib's copy,
  verified by its integrals 1347.9 / 1000.4 / 900.1 W m⁻²).
- **Edge-filter physics:** symmetric period p/2 q p/2 has E² = n_p²(cos φ + κ)/(cos φ − κ), φ = πg/2,
  κ = (n_q − n_p)/(n_q + n_p); N periods = one Herpin layer (E, Nγ), cos γ = cos²φ − ½(ρ + 1/ρ) sin²φ. The test uses it.
- **Rendering in tests:** `renderToStaticMarkup(createElement(Component, props))` works in `node:test` via tsx.
- **tsx scratch scripts:** wrap in `async function main()`; import repo modules by absolute `C:/dev/...` paths.
  In Git Bash, a `node -e '…'` body breaks on an apostrophe; use a heredoc (`node - <<'EOF'`) or Edit.
- **`ui-check` load mode** waits for an `<input>` with a React fiber; wrap runs in `timeout 200`, loop up to 3 times,
  and set `MSYS_NO_PATHCONV=1` in Git Bash.
- **Screenshots without the extension:** headless Chrome `--headless=new --screenshot=<png> --window-size=W,H <url>`.
- **Local production server:** `npx next start -p 3100`; kill with `netstat -ano | grep ':3100 .*LISTENING'` →
  `taskkill //PID <pid> //F //T`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp layer/period counts in the page (`clampToRange`).
- **`SimpleChart`**: no `shapes`; skips NaN; reads `null` as 0; legend names longer than ~14 characters are clipped.
  `ChartPanel` → `SimpleChart` for plain scatter charts.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
