# Roadmap — photonics-calculators

Source: full review on 2026-10-07 (Claude). Tick boxes as work lands. Evidence is recorded so nothing has to be re-derived.

## Known issues (evidence)

**Blockers**
- Build is broken at HEAD (`0749eb58`); production is a build from before 2026-04-18 20:40, so about 190 later commits are not live. Check: live `/detectors/channel-photomultiplier` still says "Uses TTS as pulse width — rough estimate".
  `tsc` parse errors:
  - `wave-optics/cavity-stability/page-client.tsx:47`: `const` inside an array literal
  - `wave-optics/mode-matching/page-client.tsx:101`: `1i` complex literal
  - `spectroscopy/absorption-depth/page-client.tsx:31-35`: `-(x) ** 2` needs parentheses
  - `spectroscopy/fluorescence-quantum-yield/page-client.tsx:75`: unclosed `<p>`
  - `detectors/channel-photomultiplier/page-client.tsx:55`: raw `>` in JSX

  Parse errors can hide type errors, so re-run the full `tsc` after fixing.
- A GitHub PAT is embedded in the `origin` URL in `.git/config`.

**Correctness**
- BER: `free-space-comms/ber/page-client.tsx:13-20`. `erfc()` returns `0.5*(1+sign*y)` (=Φ), not `1-erf`, so BER rises to 0.5 as signal grows and the "required photons" bisection is broken. The model is also questionable: for photon counting, OOK should be Poisson (≈½e^-n), not Gaussian Q.
- JSON-LD: 427/521 `page.tsx` files are corrupted (source code inside template literals) since `6929ab07` (2026-04-09). Live JSON-LD names read `"Airy Disk Size Calculator',\n description: ..."`. Detect with: `git grep -c "const jsonLd" -- 'src/app/**/page.tsx' | awk -F: '$2>1'`.
- `src/hooks/use-url-state.ts`: resetting to the default never removes the URL param, because the flush loop checks keys that were already deleted. The shared link keeps the stale value (confirmed by simulation). Defaults render first and URL values arrive in an effect, which causes a flash.
- `src/components/validated-number-input.tsx` (488 pages) clamps on every keystroke: with min=10, typing "50" becomes 10.
- `src/components/input-slider.tsx`: the number field passes unclamped values (e.g. NA=0 causes ÷0) until blur.
- `src/components/calculator-shell.tsx`: `ShareButton` reads `window` during render, causing a hydration mismatch. The breadcrumb check `i < breadcrumbs.length` is always true.
- `src/components/simple-chart.tsx`: the log axis clamps at 1e-10, and `Infinity` is not filtered (only `isNaN`).
- Duplicates that disagree (~40 pairs):
  - `fiber-optics/dispersion-comp` (0.25/Δτ) vs `dispersion-compensation` (1/Δτ)
  - `macro-bend` (made-up power law) vs `macro-bending-loss` (Marcuse-type, uses plane-wave β)
  - imaging second-harmonic ×3, two-photon ×3, light-sheet ×3, wavefront-sens* ×3
  - ccd-cmos/ccd-vs-cmos, em-gain/emccd-gain/electron-multiplying, full-well/well-capacity
  - scanned-mpe/scanning-mpe, dual-comb (spectroscopy + wave-optics)
- Fudge-factor models presented as calculators, e.g. `imaging/second-harmonic` (prefactor `4e-24`, `dn = 0.01·n/1.33`).
- Constants are redefined inline in 46 files (`c = 3e8` ×54, `q = 1.6e-19` ×6). `erf` is implemented 3 different ways.
- Minor: `fiber-optics/v-number` uses `floor(V²/2)` modes for V<2.405.
- Verified correct: gaussian-beam, v-number, single-ar, sellmeier, nep, airy-disk, blackbody (rounded constants).

**Architecture / content**
- Physics lives inline in ~524 `page-client.tsx` files, so it can't be tested. There are 2 test files, and the first Geiger test asserts only `> 0`.
- Five sources of truth drift apart: hand-written `sitemap.ts`, `generated/search-index.json`, `lib/flagship-related.ts` (268 KB), `lib/home-categories.ts`, and per-page metadata. The site says "541 calculators"; there are 524 pages. 55 pages have the placeholder description "Interactive X calculator for photonics and optical engineering."

**Performance / graphics** (live, 2026-10-07)
- Pages are statically prerendered and edge-cached (`X-Vercel-Cache: HIT`), with 19–35 KB of HTML. Fine.
- Initial JS is 190–240 KB gz per calculator. `lib/related-calculators.ts` pulls the search index plus `flagship-related.ts` into the client (a ~400 KB raw / 46 KB gz chunk).
- 18 pages use Plotly; `react-plotly.js` imports the full `plotly.js/dist/plotly` (4.8 MB min). `plotly.js` and `plotly.js-dist-min` are both dependencies.
- SVG charts use a fixed viewBox (700 px in `simple-chart`, 900 px in `simple-line-chart`), so labels render at 4–5 px on phones. There is no hover readout and no export.

**Found during Phase 0** (2026-10-07)
- The parse errors hid **54 type errors** in 18 pages and 2 tests, all leftovers from the April bulk "fixes" (deleted definitions, duplicate `const`, use before declaration). All are fixed in `phase-0`. Two of them changed physics:
  - `four-wave-mixing`: restored the β₂ and γ definitions that `44eaaeb4` deleted.
  - `ion-assisted-deposition`: added film molar masses, which `8f862598` had referenced but never defined.
- `mode-matching` η: the conjugate sign was wrong (`qpp_i − zR2`), so η → ∞ at a perfect match. Fixed in `phase-0` and checked against closed-form overlaps (0.64 for a 2× waist mismatch). It needs a golden test once the code is extracted (Phase 2).
- `ion-assisted-deposition` **is broken and NOT fixed** (Phase 4 rewrite):
  - The atom flux `r·ρ·N_A/(ρ·A·M_ion·m_p)` is dimensionally wrong, so Jr ≈ 1e-30 and the packing and stress outputs do nothing.
  - The correct flux `r·ρ·N_A/M` gives Jr ≈ 28 at the defaults, because the 10 cm² beam area means 5 mA/cm² (typical IAD is ~0.05–0.1 mA/cm²). The uncalibrated coefficients then give ~4.9 GPa of stress.
  - It needs a real model with references.
- ESLint had **290 errors**. Four rules are temporarily set to `warn` in `eslint.config.mjs`:
  - `preserve-manual-memoization` (153 sites)
  - `no-explicit-any` (116)
  - `react-hooks/purity` (9: `Math.random` in render, a hydration mismatch, in otdr-analysis, circular-dichroism, polarization-scrambling, retarder-types, fourier-transform and spectral-calibration): fixed in Phase 1, back to `error`
  - `set-state-in-effect` (`input-slider`, `use-url-state`): fixed in Phase 1, back to `error`
- Questionable models noticed while fixing (for Phase 4):
  - `filamentation`: Marburger z_sf gives a finite collapse distance for P < P_cr.
  - `coherent-raman`: signal prefactors are arbitrary (`1e-60`, `1e-30`).
  - `dye-laser-resonator`: k_ISC = (1−Φ_f)/τ counts all non-radiative decay as ISC.
  - `four-wave-mixing`: β₂ is fixed at 20 ps²/km and n₀ at 1.45 in χ³.
  - `ion-assisted-deposition`: the packing and stress coefficients are uncalibrated.
- `scripts/generate-search-index.mjs` (run as `prebuild`) produces a different file from the committed `src/generated/search-index.json`: 5,134 changed lines, different ordering, newer titles, and "3×10^4" mangled into "310^4". Production always ships the regenerated copy. Phase 2 registry: make it deterministic, and either gitignore the file or check it in CI.
- `next build` prerender exposes runtime TDZ errors that tsc misses (a `const` used inside a closure before its declaration, e.g. `pixel-crosstalk`). Swept with `@typescript-eslint/no-use-before-define`.
- npm 12 skips install scripts (esbuild, sharp, unrs-resolver). Their prebuilt `win32-x64` binaries are installed, so this is harmless.

**Found during Phase 1** (2026-10-07)
- The A&S 7.1.26 `erfc` copies (bpsk-qpsk, ber, scintillation, diversity-reception, fade-probability) have absolute error 1.5e-7 and are about 38 % off asymptotically, so every BER below ~1e-7 was wrong. All are replaced by `src/physics/math.ts`.
- `SimpleChart` floors log axes at 1e-10. The ber and bpsk-qpsk pages therefore plot log₁₀(BER) on a linear axis. Switch them back to log axes after the Phase 3 chart rewrite.
- 64 `page-client.tsx` files import `CalculatorShell` but never render it, so they have no title, breadcrumb or share button (e.g. `free-space-comms/ber`). Fix alongside the Phase 1 shell item. Count: `comm -23` of `git grep -l 'import CalculatorShell'` vs `git grep -l '<CalculatorShell'`.
- 138 `<label>` cards in 53 files wrap a `ValidatedNumberInput` (nested `<label>`, invalid HTML), mostly in thin-film and polarization: `<label><span>n<sub>substrate</sub></span><ValidatedNumberInput label="nsubstrate" … /></label>`. The caption shows twice and the input's copy has lost its markup. Fix with a codemod like `input-captions`: pass the span's content as `label={<>…</>}` and drop the wrapper.
- Shell titles drift from `metadata.title` in the ~456 pages that already rendered the shell (e.g. attenuation: "Wavelength-Dependent Attenuation" vs "Fiber Attenuation Calculator"). The pages fixed in item 5 use `metadata`. Generate both from the registry (Phase 2).
- For Phase 4:
  - `bpsk-qpsk` "Required RX power" uses the RF floor kT = −174 dBm/Hz + 3 dB NF. Coherent optical detection is shot-noise limited at hν ≈ −159 dBm/Hz (1550 nm).
  - `diversity-reception` uses a fixed "3σ" outage and gives identical gain for SC, EGC and MRC.
- `SimpleLineChart` prints SVG coordinates at full precision. Node (SSR) and Chrome can differ by 1 ulp (`200.2834021708276` vs `…763` on `detectors/quantum-efficiency`, seen with a warm Chrome profile), which logs a hydration-mismatch error. Round coordinates to 0.01 px in the Phase 3 chart rewrite.
- Found while writing descriptions (JSON-LD item):
  - `point-ahead` uses θ = v/c. The standard point-ahead angle is 2v⊥/c, so this is a factor-2 error (Phase 4).
  - The FAQ in `lib/json-ld.tsx` lower-cases the title ("What is photon-counting ber (ook and dpsk)?", "… (fog)?"). Fix it when the registry generates the JSON-LD (Phase 2).
  - The old slug-derived titles survive in `flagship-related.ts` ("Ber", "Wdm Coupler", with "Related … calculator." as the description) and in the category index pages. Both get regenerated from the registry (Phase 2).
  - More duplicate pairs: `scanned-mpe` / `scanning-mpe` (both titled "Scanned Beam MPE"), `scintillation` / `scintillation-index`, and `free-space-comms/atmospheric-loss` / `laser-safety/atmospheric-attenuation`.
- `useURLState` only rejects non-finite URL values. A crafted link (e.g. `?na=0`) still reaches the physics unclamped, because the inputs clamp only what the user types. Guard domains in the Phase 2 physics modules, or give `useURLState` an optional range.

## Phase 0 — safe, building, Claude-native (1 session)
- [ ] 0.1 **User, manual:**
  - [ ] Revoke the GitHub PAT, then `git remote set-url origin https://github.com/Lazfiz/photonics-calculators.git` (use Git Credential Manager).
  - [ ] Delete `~/.claude/settings-glm-backup.json` (plaintext z.ai key); revoke that key if it's unused.
  - [ ] Re-authenticate the Vercel connector for scope `mariusrut-8463s-projects` (or `vercel login`).
  - [ ] Optional: add a Defender exclusion for `C:\dev`.
- [x] 0.2 **Environment:**
  - [x] Delete `node_modules`, `.next` and `.vercel/output`. All three are Linux artifacts: Linux-only native binaries and ~4,800 empty placeholders left where symlinks were.
  - [x] `npm ci` on Windows.
  - [x] Confirm `npx tsc -v` and `npm test` work.
- [x] 0.3 **Claude Code setup** (Claude-only from now on). First confirm the current file formats with the `claude-code-guide` agent: `.claude/rules` path frontmatter, skills, agents, settings hooks.
  - [x] `CLAUDE.md` (≤100 lines, replaces `@AGENTS.md`):
    - what the project is and the Windows commands
    - architecture map, current and target
    - the Next 16 warning from `AGENTS.md` (read `node_modules/next/dist/docs/` before using Next APIs)
    - a pointer to this roadmap
    - hard rules:
      1. No credentials in remotes, files or commits.
      2. `npm run check` must be green before every commit; `npm run build` before every push.
      3. Edits touching more than 10 files only via AST codemod (ts-morph): dry run, review a 5-file sample diff, `tsc` gate. Never regex or Python rewrites — the root cause of the JSON-LD corruption and the 5 broken files.
      4. Physics in SI, constants only from `src/physics/constants.ts` (CODATA), and every formula change ships a golden-value test that cites a reference.
      5. One topic per commit, conventional messages, work on branches with PRs.
  - [x] `.claude/rules/` (short, path-scoped):
    - `physics.md` (`src/physics/**`, `src/app/**/page-client.tsx`): units, constants, domain guards, numerics, model tier plus reference, tests
    - `ui.md` (`src/components/**`): clamp on blur, no `window` in render, charts handle NaN/Infinity, rendered text ≥11 px, a11y
    - `nextjs.md` (`src/app/**`): server `page.tsx` builds metadata and JSON-LD from the registry; client code only for interactivity; related links computed server-side
  - [x] `.claude/skills/`:
    - `verify` (Windows gates and how to read failures, plus a live-site check)
    - `physics-audit` (per-calculator procedure; output ≤30 lines)
    - `new-calculator` (registry entry, physics module, test, page)
    - `codemod` (safe bulk-edit procedure)
  - [x] `.claude/agents/`:
    - `implementer` (Sonnet; routine edits under gates; report ≤40 lines)
    - `physics-reviewer` (Sonnet, read-only; runs `physics-audit` on a batch of slugs)
  - [x] `.claude/settings.json` (committed):
    - allow: `npm run *`, `node node_modules/typescript/bin/tsc *`, read-only git
    - deny: reading `.env*` / `.secrets/**`, `git push --force*`
    - PreToolUse hook on `git commit` that blocks staged real-token shapes: `(github_pat|ghp)_[A-Za-z0-9_]{30,}` or `sk-[A-Za-z0-9-]{30,}`. Match the length so this doc line doesn't trigger it.
    - no per-edit `tsc` hook (a full `tsc` takes about 4 min here)
  - [x] Clean up leftovers from the other AI tools:
    - delete `AGENTS.md` (merged into `CLAUDE.md`)
    - move `GEMINI-REVIEW-*.md` and `REVIEW-*.md` to `docs/archive/reviews/` and mark them stale
    - delete `scripts/migrate-*.py` and `scripts/revert-url-state.py`
    - check whether `scripts/generate-embeddings.py` is used; archive it if not
  - [x] `.gitignore`: add `tsconfig.tsbuildinfo`, `.claude/settings.local.json` and `CLAUDE.local.md`; run `git rm --cached tsconfig.tsbuildinfo`.
- [x] 0.4 **Fix the build:**
  - [x] Fix the 5 parse errors above.
  - [x] Run the full `tsc` again and fix any errors it uncovers.
  - [x] `npm test`, then `npm run build`.
- [ ] 0.5 **CI:**
  - [x] Add `"check": "tsc --noEmit && eslint && npm test"` to `package.json`.
  - [x] Add `.github/workflows/ci.yml` (Node 24, `npm ci`, `check`, `build`) on push and PR.
  - [ ] User: protect `main` so CI must pass.
- [ ] 0.6 **Ship:** branch `phase-0`, then PR, then a green Vercel preview, then merge. Verify live: channel-photomultiplier should show "order-of-magnitude upper bound". **Status 2026-10-07:** `phase-0` is committed locally with green gates. The push is blocked on 0.1 (the PAT is still in the remote).

## Phase 1 — correctness (1–2 days)
- [x] Shared `src/physics/math.ts`: accurate `erfc`/`Q`, used by ber, bpsk-qpsk and scintillation. Fix and retest BER, and decide on the Poisson model. **Done 2026-10-07 on branch `phase-1`** (stacked on `phase-0`, not pushed):
  - `math.ts`: `erf`/`erfc` (series + continued fraction; ≤2e-13 relative vs CPython), `qFunction`, `normalCdf`, `lnFactorial`, Poisson pmf/cdf/sf (each tail summed directly).
  - BER: chose the **exact Poisson photon-counting model** (`src/physics/free-space-comms/ber.ts`). OOK uses the ML threshold, DPSK uses two port counters with random tie-breaks. It matches brute-force sums to 1e-13 and gives the quantum limits of 10 and 20 photons/bit.
  - bpsk-qpsk: Gray QPSK BER = BPSK BER (the old formula, 2Q(1−Q), was neither BER nor SER). SER is now shown separately.
  - scintillation, diversity-reception and fade-probability use the shared `erfc`, where they used to compute ½(1 ± erf) with cancellation.
  - Tests: `tests/math.test.ts`, `ber.test.ts`, `bpsk-qpsk.test.ts`.
- [x] Fix `use-url-state` reset. `ValidatedNumberInput` and `InputSlider` clamp on blur and never pass out-of-range values to the physics. **Done 2026-10-07 on `phase-1`:**
  - `useURLState` reads `src/lib/url-state-store.ts` through `useSyncExternalStore`: the query string plus an overlay of unflushed writes (`null` deletes the param). Batched 100 ms writes keep other params and the hash. A pathname guard stops one page's params reaching the next during client navigation. Non-finite URL numbers fall back to the default.
  - Both inputs keep the typed text locally. In-range values reach `onChange` live; out-of-range values are held back and clamped on blur/Enter; invalid text reverts (`src/lib/number-input.ts`).
  - `set-state-in-effect` is back to `error` (0 sites). Tests: `tests/url-state-store.test.ts`, `number-input.test.ts`. Headless-Chrome check: `scripts/ui-check.mjs` (all checks pass on boxcar-integrator, ber and quantum-efficiency).
- [x] Rebuild JSON-LD from each page's `metadata` (codemod) and write the 55 placeholder descriptions. **Done 2026-10-07 on `phase-1`:**
  - `scripts/codemods/2026-10-07-rebuild-json-ld.ts` (ts-morph) rebuilt the call in 429 pages: 427 corrupted, plus 2 whose `\uXXXX` escapes became literal characters. It skipped none, and a second run changes nothing. It also checks that each canonical URL matches the page's path.
  - `scripts/codemods/2026-10-07-placeholder-descriptions.ts` wrote the 55 descriptions from `…-placeholder-descriptions.json`, each written from the page's inputs and results and ≤155 characters. It also replaced 33 slug-derived titles (e.g. "Ber" → "Photon-Counting BER (OOK and DPSK)").
    - Quarantined laser-safety pages, and `eye-safety-fso`, say "Simplified educational estimate … Not for safety decisions".
  - Added JSON-LD by hand to the 3 pages that had none: `nohd`, `blackbody`, `single-ar`.
  - `tests/page-json-ld.test.ts` checks every calculator page: the JSON-LD arguments equal `metadata` as plain strings, the canonical URL matches the path, and there's no placeholder description.
- [x] Fix the `ShareButton` hydration mismatch and the breadcrumb bug. Make the "541" count a computed value. **Done 2026-10-07 on `phase-1`:**
  - `ShareButton` reads `currentQuery(pathname)` from `url-state-store` through `useSyncExternalStore` (server snapshot ""), so a shared link hydrates cleanly and the button appears on the first input change. The copied link includes unflushed writes; a blocked clipboard no longer shows "Copied".
  - Breadcrumb: all ancestors are links, the title is the last `<li>` with `aria-current="page"`, no bare `<span>` in the `<ol>`, and the category crumb uses `backLabel`.
  - Counts: `scripts/generate-search-index.mjs` also writes `src/generated/calculator-counts.json` (524 = pages under `src/app/<category>/<slug>/`, hidden ones included). `home-categories`, `layout.tsx` (title, OG, Twitter, JSON-LD) and the search placeholder read it. `tests/calculator-counts.test.ts` checks it against the file system.
  - `scripts/ui-check.mjs` gained share/breadcrumb checks. The old shell fails 3 of them (including "Hydration failed"); the new one passes all 30.
- [x] Codemod (ts-morph): `label="{label}"` → `label={label}` in 40 `page-client.tsx` files (44 sites), and render `CalculatorShell` where it is missing. **Done 2026-10-07 on `phase-1`:**
  - The 44 `{label}` sites were part of a larger bug: 532 caption `<label>`s in 150 files sat beside a `ValidatedNumberInput` that renders its own label, so each label showed twice. In 18 sites the two disagreed; in 5 resonator pages and `aging-effects` the input labels were shifted by one row. `scripts/codemods/2026-10-07-input-captions.ts` moved each caption (it matches the bound value) into `label` and removed the caption. By hand: `label` is now `ReactNode` (sub/sup labels), and `materials/photorefractive` had its "Applied Field" input bound to `wavelength`; the field and wavelength inputs are separate again.
  - `scripts/codemods/2026-10-07-render-calculator-shell.ts` wrapped 66 pages in `CalculatorShell` (title/description from `metadata`, back link from the category, the page's max width); it added the import to the 4 detector pages that lacked it. OPA and OPO were done by hand (full-width root with their own description `<p>`).
  - `scripts/ui-check.mjs` checks the ber title, gas-laser-resonator labels against bound values, and no "{label}" on sbs-threshold. All 35 checks pass; the 4 new ones fail on the old pages.
- [x] Use a seeded PRNG (`src/physics/random.ts`) for the 6 pages that call `Math.random` in render. Then set `react-hooks/purity` back to `error` (`set-state-in-effect` already is). **Done 2026-10-07 on `phase-1`:**
  - `random.ts`: mulberry32 (`createRng(seed)`), `uniform`, and Box–Muller `gaussian` (u ∈ (0, 1], so log u is finite). `tests/random.test.ts` matches an independent port of the C reference for 4 seeds and checks the moments.
  - Each page creates a fixed-seed generator inside its memo, so changing e.g. the noise amplitude rescales one noise realization instead of redrawing it. `react-hooks/purity` is `error` again.
  - Headless Chrome (`ui-check … load`) on the 6 pages: 0 console errors. The old versions logged "Hydration failed" on polarization-scrambling and spectral-calibration (the two that print noise-dependent values).

## Phase 2 — architecture (~1 week)
- [ ] `src/physics/constants.ts` (CODATA) and `src/physics/<category>/<slug>.ts` pure functions, migrated by codemod and category by category, with tests.
- [ ] Calculator registry as the single source of truth: slug, title, description, category, model tier, references, aliases. It generates the sitemap, search index, metadata, JSON-LD and related links at build time.
- [ ] Merge the ~40 duplicates and add 301 redirects in `next.config.js`.
- [ ] As pages move to pure physics modules, fix the `useMemo` deps and `any`. Then set `preserve-manual-memoization` and `no-explicit-any` back to `error`.

## Phase 3 — graphics & performance (~1 week)
- [ ] Chart rewrite: real pixel width (not a scaled viewBox), hover crosshair and readout, NaN/Infinity filtering, log axes down to 1e-18, PNG/CSV export.
- [ ] Plotly via `react-plotly.js/factory` with a partial bundle; drop the extra dependency.
- [ ] Related links as server props (removes the ~46 KB gz chunk). Read URL state before first paint.
- [ ] Turn on Vercel Speed Insights and set a JS budget in CI.

## Phase 4 — physics quality (ongoing)
- [ ] Golden-value tests for the top 50 calculators by traffic, then by category.
- [ ] Model-tier badge (Exact / Textbook approximation / Illustrative) with references on each page.
- [ ] Rewrite or label the heuristic models (macro-bend, second-harmonic, …).
