---
paths:
  - "src/physics/**"
  - "src/lib/**"
  - "src/app/**/page-client.tsx"
  - "tests/**"
---
# Physics code

- **Units:** SI internally. Convert UI units (nm, mm, µm, dBm, °C) at the input/output boundary only,
  and name variables with their unit when they're not SI (`lambda_nm`, `L_mm`).
- **Constants:** import from `src/physics/constants.ts` (exact SI values; measured ones from CODATA 2022).
  Never write `3e8`, `1.6e-19`, `6.626e-34`, `1.38e-23` inline.
- **Shared math:** one `erf`/`erfc`/`Q`, complex helpers, etc. in `src/physics/math.ts` and `src/physics/complex.ts`.
  Don't add another local copy.
- **Domain guards:** every input reaches the physics clamped/validated. Guard ÷0, `sqrt`/`log` of
  negatives, `asin`/`acos` outside [-1,1], and overflow in `exp`. Return `NaN` plus a message rather than a fake number.
- **Numerics:** prefer closed forms. Use `log1p`/`expm1` near 0, and avoid catastrophic cancellation. Bisection or
  scan loops need explicit bounds and iteration caps. State the tolerance.
- **Model tier:** label every calculator Exact / Textbook approximation / Illustrative, and cite the
  reference (book + equation, or paper + DOI) in a code comment next to the formula.
  No unexplained fudge factors. If a prefactor is empirical, cite where it comes from.
- **Tests:** a formula change ships a golden-value test in `tests/` (`node:test` + `assert/strict`)
  comparing against a published value or an independent hand calculation, with the source cited in the test.
  Asserting `> 0` doesn't count. Include one edge case (limit or domain boundary).
- New physics goes into pure functions (`src/physics/<category>/<slug>.ts`), not inline in `page-client.tsx`.
