# Physics Spot-Check Review — Photonics Calculators

**Date:** 2026-04-04  
**Reviewer:** Senior Optical Physicist (automated verification)  
**Scope:** 30 calculators across all 10 categories (2–3 per category)  
**Method:** Source code analysis + cross-reference against authoritative sources (Wikipedia, RP-Photonics, Thorlabs, academic literature)

---

## 1. Detectors

### 1.1 Dark Current vs Temperature (`detectors/dark-current/page.tsx`)

**Formula in Code:**
```
I_dark(T) = I₀ · 2^((T − 25) / T_d)
σ_dark = √(I_dark · t_exp)
crossover = 25 + T_d · log2(R_read² / (I₀ · t_exp))
```

**Expected Formula:**
- Dark current doubles every T_d degrees: `I(T) = I(T₀) · 2^((T−T₀)/T_d)` ✅
- Shot noise from dark electrons: `σ = √(N_e)` ✅
- Default T_d = 6°C is within the typical 5–8°C range for silicon CCDs ✅

**Sources:** UW detector lecture notes confirm ~10°C doubling for photodiodes, ~6°C for CCDs.

**Verdict:** ✅ Correct

**Notes:** The doubling model is a well-established empirical approximation. The crossover temperature calculation (where dark noise = read noise) is a useful derived metric.

---

### 1.2 Detectivity D* (`detectors/detectivity/page.tsx`)

**Formula in Code:**
```
R = η·q·λ / (h·c)          [responsivity]
i²_shot = 2·q·I_d·F·Δf     [shot noise current²]
i²_thermal = 4·k·T·Δf / R_L [thermal noise current²]
NEP = i_noise / R            [noise-equivalent power]
D* = √(A·Δf) / NEP          [specific detectivity]
```

**Expected Formula:**
- Responsivity: `R = η·e·λ/(h·c)` ✅
- Shot noise: `i² = 2·e·I_d·Δf` (with excess noise factor F) ✅
- Thermal (Johnson-Nyquist): `i² = 4·kT·Δf/R_L` ✅
- D* = √(A·Δf)/NEP ✅

**Sources:** Wikipedia "Specific detectivity", Thorlabs NEP white paper.

**Verdict:** ✅ Correct

**Notes:** All physical constants correct (h=6.626e-34, c=3e8, q=1.602e-19, kB=1.381e-23). Unit conversions (nA→A, mm²→m², MHz→Hz) handled correctly.

---

### 1.3 NEP (`detectors/nep/page.tsx`)

**Formula in Code:**
```
NEP = √(2qI_dB + 4kTB/R_L) / R
D* = 1/(NEP × √A)  (labeled as Jones)
```

**Expected Formula:**
- NEP = `i_noise / R` ✅
- D* = `√(A·Δf) / NEP` — but code says `D* = 1/(NEP·√B)` ❌

**Verdict:** ⚠️ **Wrong D* formula in NEP page**

**Notes:** The D* calculation in the NEP page is `1/(NEP·√bandwidth)`, which lacks the area term. The correct formula is `D* = √(A·Δf)/NEP`. The detectivity page (`detectivity/page.tsx`) has it correct, but the NEP page has an independent, incorrect implementation. Also, the NEP page doesn't use CalculatorShell (missing consistent UI). The ResultCard values show raw template strings like `"{nep.toExponential(2)}"` instead of interpolated values.

---

## 2. Fiber Optics

### 2.1 Chromatic Dispersion (`fiber-optics/chromatic-dispersion/page.tsx`)

**Formula in Code:**
```
D(λ) = D₀ + S₀·(λ − λ₀)
ΔT = |D|·L·Δλ             [pulse broadening]
T_out = √(T_in² + ΔT²)    [Gaussian]
Penalty = 5·log10(1 + (π·D·L·Δλ·B/4)²) [dB]
B_max ≈ 0.44 / (|D|·L·Δλ) [Gaussian bandwidth]
```

**Expected:** All match standard fiber optics textbooks (Agrawal, "Fiber-Optic Communication Systems").

**Verdict:** ✅ Correct

**Notes:** Default SMF-28 parameters (D=17, S=0.056, λ₀=1310) are accurate. The 0.44 factor for Gaussian bandwidth is standard.

---

### 2.2 V-Number (`fiber-optics/v-number/page.tsx`)

**Formula in Code:**
```
V = 2π·a·NA / λ
NA = √(n₁² − n₂²)  (when using indices)
numModes = floor(V²/2)  [step-index approximation]
single-mode: V < 2.405
```

**Expected:** All match standard fiber theory.

**Verdict:** ✅ Correct

**Notes:** The single-mode cutoff at V=2.405 (first zero of J₀) is correct. Mode count formula V²/2 is the standard step-index approximation.

---

### 2.3 Bend Loss (`fiber-optics/bend-loss/page.tsx`)

**Formula in Code:**
```
α ≈ (1.5/(2a)) · exp(−R·γ)
γ = (2·Δ·n₁·2π/λ) · 1.75   [simplified, hardcoded constant]
loss_dB = 10·log10(e) · α   [Np/m → dB/m]
```

**Expected:** Marcuse formula involves Bessel function ratio terms. The simplified version used here is an approximation with hardcoded empirical constants.

**Verdict:** ⚠️ Approximate

**Notes:** The formula is a heavily simplified version of the Marcuse bend loss model. The factor 1.75 is a hardcoded empirical constant (should depend on V-number / λ/λc). Not wrong per se, but limited accuracy. The `gamma` calculation hardcodes `0.996 * 0.3 ≈ 0.3` instead of using the actual operating wavelength ratio. Core radius is hardcoded to 4.1 μm (SMF-28) despite the user not having control over it.

---

## 3. Free-Space Communications

### 3.1 Scintillation Index (`free-space-comms/scintillation/page.tsx`)

**Formula in Code:**
```
σ²_R = 1.23·Cn²·k^(7/6)·L^(11/6)   [Rytov variance]
r₀ = (0.423·k²·Cn²·L)^(-3/5)       [Fried parameter]
σ²_I = σ²_R  (if σ²_R < 1)          [weak turbulence]
σ²_I = 1 + 0.86·σ²_R^(-2/5)         [strong turbulence]
```

**Expected:** Rytov variance and Fried parameter formulas match Andrews & Phillips, "Laser Beam Propagation through Random Media."

**Verdict:** ✅ Correct

**Notes:** The scintillation index model for moderate-strong turbulence (σ²_I = 1 + 0.86·σ²_R^(-2/5)) is an established approximation. The aperture averaging factor formula is plausible. Default Cn² = 1.7e-14 m^(-2/3) is a reasonable weak-turbulence value.

---

### 3.2 Fog Attenuation (`free-space-comms/fog-attenuation/page.tsx`)

**Formula in Code:**
```
β = 3.91/V · (λ/0.55)^(-q)  [dB/km]
Kim q: V<0.5→0, V<1→1.6, V<2→0.585·V^(1/3), else→1.3
Kruse q: V<6→1.6, V<50→1.58, else→1.46
```

**Expected:** Matches the Kim & Kruse visibility models for FSO link attenuation.

**Verdict:** ✅ Correct

**Notes:** However, modern research (Kim et al. themselves, and subsequent work) shows fog is essentially wavelength-independent in the visible to near-IR. The code does implement both models correctly as they appear in the literature, even if the underlying physics is debated. Good to have both models available.

---

### 3.3 Link Budget (`free-space-comms/link-budget/page.tsx`)

**Formula in Code:**
```
FSPL = 20·log10(4πR/λ)
P_rx = P_tx + G_tx + G_rx − FSPL − Atm − Misc
```

**Expected:** Standard Friis transmission equation.

**Verdict:** ✅ Correct

**Notes:** The `rxAperture` input is defined but never used in the calculation. The FSPL formula correctly uses the standard expression. The margin calculation against -30 dBm sensitivity is a reasonable default.

---

## 4. Imaging

### 4.1 Airy Disk (`imaging/airy-disk/page.tsx`)

**Formula in Code:**
```
airyRadius = 0.61·λ/(2·NA)   [in mm]
resolutionNm = λ/(2·NA)      [Abbe limit]
```

**Expected:** Airy disk radius = 1.22·λ/(2·NA) = 0.61·λ/NA. Code has `0.61·λ/(2·NA)` = `0.305·λ/NA` ❌

**Verdict:** ❌ **Wrong Airy disk radius**

**Notes:** The code computes `0.61 * wavelength / 1000 / (2 * na)`. This gives 0.305·λ/NA instead of the correct 0.61·λ/NA. The Abbe limit (`λ/(2·NA)`) is correctly computed. The Airy disk **diameter** should be `1.22·λ/NA`; the **radius** should be `0.61·λ/NA`. The code has an extra factor of 2 in the denominator.

---

### 4.2 MTF (`imaging/mtf/page.tsx`)

**Formula in Code:**
```
f_c = 2·NA/λ                   [cutoff frequency]
MTF(f) = (2/π)[arccos(f/f_c) − (f/f_c)√(1−(f/f_c)²)]
defocusFactor = exp(−2·(W·fn)²)  [Gaussian approximation]
```

**Expected:** Incoherent diffraction-limited MTF matches Goodman, "Introduction to Fourier Optics." The defocus model is a simplified Gaussian approximation.

**Verdict:** ✅ Correct

**Notes:** The defocus attenuation is explicitly noted as a "Gaussian attenuation model" — an approximation, but honestly labeled. The cutoff frequency formula is correct.

---

### 4.3 NA ↔ f/# (`imaging/na-fnumber/page.tsx`)

**Formula in Code:**
```
NA = 1/(2·f/#)
half-angle = atan(1/(2·f/#))
airyDiameter = 1.22·0.55e-6·f/#·1e6  [μm @550nm]
```

**Expected:** NA = 1/(2·f/#) for infinite conjugate ratio ✅. Airy disk = 2.44·λ·f/# ✅.

**Verdict:** ✅ Correct

**Notes:** The relationship NA = 1/(2N) assumes objects at infinity (infinite conjugate), which is the standard convention and correctly stated in the description.

---

## 5. Laser Safety

### 5.1 Optical Density (`laser-safety/optical-density/page.tsx`)

**Formula in Code:**
```
OD = log10(irradiance / (mpeIrradiance / SF))
transmission = 10^(-OD)
```

**Expected:** OD = log10(hazard/MPE) with safety factor. Standard approach.

**Verdict:** ✅ Correct

**Notes:** The MPE calculation is simplified but follows the right structure (different wavelength bands with appropriate formulas). Has proper disclaimers. Safety factor application is correct.

---

### 5.2 Classification (`laser-safety/classification/page.tsx`)

**Formula in Code:**
- Class 1: P < 0.4 mW (visible), P < 1 mW (IR)
- Class 2: P ≤ 1 mW (visible CW only)
- Class 3R: P ≤ 5 mW
- Class 3B: P ≤ 500 mW
- Class 4: P > 500 mW

**Expected:** Simplified IEC 60825-1 thresholds.

**Verdict:** ⚠️ Approximate

**Notes:** The actual IEC 60825-1 AELs are wavelength and exposure-time dependent — not simple power thresholds. The visible Class 1 AEL for CW is ~0.4 mW (correct for t>0.25s), but this varies with wavelength and time. The IR Class 1 threshold of 1 mW is overly simplified. Pulses are not handled at all. The page has appropriate disclaimers.

---

### 5.3 MPE (`laser-safety/mpe/page.tsx`)

**Formula in Code:**
```
400-700nm: MPE = 1.8·t^0.75 mJ/cm²
700-1050nm: MPE = 1.8·10^(0.02(λ-0.7))·t^0.75 mJ/cm²
1050-1400nm: MPE = t>10 ? 100 : 0.01·t·1000 mJ/cm²
1400-1800nm: MPE = 100 mJ/cm²
```

**Expected:** ANSI Z136.1 simplified retinal MPE for 400-700 nm is `1.8·t^0.75·CA·(1/α)` J/cm² where CA is the correction factor and α is the angular subtense. The code's `1.8·t^0.75` gives mJ/cm², which is a simplified version.

**Verdict:** ⚠️ Approximate

**Notes:** Missing the angular subtense correction (α), the pulse correction factors, and the 1/α dependence for extended sources. The code outputs mJ/cm² which is correct for the 400-700nm formula. The transition points between spectral bands are roughly correct. Has appropriate disclaimers about being simplified.

---

## 6. Materials

### 6.1 Sellmeier Equation (`materials/sellmeier/page.tsx`)

**Formula in Code:**
```
n²(λ) = 1 + B₁λ²/(λ²−C₁) + B₂λ²/(λ²−C₂) + B₃λ²/(λ²−C₃)
```

**Expected:** Standard Sellmeier equation.

**Verdict:** ✅ Correct

**Notes:** Fused Silica coefficients match Malitson 1965 (verified against refractiveindex.info). BK7 coefficients match SCHOTT catalog. Diamond has B3=0, C3=0 (correct — 2-term fit). Good material library.

---

### 6.2 Fresnel Equations (`materials/fresnel/page.tsx`)

**Formula in Code:**
```
Rs = ((n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ))²
Rp = ((n₂cosθᵢ − n₁cosθₜ)/(n₂cosθᵢ + n₁cosθₜ))²
θₜ = arcsin(n₁sinθᵢ/n₂)  [Snell's law]
Brewster = atan(n₂/n₁)
```

**Expected:** Matches RP-Photonics and Wikipedia exactly.

**Verdict:** ✅ Correct

**Notes:** TIR correctly detected when |sinθₜ| > 1. Brewster angle correctly computed. Clean implementation.

---

### 6.3 Brewster Angle & TIR (`materials/brewster-tir/page.tsx`)

**Formula in Code:**
```
θ_B = atan(n₂/n₁)
θ_c = arcsin(n₂/n₁)  [when n₂ < n₁]
```

**Expected:** Standard formulas.

**Verdict:** ✅ Correct

**Notes:** Correctly returns N/A for critical angle when n₂ ≥ n₁. Nice beam diagram visualization.

---

## 7. Polarization

### 7.1 Stokes Parameters (`polarization/stokes/page.tsx`)

**Formula in Code:**
```
DOP = √(Q²+U²+V²)/I
DOLP = √(Q²+U²)/I
DOCP = |V|/I
ψ = 0.5·atan2(U,Q)      [orientation angle]
χ = 0.5·arcsin(V/(I·DOP)) [ellipticity angle]
```

**Expected:** Standard Stokes parameter relationships.

**Verdict:** ✅ Correct

**Notes:** Presets (linear-H, RCP, etc.) have correct Stokes vectors. Poincaré sphere visualization is a nice touch. Clamps χ to [-1,1] range properly.

---

### 7.2 Birefringence & Retardation (`polarization/birefringence/page.tsx`)

**Formula in Code:**
```
δ = 2π·Δn·d/λ
retardation_waves = δ/(2π) = Δn·d/λ
```

**Expected:** Standard phase retardation formula.

**Verdict:** ✅ Correct

**Notes:** Quartz preset values (n_o=1.5443, n_e=1.5534) are correct for 550 nm. Calcite presets are reasonable. Order crossing wavelengths are correctly computed.

---

### 7.3 Waveplate Thickness (`polarization/waveplate-thickness/page.tsx`)

**Formula in Code:**
```
d = Δ·λ / Δn
```

**Expected:** Standard quarter/half-wave plate thickness formula.

**Verdict:** ✅ Correct

**Notes:** Material presets (Quartz Δn=0.0092, Calcite Δn=0.172) are reasonable for 550 nm. The wavelength-dependent retardance chart for a fixed-thickness plate is physically correct.

---

## 8. Spectroscopy

### 8.1 Blackbody Radiation (`spectroscopy/blackbody/page.tsx`)

**Formula in Code:**
```
B(λ,T) = 2hc²/λ⁵ · 1/(exp(hc/λkT)−1)
λ_peak = 2.898e6/T nm        [Wien's law]
P_total = σT⁴                [Stefan-Boltzmann]
```

**Expected:** All match standard physics.

**Verdict:** ✅ Correct

**Notes:** Wien constant 2.898e6 nm·K is correct. Stefan-Boltzmann constant σ = 5.67e-8 W/m²/K⁴ is correct. Overflow protection (exp>500 → 0) is good practice.

---

### 8.2 Lambert-Beer Law (`spectroscopy/lambert-beer-law/page.tsx`)

**Formula in Code:**
```
A = ε·c·l
T = 10^(−A)
OD = A = −log₁₀(T)
```

**Expected:** Standard Beer-Lambert law.

**Verdict:** ✅ Correct

**Notes:** Clean implementation with parameter sweep capability. Units properly documented.

---

### 8.3 Grating Efficiency (`spectroscopy/grating-efficiency/page.tsx`)

**Formula in Code:**
```
λ_blaze = (2/d)·sin(θ_blaze)·1000 nm  [Littrow]
efficiency(λ) = exp(−0.5·((λ−λ_blaze)/(0.3·λ_blaze))²)  [Gaussian approx]
```

**Expected:** Littrow blaze wavelength is correct. The efficiency model is a Gaussian approximation centered on the blaze wavelength.

**Verdict:** ⚠️ Approximate

**Notes:** Real grating efficiency depends on groove profile, polarization, order, and wavelength in a complex way (solved by RCWA or scalar theory). The Gaussian approximation with σ=0.3·λ_blaze is a reasonable first-order model but should be labeled as approximate. The code doesn't indicate it's an approximation.

---

## 9. Thin Film

### 9.1 Bragg Reflector (`thin-film/bragg-reflector/page.tsx`)

**Formula in Code:**
```
R_peak = ((nH/nL)^(2N) − nSub) / ((nH/nL)^(2N) + nSub))²
R(λ) ≈ [reff·sin(Nπf) / √(1+reff²·sin²(Nπf))]²  [spectral]
```

**Expected:** Peak reflectance formula for quarter-wave stack is correct. The spectral approximation is problematic.

**Verdict:** ⚠️ Approximate

**Notes:** The peak reflectance formula uses `nSub` in the numerator (should use `nInc·nSub/nH²` as the "q" factor — see dielectric-stack which gets this right). Actually, looking more carefully: `R_peak = ((ratio - nSub)/(ratio + nSub))²` where `ratio = (nH/nL)^(2N)`. The standard formula is `r = (nH^(2N)·nSub - nInc)/(nH^(2N)·nSub + nInc)` for a stack starting with H. **The code omits the incident medium index entirely**, which is incorrect for non-unity nInc. The wavelength-dependent spectrum uses an ad-hoc sinusoidal approximation that doesn't match the actual transfer matrix result. The code starts implementing TMM but abandons it for the approximate formula.

---

### 9.2 Fabry-Pérot Filter (`thin-film/fabry-perot-filter/page.tsx`)

**Formula in Code:**
```
T = 1/(1 + F·sin²(δ/2))
δ = 4πnd/λ
F = 4R/(1−R)²
FSR = λ²/(2nd)
ℱ = π√F/2
FWHM = FSR/ℱ
```

**Expected:** All match standard Fabry-Pérot theory.

**Verdict:** ✅ Correct

**Notes:** All formulas are textbook-correct. FSR in wavelength units, finesse, and FWHM all properly derived.

---

### 9.3 Dielectric Stack (`thin-film/dielectric-stack/page.tsx`)

**Formula in Code:**
```
R_peak = ((ratio - q)/(ratio + q))²  where q = nInc·nSub/nH²
bandwidth = (4λ₀/π)·arcsin((1−nL/nH)/(1+nL/nH))
```

**Expected:** Peak reflectance formula is the correct one for a (HL)^N stack on a substrate.

**Verdict:** ⚠️ Approximate (for spectrum)

**Notes:** The peak R formula is correct with proper q factor. The bandwidth formula is the standard stopband width. However, the wavelength-dependent reflectance chart uses only the peak formula (flat line!) instead of implementing the full TMM — the code starts implementing TMM but abandons it. The chart shows a constant R across all wavelengths, which is wrong.

---

## 10. Wave Optics

### 10.1 Cavity Stability (`wave-optics/cavity-stability/page.tsx`)

**Formula in Code:**
```
g₁ = 1 − L/R₁
g₂ = 1 − L/R₂
stable: 0 ≤ g₁g₂ ≤ 1
```

**Expected:** Standard two-mirror cavity stability criterion.

**Verdict:** ✅ Correct

**Notes:** The stability diagram correctly shows the hyperbolic boundaries. The beam waist calculation for stable cavities uses the standard formula with proper handling of the degenerate case (R₁+R₂=2L).

---

### 10.2 ABCD Matrix (`wave-optics/abcd-matrix/page.tsx`)

**Formula in Code:**
```
Free space: [[1,d],[0,1]]
Thin lens: [[1,0],[-1/f,1]]
Curved mirror: [[1,0],[-2/R,1]]
Dielectric: [[1,0],[0,n₁/n₂]]
Matrix multiplication for cascaded elements
```

**Expected:** All match standard ray transfer matrix formalism.

**Verdict:** ✅ Correct

**Notes:** Dielectric interface matrix is `D=n₁/n₂`, which is correct for refraction at a flat interface. The imaging condition (B=0) check is a nice feature. Determinant check is useful for validation.

---

### 10.3 Etalon Finesse (`wave-optics/etalon-finesse/page.tsx`)

**Formula in Code:**
```
T = 1/(1 + F·sin²(δ/2))
δ = 4πnd/λ
FSR = λ²/(2nd)
ℱ = π√F/2
FWHM = FSR/ℱ
```

**Expected:** Same as Fabry-Pérot — all correct.

**Verdict:** ✅ Correct

**Notes:** This is essentially the same physics as the thin-film Fabry-Pérot filter. The implementation is identical and correct.

---

## Additional Findings

### Empty/Stub Calculators
Most small files (<50 lines) still contain real physics. No completely empty stubs found. However:
- `detectors/responsivity/page.tsx` has a UI bug: ResultCard values show raw template strings (`"{responsivity.toFixed(3)} A/W"`) instead of computed values — the JSX interpolation is broken.
- Several calculators don't use the standard `CalculatorShell` component (NEP, responsivity, fog-attenuation, etc.) — inconsistent UI.

### Duplicate Calculators
- `thin-film/fabry-perot-filter` and `wave-optics/etalon-finesse` implement identical Airy function physics. Both are correct but redundant.
- `fiber-optics/link-budget` and `free-space-comms/link-budget` — same link budget concept applied to different domains (justified).
- `thin-film/bragg-reflector` and `thin-film/dielectric-stack` — very similar physics, both with approximate spectral implementations.

### Unit/Conversion Issues
- `detectivity/page.tsx`: Area in mm² → converted to m² (`areaM2 = area * 1e-6`). Correct since 1 mm² = 1e-6 m².
- `detectivity/page.tsx`: Bandwidth in MHz → `bandwidth * 1e6` Hz. Correct.
- `fog-attenuation/page.tsx`: Visibility in km, then `V = visibility * 1e3` meters. But the Kim formula expects V in meters and the result is β in per km. The units work out: `β = 3.91/V_meters * ...` gives per meter, then multiplied by range in km gives total attenuation. Wait — actually β should be per km for the output label "dB/km". Let me recheck: `beta = 3.91/V * (...)` where V is in meters, giving β in per meter. Then `attenuation = beta * range` where range is in km. This gives attenuation in m⁻¹·km = 1000, which is wrong. ❌ **Fog attenuation has a unit mismatch** — V should be in km (not meters) for β to come out in per km. The code converts visibility to meters (`V = visibility * 1e3`) but the standard Kim/Kruse formula uses V in km. This means β is 1000× too large.

### Dimensional Analysis Issues
- `fiber-optics/bend-loss`: Core radius hardcoded to 4.1 μm (SMF-28). User provides n₁, n₂ but not core radius. Inconsistent.
- `imaging/airy-disk`: Extra factor of 2 in denominator (❌ as noted above).

---

## Summary Table

| # | Category | Calculator | Verdict | Severity |
|---|----------|-----------|---------|----------|
| 1 | Detectors | dark-current | ✅ Correct | — |
| 2 | Detectors | detectivity | ✅ Correct | — |
| 3 | Detectors | nep | ❌ Wrong D* | **High** |
| 4 | Fiber | chromatic-dispersion | ✅ Correct | — |
| 5 | Fiber | v-number | ✅ Correct | — |
| 6 | Fiber | bend-loss | ⚠️ Approximate | Low |
| 7 | FSO | scintillation | ✅ Correct | — |
| 8 | FSO | fog-attenuation | ❌ Unit bug | **High** |
| 9 | FSO | link-budget | ✅ Correct | — |
| 10 | Imaging | airy-disk | ❌ Wrong radius | **High** |
| 11 | Imaging | mtf | ✅ Correct | — |
| 12 | Imaging | na-fnumber | ✅ Correct | — |
| 13 | Safety | optical-density | ✅ Correct | — |
| 14 | Safety | classification | ⚠️ Simplified | Low |
| 15 | Safety | mpe | ⚠️ Simplified | Low |
| 16 | Materials | sellmeier | ✅ Correct | — |
| 17 | Materials | fresnel | ✅ Correct | — |
| 18 | Materials | brewster-tir | ✅ Correct | — |
| 19 | Polarization | stokes | ✅ Correct | — |
| 20 | Polarization | birefringence | ✅ Correct | — |
| 21 | Polarization | waveplate-thickness | ✅ Correct | — |
| 22 | Spectroscopy | blackbody | ✅ Correct | — |
| 23 | Spectroscopy | lambert-beer-law | ✅ Correct | — |
| 24 | Spectroscopy | grating-efficiency | ⚠️ Approximate | Low |
| 25 | Thin Film | bragg-reflector | ⚠️ Approx + missing nInc | Medium |
| 26 | Thin Film | fabry-perot-filter | ✅ Correct | — |
| 27 | Thin Film | dielectric-stack | ⚠️ Chart is flat | Medium |
| 28 | Wave Optics | cavity-stability | ✅ Correct | — |
| 29 | Wave Optics | abcd-matrix | ✅ Correct | — |
| 30 | Wave Optics | etalon-finesse | ✅ Correct | — |

**Score:** 22 ✅ / 5 ⚠️ / 3 ❌ out of 30

---

## Priority Fix List (Sorted by Severity)

### 🔴 High Priority (Wrong physics / broken calculations)

1. **`imaging/airy-disk/page.tsx`** — Airy disk radius has extra /2 factor. Should be `0.61·λ/NA`, code computes `0.61·λ/(2·NA)`. Fix: remove the `2*` from the denominator.

2. **`free-space-comms/fog-attenuation/page.tsx`** — Unit mismatch. Visibility is converted to meters but the Kim/Kruse formula expects V in km for β to be in per km. Fix: remove `V = visibility * 1e3` and use V directly in km, OR keep V in meters and divide β by 1000.

3. **`detectors/nep/page.tsx`** — D* formula is wrong: `1/(NEP·√B)` should be `√(A·B)/NEP`. Also has broken JSX (raw template strings in ResultCard).

### 🟡 Medium Priority (Approximate but could mislead)

4. **`thin-film/bragg-reflector/page.tsx`** — Peak R formula missing incident medium index. Wavelength-dependent spectrum is an ad-hoc approximation that doesn't match TMM. The TMM code is started but abandoned.

5. **`thin-film/dielectric-stack/page.tsx`** — Same issue: spectral chart shows flat R(λ) because TMM implementation was abandoned. Peak R formula is correct.

6. **`fiber-optics/bend-loss/page.tsx`** — Hardcoded core radius (4.1 μm), hardcoded empirical constant (1.75). User can't control core size despite it being a critical parameter.

### 🟢 Low Priority (Correct but simplified or cosmetic)

7. **`detectors/responsivity/page.tsx`** — JSX interpolation bug in ResultCard values.

8. **`laser-safety/classification/page.tsx`** — Very simplified thresholds; doesn't handle pulsed lasers or wavelength-dependent AELs.

9. **`laser-safety/mpe/page.tsx`** — Missing angular subtense correction and pulse rules. Has appropriate disclaimers.

10. **`spectroscopy/grating-efficiency/page.tsx`** — Gaussian efficiency model is approximate; should be labeled as such.

11. **UI consistency** — Several calculators don't use `CalculatorShell` (nep, responsivity, fog-attenuation, fiber-optics/link-budget, free-space-comms/link-budget, v-number).

12. **`thin-film/fabry-perot-filter` vs `wave-optics/etalon-finesse`** — Duplicate physics. Consider merging or clearly differentiating.
