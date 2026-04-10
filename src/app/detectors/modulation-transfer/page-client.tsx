"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ModulationTransferPage() {
  const [pixelPitch, setPixelPitch] = useURLState("pixelPitch", 5.4); // μm
  const [diffusionLength, setDiffusionLength] = useURLState("diffusionLength", 1.5); // μm
  const [fillFactor, setFillFactor] = useURLState("fillFactor", 0.95);
  const [opticalBlur, setOpticalBlur] = useURLState("opticalBlur", 0); // μm Gaussian sigma

  const nyquist = 1000 / (2 * pixelPitch); // cycles/mm

  const chartData = useMemo(() => {
    const maxFreq = nyquist * 2;
    const freq = Array.from({ length: 300 }, (_, i) => (i / 300) * maxFreq);
    // Active pixel width from fill factor (2D: sqrt(FF) per dimension)
    const activeWidth = pixelPitch * Math.sqrt(fillFactor); // μm

    // Pixel aperture MTF: |sinc(π·f·a)| where a = active width in mm
    const mtfPixel = freq.map(f => {
      const arg = Math.PI * f * activeWidth / 1000; // f in lp/mm, a in mm
      if (arg === 0) return 1;
      return Math.abs(Math.sin(arg) / arg);
    });

    // Diffusion MTF (Lorentzian approximation)
    const mtfDiffusion = freq.map(f => {
      const k = 2 * Math.PI * f / 1000; // cycles/mm to rad/μm
      return 1 / (1 + Math.pow(k * diffusionLength, 2));
    });

    // Optical blur MTF (Gaussian PSF)
    const mtfOptical = freq.map(f => {
      const k = 2 * Math.PI * f / 1000;
      return Math.exp(-0.5 * Math.pow(k * opticalBlur, 2));
    });

    // Total MTF = product of components
    const mtfTotal = freq.map((f, i) => mtfPixel[i] * mtfDiffusion[i] * mtfOptical[i]);

    return [
      { x: freq, y: mtfTotal, type: "scatter" as const, mode: "lines" as const, name: "Total MTF", line: { color: "#fbbf24", width: 2.5 } },
      { x: freq, y: mtfPixel, type: "scatter" as const, mode: "lines" as const, name: "Pixel aperture", line: { color: "#60a5fa", width: 1.5, dash: "dash" } },
      { x: freq, y: mtfDiffusion, type: "scatter" as const, mode: "lines" as const, name: "Diffusion", line: { color: "#34d399", width: 1.5, dash: "dot" } },
      { x: freq, y: mtfOptical, type: "scatter" as const, mode: "lines" as const, name: "Optical blur", line: { color: "#f87171", width: 1.5, dash: "dashdot" } },
    ];
  }, [pixelPitch, diffusionLength, fillFactor, opticalBlur, nyquist]);

  // MTF at Nyquist using same formulas
  const activeWidth = pixelPitch * Math.sqrt(fillFactor);
  const argNyquist = Math.PI * nyquist * activeWidth / 1000;
  const mtfPixelNyquist = argNyquist === 0 ? 1 : Math.abs(Math.sin(argNyquist) / argNyquist);
  const kNyquist = 2 * Math.PI * nyquist / 1000;
  const mtfAtNyquist = mtfPixelNyquist *
    1 / (1 + Math.pow(kNyquist * diffusionLength, 2)) *
    Math.exp(-0.5 * Math.pow(kNyquist * opticalBlur, 2));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Pixel Pitch (μm)" value={pixelPitch} onChange={setPixelPitch} />
        <ValidatedNumberInput label="Diffusion Length (μm)" value={diffusionLength} onChange={setDiffusionLength} />
        <ValidatedNumberInput label="Fill Factor" value={fillFactor} onChange={setFillFactor} min={0.1} max={1} step="0.01" />
        <ValidatedNumberInput label="Optical Blur σ (μm)" value={opticalBlur} onChange={setOpticalBlur} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Nyquist frequency = <span className="text-blue-400 font-mono">{nyquist.toFixed(1)} lp/mm</span></p>
        <p className="text-gray-300">MTF at Nyquist = <span className="text-blue-400 font-mono">{(mtfAtNyquist * 100).toFixed(1)}%</span></p>
        <p className="text-gray-300 text-sm mt-1">MTF<sub>pixel</sub> = |sinc(π·f·a)| · MTF<sub>diff</sub> = 1/(1+(k·L<sub>d</sub>)²) · MTF<sub>opt</sub> = exp(−½(k·σ)²)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Spatial Frequency (lp/mm)", gridcolor: "#374151", range: [0, nyquist * 2] },
        yaxis: { title: "MTF", range: [0, 1.05], gridcolor: "#374151" },
        shapes: [{ type: "line" as const, x0: nyquist, x1: nyquist, y0: 0, y1: 1, line: { color: "#6b7280", width: 1, dash: "dot" } }],
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true, showlegend: true
      }} />
    </div>
  );
}
