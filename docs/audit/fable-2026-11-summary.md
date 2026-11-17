# Fable physics review, November 2026: summary of parts 1–3

Read-only review of `origin/main` at `d531f2b5` in `C:\dev\photonics-review`. Nothing was changed or committed.
Reports: `fable-2026-11-part1-signals.md`, `-part2-imaging-spectra.md`, `-part3-waves-polarization-films.md`; probes in
`fable-p1-probes/`, `fable-p2-probes/`, `fable-p3-probes/`. Finding numbers carry the part (P2-E1 = part 2, E1).

## Totals

| Part | Scope | Pages | Errors | Weak | Minor |
|---|---|---|---|---|---|
| 1 | detectors, fiber-optics, free-space-comms | 127 | 0 | 1 | 8 |
| 2 | imaging, spectroscopy, materials, shared radiometry | 129 | 1 | 3 | 11 |
| 3 | wave-optics, polarization, thin-film, numeric core, agent surface | 115 + 265 schemas | 0 | 1 | 9 |
| All | | 371 | 1 | 5 | 28 |

About 330 pages were recomputed independently; no reference PDF was opened, no page rendered, no live site called.
Laser safety was outside all three parts.

## Fix order, batched into PRs

**PR 1. Wrong or misleading numbers (physics).**
- P2-E1 nonlinear-index: CS₂ n₂ is the value its authors later corrected; open the erratum, update rows and test.
- P2-W1 optical-path-length: "extra delay versus vacuum" is wrong for a tilted plate; compute the insertion delay
  (or rename the card and lower the tier), golden value at 60°.
- P1-W1 with P1-M1 scintillation: gamma-gamma value or a σ_R² > 1 flag on the fade card; regime boundary at 1.
- P2-M9, P2-M10: fused-silica dn/dT preset (12.9e-6 against ≈ 10e-6 /K) and the quartz dn/dT label; both feed other pages.

**PR 2. Agent surface.**
- P3-W1: anti-fog −25 °C boundary (`anti-fog.ts:69`), solar-protection at 40 pairs, a warning for every null
  output, and `tests/api-schemas.test.ts` extended to each input's min and max (34 cases today).
- P3-M7 decimal-only number parsing; P3-M9 the 404 in `openapi.json`; P3-M8 MCP batch counted per message.

**PR 3. Claims and notes (text only).**
- P2-W2 birefringent-crystals modelNote (1e-4 claimed, tests allow 1.5e-2); P2-W3 heat-capacity silicon caveat at
  low temperature; P1-M2 lasercom-link "uniform-aperture gains"; P2-M7 and P2-M8 validity ranges of fused silica and
  YVO₄; P2-M11 silicon two-photon spread; P3-M4 Gires–Tournois mirror-phase line; P3-M5 OPO pump-intensity
  convention; P1-M5, P1-M6, P2-M1, P2-M4 notes.

**PR 4. Defaults and small code points.**
- P1-M4 MFD default 10.4 µm on connector-insertion-loss and splice-loss; P2-M2 axial coefficient 0.88 → 0.886;
  P3-M1 ellipsometry ambiguity flag on a totally reflecting substrate; P3-M2 soliton count at N = 1.5; P3-M6
  conoscopic edge value; P2-M3 Shack–Hartmann Fresnel number; P2-M5 Voigt guard; P1-M3 comment. No action: P1-M7,
  P1-M8, P2-M6, P3-M3.

## Questions for the owner (merged)

1. **Infinite results in the API (P3-W1):** `null` plus a warning, as `nohd` does, or a string such as "∞"?
2. **Scintillation card (P1-W1):** show both models, or flag and link to fade-probability?
3. **optical-path-length (P2-W1):** is the card meant as "same geometric path in vacuum" or the insertion delay?
4. **Pupil weighting (P2-M1):** move the psf page's axial profile to the uniform-ρ pupil, or state both in the note?
5. **OPO pump intensity (P3-M5):** on-axis 2P/(πw²) like OPA and DFG, or keep the average and say so?
6. **Gires–Tournois (P3-M4):** keep the metal-mirror sign as default, or make the mirror phase an input?
7. **MFD default (P1-M4):** is 9 µm meant for 1310 nm? Then the wavelength default should change instead.
8. **Silicon two-photon absorption (P2-M11):** keep the Bristow fit alone, or show the measured range beside it?
9. **Kerr reference (part 2, Q1):** `kerr-index.ts` calls Wahlstrand & Cruz (doi 10.1063/5.0331814) a Z-scan; Crossref's
   title says pump–probe hyperspectral imaging. Is the method description right?
10. **Unverified standards:** should the ITU-R P.1814 rain coefficients join the "unverified citations" list?
11. **Agent input leniency (P3-M7, P3-M8):** are `0x10` inputs and uncounted MCP batches intended?
12. **Release order and housekeeping:** one shared module for the duplicate `DB_PER_E_FOLD` helpers? And: eye-safety-fso still shows NOHD 11.1 m on `main` (fixed in 693ed6f2 on
    `fix/laser-safety-audit`). Does that branch merge before the next release?
