# Gemini Review — Laser Safety Phase 2 Hardening Triage

## Executive Summary
The `/laser-safety` section of the photonics-calculators repository contains 53 pages ranging from basic optical geometry helpers to complex hazard evaluations. Currently, many hazard evaluation pages (such as MPE, Classification, and Diffuse Reflection) use heavily simplified formulas that omit critical standard corrections (e.g., $C_b$ blue-light hazard, pulse rules, extended sources). These simplifications pose a severe liability and safety risk if relied upon for compliance. 

We have triaged the entire category to isolate pure educational/math helpers (**Bucket A**), quarantine pages that attempt to simplify inherently complex standards (**Bucket B**), and identify a narrow path for upgrading core continuous-wave calculators to semi-serious engineering tools (**Bucket C**).

## Bucket A: Keep live as educational
**Rationale:** These pages are either purely informational text or basic optics/math calculators. They do not output a hazard limit, laser class, or PPE requirement. They are safe to keep public with the existing educational disclaimer.
- **Trust Risk:** Low
- **Effort to Improve:** Small
- **Evidence:** Pages like `beam-diameter-conversion/page.tsx` strictly calculate mathematical profile bounds (1/e², FWHM). Pages like `corneal-vs-retinal/page.tsx` simply describe biological absorption.
- **Literature:** General optics geometry, basic biological transmission properties (e.g., RP Photonics).

**Pages assigned to Bucket A:**
- `ansi-iec-comparison`
- `atmospheric-attenuation`
- `aversion-response`
- `beam-diameter-conversion`
- `beam-divergence-hazards`
- `beam-expander`
- `corneal-vs-retinal`
- `diode-laser-safety`
- `exposure-duration`
- `eye-safe-wavelength`
- `fiber-laser-safety`
- `green-laser-pointer`
- `industrial-laser-safety`
- `medical-laser-safety`
- `peak-power`
- `power-density`
- `research-lab-safety`
- `retinal-image-size`
- `thermal-vs-photochemical`
- `ultrafast-laser-safety`

## Bucket B: Further restrict / quarantine
**Rationale:** These pages attempt to simplify safety scenarios that are intractably complex and highly standard-dependent. For instance, `classification` attempts to assign laser classes without accounting for time-domain pulse trains, optical viewing conditions, or the full AEL tables. `diffuse-reflection` combines extended source geometry and MPE approximations, opening severe risk if a user relies on it for interlock design. Pulsed and scanned calculations are notoriously difficult even for Certified Laser Safety Officers (CLSOs) and depend heavily on pulse-addition rules. These pages should be removed, hidden, or aggressively gated behind a "Not for use" quarantine overlay.
- **Trust Risk:** Critical / High
- **Effort to Improve:** Large (requires digitizing and validating hundreds of pages of ANSI/IEC edge cases).
- **Evidence:** In `classification/page.tsx`, the code uses `if (P_W <= 0.0004) return "Class 1"` which entirely ignores wavelength-dependent and time-dependent AEL limits. `extended-source/page.tsx` implements a highly simplified $C_6$ factor without addressing the complexities of apparent source size and limiting apertures.
- **Literature/Standards:** ANSI Z136.1 (Multiple-pulse rules, $C_p$, extended source $\alpha_{max}$ limits, photochemical bounds), IEC 60825-1 (AEL condition 1/2/3 testing).

**Pages assigned to Bucket B:**
- `ael-limits`
- `blue-light-hazard`
- `classification`
- `corneal-limits`
- `diffuse-reflection`
- `enclosure-class`
- `extended-source`
- `infrared-corneal`
- `infrared-hazard`
- `infrared-thermal`
- `interlock-design`
- `lidar-safety`
- `maximum-exposure`
- `multiple-pulse`
- `multiple-wavelength`
- `prf-correction`
- `pulsed-mpe`
- `retinal-hazard`
- `scan-failure`
- `scanned-mpe`
- `scanning-mpe`
- `skin-hazard`
- `skin-mpe`
- `thermal-lens-hazard`
- `uv-blue-hazard`
- `uv-exposure`
- `uv-hazard`

## Bucket C: Realistic upgrade path
**Rationale:** These pages output hazard limits (MPE, NOHD, OD), but their scope can be strictly bounded. If we restrict the underlying calculator to **Continuous Wave (CW), Point Source only** and rigorously implement the exact piecewise functions from ANSI Z136.1 (including $C_A$, $C_B$, $C_C$, and proper time breakpoints), we can provide a mathematically robust engineering pre-check tool. Once a rigorous CW MPE is available, derived metrics like NOHD and OD are simple physical geometries.
- **Trust Risk:** Medium
- **Effort to Improve:** Medium (bounded entirely to CW point-source standards).
- **Evidence:** `src/lib/laser-safety-mpe.ts` currently uses non-standard smooth interpolations (e.g., `10^(0.02(lam-0.7))`) instead of the exact piecewise standard factors and omits $C_b$. With bounded effort, this file can be upgraded to reflect exact textbook/ANSI tables for CW beams.
- **Literature/Standards:** ANSI Z136.1 Section 8 (CW Point Source MPE tables), OSHA technical manual.

**Pages assigned to Bucket C:**
- `mpe`
- `nohd`
- `optical-density`
- `od-requirements`
- `viewing-distance`

## Cross-cutting risks
1. **Approximations Masking as Exact Limits:** The current codebase implements approximations that are often non-conservative. For example, omitting the blue-light hazard correction ($C_b$) overestimates the safe exposure limit for visible blue lasers.
2. **Implicit CW Assumptions:** Calculators that accept average power without explicitly rejecting pulsed inputs create a trap where users might bypass peak-power/thermal-pulse limits, assuming the CW MPE applies.
3. **Unit Ambiguity:** Previous reviews highlighted catastrophic bugs where formulas expected `W/cm²` but were fed `mJ/cm²` or where divergence was scaled incorrectly from mrad to degrees. Safety calculations must be strictly decoupled from UI state and typed with branded units.

## Recommended product policy
1. **Immediate Quarantine:** Disable or heavily watermark all 27 pages in Bucket B. They represent a liability.
2. **Strict Scope Enforcement:** For Bucket C calculators, explicitly lock the UI to "CW Point Source Only". Provide an active error state or strict validation block if the user attempts to input pulsed parameters or extended source dimensions.
3. **Decouple & Test:** Move all Bucket C math into pure TypeScript functions (e.g., `src/lib/physics/safety-mpe.ts`) completely isolated from React. Write unit tests that assert against canonical ANSI Z136.1 Appendix tables.

## Prioritized next actions
1. Enforce the quarantine/restriction policy for the Bucket B list immediately.
2. Fix the severe unit bugs in the NOHD calculator (`mrad` to `rad` and `mW` to `W` mismatch) and the MPE $C_b$ omission.
3. Overhaul `laser-safety-mpe.ts` to implement exact ANSI piecewise formulas, replacing the current smoothed approximation.

## Full page-by-page triage table

| Page | Bucket | Risk Level | Effort | Justification / Notes |
|---|---|---|---|---|
| `ael-limits` | B | High | Large | Formal classification tables; complex. |
| `ansi-iec-comparison` | A | Low | Small | Informational text. |
| `atmospheric-attenuation` | A | Low | Small | Standard optics/transmission math. |
| `aversion-response` | A | Low | Small | Educational biology. |
| `beam-diameter-conversion` | A | Low | Small | Pure geometry math helper. |
| `beam-divergence-hazards` | A | Low | Small | Educational geometry. |
| `beam-expander` | A | Low | Small | Pure optics helper. |
| `blue-light-hazard` | B | High | Large | Intricate photochemical hazard rules. |
| `classification` | B | Critical | Large | Heavily simplified rules; dangerous for sign-off. |
| `corneal-limits` | B | High | Large | Specific spectral/time rules. |
| `corneal-vs-retinal` | A | Low | Small | Educational biology comparison. |
| `diffuse-reflection` | B | High | Large | Extended source MPE applied to Lambertian targets. |
| `diode-laser-safety` | A | Low | Small | General info on diode profiles. |
| `enclosure-class` | B | High | Large | Depends on physical interlock design/policy. |
| `exposure-duration` | A | Low | Small | Informational reference. |
| `extended-source` | B | High | Large | Angular subtense ($\alpha$) modeling is error-prone. |
| `eye-safe-wavelength` | A | Low | Small | Informational overview of 1400nm+. |
| `fiber-laser-safety` | A | Low | Small | Informational. |
| `green-laser-pointer` | A | Low | Small | Educational (IR leakage hazard). |
| `industrial-laser-safety` | A | Low | Small | Informational / Policy. |
| `infrared-corneal` | B | High | Large | Complex standard tables. |
| `infrared-hazard` | B | High | Large | Specific standard limits. |
| `infrared-thermal` | B | High | Large | Specific standard limits. |
| `interlock-design` | B | High | Large | Process/facility policy. |
| `lidar-safety` | B | Critical | Large | Scanning and pulsed beams combined. |
| `maximum-exposure` | B | High | Large | Redundant with MPE but unstructured. |
| `medical-laser-safety` | A | Low | Small | Informational overview. |
| `mpe` | C | Medium | Medium | Bounded if restricted to Point Source CW; requires exact ANSI tables. |
| `multiple-pulse` | B | Critical | Large | Highly complex addition rules and $C_p$ factors. |
| `multiple-wavelength` | B | Critical | Large | Spectral hazard addition rules. |
| `nohd` | C | Medium | Medium | Simple geometry *if* MPE is rigorously solved. |
| `od-requirements` | C | Medium | Medium | Simple $\log_{10}$ math *if* MPE is rigorously solved. |
| `optical-density` | C | Medium | Medium | Pure attenuation math. |
| `peak-power` | A | Low | Small | Pure math helper ($E/t$). |
| `power-density` | A | Low | Small | Pure math helper ($W/cm^2$). |
| `prf-correction` | B | High | Large | Associated with pulsed rules. |
| `pulsed-mpe` | B | Critical | Large | ANSI time-domain breakpoints are complex. |
| `research-lab-safety` | A | Low | Small | Informational lab policy. |
| `retinal-hazard` | B | High | Large | Standard boundary rules. |
| `retinal-image-size` | A | Low | Small | Pure math helper ($f \cdot \theta$). |
| `scan-failure` | B | Critical | Large | Complex hardware/exposure evaluation. |
| `scanned-mpe` | B | Critical | Large | Moving beam analysis. |
| `scanning-mpe` | B | Critical | Large | Moving beam analysis. |
| `skin-hazard` | B | High | Large | Standard boundary rules. |
| `skin-mpe` | B | High | Large | Standard boundary rules. |
| `thermal-lens-hazard` | B | High | Large | Specific specific limits. |
| `thermal-vs-photochemical` | A | Low | Small | Educational comparison. |
| `ultrafast-laser-safety` | A | Low | Small | Informational non-linear effects. |
| `uv-blue-hazard` | B | High | Large | Standard boundary rules. |
| `uv-exposure` | B | High | Large | Standard boundary rules. |
| `uv-hazard` | B | High | Large | Standard boundary rules. |
| `viewing-distance` | C | Medium | Medium | Equivalent to NOHD math. |
