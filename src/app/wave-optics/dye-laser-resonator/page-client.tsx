"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";import ValidatedNumberInput from "../../../components/validated-number-input";

export default function DyeLaserResonatorPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 590); // nm (Rhodamine 6G peak)
  const [dyeName, setDyeName] = useState("Rhodamine 6G");
  const [cavityLength, setCavityLength] = useURLState("cavityLength", 150); // mm
  const [R1, setR1] = useURLState("R1", 100); // mm (HR)
  const [R2, setR2] = useURLState("R2", 100); // mm (OC)
  const [R_oc, setR_oc] = useURLState("R_oc", 0.85);
  const [flowSpeed, setFlowSpeed] = useURLState("flowSpeed", 5); // m/s
  const [concentration, setConcentration] = useURLState("concentration", 1e-4); // M
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 532); // nm

  const dyeParams: Record<string, { sigma_em: number; tau: number; sigma_abs_peak: number; lambda_max: number; quantum_yield: number }> = {
    "Rhodamine 6G": { sigma_em: 3e-20, tau: 3.5e-9, sigma_abs_peak: 4.5e-20, lambda_max: 590, quantum_yield: 0.95 },
    "Coumarin 540A": { sigma_em: 2e-20, tau: 3.0e-9, sigma_abs_peak: 3.5e-20, lambda_max: 540, quantum_yield: 0.5 },
    "Rhodamine B": { sigma_em: 2.5e-20, tau: 2.5e-9, sigma_abs_peak: 3.8e-20, lambda_max: 620, quantum_yield: 0.7 },
    "Stilbene 3": { sigma_em: 1.5e-20, tau: 1.0e-9, sigma_abs_peak: 2.5e-20, lambda_max: 420, quantum_yield: 0.4 },
  };

  const dp = dyeParams[dyeName] || dyeParams["Rhodamine 6G"];
  const h = 6.626e-34; const c = 3e8;
  const lambda_m = wavelength * 1e-9;
  const L_m = cavityLength / 1000;
  const R1m = R1 / 1000; const R2m = R2 / 1000;

  // Cavity stability
  const g1 = 1 - L_m / R1m;
  const g2 = 1 - L_m / R2m;
  const g1g2 = g1 * g2;
  const isStable = g1g2 > 0 && g1g2 < 1;

  // Beam waist
  let w0 = 0;
  if (isStable) {
    const numerator = lambda_m * L_m * Math.sqrt(g1 * g2 * (1 - g1 * g2));
    const denominator = Math.PI * Math.abs(g1 + g2 - 2 * g1 * g2);
    if (denominator > 0) w0 = Math.sqrt(numerator / denominator);
  }
  w0 = w0 || 50e-6;
  const beamWaist_um = w0 * 1e6;

  // Dye gain
  const N_A = 6.022e23;
  const dyeDensity = concentration * N_A * 1e3; // m^-3
  const smallSignalGain = dp.sigma_em * dyeDensity * dp.quantum_yield * 0.3; // reduced by triplet losses

  // Saturation intensity
  const Isat = h * c / (lambda_m * dp.sigma_em * dp.tau);

  // Losses
  const outputLoss = -Math.log(R_oc);
  const tripletLoss = 0.05; // typical additional loss from triplet absorption
  const totalLoss = outputLoss + tripletLoss + 0.01;

  // Threshold
  const g_th = totalLoss / (2 * L_m);
  const isAboveThreshold = smallSignalGain > g_th;

  // Output power
  const A_beam = Math.PI * w0 * w0;
  const P_out = isAboveThreshold ? Isat * A_beam * (2 * smallSignalGain * L_m - totalLoss) * outputLoss / totalLoss : 0;

  // Triplet buildup: rate ratio k_ISC / (k_ISC + k_flow)
  // k_flow = flowSpeed / L_char where L_char is the dye jet thickness
  const L_char = 0.1e-3; // m — dye jet thickness
  const k_flow = flowSpeed / L_char; // s⁻¹
  const tripletFraction = k_ISC / (k_ISC + k_flow);

  // Gain spectrum (simplified Gaussian)
  const spectrumData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => dp.lambda_max - 80 + i * 160 / 200);
    const gain = wls.map(wl => {
      const sigma = 25; // nm linewidth
      const g = dp.sigma_em * dyeDensity * dp.quantum_yield * 0.3 * Math.exp(-Math.pow(wl - dp.lambda_max, 2) / (2 * sigma * sigma));
      // Re-absorption
      const abs_factor = Math.exp(-dp.sigma_abs_peak * dyeDensity * 0.001 * Math.exp(-Math.pow(wl - (dp.lambda_max - 50), 2) / (2 * 30 * 30)));
      return g * abs_factor;
    });
    return [{ x: wls, y: gain, type: "scatter", mode: "lines", name: "Gain (m⁻¹)", line: { color: "#60a5fa", width: 2 } }];
  }, [dyeDensity, dp]);

  // Output vs pump (simplified linear model above threshold)
  const piData = useMemo(() => {
    const pumps = Array.from({ length: 100 }, (_, i) => i * 10 / 100); // W
    const slopeEff = isAboveThreshold && totalLoss > 0 ? outputLoss / totalLoss * dp.quantum_yield : 0;
    const Pth_W = isAboveThreshold ? 0 : 1; // arbitrary pump threshold for display
    return [
      { x: pumps, y: pumps.map(Pp => Pp > Pth_W ? slopeEff * (Pp - Pth_W) : 0), type: "scatter", mode: "lines", name: "Output (W)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [P_out, isAboveThreshold, outputLoss, totalLoss, dp]);

  // Triplet fraction vs flow speed (uses rate model)
  const tripletData = useMemo(() => {
    const speeds = Array.from({ length: 100 }, (_, i) => 0.1 + i * 15 / 100);
    const kISC = (1 - dp.quantum_yield) / dp.tau;
    const Lc = 0.1e-3; // m — dye jet thickness
    const tf = speeds.map(v => kISC / (kISC + v / Lc));
    return [{ x: speeds, y: tf.map(f => f * 100), type: "scatter", mode: "lines", name: "Triplet Fraction (%)", line: { color: "#f87171", width: 2 } }];
  }, [dp]);

  // Beam size in dye jet — waist position depends on g-parameters
  const beamSizeData = useMemo(() => {
    if (!isStable || w0 === 0) return [];
    const zR = Math.PI * w0 * w0 / lambda_m; // Rayleigh range (m)
    // Waist position from mirror 1: z1 = L·g2·(1-g1) / (g1+g2-2g1g2)
    const denom = g1 + g2 - 2 * g1 * g2;
    const z1 = denom !== 0 ? L_m * g2 * (1 - g1) / denom : L_m / 2;
    const zs = Array.from({ length: 200 }, (_, i) => i * L_m / 200);
    const ws = zs.map(z => {
      const dz = z - z1; // distance from waist
      return w0 * Math.sqrt(1 + (dz * dz) / (zR * zR)) * 1e6; // µm
    });
    return [{ x: zs.map(z => z * 1000), y: ws, type: "scatter", mode: "lines", name: "Beam radius (µm)", line: { color: "#a78bfa", width: 2 } }];
  }, [isStable, w0, lambda_m, L_m, g1, g2]);

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
          <label className="text-sm text-gray-400">Dye</label>
          <select className={inputStyle} value={dyeName} onChange={e => setDyeName(e.target.value)}>
            {Object.keys(dyeParams).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Wavelength (nm)</label><ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Cavity Length (mm)</label><ValidatedNumberInput label="Cavity Length (mm)" value={cavityLength} onChange={setCavityLength} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">R₁ (mm)</label><ValidatedNumberInput label="Cavity Length (mm)" value={R1} onChange={setR1} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">R₂ (mm)</label><ValidatedNumberInput label="R₁ (mm)" value={R2} onChange={setR2} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">OC Reflectivity</label><ValidatedNumberInput label="R₂ (mm)" value={R_oc} onChange={setR_oc} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Concentration (M)</label><ValidatedNumberInput label="Concentration (M)" value={concentration} onChange={setConcentration} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Flow Speed (m/s)</label><ValidatedNumberInput label="Flow Speed (m/s)" value={flowSpeed} onChange={setFlowSpeed} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Stable</div><div className="text-xl font-bold">{isStable ? "YES" : "NO"}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Beam Waist</div><div className="text-xl font-bold text-blue-400">{beamWaist_um.toFixed(0)} µm</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">g₀ (small signal)</div><div className="text-xl font-bold text-green-400">{(smallSignalGain * L_m).toFixed(3)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">g_th</div><div className="text-xl font-bold text-red-400">{g_th.toFixed(3)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">P_out</div><div className="text-xl font-bold text-yellow-400">{P_out.toFixed(3)} W</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>g₀ = σ_em · N_dye · Φ_f · f_triplet</p>
          <p>I_sat = hc / (λ · σ_em · τ)</p>
          <p>P_out = I_sat · A · (2g₀L - δ) · T_oc / δ</p>
          <p>k_ISC = (1 - Φ_f) / τ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Gain Spectrum</h3><ChartPanel data={spectrumData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "Gain (m⁻¹)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Beam Radius in Cavity</h3><ChartPanel data={beamSizeData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Position (mm)" }, yaxis: { ...plotLayout.yaxis, title: "Beam Radius (µm)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Triplet Fraction vs Flow Speed</h3><ChartPanel data={tripletData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Flow Speed (m/s)" }, yaxis: { ...plotLayout.yaxis, title: "Triplet (%)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Output vs Pump</h3><ChartPanel data={piData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump (W)" }, yaxis: { ...plotLayout.yaxis, title: "Output (W)" } }} /></div>
      </div>
    </div>
  );
}
