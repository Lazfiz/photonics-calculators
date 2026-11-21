import { type GapModel, lcosSteering } from "../../physics/spatial-light-modulators/lcos-steering";
import { defineSchema } from "../types";

const DEG = Math.PI / 180;
const HAMAMATSU = "Hamamatsu Photonics (2024). LCOS-SLM X15213 series: Applications and Features, Cat. No. LLAP3012E05, Aug. 2024. " +
  "1272 × 1024 pixels, 12.5 µm pitch, fill factor 96.8 %; Feature 3: a 2-level grating at 40 lp/mm and a 4-level grating at 20 lp/mm. " +
  "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/lpd/application_note_LCOS_E.pdf";
const NABER = "Naber J. B., Vos J., Rengelink R. J., Nusselder R. J., Davtyan D. (2016). Optical techniques for Rydberg physics in lattice " +
  "geometries. Eur. Phys. J. Spec. Top. 225, 2785–2816 (read as arXiv:1512.06241v1, Sec. on the SLM): a fill factor of 87 % gives a " +
  "theoretical diffraction efficiency of (fill factor)² = 76 %. https://doi.org/10.1140/epjst/e2015-50329-4";
const ZHANG = "Zhang Z., You Z., Chu D. (2014). Fundamentals of phase-only liquid crystal on silicon (LCOS) devices. Light Sci. Appl. 3, " +
  "e213, Eqs. 3 and 4: δ = 2πΔn·2d/λ; a 2π stroke needs d = λ/(2Δn). https://doi.org/10.1038/lsa.2014.94";

const BLAZE = "The phase stroke 4πΔn t/λ is below 2π at this wavelength, so the ramp can't be wrapped at 2π; the efficiencies assume a 2π ramp.";

export default defineSchema({
  href: "/spatial-light-modulators/lcos-beam-steering",
  choices: [
    {
      key: "gap",
      label: "Gaps between pixel mirrors",
      options: [
        { value: "absorbing", label: "Reflect nothing (Shane et al. 2019)" },
        { value: "mirror", label: "Reflect without modulation" },
      ],
      default: "absorbing",
    },
  ],
  inputs: [
    { key: "wavelength", label: "Wavelength", unit: "nm", toSI: 1e-9, siUnit: "m", default: 633, min: 200, max: 2500 },
    { key: "pitch", label: "Pixel pitch d", unit: "µm", toSI: 1e-6, siUnit: "m", default: 12.5, min: 1, max: 50 },
    { key: "period", label: "Grating period N (pixels, need not be whole)", unit: "px", toSI: 1, siUnit: "", default: 4, min: 2, max: 1000 },
    { key: "fill", label: "Area fill factor F", unit: "%", toSI: 0.01, siUnit: "", default: 96.8, min: 10, max: 100 },
    { key: "deltaN", label: "Liquid-crystal birefringence Δn at λ", unit: "", toSI: 1, siUnit: "", default: 0.2, min: 0.01, max: 0.5 },
    { key: "thickness", label: "Liquid-crystal layer thickness t", unit: "µm", toSI: 1e-6, siUnit: "m", default: 2.5, min: 0.5, max: 20 },
    { key: "focal", label: "Focal length of the Fourier lens", unit: "mm", toSI: 1e-3, siUnit: "m", default: 200, min: 1, max: 5000 },
    { key: "pixels", label: "Pixels across the steering direction", unit: "", toSI: 1, siUnit: "", default: 1272, min: 16, max: 8192 },
  ],
  outputs: [
    { key: "angle", label: "Steering angle of the first order, arcsin(λ/(N d))", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "gratingFrequency", label: "Grating frequency 1/(N d)", unit: "lp/mm", toSI: 1e3, siUnit: "1/m" },
    { key: "periodLength", label: "Grating period N d", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "maxAngle", label: "Largest steering angle (N = 2), arcsin(λ/(2d))", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "efficiency", label: "Power in the steered order, F² sinc²(π√F/N) (fraction of the incident power, lossless mirrors)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "relativeEfficiency", label: "The same over the zero order with no pattern (datasheet convention), sinc²(π√F/N)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pixelation", label: "Pixelation factor sinc²(π/N) (the steered power at F = 100 %)", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "fillLimit", label: "Long-period limit F²", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "aliasAngle", label: "Angle of the alias order (ν = 1/N − 1), on the other side", unit: "°", toSI: DEG, siUnit: "rad" },
    { key: "aliasEfficiency", label: "Power in the alias order, F² sinc²(π√F(1 − 1/N))", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "zeroOrder", label: "Power in the zero order", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "stroke", label: "Phase stroke at λ, 4πΔn t/λ", unit: "waves", toSI: 2 * Math.PI, siUnit: "rad" },
    { key: "thickness2Pi", label: "Thickness for a 2π stroke, λ/(2Δn)", unit: "µm", toSI: 1e-6, siUnit: "m" },
    { key: "maxWavelength", label: "Longest wavelength with a 2π stroke, 2Δn t (Δn held fixed)", unit: "nm", toSI: 1e-9, siUnit: "m" },
    { key: "spotShift", label: "Spot displacement f tan θ in the focal plane (ideal lens)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "replayField", label: "Replay field λf/d (paraxial; from order to order of the pixel grid)", unit: "mm", toSI: 1e-3, siUnit: "m" },
    { key: "spotSize", label: "Spot size λf/(M d), first zero, for M pixels across", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ gap, wavelength, pitch, period, fill, deltaN, thickness, focal, pixels }) {
    const g: GapModel = gap === "mirror" ? "mirror" : "absorbing";
    const r = lcosSteering({ lambda: wavelength, pitch, period, fillFactor: fill, gap: g, deltaN, thickness, focal, pixels: Math.round(pixels) });
    const warnings: string[] = [];
    type Key = "angle" | "maxAngle" | "efficiency" | "relativeEfficiency" | "aliasAngle" | "aliasEfficiency" | "zeroOrder" | "spotShift";
    const reasons: Partial<Record<Key, string>> = {};
    const evanescent = (n: string) => `λ/(${n} d) exceeds 1 here, so that order is evanescent: it doesn't leave the SLM.`;
    if (!r.reaches2Pi) reasons.efficiency = reasons.relativeEfficiency = reasons.aliasEfficiency = reasons.zeroOrder = BLAZE;
    if (!Number.isFinite(r.angle)) reasons.angle = reasons.spotShift = reasons.efficiency = reasons.relativeEfficiency = evanescent("N");
    if (!Number.isFinite(r.maxAngle)) reasons.maxAngle = evanescent("2");
    if (!Number.isFinite(r.aliasAngle)) reasons.aliasAngle = reasons.aliasEfficiency = "λ(1 − 1/N)/d exceeds 1 here, so the alias order is evanescent.";
    if (g === "mirror") {
      reasons.relativeEfficiency = "With reflecting gaps the zero order with no pattern depends on the gaps' phase against the pixels', which this model doesn't know.";
    }
    return {
      values: {
        angle: r.angle, gratingFrequency: r.gratingFrequency, periodLength: r.periodLength, maxAngle: r.maxAngle,
        efficiency: r.efficiency, relativeEfficiency: r.relativeEfficiency, pixelation: r.pixelation, fillLimit: r.fillLimit,
        aliasAngle: r.aliasAngle, aliasEfficiency: r.aliasEfficiency, zeroOrder: r.zeroOrder, stroke: r.stroke,
        thickness2Pi: r.thickness2Pi, maxWavelength: r.maxWavelength, spotShift: r.spotShift, replayField: r.replayField, spotSize: r.spotSize,
      },
      warnings,
      reasons,
    };
  },
  checks: [
    {
      // Feature 3: at 12.5 µm pitch a 2-level grating (N = 2) is 40 lp/mm.
      source: HAMAMATSU,
      basis: "printed",
      inputs: { period: 2 },
      expect: { gratingFrequency: 40 },
      tolerance: 0.005,
    },
    {
      // PLUTO, fill factor 87 %: (0.87)² = 75.69 %, printed as 76 %. A long period (N = 1000) reaches that limit.
      source: NABER,
      basis: "printed",
      inputs: { fill: 87, period: 1000 },
      expect: { fillLimit: 76, efficiency: 76 },
      tolerance: 0.005,
    },
    {
      // Defaults, the 4-level grating of the note (20 lp/mm): θ = arcsin(633 nm/50 µm) = 0.725384°;
      // sinc²(π/4) = 81.0569 %; sinc²(π·0.983870/4) = 81.6151 %; × 0.968² = 76.4753 %; alias sinc²(π·0.983870·3/4) × 0.937024 = 9.38016 %.
      source: HAMAMATSU,
      basis: "computed",
      inputs: {},
      expect: { gratingFrequency: 20, angle: 0.725384, pixelation: 81.0569, relativeEfficiency: 81.6151, efficiency: 76.4753, aliasEfficiency: 9.38016 },
      tolerance: 1e-5,
    },
    {
      // Eq. 4 at 633 nm, Δn = 0.2: t = 633 nm/0.4 = 1.5825 µm. Eq. 3 for t = 2.5 µm: 4 × 0.2 × 2.5 µm/(2 × 0.633 µm) = 1.57978 waves.
      source: ZHANG,
      basis: "computed",
      inputs: {},
      expect: { thickness2Pi: 1.5825, stroke: 1.57978, maxWavelength: 1000 },
      tolerance: 1e-5,
    },
  ],
});
