import { responsivitySummary } from "../../physics/detectors/responsivity-summary";
import { defineSchema } from "../types";

const SZE =
  "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, doi:10.1002/0470068329, ch. 13: ℛ = η·q/(h·ν) = η·q·λ/(h·c); " +
  "Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley, ch. 5. Photon rate per watt λ/(h·c); photocurrent I = ℛ·P.";

export default defineSchema({
  href: "/detectors/responsivity",
  inputs: [
    { key: "quantumEfficiency", label: "Quantum efficiency", unit: "", toSI: 1, siUnit: "", default: 0.8, min: 0, max: 1 },
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 1550, min: 200, max: 2000 },
  ],
  outputs: [
    { key: "responsivity", label: "Responsivity", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "idealResponsivity", label: "Responsivity at η = 1 (limit)", unit: "A/W", toSI: 1, siUnit: "A/W" },
    { key: "photonsPerWatt", label: "Photons per joule (photons/s per W)", unit: "1/J", toSI: 1, siUnit: "1/J" },
    { key: "photocurrent", label: "Photocurrent at 1 mW", unit: "µA", toSI: 1e-6, siUnit: "A" },
  ],
  compute({ quantumEfficiency, wavelength }) {
    const r = responsivitySummary(quantumEfficiency, wavelength);
    return {
      values: {
        responsivity: r.responsivity,
        idealResponsivity: r.idealResponsivity,
        photonsPerWatt: r.photonsPerWatt,
        photocurrent: r.photocurrent,
      },
    };
  },
  checks: [
    {
      // η = 0.8, λ = 1550 nm. ℛ = η·q·λ/(h·c) = 0.8·1.602176634e-19·1550e-9/(6.62607015e-34·299792458) = 1.000127448 A/W; ℛ(η = 1) = 1.250159310 A/W;
      // photons per watt = λ/(h·c) = 1550e-9/1.98644586e-25 = 7.80288068e18 /s; I = ℛ·1e-3 W = 1000.127448 µA.
      source: SZE,
      basis: "computed",
      inputs: {},
      expect: {
        responsivity: 1.0001274482313023, idealResponsivity: 1.250159310289128, photonsPerWatt: 7.8028806796912e18, photocurrent: 1000.1274482313023,
      },
      tolerance: 1e-8,
    },
    {
      // η = 0.5, λ = 532 nm: ℛ = 0.5·q·532e-9/(h·c) = 0.214543469 A/W; η = 1: 0.429086937 A/W; λ/(h·c) = 2.67815001e18 /s; I = 214.543469 µA.
      source: SZE,
      basis: "computed",
      inputs: { quantumEfficiency: 0.5, wavelength: 532 },
      expect: {
        responsivity: 0.21454346873348903, idealResponsivity: 0.42908693746697807, photonsPerWatt: 2.6781500139327217e18, photocurrent: 214.54346873348905,
      },
      tolerance: 1e-8,
    },
  ],
});
