"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function PhotonicCrystalFiberCalculator() {
  const [pitch, setPitch] = useURLState("pitch", 4.5); // μm (Λ)
  const [holeDiameter, setHoleDiameter] = useURLState("holeDiameter", 2.7); // μm (d)
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm

  // d/Λ ratio
  const dOverLambda = holeDiameter / pitch;

  // V-number for PCF (approximate using effective NA)
  const effectiveNA = useMemo(() => {
    // Approximate NA for PCF
    const lambda = wavelength * 1e-3; // nm to μm
    return Math.sqrt(1 - Math.exp(-(((2 * Math.PI * holeDiameter / 2) / lambda) ** 2 * Math.log(2))));
  }, [holeDiameter, wavelength]);

  const vNumber = useMemo(() => {
    const a = pitch; // effective core radius ~ pitch for PCF
    const lambda = wavelength * 1e-3; // to μm
    return (2 * Math.PI * a * effectiveNA) / lambda;
  }, [pitch, effectiveNA, wavelength]);

  // Endlessly single-mode condition: d/Λ < 0.45 (approximately)
  const isEndlesslySM = dOverLambda < 0.45;

  // Effective mode area (approximate — decreases with higher d/Λ)
  const effectiveModeArea = useMemo(() => {
    const lambda = wavelength * 1e-3;
    // Base mode field radius (Marcuse-like), then shrink with air fraction
    const w0 = pitch * (0.65 + 0.434 * (lambda / (2 * pitch)) ** 1.5 + 0.0147 * (lambda / (2 * pitch)) ** 6);
    // Higher d/Λ → tighter confinement → smaller mode
    const confinementFactor = Math.exp(-1.5 * dOverLambda);
    const w = w0 * confinementFactor;
    return Math.PI * w ** 2;
  }, [pitch, wavelength, dOverLambda]);

  // Dispersion (approximate for PCF)
  const dispersion = useMemo(() => {
    // Simplified: anomalous dispersion for small-core PCF
    const lambda = wavelength * 1e-9;
    const d = holeDiameter * 1e-6;
    const L = pitch * 1e-6;
    // Rough model
    const D = -120 * (d / L) ** 2 / (wavelength / 1000) ** 3;
    return D;
  }, [holeDiameter, pitch, wavelength]);

  // Confinement loss estimate (dB/km) - very rough
  const confinementLoss = useMemo(() => {
    // Simplified model: decreases exponentially with d/Λ
    const loss = 1e4 * Math.exp(-20 * dOverLambda);
    return loss;
  }, [dOverLambda]);

  // Plot: effective mode area vs d/Λ ratio
  const plotData = useMemo(() => {
    const ratios: number[] = [];
    const areas: number[] = [];
    const nas: number[] = [];

    for (let r = 0.1; r <= 0.95; r += 0.01) {
      ratios.push(r);
      const d = r * pitch;
      const lambda = wavelength * 1e-3;
      const na = Math.sqrt(1 - Math.exp(-(((2 * Math.PI * d / 2) / lambda) ** 2 * Math.log(2))));
      nas.push(na);
      const w0 = pitch * (0.65 + 0.434 * (lambda / (2 * pitch)) ** 1.5 + 0.0147 * (lambda / (2 * pitch)) ** 6);
      const confinementFactor = Math.exp(-1.5 * r);
      const w = w0 * confinementFactor;
      areas.push(Math.PI * w ** 2);
    }

    return [
      {
        x: ratios, y: areas, type: "scatter" as const, mode: "lines" as const,
        name: "A_eff", line: { color: "#3b82f6", width: 2 }, yaxis: "y",
      },
      {
        x: ratios, y: nas, type: "scatter" as const, mode: "lines" as const,
        name: "NA", line: { color: "#f59e0b", width: 2 }, yaxis: "y2",
      },
      {
        x: [dOverLambda], y: [effectiveModeArea], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 }, yaxis: "y",
      },
    ];
  }, [pitch, wavelength, dOverLambda, effectiveModeArea]);

  const layout = {
    title: "PCF Properties vs d/Λ Ratio",
    xaxis: { title: "d/Λ Ratio", gridcolor: "#374151" },
    yaxis: { title: "Effective Mode Area (μm²)", gridcolor: "#374151", side: "left" as const },
    yaxis2: { title: "NA", gridcolor: "#374151", overlaying: "y" as const, side: "right" as const },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Pitch Λ (μm)</label>
              <ValidatedNumberInput label="Pitch Λ (μm)" value={pitch} onChange={setPitch} min={0.5} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Hole Diameter d (μm)</label>
              <ValidatedNumberInput label="Hole Diameter d (μm)" value={holeDiameter} onChange={setHoleDiameter} min={0.1} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">d/Λ ratio:</span><span className="font-mono">{dOverLambda.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Effective NA:</span><span className="font-mono">{effectiveNA.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">V-number:</span><span className="font-mono">{vNumber.toFixed(3)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Mode area A_eff:</span><span className="font-mono text-blue-400">{effectiveModeArea.toFixed(1)} μm²</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Dispersion:</span><span className="font-mono">{dispersion.toFixed(1)} ps/(nm·km) <span className="text-xs text-gray-500">(anom. PCF approx)</span></span></div>
                <div className="flex justify-between"><span className="text-gray-400">Confinement loss:</span><span className="font-mono">{confinementLoss < 0.01 ? "< 0.01" : confinementLoss.toFixed(2)} dB/km</span></div>
                <div className="pt-3 border-t border-gray-700">
                  <div className={`flex items-center gap-2 ${isEndlesslySM ? "text-green-400" : "text-yellow-400"}`}>
                    <span className="text-2xl">{isEndlesslySM ? "✓" : "⚠"}</span>
                    <span className="font-medium">{isEndlesslySM ? "Endlessly single-mode" : "Multi-mode regime"}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">Endlessly SM when d/Λ &lt; ~0.45</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">NA ≈ √(1 - exp(-(πd/λ)² · ln2))</p>
              <p className="font-mono text-sm mt-1">V = 2πΛ · NA / λ</p>
              <p className="font-mono text-sm mt-1">A_eff = π · w² (approx)</p>
              <p className="font-mono text-sm mt-1">Endlessly SM: d/Λ &lt; 0.45</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
