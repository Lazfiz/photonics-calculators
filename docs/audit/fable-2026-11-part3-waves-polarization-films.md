# Physics review, part 3 of 3: wave-optics, polarization, thin-film, numeric core, agent surface (2026-11-13)

Read-only review by Claude Fable 5.2 in the detached worktree `C:\dev\photonics-review` at `origin/main`
(`d531f2b5e4f1681d1bb42a2cb21ac2dbae6df0ec`). No code was changed, nothing was committed. Three Opus sub-reviewers
(R1 wave-optics, R2 polarization and thin-film, R3 agent surface and constants) recomputed pages; the lead read and
re-derived the complex/FFT/RNG core and 20 physics modules, ran its own numerical probes and checked every major
finding against the code.

**Verdict.** No physics errors. Across 115 pages (37 wave-optics, 33 polarization, 45 thin-film), 103 were recomputed
independently at the defaults and at least one other regime, and every displayed number agreed to better than 0.1 %
or stayed inside the model the page states. The transfer matrix, the Jones/Mueller algebra, the ABCD and resonator
code, the split-step NLS solver and the FFT hold their invariants to rounding error. One weak finding, on the agent
surface: 34 in-range inputs return `null` outputs with no warning, against the schema contract, and two of those are
real failures (anti-fog at its −25 °C minimum, solar-protection at its 40-pair maximum). Nine minor points. The
API, MCP server and pages give the same numbers, and `openapi.json` and `llms.txt` describe what exists.

## How it was checked

- **Sources.** Born & Wolf and Macleod, *Thin-Film Optical Filters* (characteristic matrix, quarter-wave stacks);
  Azzam & Bashara and Fujiwara (ellipsometry); Goldstein, *Polarized Light* and Chipman (Jones, Mueller, Cloude
  coherency test); Siegman, *Lasers* (ABCD, resonators, Q-switching); Degnan, IEEE JQE 25, 214 (1989); Agrawal,
  *Nonlinear Fiber Optics* (NLS, solitons, SPM); Satsuma & Yajima (1974); Treacy, IEEE JQE 5, 454 (1969); Boyd,
  *Nonlinear Optics* (three-wave mixing); CODATA 2022. Formulas were re-derived or recalled; no source PDF was opened.
- **Code read by the lead (in full).** `src/physics/complex.ts`, `fft.ts`, `random.ts`, `constants.ts`;
  thin-film `transfer-matrix.ts`, `ellipsometry.ts`, `quarter-wave-stack.ts`; wave-optics `abcd.ts`,
  `two-mirror-resonator.ts`, `ring-cavity.ts`, `gaussian-beam.ts`, `mode-matching.ts`, `soliton.ts`, `three-wave.ts`,
  `optical-parametric-oscillator.ts`, `optical-parametric-amplifier.ts`, `sum-frequency.ts`, `chirped-pulse.ts`,
  `gires-tournois.ts`, `kerr.ts`, `pulsed-laser.ts`; polarization `jones.ts`, `stokes.ts`, `fresnel.ts`, `mueller.ts`,
  `retarders.ts` (TIR part).
- **Invariant scans** (scripts in `docs/audit/fable-p3-probes/`; run with `npx tsx <file>`):
  `lead/probe-core.ts`, `lead/probe-ultrafast.ts`, `lead/probe-films.ts`, `lead/probe-ellips-roots.ts`,
  `lead/probe-nulls.ts`; `r1/dump.ts`, `r1/batch2–6.ts`, `r1/edges.ts`; `r2/dump.ts`, `r2/tmm.ts`, `r2/batch1–9.ts`;
  `r3/scan.ts`, `r3/parity.ts`, `r3/nulls.ts`, `r3/solar.ts`, `r3/const.ts`, `r3/desc.ts`, `r3/probe2.ts`. Each
  computes the value independently (own transfer matrix, own DFT, own RK4, brute-force scans) beside the module's.
- **Boundary scans.** Critical angle ± 1e-12, grazing and normal incidence, zero-thickness and 1 mm absorbing layers,
  a layer exactly at its critical angle, depolarizer outside the physical range, concentric/planar/unstable cavities,
  N = 1.5 soliton boundary, r → 1 Q-switch, every input of the 37 wave-optics schemas at its min and max
  (`r1/edges.ts`), every input of all 265 schemas at its min and max (`r3/scan.ts`).
- **Agent surface.** Route handlers called in-process (HTTP `GET` handler, MCP JSON-RPC handler, `runSchema`); the dev
  server was not started. Ten pages across ten categories compared API = MCP = page wiring.
- **Tests.** `npx tsx --test` once on the 119 test files that touch this part: 816 pass, 0 fail.
- **Not run.** `npm run check`, the full suite, build, dev server, any live page.

## 1. Errors

None found.

## 2. Weak

### W1. Agent surface: 34 in-range inputs return `null` outputs with no warning

`src/schemas/types.ts:68` says every `null` output is explained by a warning; `tests/api-schemas.test.ts:56` checks
that only at the defaults. Setting each input to its declared min or max (`r3/scan.ts`, re-run by the lead in
`lead/probe-nulls.ts`) finds 34 input/output cases with `warnings: []`. Two are real failures:

- **thin-film/anti-fog**, `waterTemp=-25` (the schema minimum): `surfaceTension`, `adhesionTension`,
  `workOfAdhesion` are null. Cause: `src/physics/thin-film/anti-fog.ts:69` tests `temperature >= 248.15`, and
  −25 + 273.15 is 248.14999999999998 in floating point. At −10 °C the value is 77.01 mN/m.
- **thin-film/solar-protection**, `uvPairs=40` (the schema maximum): `solarTransmittance`, `solarReflected`,
  `uvTransmittance` are null while the visible and NIR means are returned (`src/schemas/thin-film/solar-protection.ts:53-57`).
  At 35 pairs: 48.72 %. The page shows "—" as well.

The rest are infinite or undefined results that are right to be null but do not say which: ring-cavity
`outputCouplerR=0.01` (linewidth), kerr-lens `peakPower=0`, notch-filter / cold-mirror / uv-blocking `pairs=1` (no
edge exists), spectral-calibration `pixelPitch=100`, sputtering-deposition `pressure=1000`, exposure-duration
`power=1e12`, classification `wavelength=180`, scanning-mpe `power=0`, pulsed-mpe `prf=0`, difference-frequency,
four-wave-mixing, OPA/OPO and slab-laser at zero pump, and green-laser-pointer and ultrafast-laser-safety at
`divergence=0`, where the `nohd` schema says "∞" and these two say nothing. An agent reading the JSON cannot tell
"infinite" from "failed". Suggested fix: the two bugs, one warning per null, and the test extended to the min/max scan.

## 3. Minor

| # | Where | Finding |
|---|---|---|
| M1 | `src/physics/thin-film/ellipsometry.ts` (`transparentFilmThickness`), ellipsometry-measurement | On a lossless substrate with n_s < sin θ (total reflection at the substrate; the schema allows n ≥ 0, k = 0) both roots have \|X\| = 1 and the function returns one of them as a consistent fit: θ 55.8°, n_f 2.578, n_s 0.671, d 46.0 nm comes back as 20.7 nm (4667 of 8244 random cases). No wrong root for absorbing substrates or n_s > sin θ. Flag the ambiguity. Probe: `lead/probe-ellips-roots.ts`. |
| M2 | `src/physics/wave-optics/soliton.ts` (`solitonContent`) | At exactly N = 1.5 it returns 2 solitons; Satsuma–Yajima gives η₂ = N − 3/2 = 0, so 1. Boundary value only. |
| M3 | `src/physics/complex.ts` | `sqrt` returns {0, ∞} near \|z\| ≈ 1e308 and the textbook `div` returns NaN for \|b\| ≈ 1e200. No optics input reaches these magnitudes. |
| M4 | `src/physics/wave-optics/gires-tournois.ts:6-14`, page formula | The module uses ρ = +√R, so the delay peaks at δ = π; the cited Kuhl & Heppner form has the minus sign and peaks at δ = 2πm. At the defaults (δ mod 2π = 3.040) the page shows 65.27 fs and +2404 fs²; the cited form gives 0.684 fs. The page's sign is right for a dielectric layer on a metal mirror and the header says so; one line on the page should say which mirror phase gives which sign. |
| M5 | optical-parametric-oscillator versus OPA and DFG | The OPO takes pump intensity P/(πw²), the OPA and DFG pages the on-axis 2P/(πw²) (`three-wave.ts:215`). The same beam gives Γ² a factor 2 apart on sibling pages. Each page labels its own convention. |
| M6 | `src/schemas/polarization/conoscopic.ts:78` | "Largest retardance in the field" is the maximum over the plotted grid, 6.354 µm (10.788 orders); the edge value is 6.363 µm (10.802), 0.14 % more. |
| M7 | `src/schemas/run.ts:41` | Inputs are parsed with `Number()`, so hex, binary and octal strings pass: `gaussian-beam?waist=0x10` runs with 16 µm. |
| M8 | `src/app/mcp/route.ts:27-49` | The rate limiter counts POSTs, not JSON-RPC messages: 200 `run_calculator` calls in one 24.9 kB batch were all answered, and about 500 fit under the 64 kB body cap. |
| M9 | `src/registry/api.ts:121-123` | `openapi.json` lists 200, 400 and 429 but not the 404 the handler returns for an unknown calculator. |

Observation, not graded: the NLS solver's default step gives a 0.25 % peak error after one N = 2 soliton period
(3.9959 against 4 at ξ = π/4), well inside the page's textbook tier.

## 4. Verified correct by independent calculation

Lead probes (worst deviation over the scan):

| Module | Check | Result |
|---|---|---|
| `complex.ts` `sqrt` | principal branch and accuracy on both sides of the cut | exact to rounding |
| `fft.ts` | against a naive DFT, round trip, Parseval, non-power-of-two lengths | ≤ 1e-12 relative |
| `random.ts` | determinism per seed, mean and variance of 1e6 draws | as expected |
| `constants.ts` | c, h, e, k_B, N_A, ε₀, μ₀, m_e, σ against CODATA 2022 | all match; none redefined inline in `src/` |
| `transfer-matrix.ts` | 20,000 random stacks × 2 polarizations against the lead's own matrix code | lossless \|R+T−1\| ≤ 1.4e-14; lossy \|R+T+A−1\| ≤ 8.9e-16; 2212 TIR cases R = 1 |
| `polarization/fresnel.ts` vs transfer matrix | bare interface, all angles | ≤ 1.7e-15 (after the documented r_p sign) |
| frustrated TIR | closed form | 0.38337366, same |
| `mueller.ts` | closed forms vs Mueller-from-Jones; Cloude coherency eigenvalues of random chains | ≤ 5.6e-16; min eigenvalue ≥ −2e-16 |
| `abcd.ts`, `two-mirror-resonator.ts` | det = n₁/n₂; eigenmode vs closed form over 2950 stable cavities | 2.9e-8; spot 1.5e-13, waist 8.5e-14, position 3.6e-12 |
| `soliton.ts` (split-step) | N = 1 peak; N = 2 at π/4 and π/2; linear sech rms width; energy | 0.999984–1.000002; 3.9959 and 1.0025; 1.955113 = √(π²/12 + ξ²/3); ratio 1.0000000000 |
| dispersive wave | root residual of β₂Ω²/2 + β₃Ω³/6 = γP/2 | 7e-10 |
| `gires-tournois.ts` | τ = dφ/dω, GDD = dτ/dω numerically | 5e-9 |
| `chirped-pulse.ts` Treacy | 1200 /mm, 35°, 0.3 m, double pass, 800 nm | GDD −9.984252e-25 s², TOD 1.82686e-39 s³, both equal numeric derivatives |
| chirped Gaussian | 100 fs + 20,000 fs² | 563.46 fs (FFT 561.5 at grid resolution) |
| `pulsed-laser.ts` | extraction η, RK4 ∫Φ = rη, FWHM (r = 3: 2.7043 τ_c), Degnan optimum by brute-force scan | same; γ₂ 0.5743 |
| `mode-matching.ts` | lens puts waist w₂ at d | 3e-15 |
| `kerr.ts` SPM | rms broadening, FFT vs closed form (Gaussian, sech) | same |
| `ellipsometry.ts` | SiO₂ 100 nm on Si, 70°, 632.8 nm; vs transfer matrix; pseudo-constants of a bare substrate | Ψ 41.055°, Δ 79.787°; 3e-14; 1e-11 |
| `quarter-wave-stack.ts` | closed-form R vs matrix; mirror delay (1064 nm, 2.35/1.46); stop band | 9e-16; 1.99389 fs (high outer), 6.84103 fs (low outer); 925.14–1251.91 nm against 919.40–1262.58 at 50 % for 60 pairs |
| `retarders.ts` TIR | δ against `fresnel.ts`; maximum δ at n = 1.5151 | 1.5e-14; 46.2972° |

Sub-reviewer recomputes, defaults plus one other regime per page (selected rows; all rows agree):

| Page | Inputs | Value (mine = code) |
|---|---|---|
| wave-optics/q-switched-laser | r = 3 and 1.5, own RK4 | extraction 94.048 %, FWHM 15.49 and 46.59 ns, 2.635 mJ |
| wave-optics/four-wave-mixing | defaults; normal dispersion; 0.2/5/20 dB/km coupled equations | G 512; 1.917; same |
| wave-optics/free-electron-laser | defaults, own Xie fit | ρ 4.1305e-3, L_g 0.5730 m, P_sat 22.5 MW |
| wave-optics/optical-waveguide | d 10, 2, 0.5 µm, own TE₀/TM₀ solver | n_eff and confinement to 1e-15 |
| wave-optics/supercontinuum | defaults | N 8.649, dispersive wave 633.35 nm |
| wave-optics/optical-parametric-amplifier | defaults; Δk 0.2 /mm | G 323.2; 138.6 |
| wave-optics/hermite-gaussian | HG₂₁, HG₁₀,₇, LG₁₂ | M² 5 and 3; peaks on a 2-D grid |
| wave-optics/diffraction-integral | circular aperture z 1 and 0.3 mm (Rayleigh–Sommerfeld); slit | same; 1.15751 |
| polarization/liquid-crystal-polarizer | 90°, 240°, 0° twist, own 4000-slab Jones integration | T∥ 0.869 %, T⊥ 99.131 % |
| polarization/glans-prism | Taylor, Foucault, Thompson | +5.607°, 5.638°, −4.69°/27.34° |
| polarization/birefringent-polarizer | Wollaston 20° calcite; Rochon; Sénarmont | 7.191° total |
| polarization/circular-dichroism | ΔA 0.01 | 329.81 mdeg, [θ] = 3298.2 Δε |
| polarization/polarizing-beamsplitter | MacNeille, own matrix at 45° in glass | n_glass 1.68294 |
| polarization/brewster-polarizer | 4 plates | θ_B 56.659°, T_s 0.40218, DOP 0.42635 |
| thin-film/bandpass-filter, narrow-bandpass | 27 and 77 layers, own matrix | 98.892 % / 19.137 nm; 99.691 % / 1.1342 nm |
| thin-film/dielectric-high-reflector | (HL)¹⁰H | 99.99296 %, 923.43–1255.05 nm, 1.97173 fs |
| thin-film/dichroic | (HL)⁷ at 45° | R_s 99.8495 %, R_p 96.7114 % |
| thin-film/notch-filter | defaults | OD 3.4067; 36/47/68 pairs for OD 3/4/6 |
| thin-film/gradient-index | own 2000-slab profile | 0.17699 % against 0.177065 % |
| thin-film/thermal-evaporation | Al, 1473 K | 0.817 Pa, 0.1992 nm/s |
| thin-film/spectrophotometry | absorbing film | R/T/A 2.8179 / 96.9597 / 0.2224 % |

**Conventions.** RCP = [1, i]/√2, S₃ > 0 for RCP, retarder diag(1, e^{−iΓ}), +θ counter-clockwise looking into the
beam and r_p = −r_s at normal incidence hold on every polarization page and in ellipsometry; the transfer matrix's
e^{−iωt}, N = n + iκ, r_p = r_s convention is stated where its phase is shown, and the two agree after the documented
map (Δ = π − arg ρ). poincare-sphere and stokes share one module.

**Agent surface.** 265 schemas = 265 `openapi.json` paths with unique operationIds; `llms.txt` says 411 calculators and
265 with an API, which matches the registry and the MCP server; `checks.json` lists 265 calculators and 544 cases, all
passing; every URL is on `https://photonicscalculators.com`. Defaults lie inside min/max and unit factors are
consistent in all schemas. Out-of-range values, NaN, Infinity, empty strings, "abc", "633nm", unknown keys, wrong
choices and duplicate keys all get a 400 with a reason; no input produced a 500 or a stack trace. The 61st request in
a minute gets 429. HTTP and MCP share `parseInputs`. API = MCP = page wiring within 1e-9 for gaussian-beam, airy-disk,
coupling-efficiency, attenuation, geometric-loss, semiconductor-bandgap, brewster-polarizer, etalon-fsr, single-ar
and nohd, at the defaults and one other input set each. (detectors has no schemas yet; nothing claims otherwise.)

**Tier labels.** None overclaims in these three categories.

**Judged correct after a second look.** The FEL input is kinetic energy (γ = 1 + T/mc²); the M² page takes the full
divergence angle and the diffraction page an aperture radius, both labelled; Marburger's collapse distance uses z_R as
`kerr.ts:15` states; the diode far field 37.6° is paraxial (≈ 39° exact), as the page says; the long-pass edge filter's
(H/2 L H/2)^N is the better design for its indices (pass-band mean 95.6 % against 78.3 %); calcite n_e(589 nm) 1.48614
against Hecht's 1.4864 is inside the tolerance the tests state.

## 5. Suggested fix order

1. W1: `anti-fog.ts:69` boundary (compare in °C or allow 1e-9 K), solar-protection at 40 pairs, a warning for each
   remaining null, and `tests/api-schemas.test.ts` extended to every input's min and max.
2. M7 and M9 with it (same files): decimal-only number parsing; 404 in `openapi.json`.
3. M8: count JSON-RPC messages in the MCP limiter, or cap the batch length.
4. M1, M2: ambiguity flag for the totally reflecting substrate; strict inequality at N = 1.5.
5. M4, M5, M6: one line of text each. M3: no action needed.

## 6. Questions for the owner

1. W1: should infinite results be `null` plus a warning (as `nohd` does), or a string such as "∞" in the JSON?
2. M5: should the OPO page move to the on-axis intensity 2P/(πw²) like the OPA and DFG pages, or keep the average
   and link the difference?
3. M7: is accepting `0x10` or `1e1` intended leniency for agents, or should only decimal notation pass?
4. M8: is an MCP batch meant to count as one request?
5. M4: keep the metal-mirror sign as the page default, or offer the mirror phase as an input?

## 7. Not covered

- **Polarization and thin-film, sanity checks only (12 pages):** polarizer-types (catalogue data), the
  microscope-polarizer surface leak, the band means of cold-mirror, ir-blocking, uv-blocking, wide-bandpass and
  solar-protection (design wavelengths were checked), emissivity-control beyond the blackbody fraction, sputtering
  thermalisation, the interference colours of orthoconoscopic and birefringence-imaging.
- **Wave-optics:** all 37 recomputed; abcd-matrix, mode-matching, ring-cavity, soliton and
  optical-parametric-oscillator got the lead's module-level checks plus a default and one other case at page level.
- **Agent surface:** the deployed site and real HTTP (HEAD/OPTIONS/POST, production cache headers), sending through
  `report_problem`, the ranking of `find_calculator`, and whether the sources cited in `checks.json` print the pinned
  values.
- Material data (Rakić Al, Yang Ag, Ghosh quartz/calcite) were used as coded, not checked against the tables.
- No reference was opened and no page was rendered: a misprint shared by memory and code would not show, and labels
  and units were read in the source, not in a browser.
