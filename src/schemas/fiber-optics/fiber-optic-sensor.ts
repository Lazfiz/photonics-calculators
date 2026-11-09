import { WATER_INDEX_1550 } from "../../physics/fiber-optics/fiber-sensors";
import { EVANESCENT_DT_MAX, sensorResponse, type SensorType } from "../../physics/fiber-optics/fiber-optic-sensor";
import { defineSchema } from "../types";

const KERSEY = "Kersey A. D. et al. (1997). Fiber grating sensors. J. Lightwave Technol. 15, 1442–1463, doi:10.1109/50.618377 " +
  "(Δλ_B/λ_B = (1 − p_e)ε + K_T ΔT, p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)], interferometer phase 2π n_eff L (1 − p_e)ε/λ); " +
  "p₁₁ = 0.113, p₁₂ = 0.252: Bertholds A., Dändliker R. (1988). J. Lightwave Technol. 6, 17–20, doi:10.1109/50.3956; ν = 0.16 (Corning HPFS 7980 " +
  "product sheet); SMF-28 K_T = 6.165e-6 /K at 20 °C: Cosme M. et al. (2026). Sensors 26, 435, doi:10.3390/s26020435.";
const BORN_WOLF = "Born M., Wolf E. (2019). Principles of Optics, 7th ed., Cambridge University Press, §7.6.1, doi:10.1017/CBO9781139644181 " +
  "(Airy reflection of a two-mirror cavity: F = 4ρ/(1 − ρ)², R_peak = F/(1 + F), FSR = λ²/(2nd) at normal incidence).";
const HARRICK = "Harrick N. J. (1967). Internal Reflection Spectroscopy, Wiley, ch. 2 (evanescent field exp(−γx), γ = (2π/λ)√(n_eff² − n_ext²), " +
  "d_p = 1/γ); water dn/dT ≈ −1.0e-4 /K: Thormählen I., Straub J., Grigull U. (1985). J. Phys. Chem. Ref. Data 14, 933, doi:10.1063/1.555743.";

export default defineSchema({
  href: "/fiber-optics/fiber-optic-sensor",
  inputs: [
    { key: "wavelength", label: "Wavelength (Bragg wavelength for the FBG)", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 400, max: 2000 },
    { key: "tempChange", label: "Temperature change ΔT (±30 K for the evanescent sensor)", unit: "K", toSI: 1, siUnit: "K", default: 10, min: -100, max: 100 },
    { key: "strain", label: "Strain", unit: "µε", toSI: 1e-6, siUnit: "", default: 100, min: -1e4, max: 1e4 },
    { key: "gaugeLength", label: "Mach-Zehnder gauge length", unit: "mm", toSI: 1e-3, siUnit: "m", default: 10, min: 0.1, max: 1e5 },
    { key: "cavityLength", label: "EFPI air gap d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 20, min: 1, max: 50 },
    { key: "mirrorR", label: "EFPI end-face reflectance R", unit: "", toSI: 1, siUnit: "", default: 0.033, min: 0, max: 0.9 },
    { key: "n_eff", label: "Mode effective index n_eff (phase)", unit: "", toSI: 1, siUnit: "", default: 1.447, min: 1, max: 3 },
    { key: "n_ext", label: "External index at ΔT = 0", unit: "", toSI: 1, siUnit: "", default: WATER_INDEX_1550, min: 1, max: 3 },
  ],
  choices: [
    {
      key: "sensor", label: "Sensor type", default: "fbg",
      options: [
        { value: "fbg", label: "Fiber Bragg Grating (FBG)" },
        { value: "mach_zehnder", label: "Mach-Zehnder Interferometer (sensing arm)" },
        { value: "fabry_perot", label: "Extrinsic Fabry-Perot (EFPI)" },
        { value: "evanescent", label: "Evanescent-field sensor" },
      ],
    },
  ],
  outputs: [
    { key: "gauge", label: "Strain gauge factor 1 − p_e", unit: "", toSI: 1, siUnit: "" },
    { key: "fbgTotal", label: "FBG: total Bragg shift", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "fbgStrainSens", label: "FBG: strain sensitivity", unit: "pm/µε", toSI: 1e-12, siUnit: "m" },
    { key: "fbgTempSens", label: "FBG: temperature sensitivity", unit: "pm/K", toSI: 1e-12, siUnit: "m" },
    { key: "fbgShifted", label: "FBG: shifted Bragg wavelength", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "mziPhase", label: "MZI: phase shift", unit: "rad", toSI: 1, siUnit: "rad" },
    { key: "mziStrainSens", label: "MZI: strain sensitivity", unit: "rad/µε", toSI: 1, siUnit: "rad" },
    { key: "mziTempSens", label: "MZI: temperature sensitivity", unit: "rad/K", toSI: 1, siUnit: "rad" },
    { key: "mziFringeStrain", label: "MZI: strain for one fringe", unit: "µε", toSI: 1e-6, siUnit: "" },
    { key: "efpiFsr", label: "EFPI: free spectral range", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "efpiFinesse", label: "EFPI: coefficient of finesse F", unit: "", toSI: 1, siUnit: "" },
    { key: "efpiPeak", label: "EFPI: peak reflectance F/(1 + F)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "efpiFringeShift", label: "EFPI: fringe shift (gap strain)", unit: "pm", toSI: 1e-12, siUnit: "m" },
    { key: "evNExt", label: "Evanescent: external index at ΔT", unit: "", toSI: 1, siUnit: "" },
    { key: "evDp", label: "Evanescent: penetration depth d_p", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "evDpChange", label: "Evanescent: d_p change from ΔT", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "evDpSens", label: "Evanescent: d(d_p)/dn_ext", unit: "nm/RIU", toSI: 1e-9, siUnit: "m" },
  ],
  validate: ({ sensor, tempChange }) =>
    sensor === "evanescent" && Math.abs(tempChange) > EVANESCENT_DT_MAX
      ? `The evanescent sensor takes a temperature change within ±${EVANESCENT_DT_MAX} K (water dn/dT is only roughly constant there).`
      : undefined,
  compute({ sensor, wavelength, tempChange, strain, gaugeLength, cavityLength, mirrorR, n_eff, n_ext }) {
    const type: SensorType = sensor === "mach_zehnder" || sensor === "fabry_perot" || sensor === "evanescent" ? sensor : "fbg";
    const r = sensorResponse(type, {
      lambda: wavelength, strain, deltaT: tempChange, nEff: n_eff, gaugeLength, cavityLength, mirrorR, nExt: n_ext,
    });
    const values = {
      gauge: r.gauge,
      fbgTotal: NaN, fbgStrainSens: NaN, fbgTempSens: NaN, fbgShifted: NaN,
      mziPhase: NaN, mziStrainSens: NaN, mziTempSens: NaN, mziFringeStrain: NaN,
      efpiFsr: NaN, efpiFinesse: NaN, efpiPeak: NaN, efpiFringeShift: NaN,
      evNExt: NaN, evDp: NaN, evDpChange: NaN, evDpSens: NaN,
    };
    const warnings = ["Only the outputs of the chosen sensor type are computed; the others are null."];
    switch (r.kind) {
      case "fbg":
        Object.assign(values, {
          fbgTotal: r.total, fbgStrainSens: r.strainPm * 1e-12, fbgTempSens: r.tempPm * 1e-12, fbgShifted: wavelength + r.total,
        });
        break;
      case "mzi":
        Object.assign(values, {
          mziPhase: r.phase, mziStrainSens: r.perMicrostrain, mziTempSens: r.perK, mziFringeStrain: (2 * Math.PI) / r.perStrain,
        });
        break;
      case "efpi":
        Object.assign(values, { efpiFsr: r.fsr, efpiFinesse: r.F, efpiPeak: r.peak, efpiFringeShift: r.fringeShift });
        break;
      case "evanescent":
        Object.assign(values, { evNExt: r.nExt, evDp: r.dp, evDpChange: r.dp - r.dp0, evDpSens: r.sens });
        if (!Number.isFinite(r.dp)) warnings.push("The external index is at or above n_eff: the evanescent field is not guided.");
        break;
    }
    return { values, warnings };
  },
  checks: [
    {
      // FBG at the defaults: p_e = (n²/2)[p₁₂ − ν(p₁₁ + p₁₂)] = 1.0469045 · (0.252 − 0.16 · 0.365) = 0.2026807, 1 − p_e = 0.7973193.
      // Strain 100 µε: Δλ = 1550 nm · 0.7973193 · 1e-4 = 123.58449 pm; 1.2358449 pm/µε. ΔT = 10 K: 1550 nm · 6.165e-6 · 10 = 95.5575 pm; 9.55575 pm/K.
      // Total 219.14199 pm, shifted 1550.219142 nm.
      source: KERSEY,
      basis: "computed",
      inputs: {},
      expect: {
        gauge: 0.7973192888, fbgStrainSens: 1.23584489764, fbgTempSens: 9.55575, fbgTotal: 219.14198976400002, fbgShifted: 1550.2191419897636,
      },
      tolerance: 1e-8,
    },
    {
      // EFPI d = 20 µm, R = 0.033: ρ = 0.033, F = 4 · 0.033/(1 − 0.033)² = 0.132/0.935089 = 0.1411630; peak F/(1 + F) = 12.37010 %.
      // FSR = λ²/(2d) = (1550 nm)²/(2 · 20 µm) = 2.4025e-12/4e-5 = 60.0625 nm. Fringe shift λε = 1550 nm · 1e-4 = 155 pm.
      source: BORN_WOLF,
      basis: "computed",
      inputs: { sensor: "fabry_perot" },
      expect: { efpiFsr: 60.0625, efpiFinesse: 0.14116303367914712, efpiPeak: 12.370102212655176, efpiFringeShift: 155 },
      tolerance: 1e-8,
    },
    {
      // Water at ΔT = 10 K: n_ext = 1.318 − 1.0e-4 · 10 = 1.317; n_eff² − n_ext² = 2.093809 − 1.734489 = 0.359320, root 0.599433.
      // d_p = λ/(2π · 0.599433) = 1550 nm/3.766 = 411.539 nm. At ΔT = 0 (n_ext 1.318) d_p is 1.5173 nm larger, so the change is −1.51732 nm.
      // d(d_p)/dn_ext = d_p n_ext/(n_eff² − n_ext²) = 411.539 nm · 1.317/0.359320 = 1508.40 nm/RIU.
      source: HARRICK,
      basis: "computed",
      inputs: { sensor: "evanescent" },
      expect: { evNExt: 1.3170000000000002, evDp: 411.53912921324047, evDpChange: -1.517319505262133, evDpSens: 1508.3965077753476 },
      tolerance: 1e-8,
    },
  ],
});
