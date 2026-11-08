import { WINDOWS, equivalentNoiseBandwidth, highestSidelobeDb, lineShapeDb, windowSamples, type WindowName } from "../../physics/spectroscopy/apodization-comparison";
import { defineSchema } from "../types";

const HARRIS = "Harris F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. " +
  "Proc. IEEE 66(1), 51–83, doi:10.1109/PROC.1978.10837; window definitions (eq. 30–32, Table I) and equivalent noise bandwidth " +
  "ENBW = N Σw²/(Σw)². For the symmetric Hann window w(n) = ½(1 − cos(2πn/(N − 1))) the sums are closed: Σw = (N − 1)/2 and " +
  "Σw² = 3(N − 1)/8, so ENBW = 3N/(2(N − 1)) (derived here from the definition; the periodic Hann window gives exactly 1.5).";

// Page order; the page has no URL state for the selection, so the schema reports every window.
const NAMES = Object.keys(WINDOWS) as WindowName[];
const key = (name: WindowName) => name.replace(/-(\w)/g, (_, ch: string) => ch.toUpperCase());

type Out = `enbw_${string}` | `sidelobe_${string}`;

export default defineSchema<"nPoints", Out>({
  href: "/spectroscopy/apodization-comparison",
  inputs: [
    { key: "nPoints", label: "N Points", unit: "", toSI: 1, siUnit: "", default: 512, min: 16, max: 2048 },
  ],
  outputs: [
    ...NAMES.map((name) => ({ key: `enbw_${key(name)}` as Out, label: `${WINDOWS[name].label}: equivalent noise bandwidth N Σw²/(Σw)² (bins)`, unit: "", toSI: 1, siUnit: "" })),
    ...NAMES.map((name) => ({ key: `sidelobe_${key(name)}` as Out, label: `${WINDOWS[name].label}: highest sidelobe (dB)`, unit: "dB", toSI: 1, siUnit: "dB" })),
  ],
  compute({ nPoints }) {
    const N = Math.round(nPoints);
    const values = {} as Record<Out, number>;
    for (const name of NAMES) {
      const w = windowSamples(name, N);
      values[`enbw_${key(name)}`] = equivalentNoiseBandwidth(w);
      // 16× zero padding over the first 64 bins resolves the sidelobes (same measurement as the window table).
      values[`sidelobe_${key(name)}`] = highestSidelobeDb(lineShapeDb(w, 16, 64).db);
    }
    return { values };
  },
  checks: [
    {
      // Boxcar: Σw = N, Σw² = N, so ENBW = N·N/N² = 1 for any N.
      // Hann at N = 512: 3·512/(2·511) = 1536/1022 = 1.50293542.
      source: HARRIS,
      basis: "computed",
      inputs: { nPoints: 512 },
      expect: { enbw_boxcar: 1, enbw_hanning: 1536 / 1022 },
      tolerance: 1e-8,
    },
    {
      // Hann at N = 16: 3·16/(2·15) = 1.6.
      source: HARRIS,
      basis: "computed",
      inputs: { nPoints: 16 },
      expect: { enbw_hanning: 1.6 },
      tolerance: 1e-8,
    },
  ],
});
