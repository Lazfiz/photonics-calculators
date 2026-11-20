import { coherentRamanSummary } from "../../physics/imaging/coherent-raman-summary";
import { defineSchema } from "../types";

const CHENG_XIE = "Cheng J.-X., Xie X. S. (2004). Coherent anti-Stokes Raman scattering microscopy: instrumentation, theory, " +
  "and applications. J. Phys. Chem. B 108, 827–840 (energy conservation ν̃_S = ν̃_P − Ω̃, ν̃_aS = ν̃_P + Ω̃). https://doi.org/10.1021/jp035693v";
const DIELS = "Diels J.-C., Rudolph W. (2006). Ultrashort Laser Pulse Phenomena, 2nd ed., Academic Press, ch. 1, https://doi.org/10.1016/b978-012215493-5/50002-1 " +
  "(Gaussian pulse: E = P_peak·τ_FWHM·√(π/(4 ln 2)); time-bandwidth product 2 ln 2/π).";
const ZIPFEL = "Zipfel W. R., Williams R. M., Webb W. W. (2003). Nonlinear magic: multiphoton microscopy in the biosciences. " +
  "Nat. Biotechnol. 21, 1369–1377. https://doi.org/10.1038/nbt899 (focal 1/e radius ω_xy = 0.325 λ/(√2 NA^0.91) for NA > 0.7, " +
  "0.320 λ/(√2 NA) below, Fig. 4c, p. 1372); peak intensity I = P_pk/(2π ω_xy²) (Gaussian I with w = 2ω_xy, derived); CARS maximum of |χ_NR + χ_R|² with χ_R = Γ/(Δ − iΓ) " +
  "(Im χ_R peak 1) and χ_NR real, as in Cheng & Xie (2004), https://doi.org/10.1021/jp035693v.";
const CM = 100; // 1 cm⁻¹ = 100 m⁻¹

export default defineSchema({
  href: "/imaging/coherent-raman",
  inputs: [
    { key: "pumpWl", label: "Pump wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 800, min: 400, max: 2000 },
    { key: "wavenumber", label: "Raman shift", unit: "cm⁻¹", toSI: CM, siUnit: "1/m", default: 2850, min: 100, max: 4000 },
    { key: "pumpPower", label: "Pump power (average)", unit: "mW", toSI: 1e-3, siUnit: "W", default: 50, min: 0, max: 500 },
    { key: "stokesPower", label: "Stokes power (average)", unit: "mW", toSI: 1e-3, siUnit: "W", default: 50, min: 0, max: 500 },
    { key: "pulseWidth", label: "Pulse width, FWHM", unit: "ps", toSI: 1e-12, siUnit: "s", default: 2, min: 0.01, max: 100 },
    { key: "repRate", label: "Repetition rate", unit: "MHz", toSI: 1e6, siUnit: "Hz", default: 80, min: 0.01, max: 250 },
    { key: "na", label: "Numerical aperture", unit: "", toSI: 1, siUnit: "", default: 1, min: 0.1, max: 1.7 },
    { key: "linewidth", label: "Raman linewidth Γ (HWHM)", unit: "cm⁻¹", toSI: CM, siUnit: "1/m", default: 15, min: 1, max: 100 },
    { key: "chiNR", label: "Non-resonant χ_NR (relative to peak Im χ_R)", unit: "", toSI: 1, siUnit: "", default: 0.3, min: 0, max: 10 },
  ],
  choices: [
    {
      key: "mode", label: "Mode", default: "CARS",
      options: [{ value: "CARS", label: "CARS (coherent anti-Stokes Raman)" }, { value: "SRS", label: "SRS (stimulated Raman scattering)" }],
    },
  ],
  outputs: [
    { key: "stokesWavelength", label: "Stokes wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "antiStokesWavelength", label: "Anti-Stokes (CARS signal) wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "frequencyDifference", label: "Frequency difference", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "pulseEnergyPump", label: "Pulse energy, pump", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "pulseEnergyStokes", label: "Pulse energy, Stokes", unit: "nJ", toSI: 1e-9, siUnit: "J" },
    { key: "peakPowerPump", label: "Peak power, pump", unit: "W", toSI: 1, siUnit: "W" },
    { key: "peakPowerStokes", label: "Peak power, Stokes", unit: "W", toSI: 1, siUnit: "W" },
    { key: "intensityPump", label: "Focal peak intensity, pump", unit: "GW/cm²", toSI: 1e13, siUnit: "W/m²" },
    { key: "intensityStokes", label: "Focal peak intensity, Stokes", unit: "GW/cm²", toSI: 1e13, siUnit: "W/m²" },
    { key: "carsPeakShift", label: "CARS maximum, from the resonance (negative: below it)", unit: "cm⁻¹", toSI: CM, siUnit: "1/m" },
    { key: "excitationBandwidth", label: "Excitation bandwidth (transform-limited pulses)", unit: "cm⁻¹", toSI: CM, siUnit: "1/m" },
  ],
  compute({ pumpWl, wavenumber, pumpPower, stokesPower, pulseWidth, repRate, na, linewidth, chiNR, mode }) {
    const s = coherentRamanSummary({
      pumpWavelength: pumpWl, ramanShift: wavenumber, pumpPower, stokesPower, pulseWidth, repRate, na, linewidth, chiNR,
    });
    const cars = mode !== "SRS";
    const warnings: string[] = [];
    if (!Number.isFinite(s.stokesWavelength)) {
      warnings.push("The Raman shift must be smaller than the pump wavenumber 1/λ_p.");
    }
    if (s.excitationBandwidth > 2 * linewidth) {
      warnings.push("The pulses are broader in frequency than the Raman line (excitation bandwidth above the line FWHM 2Γ): they excite neighbouring bands too and the spectral resolution is set by the pulses.");
    }
    const carsOnly = "The anti-Stokes wavelength and the CARS maximum apply to CARS mode; SRS has no anti-Stokes signal and no dispersive line.";
    return {
      values: {
        ...s,
        antiStokesWavelength: cars ? s.antiStokesWavelength : NaN,
        carsPeakShift: cars ? s.carsPeakShift : NaN,
      },
      warnings,
      reasons: { antiStokesWavelength: carsOnly, carsPeakShift: carsOnly },
    };
  },
  checks: [
    {
      // 1/816.8 nm = 12242.899 cm⁻¹; Stokes 1/(12242.899 − 2845) = 9397.899 cm⁻¹ → 1064.0676 nm; anti-Stokes 1/(12242.899 + 2845) → 662.7828 nm.
      source: CHENG_XIE,
      basis: "computed",
      inputs: { pumpWl: 816.8, wavenumber: 2845 },
      expect: { stokesWavelength: 1064.0676042, antiStokesWavelength: 662.7827984 },
      tolerance: 1e-8,
    },
    {
      // 50 mW at 80 MHz: E = 0.625 nJ; peak = 2√(ln2/π)·E/τ = 0.939437·0.625e-9/2e-12 = 293.5741 W.
      // Drive spectrum of two identical Gaussian pulses: √2·2 ln2/(π c τ), τ = 2 ps: 1.96052 / (π·299792458·2e-12) = 1040.806 m⁻¹ = 10.40806 cm⁻¹.
      source: DIELS,
      basis: "computed",
      inputs: { pumpPower: 50, repRate: 80, pulseWidth: 2 },
      expect: { pulseEnergyPump: 0.625, peakPowerPump: 293.57414959, excitationBandwidth: 10.408062303 },
      tolerance: 1e-8,
    },
    {
      // Page defaults (800 nm, 2850 cm⁻¹, 50 mW, 2 ps, 80 MHz, NA 1, Γ 15 cm⁻¹, χ_NR 0.3): I = P_pk/(2π ω_xy²) with Zipfel's
      // ω_xy (pump 800 nm: 138.236 GW/cm²; Stokes 1/(1/800e-7 − 2850) cm → 1036.6 nm: 82.386 GW/cm²); maximum of |χ_NR + χ_R|² at −4.15476 cm⁻¹.
      source: ZIPFEL,
      basis: "computed",
      inputs: {},
      expect: { intensityPump: 138.23602684, intensityStokes: 82.38646022, carsPeakShift: -4.1547594742 },
      tolerance: 1e-8,
    },
  ],
});
