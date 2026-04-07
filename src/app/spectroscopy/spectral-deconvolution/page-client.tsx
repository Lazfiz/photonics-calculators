"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
interface PeakConfig {
  center: number;
  fwhm: number;
  amplitude: number;
}

export default function SpectralDeconvolutionPage() {
  const [nPeaks, setNPeaks] = useURLState("nPeaks", 3);
  const [noiseLevel, setNoiseLevel] = useURLState("noiseLevel", 0.02);
  const [xMin, setXMin] = useURLState("xMin", 400);
  const [xMax, setXMax] = useURLState("xMax", 700);
  const [showComponents, setShowComponents] = useState(true);

  const defaultPeaks: PeakConfig[] = [
    { center: 480, fwhm: 25, amplitude: 0.7 },
    { center: 520, fwhm: 35, amplitude: 1.0 },
    { center: 570, fwhm: 30, amplitude: 0.5 },
    { center: 620, fwhm: 40, amplitude: 0.3 },
    { center: 450, fwhm: 20, amplitude: 0.4 },
  ];

  const [peaks, setPeaks] = useState<PeakConfig[]>(defaultPeaks.slice(0, 3));

  const updatePeak = (idx: number, key: keyof PeakConfig, val: number) => {
    const p = [...peaks];
    while (p.length < idx + 1) p.push({ center: 500, fwhm: 30, amplitude: 0.5 });
    p[idx] = { ...p[idx], [key]: val };
    setPeaks(p);
  };

  const chartData = useMemo(() => {
    const wl = Array.from({ length: 600 }, (_, i) => xMin + (i / 600) * (xMax - xMin));
    const seed = 42;
    const pseudoRandom = (i: number) => Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453 % 1;

    const componentSpectra = peaks.map(pk =>
      wl.map((w, i) => pk.amplitude * Math.exp(-4 * Math.log(2) * ((w - pk.center) / pk.fwhm) ** 2))
    );

    const combined = wl.map((_, i) => componentSpectra.reduce((s, cs) => s + cs[i], 0));
    const noisy = combined.map((v, i) => v + (pseudoRandom(i) - 0.5) * 2 * noiseLevel);

    const traces: any[] = [];

    if (showComponents) {
      const colors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"];
      componentSpectra.forEach((cs, idx) => {
        traces.push({
          x: wl, y: cs, type: "scatter", mode: "lines",
          name: `Peak ${idx + 1} (${peaks[idx]?.center}nm)`,
          line: { color: colors[idx % colors.length], width: 1.5, dash: "dot" },
          fill: "tozeroy", fillcolor: `${colors[idx % colors.length]}15`,
        });
      });
    }

    traces.push(
      { x: wl, y: combined, type: "scatter", mode: "lines", name: "Fit (sum)", line: { color: "#ffffff", width: 2 } },
      { x: wl, y: noisy, type: "scatter", mode: "lines", name: "Simulated Data (+noise)", line: { color: "#9ca3af", width: 1 } }
    );

    return traces;
  }, [peaks, noiseLevel, xMin, xMax, showComponents]);

  const totalArea = peaks.reduce((sum, pk) => sum + pk.amplitude * pk.fwhm * Math.sqrt(Math.PI / (4 * Math.LN2)), 0);
  const peakAreas = peaks.map(pk => pk.amplitude * pk.fwhm * Math.sqrt(Math.PI / (4 * Math.LN2)));

  return (
    <CalculatorShell backHref="/spectroscopy" backLabel="Spectroscopy" title="Spectral Deconvolution" description="Decompose overlapping spectral bands into individual Gaussian components.">
            
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Number of Peaks</span>
          <select value={nPeaks} onChange={e => { const n = +e.target.value; setNPeaks(n); setPeaks(defaultPeaks.slice(0, n)); }}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Noise Level" value={noiseLevel} onChange={setNoiseLevel} min={0} max={1} />
        <ValidatedNumberInput label="λ Min (nm)" value={xMin} onChange={setXMin} min={100} />
        <ValidatedNumberInput label="λ Max (nm)" value={xMax} onChange={setXMax} min={200} />
      </div>

      <div className="flex items-center gap-2 mb-6">
        <input type="checkbox" checked={showComponents} onChange={e => setShowComponents(e.target.checked)} className="accent-blue-500" />
        <span className="text-sm text-gray-300">Show individual components</span>
      </div>

      <div className="space-y-3 mb-8">
        {peaks.map((pk, idx) => (
          <div key={idx} className="grid gap-3 grid-cols-3 bg-gray-900 border border-gray-800 rounded-lg p-3">
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
              <span className="text-gray-400 text-xs">Peak {idx + 1} Center (nm)</span>
              <input type="number" value={pk.center} onChange={e => updatePeak(idx, "center", +e.target.value)} min={200} step={1}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
            </label>
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
              <span className="text-gray-400 text-xs">FWHM (nm)</span>
              <input type="number" value={pk.fwhm} onChange={e => updatePeak(idx, "fwhm", +e.target.value)} min={1} step={1}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
            </label>
            <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
              <span className="text-gray-400 text-xs">Amplitude</span>
              <input type="number" value={pk.amplitude} onChange={e => updatePeak(idx, "amplitude", +e.target.value)} min={0} step={0.05}
                className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm" />
            </label>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total Integrated Area</p>
          <p className="text-xl font-bold text-blue-400">{totalArea.toFixed(2)} nm·a.u.</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Peak Fractions</p>
          <p className="text-sm text-gray-300 mt-1">
            {peakAreas.map((a, i) => `${i + 1}: ${((a / totalArea) * 100).toFixed(1)}%`).join(" · ")}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono text-blue-400">I(λ) = Σᵢ Aᵢ · exp(−4·ln2·((λ−λᵢ)/FWHMᵢ)²)</p>
        <p className="text-gray-300 text-sm font-mono text-green-400">Areaᵢ = Aᵢ · FWHMᵢ · √(π / 4ln2)</p>
        <p className="text-gray-500 text-xs mt-2">Gaussian deconvolution assumes homogeneous broadening. Voigt profiles combine Gaussian + Lorentzian for Doppler + pressure broadening.</p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#1f2937" },
          yaxis: { title: "Intensity (a.u.)", gridcolor: "#1f2937" },
          legend: { orientation: "h", y: 1.2, font: { size: 10 } },
          margin: { t: 50 },
          showlegend: true,
        }} />
      </div>
    </CalculatorShell>
  );
}
