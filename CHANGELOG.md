# Changelog

Changes that alter a number or a statement on the site. Code-only changes are in the git history.

## Unreleased

### Changed
- **Adaptive optics** (`/imaging/adaptive-optics`): the fitting-error coefficient for piston + tip-tilt mirror segments
  is now κ = 0.18 (was 0.134). 0.134 was Noll's Δ₃ for a circular segment; the other two coefficients (continuous 0.28,
  piston-only 1.26) are for square cells, and 0.18 is the square-segment value printed beside them (C. Max, UCSC AY289
  lecture 8, 2016, slide 46). Its fitting variance rises by 34 % (Fable review 2026-11-20, W1). Below ≈ 1.19 segments
  across it is now capped at Noll's Δ₃ (D/r₀)^(5/3), what one piston + tip-tilt segment leaves.
- **Laser safety, pulse trains** (`/laser-safety/pulsed-mpe`, `/laser-safety/ultrafast-laser-safety` and the other
  pulse-train pages): T_i switches from 5 µs to 13 µs at 1050 nm, the same edge as the single-pulse limits (ICNIRP 2013
  Table 4 prints 1,051 nm, Table 5 1,050 nm). Only 1050 ≤ λ < 1051 nm changes (M1).
- **Scintillation** (`/free-space-comms/scintillation`): one sentence says that the weak / moderate-to-strong label
  follows Andrews & Phillips' σ_R² < 1 convention (M4).
