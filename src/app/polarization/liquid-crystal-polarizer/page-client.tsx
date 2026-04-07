"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function LiquidCrystalPolarizerPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 550);
  const [neNo, setNeNo] = useURLState("neNo", 0.2); // Δn = ne - no
  const [cellThickness, setCellThickness] = useURLState("cellThickness", 5); // μm
  const [twistAngle, setTwistAngle] = useURLState("twistAngle", 90);
  const [preTiltDeg, setPreTiltDeg] = useURLState("preTiltDeg", 2);
  const [mode, setMode] = useState<"tn" | "stn" | "van" | "ecb">("tn");

  const preTilt = preTiltDeg * Math.PI / 180;
  const twistRad = twistAngle * Math.PI / 180;
  const d = cellThickness * 1e-6;
  const lambda = wavelength * 1e-9;
  const delta = (2 * Math.PI * neNo * d) / lambda;

  // TN mode: Gooch-Tarry condition
  // T = sin²(π/2 √(1 + u²)) / (1 + u²), u = 2Δnd/(λ√(1 + α²))
  const alpha = preTilt;
  const uTN = (2 * neNo * d) / (lambda * Math.sqrt(1 + (twistAngle * Math.PI / (2 * Math.PI)) ** 2));
  const ttn = Math.sin(Math.PI / 2 * Math.sqrt(1 + uTN ** 2)) ** 2 / (1 + uTN ** 2);

  // VAN (VA) mode: T = sin²(δ/2) · sin²(2φ)
  // At normal incidence with no voltage: LC aligned homeotropically, T ≈ 0
  // With voltage: director tilts, T increases
  const tVAzeroV = 0.02; // dark state leakage
  const tVAmax = Math.min(1, Math.sin(delta / 2) ** 2);

  // ECB mode
  const tECB = Math.sin(delta / 2) ** 2;

  // STN mode: dΔn/λ typically 0.8-1.2, twist 180-270°
  const uSTN = (2 * neNo * d) / lambda;
  const tSTN = Math.sin(Math.PI / 2 * Math.sqrt(1 + (uSTN * Math.sin(twistRad / 2)) ** 2)) ** 2 /
    (1 + (uSTN * Math.sin(twistRad / 2)) ** 2);

  const trans = mode === "tn" ? ttn : mode === "stn" ? tSTN : mode === "van" ? tVAmax : tECB;

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 380 + (i / 300) * 420);
    const Tvals = wls.map(w => {
      const l = w * 1e-9;
      const dlt = (2 * Math.PI * neNo * d) / l;
      if (mode === "tn") {
        const u = (2 * neNo * d) / (l * Math.sqrt(1 + (twistAngle * Math.PI / (2 * Math.PI)) ** 2));
        return Math.sin(Math.PI / 2 * Math.sqrt(1 + u ** 2)) ** 2 / (1 + u ** 2);
      } else if (mode === "stn") {
        const u = (2 * neNo * d) / l;
        return Math.sin(Math.PI / 2 * Math.sqrt(1 + (u * Math.sin(twistRad / 2)) ** 2)) ** 2 /
          (1 + (u * Math.sin(twistRad / 2)) ** 2);
      } else if (mode === "van") {
        return Math.min(1, Math.sin(dlt / 2) ** 2);
      } else {
        return Math.sin(dlt / 2) ** 2;
      }
    });
    return [
      { x: wls, y: Tvals, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [neNo, d, mode, twistAngle, twistRad]);

  const thicknessData = useMemo(() => {
    const ths = Array.from({ length: 200 }, (_, i) => 1 + (i / 200) * 15);
    const Tvals = ths.map(t => {
      const dd = t * 1e-6;
      const dlt = (2 * Math.PI * neNo * dd) / lambda;
      if (mode === "tn") {
        const u = (2 * neNo * dd) / (lambda * Math.sqrt(1 + (twistAngle * Math.PI / (2 * Math.PI)) ** 2));
        return Math.sin(Math.PI / 2 * Math.sqrt(1 + u ** 2)) ** 2 / (1 + u ** 2);
      } else if (mode === "stn") {
        const u = (2 * neNo * dd) / lambda;
        return Math.sin(Math.PI / 2 * Math.sqrt(1 + (u * Math.sin(twistRad / 2)) ** 2)) ** 2 /
          (1 + (u * Math.sin(twistRad / 2)) ** 2);
      } else if (mode === "van") {
        return Math.min(1, Math.sin(dlt / 2) ** 2);
      } else {
        return Math.sin(dlt / 2) ** 2;
      }
    });
    return [
      { x: ths, y: Tvals, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#f87171", width: 2 } },
    ];
  }, [neNo, lambda, mode, twistAngle, twistRad]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Liquid Crystal Polarizer" description="Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">δ = 2π Δn d / λ, T<sub>TN</sub> = sin²(½π√(1+u²)) / (1+u²)</p>
        <p className="text-gray-300 text-sm font-mono">u = 2Δnd / (λ·√(1 + (φ/2π)²)), T<sub>ECB</sub> = sin²(δ/2)</p>
      </div>

      <div className="flex gap-4 mb-6">
        {(["tn", "stn", "van", "ecb"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`text-sm px-4 py-2 rounded ${mode === m ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
            {m === "tn" ? "TN (90°)" : m === "stn" ? "STN" : m === "van" ? "VA" : "ECB"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={380} max={780} step="10" />
        <ValidatedNumberInput label="Δn (birefringence)" value={neNo} onChange={setNeNo} min={0.01} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Cell Thickness (μm)" value={cellThickness} onChange={setCellThickness} min={1} max={20} step="0.5" />
        <ValidatedNumberInput label="Twist Angle (°)" value={twistAngle} onChange={setTwistAngle} min={0} max={270} step="10" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNeNo(0.076); setCellThickness(5); setTwistAngle(90); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">5CB (TN)</button>
        <button onClick={() => { setNeNo(0.14); setCellThickness(4); setTwistAngle(240); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">STN Typical</button>
        <button onClick={() => { setNeNo(0.12); setCellThickness(3.5); setTwistAngle(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">VA Typical</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Phase Retardation δ</p>
          <p className="text-2xl font-bold text-blue-400">{delta.toFixed(2)} rad</p>
          <p className="text-xs text-gray-500">{(delta / Math.PI).toFixed(2)}π</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">dΔn/λ</p>
          <p className="text-2xl font-bold text-green-400">{(neNo * cellThickness / wavelength).toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmission</p>
          <p className="text-2xl font-bold text-yellow-400">{(trans * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Mode</p>
          <p className="text-2xl font-bold text-purple-400">{mode.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Spectral Transmission</h3>
          <ChartPanel data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Transmission vs Cell Thickness</h3>
          <ChartPanel data={thicknessData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Thickness (μm)", gridcolor: "#374151" },
            yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 300,
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
