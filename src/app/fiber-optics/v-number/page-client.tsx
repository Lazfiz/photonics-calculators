"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
export default function VNumberCalculator() {
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [inputMode, setInputMode] = useState<"na" | "indices">("na");
  const [na, setNa] = useURLState("na", 0.12);
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463);

  // Calculate NA from indices if in that mode
  const effectiveNA = useMemo(() => {
    if (inputMode === "na") return na;
    return Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  }, [inputMode, na, coreIndex, claddingIndex]);

  // Calculate V-number
  const vNumber = useMemo(() => {
    const a = coreRadius * 1e-6; // Convert to meters
    const lambda = wavelength * 1e-9; // Convert to meters
    return (2 * Math.PI * a * effectiveNA) / lambda;
  }, [coreRadius, wavelength, effectiveNA]);

  // Number of modes (step-index fiber approximation)
  const numModes = useMemo(() => {
    return Math.floor((vNumber ** 2) / 2);
  }, [vNumber]);

  // Single-mode condition
  const isSingleMode = vNumber < 2.405;

  // Generate plot data: V vs wavelength
  const plotData = useMemo(() => {
    const wavelengths: number[] = [];
    const vValues: number[] = [];
    const a = coreRadius * 1e-6;
    
    for (let w = 600; w <= 2000; w += 10) {
      const lambda = w * 1e-9;
      const v = (2 * Math.PI * a * effectiveNA) / lambda;
      wavelengths.push(w);
      vValues.push(v);
    }
    
    return {
      x: wavelengths,
      y: vValues,
      type: "scatter" as const,
      mode: "lines" as const,
      name: "V-number",
      line: { color: "#3b82f6", width: 2 },
    };
  }, [coreRadius, effectiveNA]);

  // Single-mode cutoff line
  const cutoffLine = {
    x: [600, 2000],
    y: [2.405, 2.405],
    type: "scatter" as const,
    mode: "lines" as const,
    name: "Single-mode cutoff (V=2.405)",
    line: { color: "#ef4444", width: 2, dash: "dash" as const },
  };

  // Current wavelength marker
  const currentMarker = {
    x: [wavelength],
    y: [vNumber],
    type: "scatter" as const,
    mode: "markers" as const,
    name: "Current",
    marker: { color: "#22c55e", size: 12 },
  };

  const layout = {
    title: "V-Number vs Wavelength",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "V-Number", gridcolor: "#374151" },
    paper_bgcolor: "#111827",
    plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" },
    showlegend: true,
    legend: { x: 0.6, y: 0.95 },
    height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">

                
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Core Radius (μm)</label>
              <input
                type="number"
                value={coreRadius}
                onChange={(e) => setCoreRadius(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="0.1"
                min="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <input
                type="number"
                value={wavelength}
                onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                step="1"
                min="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Input Mode</label>
              <select
                value={inputMode}
                onChange={(e) => setInputMode(e.target.value as "na" | "indices")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="na">Numerical Aperture</option>
                <option value="indices">Core/Cladding Indices</option>
              </select>
            </div>

            {inputMode === "na" ? (
              <div>
                <label className="block text-sm font-medium mb-2">Numerical Aperture (NA)</label>
                <input
                  type="number"
                  value={na}
                  onChange={(e) => setNa(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                  step="0.001"
                  min="0.01"
                  max="1"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Core Refractive Index (n₁)</label>
                  <input
                    type="number"
                    value={coreIndex}
                    onChange={(e) => setCoreIndex(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                    step="0.0001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cladding Refractive Index (n₂)</label>
                  <input
                    type="number"
                    value={claddingIndex}
                    onChange={(e) => setCladdingIndex(Number(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none"
                    step="0.0001"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Effective NA:</span>
                  <span className="font-mono">{effectiveNA.toFixed(4)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">V-Number:</span>
                  <span className={`font-mono text-lg ${isSingleMode ? "text-green-400" : "text-yellow-400"}`}>
                    {vNumber.toFixed(3)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Number of Modes:</span>
                  <span className="font-mono">{numModes}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <div className={`flex items-center gap-2 ${isSingleMode ? "text-green-400" : "text-yellow-400"}`}>
                    <span className="text-2xl">{isSingleMode ? "✓" : "⚠"}</span>
                    <span className="font-medium">
                      {isSingleMode ? "Single-mode operation" : "Multi-mode operation"}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {isSingleMode
                      ? "V &lt; 2.405: Only fundamental mode propagates"
                      : "V ≥ 2.405: Multiple modes can propagate"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formula</h3>
              <p className="font-mono text-sm">
                V = (2π · a · NA) / λ
              </p>
              <p className="font-mono text-sm mt-1">
                M ≈ V² / 2 (step-index)
              </p>
            </div>
          </div>
        </div>

        {/* Plot Section */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={[plotData, cutoffLine, currentMarker]}
            layout={layout}
           
           
          />
        </div>
      </div>
    </div>
  );
}
