"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function SlabLaserPage() {
  const [slabWidth, setSlabWidth] = useState(10); // mm
  const [slabHeight, setSlabHeight] = useState(2); // mm (thin direction)
  const [slabLength, setSlabLength] = useState(50); // mm (propagation)
  const [wavelength, setWavelength] = useState(1064); // nm
  const [n_crystal, setN_crystal] = useState(1.82);
  const [pumpWavelength, setPumpWavelength] = useState(808); // nm
  const [R_oc, setR_oc] = useState(0.90);
  const [alpha_scatter, setAlpha_scatter] = useState(0.002); // cm^-1
  const [bounces, setBounces] = useState(8);
  const [thermalLoad, setThermalLoad] = useState(5); // W/cm³

  const h = 6.626e-34; const c = 3e8;
  const lambda_m = wavelength * 1e-9;

  // Slab geometry - zigzag path
  const totalPathLength = slabLength / Math.cos(Math.atan(slabHeight / (slabWidth / bounces)));
  const bounceAngle = Math.atan(slabHeight / (slabWidth / bounces)) * 180 / Math.PI;
  const totalBounces = bounces;

  // Thermal analysis
  const kappa = 11; // W/(m·K) Nd:YAG
  const dn_dT = 7.3e-6;
  const alpha_T = 7.5e-6; // thermal expansion
  const thickness_m = slabHeight * 1e-3;
  const dT_avg = thermalLoad * 1e6 * thickness_m * thickness_m / (8 * kappa);

  // Thermal lens power
  const f_thermal = 1 / (dn_dT * dT_avg * totalBounces / slabLength * 0.001);

  // Stress fracture limit
  const sigma_max = 130e6; // Pa for YAG
  const R_T = sigma_max * kappa / (alpha_T * n_crystal * dn_dT * (n_crystal - 1)); // thermal shock parameter
  const P_max_sf = R_T * 8 * kappa * slabArea() / slabLength; // very rough

  function slabArea() { return slabWidth * slabHeight * 1e-6; }

  // Wavefront distortion per bounce (thermal)
  const OPD_per_bounce = dn_dT * dT_avg * thickness_m * 1e9; // nm

  // Gain
  const sigma_em = 2.8e-23;
  const tau_f = 230e-6;
  const Isat = h * c / (lambda_m * sigma_em * tau_f);
  const totalLoss = alpha_scatter * slabLength / 10 + Math.log(1 / R_oc);
  const P_th = Isat * slabArea() * totalLoss / 2;

  const eta_slope = (pumpWavelength / wavelength) * Math.log(R_oc) / totalLoss * 0.6;

  // Extraction efficiency vs slab length
  const extractVsL = useMemo(() => {
    const Ls = Array.from({ length: 100 }, (_, i) => 10 + i * 100 / 100);
    const etas = Ls.map(L => {
      const loss = alpha_scatter * L / 10 + Math.log(1 / R_oc);
      return (pumpWavelength / wavelength) * Math.log(R_oc) / loss * 0.6;
    });
    return [{ x: Ls, y: etas.map(e => e * 100), type: "scatter", mode: "lines", name: "η_slope (%)", line: { color: "#60a5fa", width: 2 } }];
  }, [alpha_scatter, R_oc, pumpWavelength, wavelength]);

  // Temperature profile across thin dimension
  const tempProfile = useMemo(() => {
    const y = Array.from({ length: 100 }, (_, i) => -1 + i * 2 / 100);
    const T = y.map(yv => (thermalLoad * 1e6 * thickness_m * thickness_m / (2 * kappa)) * (1 - yv * yv));
    return [{ x: y.map(yv => yv * slabHeight / 2), y: T, type: "scatter", mode: "lines", name: "ΔT (K)", line: { color: "#f87171", width: 2 } }];
  }, [slabHeight, thermalLoad]);

  // Output power vs pump
  const piData = useMemo(() => {
    const pumps = Array.from({ length: 100 }, (_, i) => i * 200 / 100);
    return [
      { x: pumps, y: pumps.map(Pp => Pp > P_th ? eta_slope * (Pp - P_th) : 0), type: "scatter", mode: "lines", name: "Output (W)", line: { color: "#60a5fa", width: 2 } },
      { x: pumps, y: pumps.map(() => P_th), type: "scatter", mode: "lines", name: "P_th", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [P_th, eta_slope]);

  // Mode size vs bounces
  const modeVsBounces = useMemo(() => {
    const bs = Array.from({ length: 30 }, (_, i) => 2 + i);
    const w_slab = bs.map(b => {
      const angle = Math.atan(slabHeight / (slabWidth / b));
      const effAperture = slabWidth / b;
      return (lambda_m / (n_crystal * Math.sin(angle))) * effAperture * 1e3;
    });
    return [{ x: bs, y: w_slab, type: "scatter", mode: "lines", name: "Mode size (mm)", line: { color: "#a78bfa", width: 2 } }];
  }, [slabHeight, slabWidth, wavelength, n_crystal]);

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
      </div>
            
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Slab Width (mm)</label><input type="number" className={inputStyle} value={slabWidth} onChange={e => setSlabWidth(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Slab Height / Thin (mm)</label><input type="number" className={inputStyle} value={slabHeight} onChange={e => setSlabHeight(+e.target.value)} step={0.5} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Slab Length (mm)</label><input type="number" className={inputStyle} value={slabLength} onChange={e => setSlabLength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Wavelength (nm)</label><input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Bounces</label><input type="number" className={inputStyle} value={bounces} onChange={e => setBounces(+e.target.value)} min={1} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">OC Reflectivity</label><input type="number" className={inputStyle} value={R_oc} onChange={e => setR_oc(+e.target.value)} step={0.01} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Thermal Load (W/cm³)</label><input type="number" className={inputStyle} value={thermalLoad} onChange={e => setThermalLoad(+e.target.value)} step={0.5} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Crystal Index</label><input type="number" className={inputStyle} value={n_crystal} onChange={e => setN_crystal(+e.target.value)} step={0.01} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">Bounce Angle</div><div className="text-xl font-bold text-blue-400">{bounceAngle.toFixed(1)}°</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">ΔT_avg</div><div className="text-xl font-bold text-red-400">{dT_avg.toFixed(1)} K</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">OPD/bounce</div><div className="text-xl font-bold text-green-400">{OPD_per_bounce.toFixed(1)} nm</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">η_slope</div><div className="text-xl font-bold text-yellow-400">{(eta_slope * 100).toFixed(1)}%</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>θ_bounce = arctan(t / (W/N))</p>
          <p>ΔT(y) = (Q/t²κ) · (t²/4 - y²)  [parabolic]</p>
          <p>OPD/bounce = (dn/dT) · ΔT · t</p>
          <p>I_sat = hc / (λ·σ·τ)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Temperature Profile (thin dimension)</h3><ChartPanel data={tempProfile} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "y (mm)" }, yaxis: { ...plotLayout.yaxis, title: "ΔT (K)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Output Power vs Pump</h3><ChartPanel data={piData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump (W)" }, yaxis: { ...plotLayout.yaxis, title: "Output (W)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">η_slope vs Slab Length</h3><ChartPanel data={extractVsL} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Length (mm)" }, yaxis: { ...plotLayout.yaxis, title: "η_slope (%)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Mode Size vs Bounces</h3><ChartPanel data={modeVsBounces} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Bounces" }, yaxis: { ...plotLayout.yaxis, title: "Mode (mm)" } }} /></div>
      </div>
    </div>
  );
}
