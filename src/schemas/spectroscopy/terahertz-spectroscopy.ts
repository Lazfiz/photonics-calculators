import { c, eV, h, k_B } from "../../physics/constants";
import { extractIndex, terahertzPoint, type TerahertzModel } from "../../physics/spectroscopy/terahertz";
import { defineSchema } from "../types";

const JEPSEN = "Jepsen P. U., Fischer B. M. (2005). Dynamic range in terahertz time-domain transmission and reflection spectroscopy. " +
  "Opt. Lett. 30, 29–31, doi:10.1364/OL.30.000029 (α_max = (2/d) ln[DR · 4n/(n + 1)²]); slab transmission " +
  "T = [4ñ/(ñ + 1)²] exp(i(ñ − 1)ωd/c): Duvillaret L., Garet F., Coutaz J.-L. (1996), IEEE J. Sel. Top. Quantum Electron. 2, 739–746, " +
  "doi:10.1109/2944.571775; extraction n = 1 + cφ/(ωd): Withayachumnankul W., Naftaly M. (2014), J. Infrared Millim. Terahertz Waves 35, " +
  "610–637, doi:10.1007/s10762-013-0042-z.";
const LIEBE = "Liebe H. J., Hufford G. A., Manabe T. (1991). A model for the complex permittivity of water at frequencies below 1 THz. " +
  "Int. J. Infrared Millim. Waves 12, 659–675, doi:10.1007/BF01008897 (double Debye model, eqs. 1 and 4), with the slab transmission of " +
  "Duvillaret et al. (1996), doi:10.1109/2944.571775.";

export default defineSchema({
  href: "/spectroscopy/terahertz-spectroscopy",
  choices: [
    {
      key: "model",
      label: "Sample",
      options: [
        { value: "water", label: "Liquid water (double Debye)" },
        { value: "lorentz", label: "Solid with one phonon mode (Lorentz)" },
        { value: "constant", label: "Constant n and α" },
      ],
      default: "water",
    },
  ],
  inputs: [
    { key: "freqStart", label: "Frequency start", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 0.1, min: 0.01, max: 20 },
    { key: "freqEnd", label: "Frequency end", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 2, min: 0.02, max: 20 },
    { key: "freq", label: "Read-out frequency", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 1, min: 0.01, max: 20 },
    { key: "thicknessMm", label: "Thickness d", unit: "mm", toSI: 1e-3, siUnit: "m", default: 0.1, min: 0.001, max: 50 },
    { key: "temperature", label: "Temperature (water: 268.15–313.15 K)", unit: "K", toSI: 1, siUnit: "K", default: 293.15, min: 1, max: 3000 },
    { key: "dynamicRangeDb", label: "Field dynamic range", unit: "dB", toSI: 1, siUnit: "dB", default: 60, min: 0, max: 200 },
    { key: "refractiveIndex", label: "Refractive index n (constant model)", unit: "", toSI: 1, siUnit: "", default: 1.5, min: 1, max: 10 },
    { key: "absorptionCoeff", label: "Absorption coefficient α (constant model)", unit: "cm⁻¹", toSI: 100, siUnit: "1/m", default: 5, min: 0, max: 1e5 },
    { key: "epsInf", label: "ε∞ (Lorentz model)", unit: "", toSI: 1, siUnit: "", default: 3, min: 1, max: 100 },
    { key: "deltaEps", label: "Oscillator strength Δε (Lorentz model)", unit: "", toSI: 1, siUnit: "", default: 0.1, min: 0, max: 100 },
    { key: "f0", label: "Mode frequency f₀ (Lorentz model)", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 1.2, min: 0.01, max: 20 },
    { key: "gamma", label: "Damping γ, FWHM of ε″ (Lorentz model)", unit: "THz", toSI: 1e12, siUnit: "Hz", default: 0.05, min: 0.001, max: 10 },
  ],
  outputs: [
    { key: "n", label: "Refractive index n at the read-out frequency", unit: "", toSI: 1, siUnit: "" },
    { key: "kappa", label: "Extinction coefficient κ", unit: "", toSI: 1, siUnit: "" },
    { key: "alpha", label: "Absorption coefficient α", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "alphaMax", label: "Dynamic-range limit α_max", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "transmission", label: "Power transmission |T|²", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "delay", label: "Time delay (n − 1)d/c", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "extractedN", label: "n extracted from T (real Fresnel factor)", unit: "", toSI: 1, siUnit: "" },
    { key: "extractedAlpha", label: "α extracted from T (real Fresnel factor)", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "photonWavenumber", label: "Photon wavenumber at the read-out", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
    { key: "photonEnergy", label: "Photon energy at the read-out", unit: "meV", toSI: eV * 1e-3, siUnit: "J" },
    { key: "photonWavelength", label: "Wavelength at the read-out", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "thermalFrequency", label: "Thermal energy kT as a frequency", unit: "THz", toSI: 1e12, siUnit: "Hz" },
    { key: "thermalWavenumber", label: "Thermal energy kT as a wavenumber", unit: "cm⁻¹", toSI: 100, siUnit: "1/m" },
  ],
  validate(si) {
    if (si.freqEnd < si.freqStart + 0.01e12) return "freqEnd must exceed freqStart by at least 0.01 THz.";
    if (si.freq < si.freqStart || si.freq > si.freqEnd) return "freq must lie between freqStart and freqEnd.";
    if (si.model === "water" && (si.temperature < 268.15 || si.temperature > 313.15)) {
      return "temperature must be 268.15–313.15 K for the water model.";
    }
    return undefined;
  },
  compute(si) {
    const model = si.model as TerahertzModel;
    const f = si.freq;
    const d = si.thicknessMm;
    const DR = 10 ** (si.dynamicRangeDb / 20); // field amplitude ratio
    const sample = {
      model, temperature: si.temperature, epsInf: si.epsInf, deltaEps: si.deltaEps, f0: si.f0, gamma: si.gamma,
      n: si.refractiveIndex, alpha: si.absorptionCoeff,
    };
    const p = terahertzPoint(sample, f, d, DR);
    const fit = extractIndex(p.t.magnitude, p.t.phase, f, d);
    const warnings: string[] = [];
    if (p.alpha > p.aMax) warnings.push("α exceeds the dynamic-range limit α_max: the absorption is lost in the noise; use a thinner sample.");
    if (model === "water" && si.freqEnd > 1e12) {
      warnings.push("The water model is fitted below 1 THz; above about 2 THz the intermolecular modes (5.3 THz) take over, so values there are extrapolated.");
    }
    return {
      values: {
        n: p.nk.re,
        kappa: p.nk.im,
        alpha: p.alpha,
        alphaMax: p.aMax,
        transmission: p.t.magnitude ** 2,
        delay: ((p.nk.re - 1) * d) / c,
        extractedN: fit.n,
        extractedAlpha: fit.alpha,
        photonWavenumber: f / c,
        photonEnergy: h * f,
        photonWavelength: c / f,
        thermalFrequency: (k_B * si.temperature) / h,
        thermalWavenumber: (k_B * si.temperature) / (h * c),
      },
      warnings,
    };
  },
  checks: [
    {
      // Constant n = 1.5, α = 5 cm⁻¹ (κ = αc/(4πf) = 0.0119283629), f = 1 THz, d = 0.1 mm, DR = 10^(60/20) = 1000:
      // α_max = (2/d) ln[DR · 4n/(n + 1)²] = 2×10⁴ m⁻¹ · ln(960) = 1373.38666 cm⁻¹;
      // |T|² = |4ñ|²/|ñ + 1|⁴ · exp(−2κ k₀d) = 87.666856 %; delay (n − 1)d/c = 0.166782048 ps.
      source: JEPSEN,
      basis: "computed",
      inputs: { model: "constant", freq: 1, thicknessMm: 0.1, dynamicRangeDb: 60, refractiveIndex: 1.5, absorptionCoeff: 5 },
      expect: { n: 1.5, alpha: 5, alphaMax: 1373.3866568923765, transmission: 87.66685590757703, delay: 0.16678204759907603 },
      tolerance: 1e-8,
    },
    {
      // Water at 293.15 K (θ = 1 − 300/T): ε₀ = 77.66 − 103.3θ, ε₁ = 0.0671ε₀, ε₂ = 3.52 + 7.52θ,
      // γ₁ = 20.2 + 146.4θ + 316θ² GHz, γ₂ = 39.8γ₁; at 0.5 THz ε = 4.7395198 + 3.5001424i, so
      // ñ = 2.3055783 + 0.7590596i, α = 4πfκ/c = 159.087119 cm⁻¹, |T|² (d = 0.1 mm) = 14.515845 %.
      source: LIEBE,
      basis: "computed",
      inputs: { model: "water", temperature: 293.15, freq: 0.5, thicknessMm: 0.1 },
      expect: { n: 2.3055782821558686, kappa: 0.7590595550042168, alpha: 159.08711897204466, transmission: 14.515845169597343 },
      tolerance: 1e-8,
    },
    {
      // Photon at 1 THz: ν̃ = f/c = 33.3564095 cm⁻¹, hf = 4.13566770 meV, λ = c/f = 299.792458 µm;
      // kT at 293.15 K = 6.10825490 THz = 203.749452 cm⁻¹.
      source: "Photon relations ν̃ = f/c, E = hf, λ = c/f and kT/h with the exact SI constants h = 6.62607015e-34 J s, k_B = 1.380649e-23 J/K " +
        "(Mohr P. J., Newell D. B., Taylor B. N., Tiesinga E. (2025), CODATA recommended values of the fundamental physical constants: 2022, Rev. Mod. Phys. 97, 025002, doi:10.1103/RevModPhys.97.025002).",
      basis: "computed",
      inputs: { model: "constant", freq: 1, temperature: 293.15 },
      expect: {
        photonWavenumber: 33.35640951981521, photonEnergy: 4.135667696923859, photonWavelength: 299.792458,
        thermalFrequency: 6.108254896003477, thermalWavenumber: 203.74945176250824,
      },
      tolerance: 1e-8,
    },
  ],
});
