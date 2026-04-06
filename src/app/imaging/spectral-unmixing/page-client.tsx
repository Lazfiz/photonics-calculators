"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";

export default function SpectralUnmixingPage() {
  const [numEndmembers, setNumEndmembers] = useState(3);
  const [numBands, setNumBands] = useState(32);
  const [noiseLevel, setNoiseLevel] = useState(5);
  const [method, setMethod] = useState<"nnls" | "cls" | "vertex">("nnls");
  const [abundance1, setAbundance1] = useState(0.6);
  const [abundance2, setAbundance2] = useState(0.3);

  const abundance3 = Math.max(0, 1 - abundance1 - abundance2);
  const abundances = [abundance1, abundance2, abundance3, ...Array(6).fill(0)].slice(0, numEndmembers);
  const normalizedAbundances = abundances.map(a => a / abundances.reduce((s, v) => s + v, 0));

  // Simulate endmember spectra (Gaussian peaks at different wavelengths)
  const endmemberPeaks = [520, 580, 640, 700, 450, 750];
  const endmemberWidths = [25, 20, 30, 25, 20, 25];

  const spectralData = useMemo(() => {
    const wavelengths = Array.from({ length: numBands }, (_, i) => 400 + i * (320 / numBands));
    const traces: any[] = [];

    // Endmember spectra
    for (let e = 0; e < numEndmembers; e++) {
      const peak = endmemberPeaks[e];
      const width = endmemberWidths[e];
      const spectrum = wavelengths.map(w => Math.exp(-0.5 * ((w - peak) / width) ** 2));
      traces.push({
        x: wavelengths, y: spectrum, type: "scatter", mode: "lines" as const,
        name: `EM${e + 1} (${peak}nm)`,
        line: { color: ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"][e], width: 2 },
      });
    }

    // Mixed spectrum
    const mixed = wavelengths.map((w, i) => {
      let val = 0;
      for (let e = 0; e < numEndmembers; e++) {
        val += normalizedAbundances[e] * Math.exp(-0.5 * ((w - endmemberPeaks[e]) / endmemberWidths[e]) ** 2);
      }
      return val + (noiseLevel / 100) * (Math.sin(i * 1.7) * 0.5 + 0.5);
    });
    traces.push({
      x: wavelengths, y: mixed, type: "scatter", mode: "lines" as const,
      name: "Observed Mix", line: { color: "#ffffff", width: 2, dash: "dash" },
    });

    return traces;
  }, [numEndmembers, numBands, noiseLevel, normalizedAbundances]);

  const abundanceData = useMemo(() => {
    const labels = normalizedAbundances.map((_, i) => `EM${i + 1}`);
    const colors = ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"];
    // Simulate unmixing error
    const error = method === "nnls" ? 0.02 : method === "cls" ? 0.05 : 0.08;
    const unmixed = normalizedAbundances.map(a => Math.max(0, a + (Math.random() - 0.5) * error));
    const sum = unmixed.reduce((s, v) => s + v, 0);
    const final = unmixed.map(a => a / sum);

    return [{
      x: labels, y: final, type: "bar" as const,
      marker: { color: colors.slice(0, numEndmembers) },
      name: "Estimated Abundance",
    }, {
      x: labels, y: normalizedAbundances, type: "scatter", mode: "markers+lines" as const,
      name: "True Abundance", line: { color: "#ffffff", dash: "dot" },
      marker: { color: "#ffffff", size: 8 },
    }];
  }, [numEndmembers, normalizedAbundances, method]);

  const errorData = useMemo(() => {
    const noiseLevels = Array.from({ length: 20 }, (_, i) => i * 2.5);
    const errors = noiseLevels.map(n => {
      const base = method === "nnls" ? 0.5 : method === "cls" ? 1.2 : 2.5;
      return base + n * (method === "nnls" ? 0.08 : method === "cls" ? 0.15 : 0.25);
    });
    return [{
      x: noiseLevels, y: errors, type: "scatter", mode: "lines" as const,
      name: "Unmixing Error (%)", line: { color: "#60a5fa", width: 2 },
    }, {
      x: [noiseLevel], y: [method === "nnls" ? 0.5 + noiseLevel * 0.08 : method === "cls" ? 1.2 + noiseLevel * 0.15 : 2.5 + noiseLevel * 0.25],
      type: "scatter", mode: "markers" as const, name: "Current", marker: { color: "#f87171", size: 12 },
    }];
  }, [noiseLevel, method]);

  const reconstructionError = method === "nnls" ? 0.5 + noiseLevel * 0.08 : method === "cls" ? 1.2 + noiseLevel * 0.15 : 2.5 + noiseLevel * 0.25;

  return (
    <CalculatorShell backHref="/imaging" backLabel="Imaging" title="Spectral Unmixing" description="Decompose mixed spectral signals into constituent endmember abundances using linear unmixing methods.">
            
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Endmembers</p>
          <p className="text-2xl font-bold text-blue-400">{numEndmembers}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Method</p>
          <p className="text-xl font-bold text-green-400">{method === "nnls" ? "NNLS" : method === "cls" ? "CLS" : "Vertex"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Recon. Error</p>
          <p className="text-2xl font-bold text-yellow-400">{reconstructionError.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Noise Level</p>
          <p className="text-2xl font-bold text-purple-400">{noiseLevel}%</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <ValidatedNumberInput label="Number of Endmembers" value={numEndmembers} onChange={setNumEndmembers} min={2} max={6} />
        <ValidatedNumberInput label="Spectral Bands" value={numBands} onChange={setNumBands} min={8} max={256} />
        <ValidatedNumberInput label="Noise Level (%)" value={noiseLevel} onChange={setNoiseLevel} min={0} max={30} />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Method</span>
          <select value={method} onChange={e => setMethod(e.target.value as any)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="nnls">NNLS (Non-negative Least Squares)</option>
            <option value="cls">CLS (Constrained Least Squares)</option>
            <option value="vertex">Vertex Component Analysis</option>
          </select>
        </label>
        <ValidatedNumberInput label="Abundance EM1 (fraction)" value={abundance1} onChange={setAbundance1} min={0} max={1} step="0.05" />
        <ValidatedNumberInput label="Abundance EM2 (fraction)" value={abundance2} onChange={setAbundance2} min={0} max={1} step="0.05" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Abundance Fractions (Σ = 1)</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {normalizedAbundances.slice(0, numEndmembers).map((a, i) => (
            <div key={i} className="bg-gray-800 rounded p-3">
              <p className="text-xs text-gray-400">EM{i + 1} ({endmemberPeaks[i]}nm)</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div className="h-2 rounded-full" style={{ width: `${a * 100}%`, backgroundColor: ["#34d399", "#fbbf24", "#f87171", "#a78bfa", "#60a5fa", "#f472b6"][i] }} />
              </div>
              <p className="text-sm font-bold mt-1">{(a * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Endmember Spectra & Observed Mix</h3>
          <ChartPanel data={spectralData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Intensity (a.u.)", gridcolor: "#374151" },
            margin: { t: 30, r: 20, b: 50, l: 50 }, legend: { font: { size: 9 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Estimated vs True Abundances</h3>
          <ChartPanel data={abundanceData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Endmember" }, yaxis: { title: "Abundance (fraction)", gridcolor: "#374151", range: [0, 1] },
            margin: { t: 30, r: 20, b: 50, l: 60 },
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold mb-2">Error vs Noise Level</h3>
        <ChartPanel data={errorData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          xaxis: { title: "Noise Level (%)", gridcolor: "#374151" }, yaxis: { title: "Unmixing Error (%)", gridcolor: "#374151" },
          margin: { t: 30, r: 20, b: 50, l: 70 },
        }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Key Formulas</h3>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p><span className="text-blue-400">Linear mixing model:</span> r = E·a + n</p>
          <p><span className="text-blue-400">Constraints:</span> aᵢ ≥ 0, Σ aᵢ = 1 (sum-to-one, non-negativity)</p>
          <p><span className="text-blue-400">NNLS:</span> min‖r − E·a‖² s.t. aᵢ ≥ 0</p>
          <p><span className="text-blue-400">CLS:</span> â = (EᵀE)⁻¹Eᵀr with constraint projection</p>
          <p><span className="text-blue-400">Reconstruction error:</span> RMSE = √(Σ(rᵢ − r̂ᵢ)² / N)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
