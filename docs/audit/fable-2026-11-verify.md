# Verification of the Fable review work of 12–17 November 2026

Read-only verification by Claude Fable 5.2 on 2026-11-17. Nothing was fixed, no PR branch was changed, nothing was
merged, closed or deployed. `main` is `0cdf269` (after #291).

**Verdict.** The merged work holds: every error and weak finding of parts 1–3 is fixed in `main` and pinned by a test,
and my own closed-form probes reproduce the fixed values. Three laser-safety items are not in `main` yet (sub-ns skin
limit, the A11 toggle on the AEL page, linear beam growth on the scanning page); all three are in open PR #289.
#289 and #292 are safe to merge; #293 is safe to merge with caveats (silent typo "corrections" of real words; check the iPhone keypad first). Search on `main` passes its golden set but fails most plurals and
typos; #293 fixes most of those.

## How it was checked

- **Gates on main:** `npm ci`; `npm run check` once (tsc and eslint clean, 1388/1388 tests pass); `npm run build` once (passes).
- **Review probes:** all 75 scripts in `fable-p{1,2,3}-probes/` rerun against main; all exit 0. Outputs that moved are
  the fixed findings (below); the rest print the same values as the reports.
- **My own probes** (`docs/audit/fable-verify-probes/main/`, outputs saved beside them):
  - `probe-physics.ts`: CS₂, insertion OPD and delay, gamma-gamma fades (own quadrature, own incomplete gamma), dn/dT,
    AELs, sub-ns limits, scanning MPE (own 2-D simulation of a pass), NOHD, classification.
  - `probe-nulls.ts`: all 265 schemas at defaults, each input at min and max, each choice option (4303 runs), plus the
    REST and MCP handlers in-process.
- **Open PRs:** one reviewer per PR in its own detached worktree (`npm ci`, `npm run check`, `npm run build`, own probes
  in `fable-verify-probes/pr289|pr292|pr293/`). I did not rerun their probes myself; I spot-checked the search results.
- **Search:** `fable-verify-probes/search/probe-search.ts`, 343 queries, on main and on #293.
- **Not done.** No reference PDF could be opened: `www.icnirp.org` and `api.creol.ucf.edu` are outside this session's
  network allowlist. The ICNIRP table rows and the CS₂ erratum values are the ones the review quotes, typed into the
  probes; the closed forms are written out by hand. IEC 60825-1, A11 and ANSI Z136.1 were not read (as in the review).
  No page was rendered for part A.

## A. Merged work: is each finding fixed in main, and pinned?

"Pinned" names the test; "none" means no test would fail if the fix were reverted.

### Laser-safety audit (#284; leftovers in open #289)

| Finding | Verdict | Evidence |
|---|---|---|
| E1 Condition 1 skipped outside 400–1400 nm | **partial** | Stopgap warning only. Probe: 1550 nm, 30 mm beam, 100 mW is still Class 1 and 1 W still 3R, each with the "Condition 1 not evaluated" warning (API and page). Test `E1 stopgap…` (`tests/laser-safety-audit-2026-11.test.ts:96`). The full fix needs IEC Table 10. |
| U1 NOHD defaults to linear growth | **fixed**, one page left | `roundBeam` defaults to Gaussian; probe: 2.2 mW, 532 nm, 5 mm, 1 mrad gives 11.887 m (my closed form 11.887 m; linear option 7.895 m). Test `roundBeam defaults to Gaussian growth` (`laser-safety-hazard-distance.test.ts:66`). eye-safety-fso now gives 23.85 m (hand: 23.85 m). **scanning-mpe still uses linear growth** on main; fixed in #289. |
| U2 A11 off by default | **partial** | Classification reports the EU class beside IEC's (test `U2…`, `:72`). **ael-limits still has the `euA11` toggle, default 0**: 1310 nm gives cw1 = 498.7 mW with no EU value. Fixed in #289. |
| U3 scanning API lacks the caveats | **fixed** | Both caveats in `warnings` (probe output). Test `U3…` (`:65`). |
| U4 0.25 s carried to invisible wavelengths | **fixed** | Standard time per wavelength; warning when a shorter time is entered. Tests `U4…` (`:26`, `:43`). |
| M1 "Table 6" citation | **fixed** | Source string cites Table 5, p. 287, Table 8. Not pinned (text). |
| M2 "7 mm pupil" for every limit | **fixed** | Warning says 7 mm retina, 1–3.5 mm cornea. Not pinned (text). |
| M3 sub-ns anterior-segment limit | **not fixed in main** | Probe: 1350 nm, 500 ps gives 1000 J/m²; 10 % of the 1 ns limit is 200 J/m². Fixed and pinned in #289. |
| M4 stale validation doc | **fixed** | Doc points to `tests/laser-safety-eye-exposure-limits.test.ts:428`, which exists and passes. |
| M5 UV-B step comment | **not in main** | Comment is in #289. |
| M6, M7, M8 [IEC] | **not fixed** | Need IEC Table 10; a TODO block is in #289. |
| M9 CLAUDE.md path | n/a | No CLAUDE.md is tracked in the repo. |

AEL closed forms on main (probe section 5a): Class 1 at 532 nm 10 ns, 905 nm 100 ns, 1064 nm 10 ns and 1550 nm CW,
and Class 3B at 532, 1064 and 1550 nm all equal the ICNIRP form × aperture area to 1e-9 (IEC prints the same values to
two figures). Scanning MPE: my simulation gives 7.6815 mW at the defaults (code 7.6815) and 5.9585 mW for the 905 nm
case (code 5.9585); the 1550 nm case differs by 1.4 % (new finding M1).

### Part 1: detectors, fiber-optics, free-space-comms

| Finding | Verdict | Evidence |
|---|---|---|
| W1 scintillation fade card log-normal only | **fixed** | Page shows a gamma-gamma card and flags the log-normal one at σ_R² ≥ 1; API has `fade3dBGammaGamma`, `fade10dBGammaGamma` and a warning. My quadrature: point receiver, σ_R² 3.385: 0.3989 / 0.07176 (code equal to 1e-15); σ_R² 64.7: 0.4120 / 0.1016 (1.8e-11). Test `scintillation page: gamma-gamma and log-normal fades at σ_R² ≥ 1` (`tests/fso-turbulence.test.ts:380`). |
| M1 regime boundary at 5 | **fixed** | `page-client.tsx:86`, "Weak" below 1. Label not pinned; the API warning's edge at σ_R² = 1 is (same test). |
| M2 lasercom "Gaussian-beam gains" | **fixed** | `free-space-comms.ts:286` says uniform-aperture gains. Not pinned (text). |
| M3 β₀² comment | **fixed** | `turbulence.ts:107`. Comment only. |
| M4 MFD default 9 µm | **fixed** | 10.4 µm on both pages. connector-insertion-loss is held to its schema by `input keys and defaults match the page`; splice-loss has no schema, so not pinned. |
| M5 tilt convention line | **fixed** | connector-insertion-loss page text, lines 171–174. Not pinned (text). |
| M6 ε warning at 0.2 | **fixed** | Warning from ε > 0.1 (`birefringence-fiber/page-client.tsx:96`). Not pinned. |
| M7, M8 | no action | As the review proposed. |
| Q5 duplicate `DB_PER_E_FOLD` | **fixed** | One definition, `src/physics/math.ts:17`. |

### Part 2: imaging, spectroscopy, materials, shared radiometry

| Finding | Verdict | Evidence |
|---|---|---|
| E1 CS₂ n₂ | **fixed** | 1.5e-19 and 2.81e-18 m²/W (`kerr-index.ts:151-153`). Test `tests/materials-nonlinear.test.ts:100-102`. The erratum PDF was still not opened, here or (per the test comment) verifiably in the fix: the values are the review's. |
| W1 "extra delay versus vacuum" | **fixed** | Card is now "Extra Delay from Inserting the Slab". Probe: OPD 5.000 / 5.482 / 7.247 mm at 0° / 30° / 60° equals d(√(n² − sin²θ) − cos θ) to 1e-15; with n = 1.45, n_g = 1.47 the delay equals my numerical d(ωOPD/c)/dω to 4e-11. Test `optical path length: insertion OPD and delay` (`tests/spectroscopy-depths.test.ts:81`) and the schema check. The API keeps the old fields with formula labels. |
| W2 birefringent-crystals 1e-4 claim | **fixed** | modelNote states per-crystal accuracy (`materials.ts:38`). Not pinned (text). |
| W3 silicon at low temperature | **fixed** | Page text names silicon, 204 against 259 J/(kg·K) at 100 K. Not pinned (text). |
| M1 two pupil weightings | **fixed** (note) | Registry modelNote states the two pupils (`imaging.ts:747`). |
| M2 0.88 → 0.886 | **fixed** | `optical-sectioning-thickness.ts:56`. Tests in `tests/imaging-confocal.test.ts:64, 97`. |
| M3 Shack–Hartmann Fresnel number | **fixed** (comment) | Docstring states the full-pitch definition. Value unchanged, as proposed. |
| M4 multiphoton header | **fixed** | Header gives 3.6 % for k = 1. |
| M5 Voigt guard | **fixed** | `line-broadening.ts:105` returns NaN. **Not pinned**: no test calls it with a negative or non-finite width. |
| M6 `planckWeightedMean` | no action | As proposed. |
| M7 fused-silica range | **fixed** | Range 0.21–3.71 µm (`sellmeier-data.ts:34`). No test names the new limit. |
| M8 YVO₄ range | **partial** | Comment added; the declared range is still 0.488–3.39 µm (`uniaxial-data.ts:59-60`), so the page still shows n_o 1.942 at 3.39 µm against Shi's 1.913. |
| M9 fused-silica dn/dT | **fixed** | 8.86e-6 /K absolute (Leviton & Frey 2006). My check: Malitson's relative 10.0e-6 minus n·(n_air − 1)/T gives 8.66e-6, 2.4 % away. Tests `dn/dT presets…` and `dn/dT: absolute CHARMS values…` (`tests/materials-windows.test.ts:116, 125`). |
| M10 quartz dn/dT label | **fixed** | Window uses −5.5e-6 (n_o); same test. |
| M11 silicon two-photon spread | **fixed** | Page text and a Dinu 2003 reference. Not pinned (text). |
| Q9 Kerr reference method | **fixed** | Source now reads "Z-scan benchmark of their pump–probe method" (`kerr-index.ts:141`). |

### Part 3: wave-optics, polarization, thin-film, agent surface

| Finding | Verdict | Evidence |
|---|---|---|
| W1 34 silent nulls | **fixed** | My sweep: 4303 runs, 2344 null outputs, **0 with an empty `warnings`**. anti-fog at −25 °C returns 78.95 mN/m; solar-protection at 40 pairs returns 48.82 %. Test `each input at its min and max…` (`tests/api-schemas.test.ts:65`); `thin-film-edge-filter.test.ts:136` for the 40-pair rounding. |
| W1, "names the output" | **open by design** | A warning exists for every null, but roughly 950 of the 2344 are not named by any warning (word match, rough). This is what #292 starts on. |
| M1 ellipsometry on a totally reflecting substrate | **fixed** | The schema and page report both roots. The review's probe still prints 4667/8244 because it calls the single-root function. Test `film inversion on a totally reflecting substrate reports both roots` (`tests/thin-film-ellipsometry.test.ts:105`). |
| M2 soliton count at N = 1.5 | **fixed** | ⌈N + ½⌉ − 1. Test `tests/wave-optics-solitons.test.ts:105-107`. |
| M3 | no action | As proposed. |
| M4 Gires–Tournois sign line | **fixed** | `gires-tournois/page-client.tsx:86`. Not pinned (text). |
| M5 OPO intensity convention | **fixed** (text) | Page lines 108–109 state the factor 2. |
| M6 conoscopic edge value | **fixed** | Test `Conoscopy: the largest retardance is the rim value` (`tests/polarization-conoscopy.test.ts:80`). |
| M7 `Number()` parsing | **fixed** | `waist=0x10` gives a 400; `1e1` still passes (intended). Test `tests/api-schemas.test.ts:107-109`. |
| M8 MCP batch | **fixed** | A batch of 200 calls gets HTTP 429. Test `MCP: a batch counts each message` (`tests/mcp.test.ts:74`). Note the whole batch is refused, not the excess. |
| M9 404 in OpenAPI | **fixed** | Test `tests/api-schemas.test.ts:202-203`. |

## B. Open PRs

### #289 `fix/fable-review-laser-safety`: safe to merge

- **Rebase.** A merge of main is clean. A linear rebase has one conflict, `src/lib/test-stats.json`; the right content
  is the head's (1392 tests). `--theirs` leaves a stale count, so regenerate it.
- **Gates.** Head and merged tree: `npm run check` 1392/1392; `npm run build` passes on the merged tree.
- **Claims** (reference = hand-written closed form or brute force in `pr289/`):

| Claim | True? | Pinned by |
|---|---|---|
| 1350 nm anterior segment 2000 / 200 / 100 J/m² at 1 ns / 500 ps / 50 ps; 800 nm 500 ps 63.40 J/m² | yes | `tests/laser-safety-pulse-train.test.ts:212` |
| It binds at 1399 nm, 500 ps (200 against 18 240 J/m²) | yes | none at the API level |
| `euA11` input removed; `?euA11=1` is an unknown input | yes | `laser-safety-audit-2026-11.test.ts:76` |
| A11 outputs for Classes 1 **and 3R** | **half**: a later commit (f8cb99d) removed the 3R ones | the same test asserts there is none |
| 1310 nm: 0.09719 J through 1.5 mm; CW 94.93 mW | yes for Class 1 | schema check; `laser-safety-laser-classes.test.ts:182` |
| Scanning beam √(a² + (rφ)²); 7.682 → 7.671 mW; 1528 → 1493 mW | yes (brute force 7.672 and 1493.0) | equivalence only; the new absolute values are not pinned |
| P_max rises with beam size | yes: 401 sizes × 5 wavelengths × 10 variants, no decrease | none |
| 1378 tests, 3 new | **stale**: 1392, 4 new | n/a |

- **Regressions.** Sweep of all 41 laser-safety schemas (467 runs): only ael-limits and scanning-mpe change, as
  intended. Through the API the M3 change shows only at 1350–1399 nm below 1 ns (1350 nm, 2 mm: 7703 → 1928 µJ).
  #290 and #291 are not undone.
- **Before merging:** correct the PR body (3R outputs, counts). The 10 % rule's wording on p. 287 and everything A11
  remain unverified against the texts.

### #292 `fix/null-reasons`: safe to merge, with caveats

- **Gates.** `npm run check` 1390/1390; `npm run build` passes. Already on top of main.
- **Claims:**

| Claim | True? | Pinned by |
|---|---|---|
| `reasons` in `ComputeResult`; `runSchema` adds it to `warnings` | yes | `tests/api-schemas.test.ts:103-113` (tirf) |
| REST and MCP carry `reason`; OpenAPI documents it | yes (handlers run in-process) | **none** |
| 1553 partially null outputs | yes, reproduced | n/a |
| "only 150 named in a warning" | **not reproduced**: 111 (label or key) or 99 (key) | n/a |
| Backlog "447 output/run pairs in 128 schemas" | 447 and 128 reproduced, but they are **outputs, not output/run pairs** (as triples: 1863) | `:103-107` |
| Ratchet fails both ways | yes, three scratch experiments | `:103-107` |
| `docs/unverified-sources.md` | accurate against the code | n/a |
| ε_z = [α_f − 2ν/(1−ν)(α_s − α_f)]ΔT; −1.066566e-4; 0.2909038 against 0.3186501 nm | yes: derived from Hooke's law independently, limits and values reproduced | `tests/thin-film-environmental-stability.test.ts:56-74`, schema check |

- **Regressions.** 4398 shared sweep runs: outputs change only in environmental-stability; no warnings list changes.
  Old shared URLs of that page now give the substrate-held result (0.2909 instead of 0.3187 nm), which is intended.
- **Caveats:** the ratchet is per output, so an output already pending can gain a new unexplained null unnoticed; the
  REST/MCP `reason` field has no test; two numbers in the PR body are off as above.

### #293 `feat/fable-upgrades`: safe to merge, with caveats

- **Gates.** `npm run check` 1391/1391; `npm run build` (Turbopack) passes: 855 static pages against 434 on main,
  421 `/og` PNGs (22 MB), static generation 16.6 s against 5.5 s. Shared JS 145.4 KB gz on both; the bundle budget passes.
  "Targeted tests 55/55" could not be reproduced as a number (the touched files hold 34 tests, all passing).
- **Claims:**

| Claim | True? | Pinned by |
|---|---|---|
| MCP `matchedTerms`, `queryTerms`, `exactMatches` | yes, consistent on 12 queries; `exactMatches` counts only the returned results | `tests/mcp.test.ts:95`, `tests/search-golden.test.ts:95` |
| Plural rules; lens, focus, gauss left alone | yes (`site-search.ts:94-99`) | none direct |
| "optical glasses" ranks the glass catalogue first | yes (rank 4 on main, 1 here) | `search-golden.test.ts:58` |
| Typo tolerance, distance 1 or 2 from 8 letters | yes; `editDistance` equals a reference on 400 000 random pairs | `search-golden.test.ts:95` |
| Six new golden cases in the top 3 | yes, all rank 1; no old case moves | `search-golden.test.ts:70, 78` |
| Quick wins 6, 7, 8, 9, 10 | yes, checked in the built app at 375 and 1280 px | none |
| 11 gray-500 → gray-400, "3.6:1 → 6:1" | yes; computed 3.67 → 6.82 on gray-900 | none |
| 15 `inputMode="decimal"` on number inputs | partly: three raw inputs lack it (jones-calculus, mueller-matrix, mueller-polarimetry) | none |
| 12 OpenAPI `example`; RateLimit headers; Retry-After on 429 | yes: 1788 parameters; headers seen over HTTP; the 61st request gets 429 | `tests/api-schemas.test.ts:213` |
| Page-specific openGraph and twitter cards; `/og` route | yes in the rendered HTML; `/og/laser-safety/nohd` is a 1200×630 PNG, 48.6 KB; unknown paths give 404 | `tests/calculator-pages.test.ts:190` (metadata objects only); the route has no test |

- **Regressions.** API bodies are byte-identical to main for all 411 calculators; sitemap, robots and canonicals are
  unchanged. Search: the golden query "anti-reflection coating" keeps rank 1 but drops from 4 results to 2; "optics"
  now also matches every "optical"; `og:locale` is lost on calculator and category pages.
- **Merge order.** #289, #292 and #293 conflict pairwise only in `src/lib/test-stats.json` (1392, 1390, 1391 tests);
  whichever merges second regenerates it. All three merged in a throwaway tree: tsc clean, 35/35 targeted tests pass.
- **Before merging:** try a negative dBm value on an iPhone (W11 below).

## C. Search

- **Golden test on main:** passes; 45/45 in the top 3, 42 at rank 1. It has no plural, typo, hyphen or
  three-letter-abbreviation case.
- **343 probe queries** (golden variants plus 20 of my own):

| Group | n | main top-3 | main miss | #293 top-3 | #293 miss |
|---|---|---|---|---|---|
| Plurals | 38 | 19 | 16 | 37 | 1 |
| Spelling, hyphen, unicode | 83 | 66 | 13 | 68 | 11 |
| Abbreviations, synonyms | 99 | 78 | 12 | 78 | 12 |
| Typos | 60 | 31 | 17 | 58 | 2 |
| Own 20 (18 have a page) | 18 | 12 | 4 | 12 | 4 |

- **Still failing on main** (I reran these): "lenses", "etalons", "fresnell", "QWP", "Cn2", "f-stop", "AR-coating"
  return nothing; "gaussian beams" returns the category and m2-factor; "EOM" returns geometric-loss; "PER" returns mpe.
- **Own queries that give an unflagged wrong answer:** "shot noise limited SNR" (optical-coherence), "photon energy
  532 nm" (attosecond-pulse), "laser spot size at 100 m" (lasercom-link). The full list is in the probe's output.
- **#293 regressions:** "nohd calcualtor" goes from rank 1 to a miss; "difraction grating" from 1 to 2.

## New findings

Line numbers are on main unless a PR is named.

**Fixed in** (added 2026-11-17, after the fixes; none merged yet). Branch commits: #289 `8b3efe4`, #292 `6b29a89`,
#293 `53dbd12`, #294 `dc1f1d9` (new PR, branch `fix/fable-verify-2026-11`).

| Finding | Fixed in | How |
|---|---|---|
| E1 search plurals | #293 | Plural rules; misspelt plurals corrected through the singular. Probe: plural misses 16 on main, 1 on #293's old head, 0 now ("blackbodies" included). |
| E2 three-letter abbreviations | #293 | Whole words only; "PER" only in capitals. "EOM" no longer returns geometric-loss. |
| E3 hyphenated / joined words | #293 | Split before a letter, joined forms matched: "AR-coating", "antireflection", "fabryperot". |
| W1 laser-safety items on main | #289 | Already in #289; closed when it merges. |
| W2 Class 3R under A11 | #289 | AEL page, API and classification all cap 3R at 1× the skin AEL (the white paper's reading and the cautious one; A11 text still unread); the warning names 3R. |
| W3 sub-ns wording | #289 | pulsed-mpe, ultrafast pages and registry note cover the 700–1400 nm anterior segment. |
| W4 #289 values not pinned | #289 | Tests: 7.6722 / 1492.98 mW (√2 mm) and 7.6878 / 1547.13 mW (√5 mm, `pr289/probe-scan-sqrt5.ts`) against the brute force; monotonicity (5 λ × 5 variants × 61 sizes); 1399 nm, 500 ps binding at 1928.44 µJ through pulsed-mpe and ultrafast. |
| W5 ratchet per output | #292 | The backlog holds a run count per output (447 outputs, 128 schemas, 1863 runs); all-null runs stay exempt, stated. |
| W6 `reason` untested | #292 | REST, MCP and OpenAPI tests (tirf at θ = 0). |
| W7 missing synonyms | #293 | The listed ones and about 15 more; gvd and goggles groups narrowed. |
| W8 MCP padding, no `closest` | #293 | Same selection as the site, no padding, `closest` and `corrections` returned. |
| W9 unicode / punctuation | #293 | En dash, μ/µ, ², "1/e2", "f/#", "λ/4" folded. |
| W10 one extra word | #293 | A page missing one word is listed (and `closest` set) when it outscores the exact pages. |
| W11 decimal keypad | #293 | `inputMode="decimal"` only where min ≥ 0, else `"text"`; a test checks every schema input and every number field. Not tried on an iPhone. |
| W12 typo "corrections" of real words | #293 | Words in the index or a site word list are never corrected; a correction sets `closest`, is shown, and gives `exactMatches: 0` in MCP. |
| W13 "ar coating" dropped; "lazers" | #293 | Both fixed. |
| M1 scanning at T = 10 s | open | Left alone (needs the standard's reading); listed in #289. |
| M2 plate formula citation | #294 | §7.5.1 (two-beam plate path difference) in the registry too. |
| M3 circular gamma-gamma reference | #294 | Series closed form with its own Γ in the test; the weak case from 120-digit arithmetic (rechecked by direct mpmath quadrature: 5.93620952268e-5). |
| M4 YVO₄ range | — | Kept: no source found for a shorter valid range; the comment stays. |
| M5 Voigt guard, 3.71 µm | #294 | Tests added; the 3.71 µm test found an endpoint rounding bug in `inRange`, fixed (1e-12 slack, no range changed). |
| M6 CS₂ erratum | open | Left alone (paper not reachable). |
| M7 refused MCP batch | #294 | Messages within the limit are answered; each request past it gets its own error. |
| M8 #289 PR body | #289 | Body rewritten. |
| M9 scanning default on the note-c edge | #289 | Default beam 2 mm at the scanner (√5 mm at 1 m). |
| M10 #292 body numbers | #292 | 111 of 1553 (label 14, key 97), counting rule stated; 447 are outputs. |
| M11 free-film sentence | #292 | Page sentence and a test (0.3186501 nm). |
| M12 duplicate warning | #294 | One warning per band, naming it; the min/max sweep now fails on any repeated warning. |
| M13 query length; values only | #293 | Cut at 200 characters; "1550 nm" gets a hint. |
| M14 unverified standards | open | Left alone; listed in #289 and #292. |
| M15 `exactMatches` cap; headers | #293 | Counts the whole index (documented); counters off cacheable responses; `Access-Control-Expose-Headers`. |
| M16 #293 untested parts | #293 | Tests for plurals, `/og`, og tags (title as rendered, `og:locale` restored). |
| M17 gray-400 = gray-500 | #293 | gray-500 is #8a919e (5.6:1), below gray-400 (6.8:1). |

### Errors

- **E1. Search: no plural handling on main.** `src/lib/site-search.ts:136-147` matches the literal word and
  `src/lib/search-synonyms.ts` is singular only. "lenses", "etalons", "bandgaps" return nothing; "gaussian beams",
  "photodiodes", "link budgets" return wrong pages with no `closest` flag. Fixed by #293 except "blackbodies".
- **E2. Search: three-letter abbreviations match inside words.** The whole-word rule covers two letters only
  (`src/lib/site-search.ts:124`): EOM → geometric, PER → permissible, OPA → propagation, DOP → doped. Same on #293.
- **E3. Search: hyphenated or joined words are never split** (`src/lib/site-search.ts:50-51`): "AR-coating",
  "wave-plate", "f-stop", "fabryperot" return nothing. #293 rescues only those within edit distance.

### Weak

- **W1. Laser safety on main still has three audit items open** until #289 merges: sub-ns anterior-segment limit 5×
  high at 500 ps (`src/physics/laser-safety/pulse-train.ts:90`), `euA11` toggle default off
  (`src/schemas/laser-safety/ael-limits.ts:24`), linear beam growth on scanning-mpe
  (`src/schemas/laser-safety/scanning-mpe.ts:66`).
- **W2. #289: the two pages treat Class 3R under A11 differently.** Classification caps 3R (`laser-classes.ts:187`);
  the AEL page shows no EU value for 3R (`ael-limits.ts:17`) and its API warning names only Class 1.
- **W3. #289: page wording not updated for M3.** `pulsed-mpe/page-client.tsx:108-110`,
  `ultrafast-laser-safety/page-client.tsx:99-102` and `src/registry/calculators/laser-safety.ts:683` still say the
  10 % rule is for the cornea only.
- **W4. #289: the new scanning values (7.671 mW, 1493 mW), the monotonicity claim and the binding of the anterior
  limit at the API are not pinned by any test.**
- **W5. #292: the null-reason ratchet is per output, not per run** (`tests/api-schemas.test.ts:97`,
  `tests/null-reasons-pending.json`), and all-null runs are exempt (`:94`).
- **W6. #292: `reason` in REST/MCP and OpenAPI is untested** (`src/registry/api.ts:54, 97`).
- **W7. Search: missing synonyms** (`src/lib/search-synonyms.ts:5-52`): QWP/HWP, "m squared", Cn2, PCF, BPP, GRIN,
  f-stop, "V parameter", "ND filter", "lens equation"; and two over-broad groups (`:36` gvd ↔ "dispersion", `:15`
  goggles ↔ "optical density").
- **W8. Search: MCP `find_calculator` pads exact matches with partial ones and never exposes `closest`** on main
  (`src/mcp/tools.ts:97, 133-138`). #293 adds `exactMatches` but still pads.
- **W9. Search: no unicode or punctuation folding** (`src/lib/site-search.ts:34-51`): en dash, μ against µ, "1/e2",
  "f/#" (trimmed to "f", so flicker-noise wins).
- **W10. Search: one extra word excludes the right page with no `closest` flag** (`src/lib/site-search.ts:163-166,
  190`; stop words `:18-22`).
- **W11. #293: `inputMode="decimal"` probably removes the minus key on iPhone** for the 143 inputs on 82 pages that
  allow negative values (`src/components/validated-number-input.tsx:70`, `input-slider.tsx:72` on the PR). Inferred,
  not tested on a device.
- **W12. #293: typo correction silently "corrects" real words** and reports them as exact matches
  (`src/lib/site-search.ts:244-259` on the PR): tower → power (62 results), wake → wave (180), fairy → airy,
  paris → pairs, "grin lens" → gain/grid, "nohd calcualtor" → pages titled "Calculator". Neither the site nor MCP says
  a correction happened.
- **W13. #293: the synonym filter drops "ar coating" for "anti-reflection coating"** (`site-search.ts:78-86` on the PR),
  and misspelt plurals ("lazers", "wavelenghts") are never corrected (`:247`).

### Minor

- **M1. Scanning MPE at an exposure of exactly 10 s, above 1400 nm.** Rule 2 is tested at the train length
  (N − 1)/f + τ = 9.995 s (`src/physics/laser-safety/pulse-train.ts:165`), where Table 8 gives a 3.556 mm aperture; at
  T = 10 s the aperture is 3.5 mm. 1550 nm default scan: code 1.528 W, with the 10 s check 1.506 W (1.4 % less
  conservative). The same applies to #289's 1493 mW.
- **M2. Citation mismatch for the plate formula.** Registry modelNote says Born & Wolf §7.6.1
  (`src/registry/calculators/spectroscopy.ts:409`); the module, schema and test say §7.5.1.
- **M3. The gamma-gamma test's reference values come from a review probe that calls `gammaGammaCdf` itself**
  (`tests/fso-turbulence.test.ts:381-383`). My independent quadrature confirms the numbers, so the test is right, but
  its stated basis is circular.
- **M4. P2-M8 only half done:** the YVO₄ range is still 0.488–3.39 µm (`src/physics/materials/uniaxial-data.ts:59-60`).
- **M5. No test for the Voigt guard** (`src/physics/spectroscopy/line-broadening.ts:105`) or the 3.71 µm fused-silica limit.
- **M6. The CS₂ erratum has still not been opened by anyone;** `tests/materials-nonlinear.test.ts:100` cites it as if read.
- **M7. A refused MCP batch drops every message,** including those under the limit (`src/app/mcp/route.ts:43-47`).
- **M8. #289: PR body is stale** (3R A11 outputs, 1378 tests, "3 new tests").
- **M9. #289: the new scanning default sits exactly on the 1 mm note-c threshold** (`scanning-mpe.ts:66` on the PR):
  beamDiam 0.999 against 1.000 changes the reported pass duration from 7.95 to 10.21 µs; P_max is continuous.
- **M10. #292: PR body numbers** ("150 named", "output/run pairs").
- **M11. #292: the page does not say that ν_H = ν_L = 0 reproduces the old free-film numbers**
  (`src/app/thin-film/environmental-stability/page-client.tsx:181` on the PR).
- **M12. `/thin-film/dual-band-ar?nSub=1` returns the same warning twice** (on main).
- **M13. Search: no query-length cap** (12 000 characters take about 0.7 s; `src/lib/site-search.ts:79-91`); pure
  number-and-unit queries ("1550 nm") return nothing with no hint.
- **M14. Standards that look as unverified as the three in #292's list:** IEC 60825-1:2014 itself (AELs rebuilt from
  ICNIRP and a white paper), ANSI Z136.1-2014, IEC 60793-2-10 (from datasheets). Candidates only, from grep.
- **M15. #293: `exactMatches` is capped by `limit`** and the tool description does not say so (`src/mcp/tools.ts:146`
  on the PR); cacheable 400 and 404 responses carry one client's RateLimit values and there is no
  `Access-Control-Expose-Headers` (`route.ts:13`).
- **M16. #293: no tests** for quick wins 6–11 and 15, the plural rules, the `/og` handler or the rendered og tags; the
  og:title test asserts the bare title while the page renders it with the site suffix (`metadata.ts:24-31`).
- **M17. #293: gray-400 and gray-500 are now the same colour** (`globals.css:95`), so any hierarchy between them is gone.
