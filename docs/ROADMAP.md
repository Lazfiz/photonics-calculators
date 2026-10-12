# Roadmap — photonics-calculators

Open work only, in order. The history is in `docs/archive/roadmap-history.md`: the 2026-10-07 review, every finding's
evidence and the logs of sessions 1–40. Don't read it at session start (≈ 50k tokens). `grep -n "<slug>"` it when a task
needs old evidence. When a stage is done, tick it here with one line (session, branch, PR, headline numbers). The detail
goes in the PR description.

## Status (session 42, 2026-10-12)
- Phases 0–1 are done.
- Phase 2: the registry, trust data and the duplicate merge are done. The physics modules grow with each Phase 4 stage.
- Phase 3 hasn't started. Phase 4 is ongoing.

Model tiers: `npx tsx scripts/tier-status.ts` (add `<category>` to list its untiered pages).

| Category | Tiered | Notes |
|---|---|---|
| laser-safety | 40 / 40 | done (sessions 18, 23, 29–36) |
| thin-film | 39 / 45 | leftovers below |
| polarization | 32 / 33 | parts 1–4 done (sessions 37–42); `polarizer-types` left |
| imaging | 9 / 65 | findings fixed (sessions 19, 22); no full audit |
| free-space-comms | 6 / 27 | findings fixed (Phase 1, session 21); no full audit |
| spectroscopy | 5 / 54 | findings fixed (sessions 19–21); no full audit |
| fiber-optics | 3 / 49 | findings fixed (sessions 19–20); no full audit |
| materials | 3 / 45 | Sellmeier sets fixed (session 20); no full audit |
| wave-optics | 2 / 49 | OPO (19), Gires-Tournois (14) fixed; no full audit |
| detectors | 0 / 54 | |
| **total** | **139 / 461** | 0 `knownIssue`s |

## Next (Phase 4, in order)
- [ ] `polarizer-types`: sourced specs. The Thorlabs, Edmund and Newport spec pages are JS-rendered or return 403 to
  WebFetch and curl. Use Claude in Chrome, or ask the user for data sheets. Also clear the eslint warnings there
  (unused `wavelength` state) and in `polarizer-extinction` (unused `useState`).
- [ ] **Next category audit** (the user picks; detectors 0/54 or fiber-optics 3/49 suggested). Use the procedure from
  thin film, laser safety and polarization:
  - Part 0 audits every untiered page with `physics-reviewer` batches (Opus, high effort).
  - Bug pages get a registry `knownIssue`; OK pages get their tier at once.
  - Then fix in parts of about 8–10 pages a session, with tested modules in `src/physics/<category>/`.
  - Consider saving part 0 as a dynamic workflow (`category-audit`) on its first run.
- [ ] Thin-film leftovers (6 untiered, see open findings).
- [ ] Golden-value tests for the top 50 calculators by traffic (needs traffic data, e.g. Vercel Analytics).
- [ ] Rewrite each heuristic model, or label it illustrative, during its category's audit. Macro-bend and
  second-harmonic are done.

## Open findings (evidence; fix during that category's audit)
**Thin film**
- `thermal-evaporation`:
  - The deposition rate is mass flux × r²/d² × 1e9 with no ÷ρ, so it is ×2,200 (SiO₂) to ×19,300 (Au) too high.
  - The log₁₀P = A − B/T coefficients are ≈ 10⁴ low: Al at 1,080 °C gives 3e-8 Torr where ≈ 1e-4 is expected.
  - The two errors partly cancel, so fix them together with tabulated data (Honig; Alcock et al. 1984). The oxide
    coefficients look invented.
  - The mean free path is 0.005/P_Pa m, against the air rule of 6.6e-3/P_Pa m. Packing and uniformity are heuristics.
- `ion-assisted-deposition`:
  - The atom flux r·ρ·N_A/(ρ·A·M_ion·m_p) is dimensionally wrong (Jr ≈ 1e-30).
  - The correct r·ρ·N_A/M gives Jr ≈ 28, because 10 cm² is 5 mA/cm²; typical IAD is 0.05–0.1 mA/cm².
  - The packing and stress coefficients are uncalibrated (4.9 GPa). It needs a real model with references.
- `sputtering-deposition`, `plasma-deposition`, `adhesion-testing`: not audited. The constants codemod changed their
  amu from m_p to m_u.
- `angle-shift`: matched the module in session 12 (λ₀ cos θ_film to 4e-6 nm) but was never tiered. Audit and label it.
- `ellipsometry-measurement` (optional): a film thickness needs a film model, e.g. a known film index and Azzam &
  Bashara's transparent-film inversion.

**Wave optics**
- `filamentation`: Marburger's z_sf gives a finite collapse distance for P < P_cr.
- `four-wave-mixing`: β₂ is fixed at 20 ps²/km and n₀ at 1.45 in χ³.
- `dye-laser-resonator`: k_ISC = (1 − Φ_f)/τ counts all non-radiative decay as ISC.
- `mode-matching`: the η conjugate sign was fixed in Phase 0 (0.64 for a 2× waist mismatch). It still needs a module
  and a golden test.

**Free-space comms**
- `point-ahead`: θ = v/c, but the point-ahead angle is 2v⊥/c (a factor of 2).
- `bpsk-qpsk`: "Required RX power" uses the RF floor kT = −174 dBm/Hz + 3 dB NF. Coherent optical detection is
  shot-noise limited at hν ≈ −159 dBm/Hz (1550 nm).
- `ber` and `bpsk-qpsk` plot log₁₀(BER) on a linear axis. Switch them back to log axes; the floor is gone.
- `diversity-reception`: a fixed "3σ" outage, and identical gain for SC, EGC and MRC.

**Fiber optics**
- `v-number` (minor): it shows floor(V²/2) modes for V < 2.405.

**Materials**
- `birefringent-crystals` lists the fused-silica Malitson set as quartz.
- `crystal-birefringence` has rutile at 2.454/2.493. Use `materials/uniaxial-data.ts`.

**Polarization**
- `polarization-scrambling` multiplies the stage means, which holds only for incommensurate frequencies. Near-resonant
  stages (q·f_i ≈ p·f_j, p, q ≤ 4) only get a warning: locked 1 kHz stages give 0.5118 in the product but 0.8848 averaged
  in time (`tests/polarization-scrambler.test.ts`). An exact average over the beat period would fix it.

**Laser safety** (optional)
- A scanned-lidar mode on `lidar-safety`.
- Re-check the classes when IEC 60825-1 Ed. 4 is published (only a BSI draft in 2026).

**Cross-cutting**
- `erf` had three implementations. `src/physics/math.ts` replaced five pages' copies; others may remain.
- `useURLState` only rejects non-finite values, so a crafted `?na=0` reaches the physics unclamped. Clamp in the page,
  or give `useURLState` an optional range.
- `ui-check` can't hydrate a page that has no `<input>` (`optical-glass-catalog`; `jones-calculus` until an element is
  added).

## Phase 2 — architecture (open)
- [ ] Pure SI physics functions in `src/physics/<category>/`, with golden tests. They grow with each Phase 4 stage.
- [ ] Set `preserve-manual-memoization` and `no-explicit-any` back to `error` once the pages are on modules
  (`eslint.config.mjs`).

## Phase 3 — graphics & performance
- [ ] Chart rewrite:
  - Real pixel width instead of a scaled viewBox; labels now render at 4–5 px on phones.
  - Hover crosshair and readout; PNG/CSV export.
  - Open bugs: `SimpleChart` reads `null` as 0, so a break in a line needs separate traces. `SimpleLineChart` prints
    coordinates at full precision, so Node and Chrome can differ by 1 ulp (a hydration error on
    `detectors/quantum-efficiency`). Round to 0.01 px.
  - Done: ticks (session 26); log axes with no floor, non-finite values dropped (session 34).
- [ ] Plotly:
  - 18 pages use it. `react-plotly.js` imports the full `plotly.js/dist/plotly` (4.8 MB min), and both `plotly.js` and
    `plotly.js-dist-min` are dependencies.
  - Use `react-plotly.js/factory` with a partial bundle, and drop one dependency.
- [ ] Initial JS was 190–240 KB gz per page (2026-10-07).
  - The ~46 KB gz related-links chunk should be gone since stage 2b (the links are server-rendered). Confirm with a
    bundle check.
  - Read URL state before first paint: today the defaults render first, then the URL values (a flash).
- [ ] Vercel Speed Insights and a JS budget in CI.

## Decisions (keep)
- **Polarization:** Goldstein/Collett convention site-wide.
  - e^{i(ωt − kz)}; RCP = [1, i]/√2, and S3 = 2 Im(Ex* Ey) > 0 for RCP.
  - A retarder with its fast axis at 0° is diag(1, e^{−iΓ}). +θ is counter-clockwise looking into the beam.
  - Fresnel: r_p = −r_s at normal incidence, as in `thin-film/ellipsometry.ts`. `transfer-matrix.ts` uses e^{−iωt} and
    r_p = r_s.
  - Each page states its convention in its `modelNote`.
- **Laser safety:**
  - Use ICNIRP 2013 where IEC values can't be verified (the IEC text is paywalled).
  - ANSI tables aren't public, so the site has no ANSI numbers.
- **Trust data:**
  - Untiered pages say "Not yet reviewed".
  - A page with a known error shows a red `knownIssue` box and no tier; the fix removes it.
- **Duplicates:** merged only with the user's yes, via `src/registry/redirects.json` and the merge codemod.
- **Git:** `main` changes only through a PR, and merges need the user's yes.

## Done (one line each; detail in the archive and the PR descriptions)
- Phase 0 (session 8, PR #2): build fixed, CI, `main` protected, PAT revoked, Claude Code set up.
- Phase 1 (PR #3): erfc and BER, URL state and inputs, JSON-LD rebuild, shell, input labels, seeded PRNG.
- Phase 2:
  - Thin-film transfer matrix (by session 12) and constants codemods (sessions 13–14).
  - Registry 2a and 2b (PRs #11–12), duplicates merged (session 17, PR #13), trust data 2c (session 24, PR #21).
- Phase 4:
  - Findings batches (sessions 18–23, PRs #14–20).
  - Thin film parts 1–4 (sessions 25–28, PRs #22–25).
  - Laser safety audit, parts 2–5b and loose ends (sessions 29–36, PRs #26–33).
  - Polarization audit and parts 1–3 (sessions 37–40, PRs #34–37).
  - Polarization part 4 (session 42, PR #40): 8 pages on 9 tested modules (optical activity, CD, spectral
    depolarization, scrambler, CIE colour, interference colours, conoscopy, photoelasticity, microscope extinction);
    456 tests; 0 `knownIssue`s left.
- Session 41: roadmap archived; `/ship` and `/handover` skills; `physics-reviewer` on Opus; `checker` agent on Haiku.
- [ ] Optional (user): a Defender exclusion for `C:\dev`.
