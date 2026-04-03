"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ThinDiskLaserPage() {
  const [diskThickness, setDiskThickness] = useState(200); // µm
  const [diskDiameter, setDiskDiameter] = useState(10); // mm
  const [wavelength, setWavelength] = useState(1030); // nm
  const [numPasses, setNumPasses] = useState(16);
  const [pumpSpotDiameter, setPumpSpotDiameter] = useState(3); // mm
  const [R_oc, setR_oc] = useState(0.97);
  const [alpha_disk, setAlpha_disk] = useState(0.01); // cm^-1
  const [pumpWavelength, setPumpWavelength] = useState(940); // nm
  const [Yb_concentration, setYb_concentration] = useState(10); // at.%
  const [T_disk, setT_disk] = useState(25); // °C surface temp rise

  const diskThick_cm = diskThickness * 1e-4;
  const pumpArea = Math.PI * Math.pow(pumpSpotDiameter / 2 * 1e-3, 2);
  const diskArea = Math.PI * Math.pow(diskDiameter / 2 * 1e-3, 2);

  // Absorption per pass (Bouguer-Lambert)
  const alpha_abs = 0.05 * Yb_concentration; // rough: cm^-1 at peak
  const singlePassAbs = 1 - Math.exp(-alpha_abs * diskThick_cm);
  const totalAbsorption = 1 - Math.pow(1 - singlePassAbs, numPasses);

  // Saturation intensity
  const h = 6.626e-34; const c = 3e8;
  const sigma_em = 3e-25; // m² Yb:YAG at 1030nm
  const tau = 0.95e-3;
  const Isat = h * c / (wavelength * 1e-9 * sigma_em * tau);

  // Threshold (simplified)
  const outputLoss = -Math.log(R_oc);
  const P_th = Isat * pumpArea * outputLoss / (2 * totalAbsorption);

  // Thermal lens
  const dn_dT = 7.3e-6; // K^-1 Yb:YAG
  const thermalLensPower = dn_dT * T_disk * diskThickness * 1e-6 / (pumpArea / Math.PI * 1e-6);

  // Slope efficiency
  const eta_quantum = pumpWavelength / wavelength;
  const eta_absorption = totalAbsorption;
  const eta_stokes = wavelength / pumpWavelength;
  const eta_slope = eta_quantum * outputLoss / (outputLoss + alpha_disk * diskThick_cm + 0.02);

  // Max extraction efficiency vs number of passes
  const absVsPasses = useMemo(() => {
    const passes = Array.from({ length: 50 }, (_, i) => 1 + i * 40 / 50);
    const absorption = passes.map(n => (1 - Math.pow(1 - singlePassAbs, n)) * 100);
    return [{ x: passes, y: absorption, type: "scatter", mode: "lines", name: "Total Absorption (%)", line: { color: "#60a5fa", width: 2 } }];
  }, [singlePassAbs]);

  // Output power vs pump
  const piData = useMemo(() => {
    const pumps = Array.from({ length: 100 }, (_, i) => i * 500 / 100);
    return [
      { x: pumps, y: pumps.map(Pp => Pp > P_th ? eta_slope * (Pp - P_th) : 0), type: "scatter", mode: "lines", name: "Output (W)", line: { color: "#60a5fa", width: 2 } },
      { x: pumps, y: pumps.map(() => P_th), type: "scatter", mode: "lines", name: "Threshold", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [P_th, eta_slope]);

  // Temperature vs pump intensity
  const tempData = useMemo(() => {
    const intensities = Array.from({ length: 100 }, (_, i) => i * 20 / 100); // kW/cm²
    const kappa = 11; // W/(m·K) YAG
    const temps = intensities.map(I => I * 1e7 * diskThickness * 1e-6 / (2 * kappa) * 1e4);
    return [{ x: intensities, y: temps, type: "scatter", mode: "lines", name: "ΔT (K)", line: { color: "#f87171", width: 2 } }];
  }, [diskThickness]);

  // Thermal lens vs pump power
  const thermalLensData = useMemo(() => {
    const powers = Array.from({ length: 100 }, (_, i) => i * 500 / 100);
    const f_th = powers.map(P => {
      const I = P / pumpArea;
      const kappa = 11;
      const dT = I * diskThickness * 1e-6 / (2 * kappa);
      const f = pumpSpotDiameter * 1e-3 / (4 * dn_dT * dT * (1.5 - 1) * diskThickness * 1e-6 / (pumpSpotDiameter * 1e-3));
      return f > 0 ? f : 0;
    });
    return [{ x: powers, y: f_th, type: "scatter", mode: "lines", name: "f_thermal (m)", line: { color: "#a78bfa", width: 2 } }];
  }, [diskThickness, pumpSpotDiameter]);

  const plotLayout: any = {
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937", font: { color: "#e5e7eb" },
    xaxis: { gridcolor: "#374151" }, yaxis: { gridcolor: "#374151" },
    margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { orientation: "h", y: -0.25 },
  };
  const inputStyle = "bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300">← Home</Link>
        <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300">← Wave Optics</Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">💿 Thin-Disk Laser Design</h1>
      <p className="text-gray-400 mb-6">Multi-pass pumped thin-disk laser — absorption, thermal management, and power scaling.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Disk Thickness (µm)</label><input type="number" className={inputStyle} value={diskThickness} onChange={e => setDiskThickness(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Disk Diameter (mm)</label><input type="number" className={inputStyle} value={diskDiameter} onChange={e => setDiskDiameter(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Laser λ (nm)</label><input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Pump λ (nm)</label><input type="number" className={inputStyle} value={pumpWavelength} onChange={e => setPumpWavelength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Number of Passes</label><input type="number" className={inputStyle} value={numPasses} onChange={e => setNumPasses(+e.target.value)} min={1} max={64} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Pump Spot Ø (mm)</label><input type="number" className={inputStyle} value={pumpSpotDiameter} onChange={e => setPumpSpotDiameter(+e.target.value)} step={0.5} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">OC Reflectivity</label><input type="number" className={inputStyle} value={R_oc} onChange={e => setR_oc(+e.target.value)} step={0.01} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Yb Concentration (at.%)</label><input type="number" className={inputStyle} value={Yb_concentration} onChange={e => setYb_concentration(+e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Single-Pass Abs.</div><div className="text-xl font-bold text-blue-400">{(singlePassAbs * 100).toFixed(1)}%</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Total Absorption</div><div className="text-xl font-bold text-green-400">{(totalAbsorption * 100).toFixed(1)}%</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">P_th</div><div className="text-xl font-bold text-red-400">{P_th.toFixed(1)} W</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">η_slope</div><div className="text-xl font-bold text-yellow-400">{(eta_slope * 100).toFixed(1)}%</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>A_single = 1 - exp(-α·d)</p>
          <p>A_total = 1 - (1 - A_single)^N</p>
          <p>I_sat = hc / (λ·σ·τ)</p>
          <p>P_th = I_sat · A_pump · δ_oc / (2·A_total)</p>
          <p>f_thermal ≈ r² / (4·dn/dT·ΔT·d·n₀)  (parabolic approximation)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Absorption vs Number of Passes</h3><Plot data={absVsPasses} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Number of Passes" }, yaxis: { ...plotLayout.yaxis, title: "Absorption (%)" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Output Power vs Pump</h3><Plot data={piData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump (W)" }, yaxis: { ...plotLayout.yaxis, title: "Output (W)" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">ΔT vs Pump Intensity</h3><Plot data={tempData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Intensity (kW/cm²)" }, yaxis: { ...plotLayout.yaxis, title: "ΔT (K)" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Thermal Lens f vs Pump</h3><Plot data={thermalLensData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump (W)" }, yaxis: { ...plotLayout.yaxis, title: "f_thermal (m)" } }} config={{ responsive: true }} /></div>
      </div>
    </div>
  );
}
