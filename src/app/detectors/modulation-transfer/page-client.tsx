"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { exponentialSpreadMtf, gaussianBlurMtf, pixelApertureMtf } from "../../../physics/detectors/sensor-mtf";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

export default function ModulationTransferPage() {
  const [pitchRaw, setPixelPitch] = useURLState("pixelPitch", 5.4); // µm
  const [spreadRaw, setSpreadLength] = useURLState("diffusionLength", 1.5); // µm, exponential line-spread length
  const [fillRaw, setFillFactor] = useURLState("fillFactor", 0.95);
  const [blurRaw, setOpticalBlur] = useURLState("opticalBlur", 0); // µm Gaussian σ

  const pixelPitch = clamp(pitchRaw, 0.5, 100, 5.4);
  const spreadLength = clamp(spreadRaw, 0, 50, 1.5);
  const fillFactor = clamp(fillRaw, 0.1, 1, 0.95);
  const opticalBlur = clamp(blurRaw, 0, 50, 0);

  // SI inside: lengths in m, frequencies in cycles/m; the page shows lp/mm.
  const pitch = pixelPitch * 1e-6;
  const aperture = pitch * Math.sqrt(fillFactor); // square active area: √FF per axis
  const spread = spreadLength * 1e-6;
  const sigma = opticalBlur * 1e-6;
  const nyquist = 1 / (2 * pitch);
  const terms = (f: number) => {
    const pixel = pixelApertureMtf(f, aperture);
    const diffusion = exponentialSpreadMtf(f, spread);
    const blur = gaussianBlurMtf(f, sigma);
    return { pixel, diffusion, blur, total: pixel * diffusion * blur };
  };
  const atNyquist = terms(nyquist);

  const freq = Array.from({ length: 301 }, (_, i) => (i / 300) * 2 * nyquist);
  const curves = freq.map(terms);
  const lpmm = freq.map(f => f / 1000);
  const chartData = [
    { x: lpmm, y: curves.map(t => t.total), type: "scatter" as const, mode: "lines" as const, name: "Total MTF", line: { color: "#fbbf24", width: 2.5 } },
    { x: lpmm, y: curves.map(t => t.pixel), type: "scatter" as const, mode: "lines" as const, name: "Pixel aperture", line: { color: "#60a5fa", width: 1.5, dash: "dash" } },
    { x: lpmm, y: curves.map(t => t.diffusion), type: "scatter" as const, mode: "lines" as const, name: "Charge spread", line: { color: "#34d399", width: 1.5, dash: "dot" } },
    { x: lpmm, y: curves.map(t => t.blur), type: "scatter" as const, mode: "lines" as const, name: "Optical blur", line: { color: "#f87171", width: 1.5, dash: "dashdot" } },
    { x: [nyquist / 1000, nyquist / 1000], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Nyquist", line: { color: "#6b7280", width: 1, dash: "dot" } },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pixel pitch p (µm)" value={pitchRaw} onChange={setPixelPitch} min={0.5} max={100} step="0.1" />
        <ValidatedNumberInput label="Charge spread length ℓ (µm)" value={spreadRaw} onChange={setSpreadLength} min={0} max={50} step="0.1" />
        <ValidatedNumberInput label="Fill factor" value={fillRaw} onChange={setFillFactor} min={0.1} max={1} step="0.01" />
        <ValidatedNumberInput label="Optical blur σ (µm)" value={blurRaw} onChange={setOpticalBlur} min={0} max={50} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <ResultCard label="Nyquist frequency" value={`${(nyquist / 1000).toFixed(1)} lp/mm`} subtext="f_N = 1/(2p)" tone="blue" />
        <ResultCard label="MTF at Nyquist" value={pct(atNyquist.total)} subtext="product of the three terms" tone="yellow" />
        <ResultCard label="Pixel aperture at Nyquist" value={pct(atNyquist.pixel)} subtext={`active width ${(aperture * 1e6).toFixed(2)} µm; 2/π = 63.7 % at 100 % fill`} tone="purple" />
        <ResultCard label="Charge spread at Nyquist" value={pct(atNyquist.diffusion)} subtext="1/(1 + (2π f ℓ)²)" tone="green" />
        <ResultCard label="Optical blur at Nyquist" value={pct(atNyquist.blur)} subtext="exp(−2π² σ² f²)" tone="red" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>MTF(f) = |sinc(π f a)| · 1/(1 + (2π f ℓ)²) · exp(−2π² σ² f²), with a = p·√FF for a square active area.</p>
        <p>ℓ is the 1/e length of an exponential line spread, e<sup>−|x|/ℓ</sup>/(2ℓ). It is a fitted spread, not the minority-carrier diffusion length: for the Seib diffusion model with depletion depth and wavelength, use the pixel crosstalk calculator.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Spatial frequency (lp/mm)", gridcolor: "#374151", range: [0, (2 * nyquist) / 1000] },
        yaxis: { title: "MTF", range: [0, 1.05], gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true,
      }} />
    </>
  );
}
