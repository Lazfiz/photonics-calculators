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

export default function DegreeOfPolarizationPage() {
  const [s0, setS0] = useURLState("s0", 1);
  const [s1, setS1] = useURLState("s1", 0.8);
  const [s2, setS2] = useURLState("s2", 0.3);
  const [s3, setS3] = useURLState("s3", 0.2);

  const [spectralMode, setSpectralMode] = useState(false);
  const [centerWl, setCenterWl] = useURLState("centerWl", 550);
  const [bandwidth, setBandwidth] = useURLState("bandwidth", 100);
  const [retardance, setRetardance] = useURLState("retardance", 5); // waves at center

  const results = useMemo(() => {
    const polIntensity = Math.sqrt(s1 ** 2 + s2 ** 2 + s3 ** 2);
    const unpolIntensity = s0 - polIntensity;
    const dop = polIntensity / s0;
    const dopPercent = dop * 100;
    const orientation = 0.5 * Math.atan2(s2, s1) * 180 / Math.PI;
    const ellipticityAngle = 0.5 * Math.asin(s3 / polIntensity) * 180 / Math.PI;
    const ellipticity = Math.tan(ellipticityAngle * Math.PI / 180);

    // Poincaré coordinates
    const s1norm = s1 / s0;
    const s2norm = s2 / s0;
    const s3norm = s3 / s0;

    return { polIntensity, unpolIntensity, dop, dopPercent, orientation, ellipticityAngle, ellipticity, s1norm, s2norm, s3norm };
  }, [s0, s1, s2, s3]);

  const spectralData = useMemo(() => {
    if (!spectralMode) return null;
    const N = 100;
    const wls: number[] = [];
    const dopVals: number[] = [];
    const s1Vals: number[] = [];
    const s2Vals: number[] = [];
    const s3Vals: number[] = [];

    for (let i = 0; i < N; i++) {
      const wl = (centerWl - bandwidth / 2) + (bandwidth * i) / (N - 1);
      wls.push(wl);
      const delta = 2 * Math.PI * retardance * (centerWl / wl - 1);
      const localS1 = s1 * Math.cos(delta) - s3 * Math.sin(delta);
      const localS2 = s2;
      const localS3 = s1 * Math.sin(delta) + s3 * Math.cos(delta);
      s1Vals.push(localS1);
      s2Vals.push(localS2);
      s3Vals.push(localS3);
      dopVals.push(Math.sqrt(localS1 ** 2 + localS2 ** 2 + localS3 ** 2) / s0);
    }

    // Spectrally averaged DoP
    const avgS1 = s1Vals.reduce((a, b) => a + b, 0) / N;
    const avgS2 = s2Vals.reduce((a, b) => a + b, 0) / N;
    const avgS3 = s3Vals.reduce((a, b) => a + b, 0) / N;
    const avgDop = Math.sqrt(avgS1 ** 2 + avgS2 ** 2 + avgS3 ** 2) / s0;

    return { wls, dopVals, s1Vals, s2Vals, s3Vals, avgDop };
  }, [spectralMode, centerWl, bandwidth, retardance, s0, s1, s2, s3]);

  // Generate Poincaré sphere trace
  const poincareTrace = useMemo(() => {
    const theta = Math.atan2(s2, s1);
    const phi = Math.asin(s3 / Math.sqrt(s1 ** 2 + s2 ** 2 + s3 ** 2));
    return { theta: theta * 180 / Math.PI, phi: phi * 180 / Math.PI };
  }, [s1, s2, s3]);

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
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Degree of Polarization" description="Calculate DoP from Stokes parameters, decompose into polarized and unpolarized components.">
            
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Parameters</h2>
          {[
            { label: "S₀ (total intensity)", val: s0, set: setS0, step: 0.1 },
            { label: "S₁ (H − V)", val: s1, set: setS1, step: 0.01 },
            { label: "S₂ (+45° − −45°)", val: s2, set: setS2, step: 0.01 },
            { label: "S₃ (RCP − LCP)", val: s3, set: setS3, step: 0.01 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <ValidatedNumberInput label="{label}" value={val} onChange={set} />
            </div>
          ))}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setS0(1); setS1(1); setS2(0); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">H-Pol</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(1); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">+45°</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(1); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">RCP</button>
            <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Unpol</button>
            <button onClick={() => { setS0(1); setS1(0.577); setS2(0.577); setS3(0.577); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">33% DoP</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-1">
            <ResultRow label="Degree of Polarization" value={`${results.dopPercent.toFixed(2)}%`} />
            <ResultRow label="Polarized intensity" value={results.polIntensity.toFixed(4)} />
            <ResultRow label="Unpolarized intensity" value={results.unpolIntensity.toFixed(4)} />
            <ResultRow label="Orientation angle (ψ)" value={`${results.orientation.toFixed(2)}°`} />
            <ResultRow label="Ellipticity angle (χ)" value={`${results.ellipticityAngle.toFixed(2)}°`} />
            <ResultRow label="Ellipticity (e)" value={results.ellipticity.toFixed(4)} />
            <ResultRow label="S₁/S₀" value={results.s1norm.toFixed(4)} />
            <ResultRow label="S₂/S₀" value={results.s2norm.toFixed(4)} />
            <ResultRow label="S₃/S₀" value={results.s3norm.toFixed(4)} />
          </div>
          <div className="mt-4 p-3 bg-gray-800 rounded-lg text-center">
            <div className="text-sm text-gray-400">DoP</div>
            <div className={`text-3xl font-bold ${results.dop > 0.9 ? "text-green-400" : results.dop > 0.5 ? "text-yellow-400" : "text-red-400"}`}>
              {(results.dop * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Decomposition</h2>
          <div className="relative w-48 h-48 mx-auto">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Outer circle - total */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="#4b5563" strokeWidth="2" />
              <text x="100" y="20" textAnchor="middle" fill="#9ca3af" fontSize="10">S₀ = {s0.toFixed(2)}</text>
              {/* Polarized portion */}
              <circle cx="100" cy="100" r={results.dop * 80} fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="2" />
              {/* Unpolarized portion */}
              <text x="100" y="105" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                {(results.dop * 100).toFixed(0)}%
              </text>
              <text x="100" y="120" textAnchor="middle" fill="#9ca3af" fontSize="9">polarized</text>
            </svg>
          </div>
        </div>
      </div>

      {spectralMode && spectralData && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Spectral DoP Analysis</h2>
            <div className="flex gap-2">
              <ValidatedNumberInput label="centerWl" value={centerWl} onChange={setCenterWl} />
              <span className="text-sm text-gray-400 self-center">nm ±</span>
              <ValidatedNumberInput label="nm ±" value={bandwidth} onChange={setBandwidth} />
              <span className="text-sm text-gray-400 self-center">nm, {retardance} waves</span>
            </div>
          </div>
          <ChartPanel data={[
            { x: spectralData.wls, y: spectralData.dopVals, name: "DoP", type: "scatter", mode: "lines", line: { color: "#f59e0b", width: 2 } },
          ]} layout={{ ...plotLayout, height: 250, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "DoP", range: [0, 1.05] } }} />
          <div className="mt-2 text-sm text-gray-400">
            Spectrally averaged DoP: <span className="text-white font-bold">{(spectralData.avgDop * 100).toFixed(2)}%</span>
          </div>
        </div>
      )}

      {!spectralMode && (
        <button onClick={() => setSpectralMode(true)} className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:border-blue-500">
          Show Spectral Analysis →
        </button>
      )}
      {spectralMode && (
        <button onClick={() => setSpectralMode(false)} className="mt-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm hover:border-blue-500">
          ← Hide Spectral Analysis
        </button>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>DoP = √(S₁² + S₂² + S₃²) / S₀</p>
          <p>I_pol = √(S₁² + S₂² + S₃²) &nbsp; I_unpol = S₀ − I_pol</p>
          <p>Orientation: ψ = ½ · atan2(S₂, S₁)</p>
          <p>Ellipticity angle: χ = ½ · asin(S₃ / I_pol)</p>
          <p>Ellipticity: e = tan(χ)</p>
          <p>Spectral DoP: DoP_avg = √(⟨S₁⟩² + ⟨S₂⟩² + ⟨S₃⟩²) / S₀</p>
        </div>
      </div>
    </CalculatorShell>
  );
}
