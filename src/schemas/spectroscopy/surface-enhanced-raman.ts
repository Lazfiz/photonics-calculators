import { stokesWavelength } from "../../physics/spectroscopy/raman";
import { sersEnhancement, silverPermittivity, silverSphereResonance, sphereFieldEnhancement } from "../../physics/spectroscopy/sers";
import { defineSchema } from "../types";

const LE_RU = "Le Ru E. C., Etchegoin P. G. (2006). Rigorous justification of the |E|⁴ enhancement factor in Surface Enhanced Raman " +
  "Spectroscopy. Chem. Phys. Lett. 423, 63–66, doi:10.1016/j.cplett.2006.03.042 (EF ≈ |E(λ_L)/E₀|² |E(λ_R)/E₀|²); quasistatic sphere field " +
  "E_r = E₀ cos θ (1 + 2gs), E_θ = −E₀ sin θ (1 − gs), g = (ε − ε_m)/(ε + 2ε_m), s = (a/(a + d))³: Bohren C. F., Huffman D. R. (1983), " +
  "Absorption and Scattering of Light by Small Particles, Wiley, ch. 5, doi:10.1002/9783527618156; silver permittivity: Yang H. U., " +
  "D'Archangel J., Sundheimer M. L., Tucker E., Boreman G. D., Raschke M. B. (2015), Optical dielectric function of silver, " +
  "Phys. Rev. B 91, 235137, doi:10.1103/PhysRevB.91.235137.";

export default defineSchema({
  href: "/spectroscopy/surface-enhanced-raman",
  inputs: [
    { key: "laserWavelength", label: "Laser wavelength λ_L", unit: "nm", toSI: 1e-9, siUnit: "m", default: 405, min: 300, max: 1500 },
    { key: "ramanShift", label: "Raman shift", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 1000, min: 0, max: 4000 },
    { key: "radius", label: "Silver sphere radius a", unit: "nm", toSI: 1e-9, siUnit: "m", default: 10, min: 2, max: 100 },
    { key: "distance", label: "Molecule distance from the surface d", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0, min: 0, max: 50 },
    { key: "mediumIndex", label: "Surrounding medium index n_m", unit: "", toSI: 1, siUnit: "", default: 1.33, min: 1, max: 2 },
  ],
  outputs: [
    { key: "efMax", label: "SERS EF, maximum on the sphere", unit: "", toSI: 1, siUnit: "" },
    { key: "efAverage", label: "SERS EF, surface average", unit: "", toSI: 1, siUnit: "" },
    { key: "fieldPole", label: "Local intensity |E/E₀|² at λ_L, pole", unit: "", toSI: 1, siUnit: "" },
    { key: "fieldEquator", label: "Local intensity |E/E₀|² at λ_L, equator", unit: "", toSI: 1, siUnit: "" },
    { key: "ramanWavelength", label: "Raman (Stokes) wavelength λ_R", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "resonance", label: "Dipole resonance (Re ε = −2ε_m, scanned 300–1000 nm)", unit: "nm", toSI: 1e-9, siUnit: "m" },
  ],
  compute({ laserWavelength, ramanShift, radius, distance, mediumIndex }) {
    const epsM = mediumIndex * mediumIndex;
    const lambdaR = stokesWavelength(laserWavelength, ramanShift);
    const epsL = silverPermittivity(laserWavelength);
    const epsR = silverPermittivity(lambdaR);
    const field = sphereFieldEnhancement(epsL, epsM, radius, distance);
    const ef = sersEnhancement(epsL, epsR, epsM, radius, distance);
    const warnings: string[] = [];
    const sizeParameter = (2 * Math.PI * mediumIndex * radius) / laserWavelength;
    if (sizeParameter > Math.PI / 10) {
      warnings.push("The sphere diameter exceeds λ/(10 n_m): retardation and radiation damping red-shift, broaden and weaken the real resonance, so these quasistatic values are too high near it; use Mie theory.");
    }
    if (radius < 5e-9) {
      warnings.push("Surface (Kreibig) damping broadens and weakens the resonance below about 10 nm diameter; the bulk ε used here overestimates the enhancement factor.");
    }
    return {
      values: {
        efMax: ef.max,
        efAverage: ef.average,
        fieldPole: field.pole,
        fieldEquator: field.equator,
        ramanWavelength: lambdaR,
        resonance: silverSphereResonance(epsM),
      },
      warnings,
    };
  },
  checks: [
    {
      // Stokes wavelength: 1/λ_R = 1/λ_L − ν̃ = 1/405 nm − 1000 cm⁻¹ = 2469135.80 m⁻¹ − 100000 m⁻¹ = 2369135.80 m⁻¹,
      // so λ_R = 422.094841 nm.
      source: LE_RU,
      basis: "computed",
      inputs: { laserWavelength: 405, ramanShift: 1000 },
      expect: { ramanWavelength: 422.0948410630537 },
      tolerance: 1e-8,
    },
    {
      // Defaults (405 nm, 1000 cm⁻¹, a = 10 nm, d = 0, n_m = 1.33): silver ε(405 nm) = −4.609031 + 0.246131i and
      // ε(422.09 nm) = −5.438038 + 0.256222i (Yang et al. table, interpolated linearly), so g = (ε − 1.7689)/(ε + 3.5378),
      // A = |1 + 2g|² = 158.704675, B = |1 − g|² = 23.309893 at λ_L; A_R = 72.551932, B_R = 7.659633 at λ_R.
      // Pole is the maximum: EF = A_L A_R = 11514.3307; ⟨EF⟩ = A_L A_R/5 + 8 B_L B_R/15 + 2(A_L B_R + B_L A_R)/15 = 2785.66324.
      source: LE_RU,
      basis: "computed",
      inputs: {},
      expect: { efMax: 11514.33073927872, efAverage: 2785.6632445295463, fieldPole: 158.70467486866244, fieldEquator: 23.309893183779632 },
      tolerance: 1e-8,
    },
  ],
});
