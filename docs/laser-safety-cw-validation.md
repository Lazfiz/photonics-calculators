# Laser Safety CW Bounded Suite — Validation Matrix

This document freezes a small set of representative reference cases for the bounded CW point-source suite.

## Scope
These values are for the bounded engineering pre-check suite only:
- CW / continuous exposure
- small-source / point-source direct beam
- 400–1050 nm
- explicitly implemented ANSI-style table slices only
- not compliance-grade sign-off values

## Reference anchors
- ANSI Z136.1 ocular MPE framework
- OSHA Technical Manual, laser hazards chapter
- UC Merced Laser Safety Manual summary tables / correction-factor notes

## Representative cases

| Wavelength | Exposure | Expected branch | H_MPE (mJ/cm²) | E_MPE (mW/cm²) |
|---|---:|---|---:|---:|
| 440 nm | 0.25 s | Visible retinal thermal short-exposure | 0.6364 | 2.5456 |
| 440 nm | 30 s | Visible long-duration (400–450 nm, 10–100 s) | 10.0000 | 0.3333 |
| 470 nm | 30 s | Visible blue-light branch (450–500 nm, T1–100 s) | 25.1189 | 0.8373 |
| 470 nm | 600 s | Visible blue-light branch (450–500 nm, 100–3×10^4 s) | 150.7132 | 0.2512 |
| 532 nm | 600 s | Visible long-duration (500–700 nm) | 600.0000 | 1.0000 |
| 633 nm | 3600 s | Visible long-duration (500–700 nm) | 3600.0000 | 1.0000 |
| 850 nm | 3600 s | Near-IR long-duration with C_A | 7182.9443 | 1.9953 |

## Derived constants used in implemented slices
- For **470 nm**:
  - `C_B = 10^(0.02 × (470 - 450)) = 2.511886...`
  - `T1 = 10 × 10^(0.02 × (470 - 450)) = 25.118863... s`
- For **850 nm**:
  - `C_A = 10^(2 × (0.850 - 0.700)) = 1.995262...`

## How to verify
- `npm test`
- the automated checks in `tests/laser-safety-cw.test.ts` should continue matching these cases
- if the implementation changes, update both the tests and this table in the same commit
