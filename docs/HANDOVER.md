# Handover — 2026-10-09 (session 27 → session 28)

**Start here:** read this file, then `docs/ROADMAP.md` (Phase 4, "Audit the unreviewed pages"). Session 27 did
thin-film part 3 (readouts and phase) on branch `phase-4/thin-film-readouts` (PR #24).

## State
- `transfer-matrix.ts`: `StackResponse.t` (tangential-field ratio 2η₀/(η₀B + C)) and `reflectionGroupDelay` (GD and
  GDD from central differences of arg r). Sign: with e^(−iωt), the delay is +d(arg r)/dω.
- `quarter-wave-stack.ts`: `reflectionBandEdges` (first crossing of a level out from λ₀; mirrors in g), the semi-infinite
  mirror delay `quarterWaveMirrorDelay`, `quarterWavePairsForReflectance` (tanh²). `cavity-filter.ts`: `cavityPassband`
  (FWHM by log scan + bisection). New `beamsplitter.ts`. `math.ts`: `unwrapPhase`.
- `bandpass-filter` and `narrow-bandpass` share `components/cavity-bandpass-calculator.tsx` (same model, different
  defaults and URL key for the pairs). They are near-duplicates now; merging them is the user's call (not asked yet).
- 5 pages got trust data (all exact): 66 of 470 pages have a tier.

## Decisions
- `dielectric-high-reflector` defaults to (HL)ᴺH (high index on both faces, the textbook HR); (LH)ᴺ, the old design,
  is an option (`outer=low`). The audit's 383 nm / 6.718 fs were for (LH)¹⁰.
- `notch-filter` is now a low-contrast quarter-wave stack (1.63/1.46, 40 pairs, 532 nm). There is no cavity input; old
  `spacerN` / `mirrorPairs` links fall back to the defaults.
- `beamsplitter` shows two designs for the target: a thinned HLH (exact at λ₀, but on a slope) and an all-quarter-wave
  H M H (flat top, needs n_M = n_H²/n₁). The slope was seen on the chart, so the page says it.
- OD comes from the transfer matrix's T, not 1 − R (which loses its digits as R → 1).
- Kept from earlier sessions: DOIs only from Crossref; a page gets a tier only once OK or fixed; mixed model → lower tier.

## Next actions
1. PR #24: CI, then ask the user to merge; after merge, `ui-check` against production and the six pages' values.
2. Thin-film part 4 (metals and one-offs): `heat-mirror`, `enhanced-aluminum`, `protected-silver`, `dual-band-ar`,
   `hard-coating`, `anti-fog`, `emissivity-control` (ROADMAP part 4; needs tabulated Ag/Al/ITO data, Rakić 1998).
   Other tracks: Phase 3 charts, top-50 golden tests.

## Ship flow (worked twenty-one times)
- **Push:** `git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push -u origin <branch>`.
- **CI:** `gh pr create --body-file f`, then `gh pr checks <n> --watch`.
- **Preview:** behind Vercel SSO. Use a local `npm run build` + `npx next start -p 3100`.
- **Merge:** ask the user, then `gh pr merge <n> --merge`. Wait for the Vercel status
  (`gh api repos/Lazfiz/photonics-calculators/commits/<sha>/status`), then run `ui-check` against production.

## Non-obvious facts
- **Whole-quarter-wave symmetry:** a lossless stack of whole quarter waves at λ₀ (normal incidence) has
  R(g) = R(2 − g) in g = λ₀/λ. Band edges and FWHMs scan one side only; the tests check the mirror.
- **Mirror delay:** τ = λ₀n₀/(2cΔn) with H outermost, λ₀n_Hn_L/(2cn₀Δn) with L outermost; GDD(λ₀) = 0.
- **Trust data:** tier, `modelNote` (≤ 220 chars), references in `src/registry/calculators/<category>.ts`. Check DOIs
  on Crossref (`api.crossref.org/works?query.bibliographic=…`, volume + first page; ≥ 1 s between requests) and that
  `https://doi.org/<doi>` answers 302. Never take a DOI from memory.
- **Chrome extension** may be disconnected: use `scripts/ui-check.mjs <base> load /a /b` (console errors) and
  headless Chrome `--headless=new --virtual-time-budget=8000 --screenshot=C:/…/x.png --window-size=1280,2900 <url>`
  (the screenshot path must be a Windows path, not `/c/...`).
- **Dev server for checks:** `npx next dev -p 3200`; stop it before `npm run build` (both use `.next`).
- **Killing a server in Git Bash:** with `MSYS_NO_PATHCONV=1` use `taskkill /PID <pid> /F /T`; without it, `//PID`.
- **Removing pages leaves stale `.next/types/validator.ts`** that fails `tsc`. Delete `.next/types` and re-run `check`.
- **tsx scratch scripts:** wrap in `async function main()`; import repo modules by absolute `C:/dev/...` paths.
  A Bash heredoc with mixed quoting can fail to parse; then write the file with the Write tool.
- **`Math.max(...arr)`** overflows the stack at ~1e5 elements; use `reduce`.
- **Timings:** `tsc` ≈ 1.5–4 min, `check` ≈ 6 min, `build` ≈ 6–10 min. Background them; don't edit `.ts` during `check`.
- **Committing:** `git commit -F msg -- <paths>`. Untracked files need `git add` first.
- **`useURLState` doesn't clamp:** clamp counts in the page (`clampToRange`).
- **`SimpleChart`**: no `shapes`; skips NaN; reads `null` as 0; legend names longer than ~14 characters are clipped;
  `yaxis: "y2"` on a trace plus `layout.yaxis2` gives a right axis. `ChartPanel` takes a `title`.
- **TS syntax:** `-x ** 2` is a parse error; write `-(x ** 2)`.
