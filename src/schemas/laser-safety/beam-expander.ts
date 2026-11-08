import { expandBeam } from "../../physics/laser-safety/beam-expander";
import { defineSchema } from "../types";

const SOURCE = "Saleh & Teich (2019). Fundamentals of Photonics, 3rd ed., Wiley, ch. 3.1 (Gaussian beam peak irradiance " +
  "I₀ = 2P/(πw²)); mean irradiance 4P/(πd²) over a circle of diameter d; an ideal expander of magnification M scales " +
  "the diameter by M and the area by M².";

export default defineSchema({
  href: "/laser-safety/beam-expander",
  inputs: [
    { key: "power", label: "Power", unit: "W", toSI: 1, siUnit: "W", default: 1, min: 0.000001, max: 100000 },
    { key: "beamDia", label: "Input beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m", default: 2, min: 0.01, max: 1000 },
    { key: "expansion", label: "Expansion ratio M", unit: "", toSI: 1, siUnit: "", default: 5, min: 1, max: 1000 },
  ],
  outputs: [
    { key: "outputDiameter", label: "Output beam diameter", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "irradianceIn", label: "Mean irradiance of the input beam", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "irradianceOut", label: "Mean irradiance of the expanded beam", unit: "W/cm²", toSI: 1e4, siUnit: "W/m²" },
    { key: "reduction", label: "Irradiance reduction M²", unit: "", toSI: 1, siUnit: "" },
    { key: "divergenceFactor", label: "Divergence factor 1/M", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ power, beamDia, expansion }) {
    const r = expandBeam(power, beamDia, expansion);
    return {
      values: {
        outputDiameter: r.outputDiameter,
        irradianceIn: r.meanIrradianceIn,
        irradianceOut: r.meanIrradianceOut,
        reduction: r.reduction,
        divergenceFactor: r.divergenceFactor,
      },
    };
  },
  checks: [
    {
      // P = 1 W, d = 2 mm, M = 5: 4P/(πd²) = 4/(π·4e-6 m²) = 318309.886 W/m² = 31.83098862 W/cm²; /M² = 25 gives
      // 1.273239545 W/cm²; output diameter 10 mm; divergence × 0.2.
      source: SOURCE,
      basis: "computed",
      inputs: {},
      expect: {
        outputDiameter: 10, irradianceIn: 31.83098862, irradianceOut: 1.273239545, reduction: 25, divergenceFactor: 0.2,
      },
      tolerance: 1e-8,
    },
  ],
});
