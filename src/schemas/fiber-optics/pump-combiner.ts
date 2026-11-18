import { pumpCombinerSummary } from "../../physics/fiber-optics/pump-combiner";
import { defineSchema } from "../types";

const KOSTERIN = "Kosterin A., Temyanko V., Fallahi M., Mansuripur M. (2004). Tapered fiber bundles for combining high-power diode " +
  "lasers. Appl. Opt. 43(19), 3893–3900, doi:10.1364/AO.43.003893: étendue conservation N·(d_p·NA_p)² ≤ (D_out·NA_out)² and the " +
  "adiabatic taper that multiplies the pump NA by the taper ratio; hexagonal bundle of n full rings, diameter (2n + 1)·d_clad.";

export default defineSchema({
  href: "/fiber-optics/pump-combiner",
  inputs: [
    { key: "numPumpPorts", label: "Pump ports N", unit: "", toSI: 1, siUnit: "", default: 6, min: 1, max: 100 },
    { key: "pumpPowerPerPort", label: "Pump power per port", unit: "W", toSI: 1, siUnit: "W", default: 30, min: 0, max: 10000 },
    { key: "combinerEfficiency", label: "Pump transmission", unit: "%", toSI: 0.01, siUnit: "", default: 98, min: 0, max: 100 },
    { key: "signalInsertionLoss", label: "Signal insertion loss", unit: "dB", toSI: 1, siUnit: "dB", default: 0.1, min: 0, max: 20 },
    { key: "pumpCore", label: "Pump fibre core diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 200, min: 1, max: 2000 },
    { key: "pumpClad", label: "Pump fibre cladding diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 220, min: 1, max: 2000 },
    { key: "pumpNA", label: "Pump fibre NA", unit: "", toSI: 1, siUnit: "", default: 0.22, min: 0.01, max: 1 },
    { key: "outputDiameter", label: "Output pump-guide diameter", unit: "µm", toSI: 1e-6, siUnit: "m", default: 400, min: 1, max: 5000 },
    { key: "outputNA", label: "Output pump-guide NA", unit: "", toSI: 1, siUnit: "", default: 0.46, min: 0.01, max: 1 },
  ],
  choices: [
    {
      key: "signalPort", label: "Centre signal fibre",
      options: [{ value: "yes", label: "Yes, (N+1)×1" }, { value: "no", label: "No, N×1" }],
      default: "yes",
    },
  ],
  outputs: [
    { key: "pumpIn", label: "Total pump input", unit: "W", toSI: 1, siUnit: "W" },
    { key: "pumpOut", label: "Combined pump output", unit: "W", toSI: 1, siUnit: "W" },
    { key: "pumpLost", label: "Lost in combiner", unit: "W", toSI: 1, siUnit: "W" },
    { key: "etendueUsed", label: "Étendue used", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "maxPorts", label: "Ideal port limit (étendue)", unit: "", toSI: 1, siUnit: "" },
    { key: "bundleDiameter", label: "Bundle diameter before taper", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "taperRatio", label: "Taper ratio", unit: "", toSI: 1, siUnit: "" },
    { key: "naTaper", label: "Pump NA after taper", unit: "", toSI: 1, siUnit: "" },
    { key: "brightnessIn", label: "Pump brightness in (one port)", unit: "W/(mm²·sr)", toSI: 1e6, siUnit: "W/(m²·sr)" },
    { key: "brightnessOut", label: "Pump brightness out", unit: "W/(mm²·sr)", toSI: 1e6, siUnit: "W/(m²·sr)" },
    { key: "signalTransmission", label: "Signal transmission", unit: "%", toSI: 0.01, siUnit: "" },
  ],
  compute({ numPumpPorts, signalPort, pumpPowerPerPort, combinerEfficiency, signalInsertionLoss, pumpCore, pumpClad, pumpNA, outputDiameter, outputNA }) {
    const r = pumpCombinerSummary({
      ports: Math.round(numPumpPorts), signalPort: signalPort !== "no", power: pumpPowerPerPort, efficiency: combinerEfficiency,
      signalLossDb: signalInsertionLoss, pumpCore: Math.min(pumpCore, pumpClad), pumpClad, pumpNA, outDia: outputDiameter, outNA: outputNA,
    });
    const warnings: string[] = [];
    if (pumpCore > pumpClad) warnings.push("The pump core is larger than its cladding; the core was set equal to the cladding.");
    if (!r.etendueOK) warnings.push("The pump étendue exceeds that of the output pump guide: the combiner cannot couple all pump light.");
    if (r.naTaper > 1) warnings.push("The pump NA after the taper exceeds 1: the light is no longer guided.");
    else if (!r.taperOK) warnings.push("The pump NA after the taper exceeds the output NA: the taper leaks pump light.");
    return {
      values: {
        pumpIn: r.pIn, pumpOut: r.pOut, pumpLost: r.pIn - r.pOut, etendueUsed: r.U, maxPorts: r.maxPorts,
        bundleDiameter: r.bundle, taperRatio: r.taperRatio, naTaper: r.naTaper,
        brightnessIn: r.bIn, brightnessOut: r.bOut, signalTransmission: r.signalT,
      },
      warnings,
    };
  },
  checks: [
    {
      // Defaults, 7 fibres (6 + centre) = 1 ring: bundle (2·1 + 1)·220 µm = 660 µm; TR = 660/400 = 1.65; NA after taper = 0.22·1.65 = 0.363.
      // U = 6·(200·0.22)²/(400·0.46)² = 6·1936/33856 = 0.343100189; P_out = 6·30·0.98 = 176.4 W; port limit ⌊33856/1936⌋ = ⌊17.49⌋ = 17.
      // Étendue G = π²d²NA²/4: one port π²·(200e-6)²·0.22²/4 = 4.7767e-9 m²·sr, so 30 W/G = 6.2802e9 W/(m²·sr) = 6280.24 W/(mm²·sr);
      // output π²·(400e-6)²·0.46²/4 = 8.3534e-8 m²·sr, so 176.4 W/G = 2.11166e9 W/(m²·sr). Signal: 10^(−0.1/10) = 0.977237221.
      source: KOSTERIN,
      basis: "computed",
      inputs: {},
      expect: {
        pumpOut: 176.4, bundleDiameter: 660, taperRatio: 1.65, naTaper: 0.363, etendueUsed: 34.31001890359168, maxPorts: 17,
        brightnessIn: 6280.238655516804, brightnessOut: 2111.6560485005176, signalTransmission: 97.72372209558107,
      },
      tolerance: 1e-8,
    },
    {
      // N = 3 without centre fibre: 1 ring (3 ≤ 7), bundle 3·220 = 660 µm (the page's full-hexagonal-ring rule (2n + 1)·d_clad, a simplification of the model: close packing of 3 fibres would give d(1 + 2/√3) ≈ 474 µm); output 500 µm, NA 0.5: TR = 660/500 = 1.32, NA after taper = 0.22·1.32 = 0.2904.
      // U = 3·(200·0.22)²/(500·0.5)² = 3·1936/62500 = 0.092928; port limit ⌊62500/1936⌋ = ⌊32.28⌋ = 32; P_out = 3·30·0.98 = 88.2 W.
      source: KOSTERIN,
      basis: "computed",
      inputs: { numPumpPorts: 3, signalPort: "no", outputDiameter: 500, outputNA: 0.5 },
      expect: { bundleDiameter: 660, taperRatio: 1.32, naTaper: 0.2904, etendueUsed: 9.2928, maxPorts: 32, pumpOut: 88.2 },
      tolerance: 1e-8,
    },
  ],
});
