import { glazingPerformance, heatMirrorCoating } from "../../physics/thin-film/low-emissivity";
import { defineSchema } from "../types";

const NM = 1e-9;

/** Glass pane with a dielectric | Ag | dielectric heat-mirror coating: D65 luminous and AM1.5 G solar T and R, Planck-weighted normal emittance. */
export default defineSchema({
  href: "/thin-film/heat-mirror",
  inputs: [
    { key: "nD", label: "n of the dielectric (TiO₂ ≈ 2.35)", unit: "", toSI: 1, siUnit: "", default: 2.35, min: 1, max: 4 },
    { key: "dOuter", label: "Outer dielectric", unit: "nm", toSI: NM, siUnit: "m", default: 30, min: 0, max: 500 },
    { key: "dAg", label: "Ag thickness", unit: "nm", toSI: NM, siUnit: "m", default: 12, min: 0, max: 100 },
    { key: "dInner", label: "Inner dielectric, on the glass", unit: "nm", toSI: NM, siUnit: "m", default: 30, min: 0, max: 500 },
    { key: "nSub", label: "n of the glass", unit: "", toSI: 1, siUnit: "", default: 1.52, min: 1, max: 4 },
    { key: "temp", label: "Surface temperature for ε", unit: "K", toSI: 1, siUnit: "K", default: 300, min: 200, max: 600 },
  ],
  outputs: [
    { key: "Tvis", label: "Light transmittance τv (D65)", unit: "", toSI: 1, siUnit: "" },
    { key: "Rvis", label: "Light reflectance ρv (D65)", unit: "", toSI: 1, siUnit: "" },
    { key: "Tsol", label: "Solar transmittance τe (AM1.5 G)", unit: "", toSI: 1, siUnit: "" },
    { key: "Rsol", label: "Solar reflectance ρe (AM1.5 G)", unit: "", toSI: 1, siUnit: "" },
    { key: "emittance", label: "Normal emittance εn of the coated face", unit: "", toSI: 1, siUnit: "" },
    { key: "TvisBare", label: "Light transmittance τv, bare pane", unit: "", toSI: 1, siUnit: "" },
    { key: "emittanceBare", label: "Normal emittance εn, bare glass (this model)", unit: "", toSI: 1, siUnit: "" },
  ],
  compute({ nD, dOuter, dAg, dInner, nSub, temp }) {
    const perf = glazingPerformance(heatMirrorCoating(nD, dOuter, dAg, dInner), nSub, temp);
    const bare = glazingPerformance([], nSub, temp);
    return {
      values: { Tvis: perf.Tvis, Rvis: perf.Rvis, Tsol: perf.Tsol, Rsol: perf.Rsol, emittance: perf.emittance, TvisBare: bare.Tvis, emittanceBare: bare.emittance },
      warnings: [
        "Normal (not hemispherical) emittance over 2.5–50 µm; the glass is opaque there and taken with a constant index, so bare-glass ε is too high. Real Ag films this thin conduct worse than the model, which raises ε.",
      ],
    };
  },
  checks: [
    {
      // No coating on a lossless glass of n = 1.52. Front-face Fresnel Rb = ((n − 1)/(n + 1))² = (0.52/2.52)² = 0.04257999;
      // incoherent two-face sheet: T = (1 − Rb)/(1 + Rb) = 0.95742001/1.04257999 = 0.91831803, independent of wavelength, so the
      // D65 and AM1.5 weightings drop out; R = 1 − T. The glass is opaque in the thermal band: ε = 1 − Rb = 0.95742001.
      source: "Born M., Wolf E. (1999). Principles of Optics, 7th ed., Cambridge University Press, §1.5 (Fresnel reflectance at normal incidence); Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., CRC Press, ch. 2 (incoherent substrate); Kirchhoff's law ε = 1 − R for an opaque surface.",
      basis: "computed",
      inputs: { dOuter: 0, dAg: 0, dInner: 0 },
      expect: { Tvis: 0.91831803, Tsol: 0.91831803, Rvis: 0.08168197, emittance: 0.95742001 },
      tolerance: 1e-7,
    },
  ],
});
