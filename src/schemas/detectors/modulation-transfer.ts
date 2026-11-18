import { modulationTransferSummary } from "../../physics/detectors/modulation-transfer";
import { defineSchema } from "../types";

const HOLST = "Holst G. C., Lomheim T. S. (2011). CMOS/CCD Sensors and Camera Systems, 2nd ed. SPIE Press, ch. 10 \"MTF\", doi:10.1117/3.2524677.ch10: " +
  "the MTF of a linear shift-invariant chain is the product of its terms; pixel aperture of width a = p·√FF: |sinc(π f a)| = |sin(π f a)/(π f a)|; " +
  "exponential line spread e^(−|x|/ℓ)/(2ℓ): 1/(1 + (2π f ℓ)²); Gaussian blur σ: exp(−2π² σ² f²); Nyquist f_N = 1/(2p).";

export default defineSchema({
  href: "/detectors/modulation-transfer",
  inputs: [
    { key: "pixelPitch", label: "Pixel pitch p", unit: "µm", toSI: 1e-6, siUnit: "m", default: 5.4, min: 0.5, max: 100 },
    { key: "diffusionLength", label: "Charge spread length ℓ", unit: "µm", toSI: 1e-6, siUnit: "m", default: 1.5, min: 0, max: 50 },
    { key: "fillFactor", label: "Fill factor", unit: "", toSI: 1, siUnit: "", default: 0.95, min: 0.1, max: 1 },
    { key: "opticalBlur", label: "Optical blur σ", unit: "µm", toSI: 1e-6, siUnit: "m", default: 0, min: 0, max: 50 },
  ],
  outputs: [
    { key: "nyquist", label: "Nyquist frequency", unit: "lp/mm", toSI: 1000, siUnit: "cycles/m" },
    { key: "mtfNyquist", label: "MTF at Nyquist", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "pixelAperture", label: "Pixel aperture at Nyquist", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "chargeSpread", label: "Charge spread at Nyquist", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "opticalBlurTerm", label: "Optical blur at Nyquist", unit: "%", toSI: 0.01, siUnit: "" },
    { key: "activeWidth", label: "Active width", unit: "µm", toSI: 1e-6, siUnit: "m" },
  ],
  compute({ pixelPitch, diffusionLength, fillFactor, opticalBlur }) {
    const r = modulationTransferSummary({ pitch: pixelPitch, spreadLength: diffusionLength, fillFactor, blurSigma: opticalBlur });
    return {
      values: {
        nyquist: r.nyquist, mtfNyquist: r.total, pixelAperture: r.pixel, chargeSpread: r.diffusion, opticalBlurTerm: r.blur, activeWidth: r.aperture,
      },
    };
  },
  checks: [
    {
      // Defaults p = 5.4 µm, ℓ = 1.5 µm, FF = 0.95, σ = 0: f_N = 1/(2·5.4e-6) = 92.5925926 lp/mm; a = 5.4·√0.95 = 5.26326895 µm;
      // pixel |sin(π f a)|/(π f a) = 0.65264155; spread 1/(1 + (2π·f_N·1.5e-6)²) = 0.56768395; blur 1; total 0.37049413.
      source: HOLST,
      basis: "computed",
      inputs: {},
      expect: { nyquist: 92.5925925925926, mtfNyquist: 37.0494132203991, pixelAperture: 65.26415486992296, chargeSpread: 56.76839498533575, opticalBlurTerm: 100, activeWidth: 5.26326894619684 },
      tolerance: 1e-8,
    },
    {
      // p = 4 µm, FF = 1, ℓ = 0, σ = 0: f_N = 125 lp/mm, a = p so f a = 1/2 and the pixel term is sin(π/2)/(π/2) = 2/π = 63.661977 %; the other terms are 1.
      source: HOLST,
      basis: "computed",
      inputs: { pixelPitch: 4, diffusionLength: 0, fillFactor: 1 },
      expect: { nyquist: 125, mtfNyquist: 63.66197723675815, pixelAperture: 63.66197723675815, chargeSpread: 100, opticalBlurTerm: 100, activeWidth: 4 },
      tolerance: 1e-8,
    },
    {
      // p = 6.5 µm, ℓ = 2 µm, FF = 0.8, σ = 1.2 µm: f_N = 76.9230769 lp/mm; a = 6.5·√0.8 = 5.81377674 µm; pixel 0.70199796; spread 0.51695605;
      // blur exp(−2π²·(1.2e-6)²·f_N²) = 0.84519148; total 0.30672176.
      source: HOLST,
      basis: "computed",
      inputs: { pixelPitch: 6.5, diffusionLength: 2, fillFactor: 0.8, opticalBlur: 1.2 },
      expect: { nyquist: 76.92307692307692, mtfNyquist: 30.67217585977163, pixelAperture: 70.19979642700851, chargeSpread: 51.69560507647392, opticalBlurTerm: 84.51914789389138, activeWidth: 5.813776741499453 },
      tolerance: 1e-8,
    },
  ],
});
