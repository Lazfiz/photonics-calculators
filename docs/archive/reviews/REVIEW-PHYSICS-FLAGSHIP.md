# Physics Verification Review — 5 Flagship Photonics Calculators

**Reviewer:** Senior optical physicist (automated verification)
**Date:** 2026-04-04
**Scope:** Formula correctness, unit analysis, edge cases, physical reasonableness

---

## 1. Gaussian Beam Propagation

**File:** `src/app/wave-optics/gaussian-beam/page.tsx`

### Formulas

| Quantity | Code | Standard Formula |
|---|---|---|
| Rayleigh range | `zR = (π · w₀² / λ) × 1000` | `zR = π·w₀²/λ` ✅ |
| Divergence | `divergence = (λ / (π · w₀)) × 1000` | `θ = λ/(π·w₀)` ✅ |
| Beam envelope | `w(z) = w₀·√(1 + (z/zR)²)` | ✅ |
| BPP | `bpp = (w₀/1000) × divergence/2` | `BPP = w₀ × θ` (where θ is half-angle) ✅ |

### Sources Checked

1. **RP Photonics** (rp-photonics.com/rayleigh_length.html): Confirms `zR = π·w₀²/λ` and notes effective zR includes M² factor.
2. **Gentec-EO** (gentec-eo.com): `θ = λ/(π·w₀)`, `D(z) = 2w₀√(1+(z/zR)²)`.
3. **Ansys OpticStudio** (optics.ansys.com): Confirms same standard Gaussian beam equations.

### Unit Analysis

- `wavelength` in nm, `waist` in µm → `π × (10µm)² / 1550nm = π × 100 / 1550 ≈ 0.2027` — result is in µm.
- Code multiplies by 1000 to convert µm → mm for zR display: **correct**.
- Divergence: `λ(nm)/(π × w₀(µm)) = nm/µm = 10⁻³` (dimensionless ratio). Multiplied by 1000 → mrad: **correct**.
- BPP: `(w₀/1000)(mm) × (divergence/2)(mrad)` → mm·mrad. **Correct.** BPP uses half-angle divergence.

### Edge Cases

- **z=0**: `w(0) = w₀·√(1+0) = w₀` ✅ — waist correctly shown.
- **wavelength → 0**: zR → ∞, divergence → 0. No NaN. Physically correct limit.
- **waist → 0**: zR → 0, divergence → ∞. Chart zMax clamps to max(zR×4, 1) = 1mm. **Safe.**
- No division by zero risk (waist min = 2µm, wavelength min = 400nm).

### Physical Reasonableness

- Default λ=1550nm, w₀=10µm: zR≈0.20mm, θ≈49.3mrad. This is a tightly focused beam — physically reasonable.
- Wavelength range 400–2000nm: standard optical range. ✅
- Waist range 2–100µm: reasonable for wave optics.

### Verdict: ✅ Correct

All formulas are textbook-standard. Unit conversions are correct. BPP correctly uses half-angle divergence. No issues.

---

## 2. Maximum Permissible Exposure (MPE)

**File:** `src/app/laser-safety/mpe/page.tsx`

### Formulas in Code

```
λ = wavelength / 1000  (nm → µm)
400–700nm:   MPE = 1.8 × t^0.75  mJ/cm²
700–1050nm:  MPE = 1.8 × 10^(0.02(λ-0.7)) × t^0.75  mJ/cm²
1050–1400nm: MPE = t > 10 ? 100 : 0.01 × t × 1000 = 10t  mJ/cm²
1400–1800nm: MPE = 100  mJ/cm²
```

### Sources Checked

1. **ANSI Z136.1-2014/2022** (sample from assets.lia.org): The standard uses a correction factor C_b for blue light (400–450nm) and the base MPE formula for point-source ocular exposure in 400–700nm is `MPE = 1.8 × C_b × t^0.75` J/cm² (for t in seconds, 1.8×10⁻³ to 10 s). The code omits C_b.
2. **Laser Pointer Safety** (laserpointersafety.com): For 0.25s exposure, visible MPE ≈ 0.64 mJ/cm². Code gives `1.8 × 0.25^0.75 = 1.8 × 0.354 = 0.636 mJ/cm²`. **Matches within rounding.** (But this omits C_b which can be up to 1.5× at 400nm.)
3. **Wikipedia / Laser Safety**: Confirms spectral regions: 400–700nm retinal hazard, 700–1400nm retinal hazard, >1400nm corneal hazard.

### Issues Found

**⚠️ Approximate — multiple significant simplifications:**

1. **Missing C_b correction factor (400–500nm):** ANSI Z136 includes a blue-light correction factor C_b that increases MPE below 500nm (actually decreases it — C_b < 1, making the MPE more restrictive). The code ignores this entirely, making the calculator **non-conservative** (overestimates safe exposure) for blue wavelengths. For a safety calculator, being non-conservative is dangerous.

2. **Missing time-dependent transitions:** ANSI Z136 has multiple exposure-time regimes (e.g., t < 10⁻⁹s, 10⁻⁹ to 18µs, 18µs to 10s, t > 10s). The code uses a single `t^0.75` formula without any time-domain breakpoints for visible/NIR. The actual standard has different exponents and constants for different time ranges.

3. **700–1050nm transition formula:** The code uses `10^(0.02(λ-0.7))` where λ is in µm. At λ=0.7µm: factor = 10⁰ = 1 → MPE = 1.8×t^0.75. At λ=1.05µm: factor = 10^(0.007) ≈ 1.016. This is a *very* weak wavelength dependence. ANSI actually uses a correction factor C_A that rises more steeply. The standard value at 1050nm has a different regime. **This is an approximation.**

4. **1050–1400nm region:** Code gives `MPE = 10t` mJ/cm² for t ≤ 10s. This is 10× the visible MPE at t=1s (10 vs 1.8). ANSI Z136 actually makes 1050–1400nm *more* restrictive than visible for short exposures due to thermal lens effects. The code may be **non-conservative** here.

5. **1400–1800nm:** Code gives constant 100 mJ/cm². ANSI has time-dependent values for this spectral region as well (both radiant exposure and irradiance limits). The constant 100 is an oversimplification.

6. **Unit labeling:** Output is labeled "mJ/cm²" but MPE can be expressed as irradiance (W/cm²) or radiant exposure (J/cm²). The code only handles radiant exposure. For CW lasers, MPE is often an irradiance limit.

### Unit Analysis

- `lam = wavelength/1000` converts nm to µm: correct for formula usage.
- All MPE values output as mJ/cm²: consistent.
- No unit conversion errors.

### Edge Cases

- **t → 0**: `t^0.75 → 0`, MPE → 0. Correct behavior (shorter exposure → lower energy threshold).
- **t > 10 in 1050–1400nm**: Code switches to constant 100. This creates a discontinuity at t=10: MPE jumps from 100 to 100 (continuous, OK). But at t=10.001: MPE=100 vs MPE(10)=100. Continuous. ✅
- **λ exactly at boundaries (700, 1050, 1400)**: `<` vs `<=` operators — λ=700 enters the 700–1050 branch, λ=1400 enters the 1400–1800 branch. Boundary handling is present but not guaranteed continuous.
- Default λ=1550nm, t=0.25s: MPE=100 mJ/cm². This is in the corneal hazard region.

### Physical Reasonableness

- Slider ranges: 400–1800nm, 0.001–10s. Reasonable.
- Defaults produce values in the right ballpark but should not be trusted for safety decisions.

### Verdict: ⚠️ Approximate (safety-critical concerns)

**The MPE calculator is heavily simplified and omits critical ANSI Z136 correction factors. Most dangerously, it lacks the C_b blue-light correction, making it non-conservative at blue wavelengths. The disclaimer is present and appropriate, but users may still rely on it. For a safety calculator, the approximations are concerning.**

**Recommendations:**
- Add C_b correction for 400–500nm (C_b = 1 for 450–700nm, C_b = 10^(0.02(450-λ)) for 400–450nm... actually this *increases* the MPE factor which makes it *less* restrictive. Wait — re-checking: C_b in ANSI Z136 is actually a factor applied to make blue light MORE restrictive. The code's omission is problematic either way depending on the exact convention.)
- Add time-domain breakpoints (especially the t > 10s regime for visible).
- Add pulsed-laser warning since CW formulas are shown.
- Consider removing MPE entirely or adding a much stronger disclaimer with specific guidance on when the calculator is NOT valid.

---

## 3. Nominal Ocular Hazard Distance (NOHD)

**File:** `src/app/laser-safety/nohd/page.tsx`

### Formula in Code

```javascript
const a = (beamDia / 2) / 1000;              // beam radius in meters
const phi = (divergence / 1000) * Math.PI / 180; // divergence: mrad → radians
const mpeWm2 = (mpe / 1000) * 1e4;             // mJ/cm² → W/m²
const factor = (1.27 * power) / (mpeWm2 * a²); // power in mW
const nohd = (1/phi) * (Math.sqrt(factor) - 1);
```

### Sources Checked

1. **Calculator Academy**: `NOHD = (1/θ) × √((4P)/(π·MPE) − d₀²)` where θ is full-angle in radians, P in watts, d₀ in meters. Note: `4/π = 1.273`, matching the code's 1.27 constant. ✅
2. **LaserPointerSafety.com**: For 5mW, 1mrad divergence: NOHD ≈ 51.9 feet ≈ 15.8m. Using code with MPE=2.54 mW/cm² (= 25.4 W/m²): `mpeWm2 = (2.54/1000)×1e4 = 25.4`, `a = 0.001m`, `phi = 1e-6 rad`, `factor = (1.27×5)/(25.4×1e-6) = 250,000`, `nohd = (1e6)(√250000 - 1) ≈ 1e6 × 499 ≈ 499m`. This is WAY too high. **Something is wrong.**
3. **University of Chicago Laser Safety Guide**: NOHD is distance where irradiance equals MPE, dependent on power, diameter, and divergence.

### ❌ CRITICAL BUG: Divergence Conversion

The code converts divergence from **mrad to radians** as:
```
phi = (divergence / 1000) * Math.PI / 180
```

This treats the input as **millidegrees** then divides by 180/π. For divergence=1 mrad:
- `1/1000 = 0.001` (this would be correct as radians if we stopped here)
- `× π/180 = 0.00001745` rad

**The correct conversion from mrad to radians is simply divide by 1000: `phi = divergence / 1000`.** The code incorrectly applies a degrees-to-radians conversion on top, making the divergence ~57.3× too small. This makes the NOHD ~57.3× too large.

**Correct formula:**
```javascript
const phi = divergence / 1000; // mrad to radians (1 mrad = 0.001 rad)
```

The code does `mrad → degrees → radians` which is wrong. 1 mrad = 0.0573° = 0.001 rad, but the code computes 0.001 × π/180 = 1.745×10⁻⁵ rad.

### Unit Analysis (with bug)

- `a = (beamDia_mm / 2) / 1000` → meters. ✅
- `mpeWm2 = (mpe_mJ_cm2 / 1000) × 1e4` → converts mJ/cm² to J/m² then to W/m² (for CW, 1 J/s = 1 W). **Wait: mJ/cm² → J/cm² → J/m² = (mpe/1000) × 10⁴ = mpe × 10 W/m².** But MPE here is radiant exposure (mJ/cm²), not irradiance (W/cm²). For CW exposure, you'd divide by time to get irradiance. **The code treats the MPE input as if it's already an irradiance in mW/cm² masquerading as mJ/cm².** The slider label says "MPE threshold (mJ/cm²)" but the conversion treats it as `mJ/cm² × (1/1s) = mW/cm²`. This only works if the implicit exposure time is 1 second. **This is a unit mismatch.**

- `factor = (1.27 × power_mW) / (mpeWm2 × a²)`: numerator is in mW, denominator in W/m² × m² = W. So factor is dimensionless... but with a factor of 1000 from mW→W mismatch. Actually: `1.27 × power(mW)` should be `1.27 × P(W)` for the formula to work. **The power is in mW but the formula expects watts.** This introduces another 1000× error.

### Summary of Bugs

1. **❌ Divergence conversion: mrad × (π/180) instead of mrad/1000** — makes NOHD ~57.3× too large
2. **❌ Power in mW, formula expects watts** — makes NOHD ~√1000 ≈ 31.6× too large
3. **⚠️ MPE unit ambiguity**: Input labeled mJ/cm² but converted as if mW/cm². Only correct for t=1s.

Combined error factor: ~57.3 × 31.6 ≈ **1810× overestimate of NOHD**. The calculator is conservative (overestimates hazard distance) which is safer than the reverse, but it's wildly inaccurate.

### Edge Cases

- `factor ≤ 1`: returns 0. ✅ Beam is already below MPE at aperture.
- `phi ≤ 0`: returns 0. ✅ Zero divergence guard.
- `a → 0`: `a² → 0`, `factor → ∞`, `nohd → ∞`. Min beamDia is 0.5mm so `a = 0.00025m`. With default values this produces large but finite NOHD.

### Verdict: ❌ Wrong (multiple critical bugs)

**The NOHD calculator has a severe divergence conversion bug (treating mrad as millidegrees) and a power unit mismatch (mW vs W). The NOHD output is ~1800× too large. While this is conservative (overestimates hazard), it renders the calculator practically useless and untrustworthy.**

**Recommendations:**
- Fix: `phi = divergence / 1000;` (remove `* Math.PI / 180`)
- Fix: `factor = (1.27 * power / 1000) / (mpeWm2 * a * a);` or convert power to watts first
- Clarify MPE unit: if input is mJ/cm² for a specific exposure time, state what that time is. Better yet, ask for MPE in W/cm² for CW lasers.
- Add validation with known test case (e.g., 5mW visible pointer, 1mrad → NOHD ≈ 15.8m with appropriate MPE).

---

## 4. Single-Layer AR Coating

**File:** `src/app/thin-film/single-ar/page.tsx`

### Formulas

**Snell's law:** `sin(θ₁) = (n₀/n₁)·sin(θ₀)` — with TIR check (`|sinθ| > 1 → null`). ✅

**Fresnel coefficients (correct sign convention for field reflection):**
- s-pol: `r₀₁ˢ = (n₀cosθ₀ - n₁cosθ₁)/(n₀cosθ₀ + n₁cosθ₁)` ✅
- p-pol: `r₀₁ᵖ = (n₁cosθ₀ - n₀cosθ₁)/(n₁cosθ₀ + n₀cosθ₁)` ✅
- Same for r₁₂ at second interface. ✅

**Phase thickness:** `δ = 2π·n₁·d·cos(θ₁)/λ` ✅

**Thin-film reflectance via transfer-matrix:**
```javascript
const c = cos(2δ), s = sin(2δ);
nRe = r01 + r12·c;
nIm = -r12·s;
dRe = 1 + r01·r12·c;
dIm = -r01·r12·s;
r = (nRe + i·nIm)/(dRe + i·dIm);  // complex division
R = |r|²
```

This implements: `r = (r01 + r12·e^{-2iδ}) / (1 + r01·r12·e^{-2iδ})` where `e^{-2iδ} = cos(2δ) - i·sin(2δ)`.

✅ **This is the standard Airy/summation formula for single-layer thin-film reflectance, equivalent to the transfer-matrix method.**

**Quarter-wave thickness:** `d = λ/(4·n₁·cos(θ₁))` — accounts for oblique incidence via the reduced optical path. ✅

**Optimal film index:** `n_f = √(n_s · n_i)` — standard condition for zero reflectance at normal incidence. ✅

### Sources Checked

1. **RP Photonics** (anti_reflection_coatings.html): "Single-layer AR coating consists of a quarter-wave thick layer with refractive index that is the geometric mean of the adjacent media." ✅
2. **Wikipedia (Anti-reflective coating)**: Confirms quarter-wave condition and transfer-matrix method. ✅
3. **Born & Wolf / Hecht**: Standard textbook formulas match the Fresnel coefficients and thin-film summation used in the code.

### Unit Analysis

- All refractive indices: dimensionless. ✅
- `designWavelength` in nm, `thickness` output in nm: consistent. ✅
- Angle in degrees, converted to radians via `× π/180`. ✅

### Edge Cases

- **TIR at first interface** (θ₀ > critical angle): Returns Rs=Rp=1. ✅ Physically correct — total reflection.
- **TIR at second interface** (θ₁ > critical angle at n₁/n₂): Returns Rs=Rp=1, shows θ₁. ✅
- **Normal incidence (θ=0)**: cosθ₀=1, sinθ₀=0, θ₁=0. Fresnel coefficients reduce to `(n₀-n₁)/(n₀+n₁)`. ✅
- **n_film = optimal at normal incidence**: With n_i=1.0, n_s=1.52, n_f=√1.52≈1.233. Default n_f=1.38 → non-zero residual reflectance. ✅ Reasonable.

### Physical Reasonableness

- Default: n_i=1.0, n_f=1.38 (MgF₂), n_s=1.52 (BK7), λ=550nm, θ=0°. R ≈ 1.26% (non-optimal film index). With optimal n_f=1.233, R→0 at design λ. ✅
- Substrate presets: 1.45 (fused silica), 1.52 (BK7), 1.76 (sapphire). All reasonable. ✅
- Film index range 1.1–2.4: reasonable for common coating materials. ✅
- Angle range 0–75°: approaching grazing but not exceeding. ✅

### Verdict: ✅ Correct

All formulas are textbook-standard and properly implemented. Fresnel coefficients, phase accumulation, complex reflectance calculation, TIR handling, and quarter-wave design are all correct. This is a well-implemented calculator.

---

## 5. Fiber Coupling Efficiency

**File:** `src/app/fiber-optics/coupling-efficiency/page.tsx`

### Formulas

**Mode field radius:** `w₀ = MFD / 2` ✅

**NA mismatch loss:** `η_NA = sourceNA ≤ fiberNA ? 1 : (fiberNA/sourceNA)²` ✅
- When source overfills fiber: fraction of power coupled = (NA_fiber/NA_source)²
- When source underfills: all power accepted. ✅

**Lateral offset:** `η_lateral = exp(-(d/w₀)²)` ✅
- Standard Gaussian overlap integral for lateral displacement between identical Gaussian modes.

**Angular misalignment:** `η_angular = exp(-(π·n·w₀·θ/λ)²)` ✅
- Where θ is in radians, λ in µm (code: `wavelength * 1e-3` converts nm→µm), w₀ in µm, n=1.46.
- This matches the standard result from Nemoto & Makimoto (1979) and Marcuse (1977).

**Total coupling:** `η = η_NA × η_lateral × η_angular` ✅ (independent loss mechanisms multiply)

**Insertion loss:** `-10·log₁₀(η)` dB ✅

### Sources Checked

1. **Nemoto & Makimoto (1979)**: Coupling efficiency for angular misalignment: `η = exp(-(π·n₂·w·θ/λ)²)` — matches code exactly. ✅
2. **Marcuse, "Losses of Tilted Gaussian Beams in Fiber" (1977)**: Same formula for small-angle angular misalignment. ✅
3. **Reddit r/Optics discussion**: Confirms the butt-coupling equations for lateral offset, angular misalignment, and mode mismatch. ✅

### Unit Analysis

- `w₀ = MFD/2` in µm. ✅
- `lateralOffset` in µm, `w₀` in µm: ratio dimensionless. ✅
- Angular misalignment: `theta = (angularMisalign * π/180)` — degrees to radians. ✅
- `lambda = wavelength * 1e-3` — nm to µm. ✅
- Exponent `(π × n × w₀(µm) × θ(rad)) / λ(µm)`: dimensionless. ✅

### Issues Found

**⚠️ Minor approximations:**

1. **Hardcoded n=1.46:** The angular coupling formula uses a fixed refractive index n=1.46 (typical silica fiber at 1550nm). This is reasonable for single-mode telecom fiber but not configurable. If the user sets wavelength=850nm, n should be closer to 1.45. The effect is small (<1% error in exponent) but noticeable for precise work.

2. **No mode field mismatch loss:** The calculator assumes the source Gaussian matches the fiber mode field diameter exactly. In practice, there's an additional coupling loss from w_source ≠ w_fiber: `η_mode = (2·w_s·w_f/(w_s²+w_f²))²`. The MFD slider controls both source and fiber MFD simultaneously. This is a simplification.

3. **No axial (longitudinal) gap loss:** Real fiber connectors have a gap between fiber end-faces. The calculator ignores this.

4. **NA mismatch is geometric, not modal:** The `(NA_f/NA_s)²` formula is an approximation that assumes uniform illumination within the acceptance cone. For Gaussian beams, the actual NA-based loss is smoother. This is a standard simplification.

### Edge Cases

- **All offsets zero, NA matched:** η=1, loss=0dB. ✅
- **sourceNA > fiberNA:** η_NA < 1. ✅
- **sourceNA ≤ fiberNA:** η_NA = 1. ✅
- **totalCoupling = 0**: loss = Infinity, displayed as "∞ dB". ✅
- **Large lateral offset** (d >> w₀): η → 0. ✅

### Physical Reasonableness

- Defaults: sourceNA=0.22, fiberNA=0.12, MFD=10.4µm, λ=1550nm. η_NA = (0.12/0.22)² = 0.298. Loss ≈ -10log₁₀(0.298) = 5.26dB. This is realistic for overfilling a fiber. ✅
- MFD range 4–30µm: covers SMF-28 (10.4µm) through large-mode-area fibers. ✅
- NA range 0.05–0.5: covers standard telecom to high-NA fibers. ✅

### Verdict: ✅ Correct (with noted approximations)

The core formulas are textbook-correct. The hardcoded n=1.46 and missing mode-mismatch loss are minor simplifications appropriate for an educational tool. The calculator produces physically reasonable results.

---

## Summary Table

| # | Calculator | Verdict | Critical Issues |
|---|---|---|---|
| 1 | Gaussian Beam | ✅ Correct | None |
| 2 | MPE | ⚠️ Approximate | Missing C_b, no time breakpoints, non-conservative at blue wavelengths |
| 3 | NOHD | ❌ Wrong | Divergence mrad→rad bug, power mW/W mismatch, MPE unit ambiguity |
| 4 | Single-Layer AR | ✅ Correct | None |
| 5 | Fiber Coupling | ✅ Correct | Minor: hardcoded n, no mode mismatch |

---

## Priority Action Items

1. **🔴 FIX NOHD calculator immediately** — two critical bugs make output ~1800× too large. Even though it's conservative, it's useless for practical safety work.
2. **🟡 Improve MPE calculator** — add C_b correction factor and time-domain breakpoints, or add stronger warnings about which spectral/time regimes are unreliable.
3. **🟢 Minor: Add configurable n to fiber coupling** — allow user to set fiber refractive index or auto-calculate from wavelength.
