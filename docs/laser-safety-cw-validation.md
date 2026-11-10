# Laser Safety CW Eye Limits — Validation Cases

Seven reference cases for the CW, point-source eye exposure limits that the laser-safety calculators share.

## Scope
- The limits are ICNIRP 2013 (Health Phys. 105(3), 271–295, doi:10.1097/HP.0b013e3182983fd4), Tables 3, 5 and 8,
  implemented for 180 nm to 1 mm and 1 ns to 30 000 s in `src/physics/laser-safety/eye-exposure-limits.ts`.
- These cases cover CW exposure of a small (point) source, α ≤ α_min = 1.5 mrad, at 440–850 nm.
- They are engineering checks, not compliance sign-off values.

## Representative cases

The least ICNIRP 2013 eye limit at the wavelength and exposure time (Table 5).

| Wavelength | Exposure | Binding limit | H (mJ/cm²) | E (mW/cm²) |
|---|---:|---|---:|---:|
| 440 nm | 0.25 s | Retinal thermal, 18 t^0.75 J/m² (400–1400 nm, to 10 s) | 0.6364 | 2.5456 |
| 440 nm | 30 s | Retinal photochemical, 100 C_B J/m² (10–100 s), C_B = 1 below 450 nm | 10.0000 | 0.3333 |
| 470 nm | 30 s | Retinal photochemical, 100 C_B J/m² (10–100 s) | 25.1189 | 0.8373 |
| 470 nm | 600 s | Retinal photochemical, C_B W/m² (100 s – 30 ks) | 150.7132 | 0.2512 |
| 532 nm | 600 s | Retinal thermal, 10 W/m² (from 10 s, α_min) | 600.0000 | 1.0000 |
| 633 nm | 3600 s | Retinal thermal, 10 W/m² (from 10 s, α_min) | 3600.0000 | 1.0000 |
| 850 nm | 3600 s | Retinal thermal, 10 C_A C_C W/m² (from 10 s, α_min; C_C = 1 below 1150 nm) | 7182.9443 | 1.9953 |

## Correction factors
- **470 nm:** `C_B = 10^(0.02 × (470 − 450)) = 2.511886…`
- **850 nm:** `C_A = 10^(0.002 × (850 − 700)) = 1.995262…`

## How to verify
- `npm test`. The test "docs/laser-safety-cw-validation.md: seven CW point-source cases" in
  `tests/laser-safety-eye-exposure-limits.test.ts` checks these values.
- If the implementation changes, update both the test and this table in the same commit.
