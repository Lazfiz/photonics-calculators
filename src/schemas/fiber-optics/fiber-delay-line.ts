import { NARROW_SOURCE_FACTOR, SMF_THERMAL_DELAY_PS_PER_KM_K, delayLineSummary, isNarrowSource } from "../../physics/fiber-optics/fiber-delay-line";
import { defineSchema } from "../types";

const SOURCES = "Group delay τ = n_g L/c and loop free spectral range c/(n_g L); ITU-T G.652 (2016) and IEC 60793-1-42 for " +
  "D(λ) = (S₀/4)(λ − λ₀⁴/λ³), S(λ) = (S₀/4)(1 + 3λ₀⁴/λ⁴), λ₀ = 1310 nm, S₀ = 0.092 ps/(nm²·km); " +
  "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed., Wiley, doi:10.1002/9780470918524, §2.4.2 (rms spread " +
  "σ_D = L√((Dσ_λ)² + ½(Sσ_λ²)²) of a broad source); Slavík R. et al. (2015). Ultralow thermal sensitivity of phase and " +
  "propagation delay in hollow core optical fibres. Sci. Rep. 5, 15447, doi:10.1038/srep15447 (SMF-28 delay coefficient 37.4 ps/(km·K))";

export default defineSchema({
  href: "/fiber-optics/fiber-delay-line",
  inputs: [
    { key: "fiberLength", label: "Fiber length", unit: "m", toSI: 1, siUnit: "m", default: 100, min: 0.001, max: 1000000 },
    { key: "refractiveIndex", label: "Group index n_g", unit: "", toSI: 1, siUnit: "", default: 1.468, min: 1, max: 3 },
    { key: "signalWavelength", label: "Signal wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 1260, max: 1625 },
    { key: "inputBitRate", label: "Input bit rate", unit: "Gb/s", toSI: 1e9, siUnit: "1/s", default: 10, min: 0.001, max: 1000 },
    { key: "spectralWidth", label: "Source rms spectral width σ_λ", unit: "nm", toSI: 1e-9, siUnit: "m", default: 0.1, min: 0, max: 100 },
    { key: "temperature", label: "Temperature", unit: "°C", toSI: 1, siUnit: "°C", default: 35, min: -60, max: 150 },
    { key: "thermalCoeff", label: "Thermal delay coefficient", unit: "ps/(km·K)", toSI: 1e-15, siUnit: "s/(m·K)", default: SMF_THERMAL_DELAY_PS_PER_KM_K, min: 0, max: 100 },
  ],
  outputs: [
    { key: "delay", label: "Propagation delay", unit: "ns", toSI: 1e-9, siUnit: "s" },
    { key: "groupVelocity", label: "Group velocity c/n_g", unit: "m/s", toSI: 1, siUnit: "m/s" },
    { key: "groupPath", label: "Group path n_g·L", unit: "m", toSI: 1, siUnit: "m" },
    { key: "bitSlots", label: "Bit slots stored", unit: "bits", toSI: 1, siUnit: "" },
    { key: "dispersion", label: "SMF dispersion D(λ)", unit: "ps/(nm·km)", toSI: 1e-6, siUnit: "s/m²" },
    { key: "broadening", label: "rms dispersive spread", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "thermalDelay", label: "Delay change vs 25 °C", unit: "ps", toSI: 1e-12, siUnit: "s" },
    { key: "fsr", label: "Loop free spectral range", unit: "MHz", toSI: 1e6, siUnit: "Hz" },
  ],
  compute({ fiberLength, refractiveIndex, signalWavelength, inputBitRate, spectralWidth, temperature, thermalCoeff }) {
    const r = delayLineSummary({
      fiberLength, groupIndex: refractiveIndex, lambda: signalWavelength, bitRate: inputBitRate,
      sigmaLambda: spectralWidth, temperature, thermalCoeff,
    });
    const warnings: string[] = [];
    if (isNarrowSource(spectralWidth, signalWavelength, inputBitRate)) {
      warnings.push(`Narrow source (σ_λ < ${NARROW_SOURCE_FACTOR}λ²B/c): the broad-source spread underestimates the broadening.`);
    }
    return {
      values: {
        delay: r.tau, groupVelocity: r.vg, groupPath: r.groupPath, bitSlots: r.bitSlots, dispersion: r.D,
        broadening: r.broadening, thermalDelay: r.thermal, fsr: r.fsr,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults: L = 100 m, n_g = 1.468. τ = n_g L/c = 146.8/299792458 = 4.896721e-7 s = 489.6721 ns; v_g = c/n_g = 2.042183e8 m/s;
      // bit slots = τ · 10e9 = 4896.721; FSR = c/(n_g L) = 299792458/146.8 = 2.042183e6 Hz; n_g L = 146.8 m.
      // G.652 at 1550 nm: λ₀⁴/λ³ = (1310⁴/1550³) nm = 790.8427 nm, D = (0.092/4)(1550 − 790.8427) = 0.023 · 759.1573 = 17.46062 ps/(nm·km).
      // S = 0.023(1 + 3 · 1310⁴/1550⁴) = 0.023 · 2.530663 = 0.0582053 ps/(nm²·km); σ_D = L√((Dσ_λ)² + ½(Sσ_λ²)²) =
      // √((1.746062 ps/nm · 0.1 nm)² + ½(0.00582053 · 0.01)²) ps = 0.1746062 ps. Thermal: 37.4 ps/(km·K) · 0.1 km · (35 − 25) K = 37.4 ps.
      source: SOURCES,
      basis: "computed",
      inputs: {},
      expect: {
        delay: 489.6720917508872,
        groupVelocity: 204218295.64032698,
        groupPath: 146.8,
        bitSlots: 4896.720917508872,
        dispersion: 17.460618823134505,
        broadening: 0.17460619308204875,
        thermalDelay: 37.4,
        fsr: 2.0421829564032697,
      },
      tolerance: 1e-8,
    },
  ],
});
