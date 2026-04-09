"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function DepolarizationPage() {
  const [s0in, setS0in] = useURLState("s0in", 1);
  const [s1in, setS1in] = useURLState("s1in", 1);
  const [s2in, setS2in] = useURLState("s2in", 0);
  const [s3in, setS3in] = useURLState("s3in", 0);
  const [depCoeff, setDepCoeff] = useURLState("depCoeff", 0.1); // depolarization coefficient 0-1

  // Depolarization via Mueller matrix for partial depolarizer
  // M_dep = diag(1, 1-d, 1-d, 1-d) where d is depolarization power
  // Alternative model: spectral depolarization (averaging over wavelengths)

  const [spectralMode, setSpectralMode] = useState(false);
  const [centerWavelength, setCenterWavelength] = useURLState("centerWavelength", 550);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100);

  const results = useMemo(() => {
    if (spectralMode) {
      // Spectral depolarization: average Stokes over wavelength band
      // Model: retardance varies with wavelength → depolarization
      const N = 50;
      let s0avg = 0, s1avg = 0, s2avg = 0, s3avg = 0;
      const wavelengths: number[] = [];
      const s1vals: number[] = [];
      const s2vals: number[] = [];
      const s3vals: number[] = [];
      const dopVals: number[] = [];

      for (let i = 0; i < N; i++) {
        const wl = (centerWavelength - bandwidth / 2) + (bandwidth * i) / (N - 1);
        wavelengths.push(wl);
        // Retardance varies linearly with 1/λ
        const ret0 = 2 * Math.PI * 5 * 0.0091 * 1e-3 / (centerWavelength * 1e-9);
        const ret = 2 * Math.PI * 5 * 0.0091 * 1e-3 / (wl * 1e-9);
        const deltaRet = ret - ret0;

        // Apply to input Stokes (linear at 45°: S=[1,1,0,0])
        const s1 = s1in * Math.cos(deltaRet) - s3in * Math.sin(deltaRet);
        const s2 = s2in;
        const s3 = s1in * Math.sin(deltaRet) + s3in * Math.cos(deltaRet);
        s1avg += s1; s2avg += s2; s3avg += s3;
        s1vals.push(s1); s2vals.push(s2); s3vals.push(s3);
        const dop = Math.sqrt(s1 * s1 + s2 * s2 + s3 * s3) / s0in;
        dopVals.push(dop);
      }
      s0avg = s0in; // total power conserved
      s1avg /= N; s2avg /= N; s3avg /= N;
      const dop = Math.sqrt(s1avg ** 2 + s2avg ** 2 + s3avg ** 2) / s0avg;
      return { s0: s0avg, s1: s1avg, s2: s2avg, s3: s3avg, dop, wavelengths, s1vals, s2vals, s3vals, dopVals };
    }

    // Simple Mueller depolarizer
    const d = depCoeff;
    const s1out = s1in * (1 - d);
    const s2out = s2in * (1 - d);
    const s3out = s3in * (1 - d);
    const dop = Math.sqrt(s1out ** 2 + s2out ** 2 + s3out ** 2) / s0in;
    return { s0: s0in, s1: s1out, s2: s2out, s3: s3out, dop, wavelengths: [], s1vals: [], s2vals: [], s3vals: [], dopVals: [] };
  }, [s0in, s1in, s2in, s3in, depCoeff, spectralMode, centerWavelength, bandwidth]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 50, r: 10 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Depolarization" description="Calculate depolarization effects via Mueller matrix model or spectral averaging.">
            
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Mode</h2>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setSpectralMode(false)}
              className={`px-4 py-2 rounded text-sm ${!spectralMode ? "bg-blue-600" : "bg-gray-800 border border-gray-700"}`}>
              Mueller Depolarizer
            </button>
            <button onClick={() => setSpectralMode(true)}
              className={`px-4 py-2 rounded text-sm ${spectralMode ? "bg-blue-600" : "bg-gray-800 border border-gray-700"}`}>
              Spectral Depolarization
            </button>
          </div>

          <h3 className="text-sm font-semibold mb-2">Input Stokes Parameters</h3>
          {[
            { label: "S₀ (total intensity)", val: s0in, set: setS0in, step: 0.1 },
            { label: "S₁ (horizontal vs vertical)", val: s1in, set: setS1in, step: 0.1 },
            { label: "S₂ (+45° vs −45°)", val: s2in, set: setS2in, step: 0.1 },
            { label: "S₃ (RCP vs LCP)", val: s3in, set: setS3in, step: 0.1 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}

          {!spectralMode && (
            <>
            <div className="mb-3 mt-4">
              <ValidatedNumberInput label="Depolarization coefficient (0–1)" value={depCoeff} onChange={setDepCoeff} min={0} max={1} step="0.01" />
            </div>
            <div className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">Bandwidth (nm)</label>
              <input type="range" min={1} max={500} value={bandwidth}
                onChange={(e) => setBandwidth(parseFloat(e.target.value))}
                />
              <div className="text-center text-xs text-white">{bandwidth} nm</div>
            </div>
            </>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setS1in(1); setS2in(0); setS3in(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">H-Pol</button>
            <button onClick={() => { setS1in(0); setS2in(1); setS3in(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">+45°</button>
            <button onClick={() => { setS1in(0); setS2in(0); setS3in(1); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">RCP</button>
            <button onClick={() => { setS1in(0.577); setS2in(0.577); setS3in(0.577); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Unpol</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Output Stokes Vector</h2>
          <div className="space-y-1">
            <ResultRow label="S₀" value={results.s0.toFixed(4)} />
            <ResultRow label="S₁" value={results.s1.toFixed(4)} />
            <ResultRow label="S₂" value={results.s2.toFixed(4)} />
            <ResultRow label="S₃" value={results.s3.toFixed(4)} />
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400">Degree of Polarization</div>
            <div className="text-2xl font-bold">{(results.dop * 100).toFixed(2)}%</div>
          </div>
          {!spectralMode && (
            <div className="mt-4 text-xs text-gray-500">
              Mueller depolarizer: M = diag(1, {`${(1 - depCoeff).toFixed(3)}, ${(1 - depCoeff).toFixed(3)}, ${(1 - depCoeff).toFixed(3)}`})
            </div>
          )}
        </div>
      </div>

      {spectralMode && results.wavelengths.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
          <h2 className="text-lg font-semibold mb-4">Stokes Parameters vs Wavelength</h2>
          <ChartPanel data={[
            { x: results.wavelengths, y: results.s1vals, name: "S₁", type: "scatter", mode: "lines", line: { color: "#ef4444" } },
            { x: results.wavelengths, y: results.s2vals, name: "S₂", type: "scatter", mode: "lines", line: { color: "#22c55e" } },
            { x: results.wavelengths, y: results.s3vals, name: "S₃", type: "scatter", mode: "lines", line: { color: "#3b82f6" } },
          ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" } }} />
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>DoP = √(S₁² + S₂² + S₃²) / S₀</p>
          <p>M_dep = diag(1, 1−d, 1−d, 1−d) — diagonal depolarizer</p>
          <p>S_out = M_dep · S_in</p>
          <p>Spectral depol: S_avg = ⟨S(λ)⟩ over bandwidth</p>
          <p>Depolarization length: L_dep ∝ λ² / (Δn · Δλ)</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
