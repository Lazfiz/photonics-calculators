"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function FiberCouplerCalculator() {
  const [couplingLength, setCouplingLength] = useURLState("couplingLength", 10); // mm
  const [couplingCoeff, setCouplingCoeff] = useURLState("couplingCoeff", 0.5); // 1/mm
  const [excessLoss, setExcessLoss] = useURLState("excessLoss", 0.1); // dB
  const [inputPower, setInputPower] = useURLState("inputPower", 0); // dBm
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [type, setType] = useState<"directional" | "star">("directional");

  // Power splitting ratio for directional coupler
  const couplingRatio = useMemo(() => {
    const kappa = couplingCoeff;
    const L = couplingLength;
    const sinSq = Math.sin(kappa * L) ** 2;
    return sinSq; // fraction coupled to port 2
  }, [couplingCoeff, couplingLength]);

  // Excess loss in linear (input is dB)
  const lossLinear = Math.pow(10, -excessLoss / 10);

  const throughPower = useMemo(() => {
    return (1 - couplingRatio) * lossLinear; // linear
  }, [couplingRatio, lossLinear]);

  const coupledPower = useMemo(() => {
    return couplingRatio * lossLinear;
  }, [couplingRatio, lossLinear]);

  const throughPowerDbm = useMemo(() => {
    return inputPower + 10 * Math.log10(throughPower);
  }, [inputPower, throughPower]);

  const coupledPowerDbm = useMemo(() => {
    return inputPower + 10 * Math.log10(coupledPower);
  }, [inputPower, coupledPower]);

  const couplingLength5050 = useMemo(() => {
    // For 50:50 split: κL = π/4
    return Math.PI / (4 * couplingCoeff);
  }, [couplingCoeff]);

  // Transfer curve vs coupling length
  const transferCurve = useMemo(() => {
    const lengths: number[] = [];
    const through: number[] = [];
    const coupled: number[] = [];

    for (let l = 0; l <= 30; l += 0.05) {
      lengths.push(l);
      const sinSq = Math.sin(couplingCoeff * l) ** 2;
      through.push((1 - sinSq) * lossLinear);
      coupled.push(sinSq * lossLinear);
    }

    return [
      { x: lengths, y: through, type: "scatter" as const, mode: "lines" as const, name: "Through Port", line: { color: "#3b82f6", width: 2 } },
      { x: lengths, y: coupled, type: "scatter" as const, mode: "lines" as const, name: "Coupled Port", line: { color: "#ef4444", width: 2 } },
    ];
  }, [couplingCoeff, lossLinear]);

  // Spectral response (wavelength-dependent coupling)
  const spectralResponse = useMemo(() => {
    const wavelengths: number[] = [];
    const throughSpec: number[] = [];
    const coupledSpec: number[] = [];

    const kappa0 = couplingCoeff;
    const L = couplingLength;

    for (let w = 1500; w <= 1600; w += 0.5) {
      wavelengths.push(w);
      // Coupling coefficient varies with wavelength: κ(λ) ≈ κ₀ · (λ₀/λ)
      const kappa = kappa0 * (1550 / w);
      const sinSq = Math.sin(kappa * L) ** 2;
      throughSpec.push((1 - sinSq) * lossLinear);
      coupledSpec.push(sinSq * lossLinear);
    }

    return [
      { x: wavelengths, y: throughSpec, type: "scatter" as const, mode: "lines" as const, name: "Through Port", line: { color: "#3b82f6", width: 2 } },
      { x: wavelengths, y: coupledSpec, type: "scatter" as const, mode: "lines" as const, name: "Coupled Port", line: { color: "#ef4444", width: 2 } },
    ];
  }, [couplingCoeff, couplingLength, lossLinear]);

  const layout1 = {
    title: "Power Transfer vs Coupling Length",
    xaxis: { title: "Coupling Length (mm)", gridcolor: "#374151" },
    yaxis: { title: "Normalized Power", gridcolor: "#374151", range: [0, 1.05] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Spectral Response",
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Normalized Power", gridcolor: "#374151", range: [0, 1.05] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Coupler Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as "directional" | "star")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="directional">2×2 Directional Coupler</option>
                <option value="star">Star Coupler (N×M)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coupling Length (mm)</label>
              <ValidatedNumberInput label="Coupling Length (mm)" value={couplingLength} onChange={setCouplingLength} step="0.5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coupling Coefficient κ (1/mm)</label>
              <ValidatedNumberInput label="Coupling Coefficient κ (1/mm)" value={couplingCoeff} onChange={setCouplingCoeff} step="0.05" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Excess Loss (dB)</label>
              <ValidatedNumberInput label="Excess Loss (dB)" value={excessLoss} onChange={setExcessLoss} step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input Power (dBm)</label>
              <ValidatedNumberInput label="Input Power (dBm)" value={inputPower} onChange={setInputPower} step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Coupling ratio:</span><span className="font-mono text-lg">{(couplingRatio * 100).toFixed(1)}% / {(100 - couplingRatio * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Through port power:</span><span className="font-mono text-blue-400">{throughPowerDbm.toFixed(2)} dBm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupled port power:</span><span className="font-mono text-red-400">{coupledPowerDbm.toFixed(2)} dBm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total excess loss:</span><span className="font-mono">{excessLoss.toFixed(2)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Length for 50:50 split:</span><span className="font-mono text-green-400">{couplingLength5050.toFixed(2)} mm</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">P_coupled = P_in · sin²(κ·L) · 10^(-α/10)</p>
              <p className="font-mono text-sm mt-1">P_through = P_in · cos²(κ·L) · 10^(-α/10)</p>
              <p className="font-mono text-sm mt-1">L₅₀:₅₀ = π / (4κ)</p>
              <p className="font-mono text-sm mt-1">κ(λ) ≈ κ₀ · (λ₀/λ)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={transferCurve} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={spectralResponse} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
