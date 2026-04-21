"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function EmissionSpectraPage() {
  const [centerWL, setCenterWL] = useURLState("centerWL", 520);
  const [fwhm, setFwhm] = useURLState("fwhm", 35);
  const [asymmetry, setAsymmetry] = useURLState("asymmetry", 0.3);
  const [peakIntensity, setPeakIntensity] = useURLState("peakIntensity", 1.0);
  const [nPeaks, setNPeaks] = useURLState("nPeaks", 1);
  const [peak2WL, setPeak2WL] = useURLState("peak2WL", 560);
  const [peak2Fwhm, setPeak2Fwhm] = useURLState("peak2Fwhm", 40);
  const [peak2Intensity, setPeak2Intensity] = useURLState("peak2Intensity", 0.3);

  const asymmetricGaussian = (x: number, center: number, fwhm: number, amp: number, asym: number) => {
    const d = x - center;
    // Normalize so the peak's actual FWHM matches the user-specified value.
    // σ_left = fwhm / (2.355 * (1 + asym/2)), σ_right = σ_left * (1 + asym)
    const sigmaLeft = fwhm / (2.355 * (1 + asym / 2));
    const sigma = d < 0 ? sigmaLeft : sigmaLeft * (1 + asym);
    return amp * Math.exp(-0.5 * (d / sigma) ** 2);
  };

  const chartData = useMemo(() => {
    const wl = Array.from({ length: 600 }, (_, i) => 350 + (i / 600) * 400);
    const spec = wl.map(w => asymmetricGaussian(w, centerWL, fwhm, peakIntensity, asymmetry));
    const spec2 = nPeaks >= 2 ? wl.map(w => asymmetricGaussian(w, peak2WL, peak2Fwhm, peak2Intensity, asymmetry)) : [];

    const traces: Record<string, unknown>[] = [
      { x: wl, y: spec, type: "scatter" as const, mode: "lines" as const, name: "Peak 1", line: { color: "#60a5fa" }, fill: "tozeroy", fillcolor: "rgba(96,165,250,0.15)" },
    ];
    if (nPeaks >= 2) {
      traces.push({ x: wl, y: spec2, type: "scatter" as const, mode: "lines" as const, name: "Peak 2", line: { color: "#34d399" }, fill: "tozeroy", fillcolor: "rgba(52,211,153,0.15)" });
      traces.push({ x: wl, y: spec.map((v, i) => v + spec2[i]), type: "scatter" as const, mode: "lines" as const, name: "Combined", line: { color: "#fbbf24", width: 2 } });
    }

    // Center of mass
    const combined = nPeaks >= 2 ? spec.map((v, i) => v + spec2[i]) : spec;
    const totalInt = combined.reduce((a, b) => a + b, 0);
    const com = totalInt > 0 ? combined.reduce((a, b, i) => a + b * wl[i], 0) / totalInt : NaN;

    if (!isNaN(com)) {
      traces.push({
        x: [com], y: [peakIntensity * 1.1],
        type: "scatter" as const, mode: "markers" as const, name: `CoM: ${com.toFixed(1)} nm`,
        marker: { color: "#f87171", size: 10, symbol: "x" }
      });
    }

    return traces;
  }, [centerWL, fwhm, asymmetry, peakIntensity, nPeaks, peak2WL, peak2Fwhm, peak2Intensity]);

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Emission Spectra Fitting" description="Model photoluminescence emission with asymmetric Gaussian line shapes.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Peak 1 Center (nm)" value={centerWL} onChange={setCenterWL} min={300} max={1000} />
        <ValidatedNumberInput label="Peak 1 FWHM (nm)" value={fwhm} onChange={setFwhm} min={1} />
        <ValidatedNumberInput label="Peak 1 Intensity" value={peakIntensity} onChange={setPeakIntensity} min={0} />
        <ValidatedNumberInput label="Asymmetry (red-tail)" value={asymmetry} onChange={setAsymmetry} min={0} max={2} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Number of Peaks</span>
          <select value={nPeaks} onChange={e => setNPeaks(+e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
      </div>

      {nPeaks >= 2 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <ValidatedNumberInput label="Peak 2 Center (nm)" value={peak2WL} onChange={setPeak2WL} min={300} />
          <ValidatedNumberInput label="Peak 2 FWHM (nm)" value={peak2Fwhm} onChange={setPeak2Fwhm} min={1} />
          <ValidatedNumberInput label="Peak 2 Intensity" value={peak2Intensity} onChange={setPeak2Intensity} min={0} />
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">I(λ) = A · exp(−0.5 · ((λ − λ₀)/σ)²)</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">σ_left = FWHM / (2.355·(1+α/2)), σ_right = σ_left·(1+α)</p>
        <p className="text-gray-500 text-xs mt-2">Asymmetric Gaussian models the common red-tailed emission of fluorophores due to vibronic coupling.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#1f2937" },
          legend: { orientation: "h", y: 1.15 },
          margin: { t: 40 },
        }} />
      </div>
    </CalculatorShell>
  );
}
