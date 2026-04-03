"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SolidStateLaserResonatorPage() {
  const [crystalLength, setCrystalLength] = useState(10); // mm
  const [crystalDiameter, setCrystalDiameter] = useState(3); // mm
  const [wavelength, setWavelength] = useState(1064); // nm
  const [R1, setR1] = useState(-100); // mm (HR, concave)
  const [R2, setR2] = useState(200); // mm (OC, concave or flat=inf)
  const [L_cav, setL_cav] = useState(150); // mm cavity length
  const [R_oc, setR_oc] = useState(0.95);
  const [R_hr, setR_hr] = useState(0.999);
  const [alpha_c, setAlpha_c] = useState(0.001); // cm^-1 crystal loss
  const [n_crystal, setN_crystal] = useState(1.82); // Nd:YAG

  const L_crystal_cm = crystalLength / 10;
  const n = n_crystal;
  const thermalLensDiopters = 0; // simplified
  const effectiveCavity = L_cav / 1000; // m

  // Gaussian beam in cavity
  // Stability: 0 <= g1*g2 <= 1
  const g1 = 1 - effectiveCavity / (R1 / 1000);
  const g2 = 1 - effectiveCavity / (R2 / 1000);
  const g1g2 = g1 * g2;
  const isStable = g1g2 > 0 && g1g2 < 1;

  // Beam waist at center
  const lambda_m = wavelength * 1e-9;
  const R1m = R1 / 1000;
  const R2m = R2 / 1000;

  let beamWaist = 0;
  let zR = 0;
  if (isStable && R1m !== 0 && R2m !== 0) {
    // Waist at position where d/dz(w²)=0
    const d = effectiveCavity;
    const t1 = d * (R2m - d) / (R2m + R1m - 2 * d);
    const t2 = d * (R1m - d) / (R2m + R1m - 2 * d);
    const w1_sq = (lambda_m / Math.PI) * Math.sqrt(R1m * t1 * (d - t1) / (R1m - d));
    beamWaist = Math.sqrt(Math.max(0, w1_sq)) * 1e6; // µm
    zR = Math.PI * Math.pow(beamWaist * 1e-6, 2) / lambda_m;
  }

  // Threshold
  const crystalLoss = alpha_c * L_crystal_cm;
  const outputLoss = -Math.log(R_oc);
  const totalLoss = crystalLoss + outputLoss + (1 - R_hr);
  const sigma_em = 2.8e-23; // m² Nd:YAG
  const tau_f = 230e-6; // s
  const A_crystal = Math.PI * Math.pow(crystalDiameter / 2 * 1e-3, 2);
  const P_th = totalLoss * h * c / (wavelength * 1e-9 * sigma_em * tau_f) * A_crystal / (2 * L_crystal_cm / 100);

  // Slope efficiency
  const eta_slope = 0.5 * outputLoss / totalLoss;

  // Stability diagram
  const stabilityData = useMemo(() => {
    const gs = Array.from({ length: 100 }, (_, i) => -1 + i * 3 / 100);
    const data: any[] = [];
    // Fill stable region
    const xStable: number[] = [];
    const yStable: number[] = [];
    for (const g1v of gs) {
      for (const g2v of gs) {
        if (g1v * g2v > 0 && g1v * g2v < 1) {
          xStable.push(g1v);
          yStable.push(g2v);
        }
      }
    }
    data.push({ x: xStable, y: yStable, type: "scatter", mode: "markers", marker: { color: "#34d39940", size: 3 }, name: "Stable" });
    data.push({ x: [g1], y: [g2], type: "scatter", mode: "markers", marker: { color: "#f87171", size: 12 }, name: "This Cavity" });
    return data;
  }, [g1, g2]);

  // Beam radius along cavity
  const beamProfileData = useMemo(() => {
    if (!isStable) return [];
    const zs = Array.from({ length: 200 }, (_, i) => i * effectiveCavity / 200);
    const ws = zs.map(z => {
      const wz = beamWaist * 1e-6 * Math.sqrt(1 + Math.pow((z - effectiveCavity / 2) / (zR > 0 ? zR : 1), 2));
      return wz * 1e6;
    });
    return [{ x: zs.map(z => z * 1000), y: ws, type: "scatter", mode: "lines", name: "Beam Radius", line: { color: "#60a5fa", width: 2 } }];
  }, [isStable, beamWaist, zR, effectiveCavity]);

  const h = 6.626e-34;
  const c = 3e8;

  // Output power vs pump
  const piData = useMemo(() => {
    const pumps = Array.from({ length: 100 }, (_, i) => i * 10 / 100);
    return [
      { x: pumps, y: pumps.map(Pp => Pp > P_th ? eta_slope * (Pp - P_th) : 0), type: "scatter", mode: "lines", name: "Output (W)", line: { color: "#60a5fa", width: 2 } },
      { x: pumps, y: pumps.map(() => P_th), type: "scatter", mode: "lines", name: "Threshold", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [P_th, eta_slope]);

  const plotLayout: any = {
    paper_bgcolor: "#111827",
    plot_bgcolor: "#1f2937",
    font: { color: "#e5e7eb" },
    xaxis: { gridcolor: "#374151" },
    yaxis: { gridcolor: "#374151" },
    margin: { t: 40, r: 20, b: 50, l: 60 },
    legend: { orientation: "h", y: -0.2 },
  };
  const inputStyle = "bg-gray-800 border border-gray-600 rounded px-2 py-1 w-full text-white text-sm";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300">← Home</Link>
        <Link href="/wave-optics" className="text-blue-400 hover:text-blue-300">← Wave Optics</Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">💎 Solid-State Laser Resonator</h1>
      <p className="text-gray-400 mb-6">Analyze stability, mode size, threshold, and output power for end-pumped solid-state laser resonators.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Crystal Length (mm)</label>
          <input type="number" className={inputStyle} value={crystalLength} onChange={e => setCrystalLength(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Crystal Diameter (mm)</label>
          <input type="number" className={inputStyle} value={crystalDiameter} onChange={e => setCrystalDiameter(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Wavelength (nm)</label>
          <input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">R₁ (HR mirror, mm)</label>
          <input type="number" className={inputStyle} value={R1} onChange={e => setR1(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">R₂ (OC mirror, mm)</label>
          <input type="number" className={inputStyle} value={R2} onChange={e => setR2(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Cavity Length (mm)</label>
          <input type="number" className={inputStyle} value={L_cav} onChange={e => setL_cav(+e.target.value)} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">OC Reflectivity</label>
          <input type="number" className={inputStyle} value={R_oc} onChange={e => setR_oc(+e.target.value)} step={0.01} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">HR Reflectivity</label>
          <input type="number" className={inputStyle} value={R_hr} onChange={e => setR_hr(+e.target.value)} step={0.001} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="text-sm text-gray-400">Crystal Index</label>
          <input type="number" className={inputStyle} value={n_crystal} onChange={e => setN_crystal(+e.target.value)} step={0.01} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">g₁·g₂</div>
          <div className="text-xl font-bold" style={{ color: isStable ? "#34d399" : "#f87171" }}>{g1g2.toFixed(4)}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Stable?</div>
          <div className="text-xl font-bold" style={{ color: isStable ? "#34d399" : "#f87171" }}>{isStable ? "YES" : "NO"}</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Beam Waist</div>
          <div className="text-xl font-bold text-blue-400">{beamWaist.toFixed(1)} µm</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400">Slope Efficiency</div>
          <div className="text-xl font-bold text-yellow-400">{(eta_slope * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>g₁ = 1 - L/R₁, g₂ = 1 - L/R₂</p>
          <p>Stable: 0 &lt; g₁g₂ &lt; 1</p>
          <p>w²(z) = w₀²[1 + (z/z_R)²]</p>
          <p>P_out = η_s · (P_pump - P_th)</p>
          <p>δ_total = α·L_c + ln(1/R_oc) + (1 - R_hr)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Stability Diagram</h3>
          <Plot data={stabilityData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "g₁", range: [-1, 2] }, yaxis: { ...plotLayout.yaxis, title: "g₂", range: [-1, 2] }, width: 450, height: 400 }} config={{ responsive: true }} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Beam Radius Along Cavity</h3>
          <Plot data={beamProfileData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Position (mm)" }, yaxis: { ...plotLayout.yaxis, title: "Beam Radius (µm)" } }} config={{ responsive: true }} />
        </div>
        <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">Output Power vs Pump Power</h3>
          <Plot data={piData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Pump (W)" }, yaxis: { ...plotLayout.yaxis, title: "Output (W)" } }} config={{ responsive: true }} />
        </div>
      </div>
    </div>
  );
}
