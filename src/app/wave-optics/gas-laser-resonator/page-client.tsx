"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function GasLaserResonatorPage() {
  const [tubeDiameter, setTubeDiameter] = useState(6); // mm
  const [tubeLength, setTubeLength] = useState(500); // mm
  const [wavelength, setWavelength] = useState(632.8); // nm (HeNe default)
  const [R1, setR1] = useState(1000); // mm HR
  const [R2, setR2] = useState(5000); // mm OC (high radius = low output coupling)
  const [R_oc, setR_oc] = useState(0.99); // OC reflectivity
  const [pressure, setPressure] = useState(3); // Torr
  const [gasType, setGasType] = useState("HeNe");

  const gasParams: Record<string, { sigma: number; tau: number; I_sat: number; A_gain: number; alpha: number }> = {
    HeNe: { sigma: 3e-17, tau: 100e-9, I_sat: 4.5, A_gain: 5e-5, alpha: 0.0005 },
    CO2: { sigma: 1.5e-22, tau: 1e-3, I_sat: 50, A_gain: 0.01, alpha: 0.005 },
    ArIon: { sigma: 2.5e-16, tau: 5e-9, I_sat: 500, A_gain: 0.002, alpha: 0.01 },
  };

  const params = gasParams[gasType] || gasParams.HeNe;
  const h = 6.626e-34; const c = 3e8;
  const lambda_m = wavelength * 1e-9;
  const L_m = tubeLength / 1000;
  const L_cm = tubeLength / 10;
  const R1m = R1 / 1000; const R2m = R2 / 1000;

  // Stability
  const g1 = 1 - L_m / R1m;
  const g2 = 1 - L_m / R2m;
  const g1g2 = g1 * g2;
  const isStable = g1g2 > 0 && g1g2 < 1;

  // Fresnel number
  const Fresnel = Math.pow(tubeDiameter / 2 * 1e-3, 2) / (lambda_m * L_m);

  // Beam waist (TEM00)
  let w0 = 0;
  if (isStable && R1m !== R2m) {
    const term = Math.pow(g1 + g2 - 2 * g1 * g2, 2) - 4 * g1 * g2 * (g1 * g2 - 1);
    if (term > 0) {
      w0 = Math.pow(lambda_m * L_m / Math.PI, 0.5) * Math.pow(g1 * g2 * (1 - g1 * g2) / Math.pow(g1 + g2 - 2 * g1 * g2, 2), 0.25);
    }
  } else if (Math.abs(R1m - R2m) < 1e-9) {
    w0 = Math.pow(lambda_m * L_m / Math.PI * Math.sqrt(g1 * (1 - g1)), 0.25);
  }
  w0 = w0 || 0.3e-3;
  const beamWaist_um = w0 * 1e6;

  // Gain
  const smallSignalGain = params.A_gain * Math.sqrt(pressure / 3);
  const outputCouplingLoss = -Math.log(R_oc);
  const internalLoss = params.alpha * L_cm;
  const totalLoss = outputCouplingLoss + internalLoss;

  // Threshold
  const g_th = totalLoss / (2 * L_m);
  const isAboveThreshold = smallSignalGain > g_th;

  // Saturation
  const Isat = params.I_sat * 1e4; // W/m²
  const A_beam = Math.PI * w0 * w0;

  // Output power
  const P_out = isAboveThreshold ? Isat * A_beam * (smallSignalGain * 2 * L_m - totalLoss) * outputCouplingLoss / totalLoss : 0;

  // Optimal OC reflectivity
  const R_opt = Math.exp(-2 * smallSignalGain * L_m - internalLoss + Math.sqrt(2 * smallSignalGain * L_m * internalLoss));

  // Gain saturation curve
  const saturationData = useMemo(() => {
    const gains = Array.from({ length: 100 }, (_, i) => i * 10 / 100); // m^-1
    const P = gains.map(g => {
      const gL = g * L_m;
      if (gL <= totalLoss / 2) return 0;
      return Isat * A_beam * (2 * gL - totalLoss) * outputCouplingLoss / totalLoss;
    });
    return [
      { x: gains, y: P, type: "scatter", mode: "lines", name: "P_out (W)", line: { color: "#60a5fa", width: 2 } },
      { x: gains, y: gains.map(() => g_th), type: "scatter", mode: "lines", name: "g_th", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [totalLoss, L_m, Isat, A_beam, outputCouplingLoss, g_th]);

  // Optimal OC vs gain
  const optRData = useMemo(() => {
    const gains = Array.from({ length: 100 }, (_, i) => 0.5 + i * 15 / 100);
    const Rs = gains.map(g => {
      const gL = g * L_m;
      const val = -2 * gL - internalLoss + Math.sqrt(Math.max(0, 2 * gL * internalLoss));
      return Math.exp(val);
    });
    return [{ x: gains, y: Rs, type: "scatter", mode: "lines", name: "R_opt", line: { color: "#34d399", width: 2 } }];
  }, [L_m, internalLoss]);

  // P_out vs OC reflectivity
  const poutVsR = useMemo(() => {
    const Rs = Array.from({ length: 100 }, (_, i) => 0.5 + i * 0.5 / 100);
    const P = Rs.map(r => {
      const ocLoss = -Math.log(r);
      const tLoss = ocLoss + internalLoss;
      const gL = smallSignalGain * L_m;
      if (2 * gL <= tLoss) return 0;
      return Isat * A_beam * (2 * gL - tLoss) * ocLoss / tLoss;
    });
    return [{ x: Rs, y: P, type: "scatter", mode: "lines", name: "P_out", line: { color: "#a78bfa", width: 2 } }];
  }, [smallSignalGain, L_m, Isat, A_beam, internalLoss]);

  const plotLayout: any = {
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937", font: { color: "#e5e7eb" },
    xaxis: { gridcolor: "#374151" }, yaxis: { gridcolor: "#374151" },
    margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { orientation: "h", y: -0.25 },
  };
  const inputStyle = "bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
      </div>
            
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Gas Type</label>
          <select className={inputStyle} value={gasType} onChange={e => setGasType(e.target.value)}>
            <option value="HeNe">HeNe (632.8 nm)</option>
            <option value="CO2">CO₂ (10.6 µm)</option>
            <option value="ArIon">Ar⁺ (488/514 nm)</option>
          </select>
        </div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Tube Diameter (mm)</label><input type="number" className={inputStyle} value={tubeDiameter} onChange={e => setTubeDiameter(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Tube Length (mm)</label><input type="number" className={inputStyle} value={tubeLength} onChange={e => setTubeLength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Wavelength (nm)</label><input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} step={0.1} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">R₁ HR (mm)</label><input type="number" className={inputStyle} value={R1} onChange={e => setR1(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">R₂ OC (mm)</label><input type="number" className={inputStyle} value={R2} onChange={e => setR2(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">OC Reflectivity</label><input type="number" className={inputStyle} value={R_oc} onChange={e => setR_oc(+e.target.value)} step={0.001} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Pressure (Torr)</label><input type="number" className={inputStyle} value={pressure} onChange={e => setPressure(+e.target.value)} step={0.5} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">g₁g₂</div><div className="text-xl font-bold">{g1g2.toFixed(4)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Beam Waist</div><div className="text-xl font-bold text-blue-400">{beamWaist_um.toFixed(0)} µm</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Fresnel #</div><div className="text-xl font-bold text-green-400">{Fresnel.toFixed(2)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">R_opt</div><div className="text-xl font-bold text-yellow-400">{Math.min(1, R_opt).toFixed(4)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">P_out</div><div className="text-xl font-bold text-purple-400">{P_out.toFixed(3)} W</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>P_out = I_sat · A · (2gL - δ) · T_oc / δ</p>
          <p>R_opt = exp(-2gL - δ_i + √(2gL·δ_i))</p>
          <p>g_th = δ_total / (2L)</p>
          <p>F = a² / (λL)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Output Power vs Gain</h3><ChartPanel data={saturationData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Gain (m⁻¹)" }, yaxis: { ...plotLayout.yaxis, title: "P_out (W)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">P_out vs OC Reflectivity</h3><ChartPanel data={poutVsR} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "R_oc" }, yaxis: { ...plotLayout.yaxis, title: "P_out (W)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4 md:col-span-2"><h3 className="font-semibold mb-2">Optimal OC vs Small-Signal Gain</h3><ChartPanel data={optRData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "g₀ (m⁻¹)" }, yaxis: { ...plotLayout.yaxis, title: "R_opt" } }} /></div>
      </div>
    </div>
  );
}
