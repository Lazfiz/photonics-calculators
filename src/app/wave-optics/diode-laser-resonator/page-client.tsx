"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
export default function DiodeLaserResonatorPage() {
  const [cavityLength, setCavityLength] = useState(300); // µm
  const [stripeWidth, setStripeWidth] = useState(3); // µm
  const [activeThickness, setActiveThickness] = useState(0.1); // µm
  const [wavelength, setWavelength] = useState(980); // nm
  const [n_eff, setN_eff] = useState(3.4);
  const [alpha_i, setAlpha_i] = useState(10); // cm^-1 internal loss
  const [mirrorR1, setMirrorR1] = useState(0.32); // cleaved facet
  const [mirrorR2, setMirrorR2] = useState(0.32);

  const L_cm = cavityLength * 1e-4;
  const lambda_m = wavelength * 1e-9;
  const facetLoss1 = -Math.log(mirrorR1);
  const facetLoss2 = -Math.log(mirrorR2);
  const mirrorLoss = (facetLoss1 + facetLoss2) / 2;
  const totalLoss = alpha_i + mirrorLoss / L_cm;

  // Threshold gain
  const g_th = alpha_i + (1 / (2 * L_cm)) * Math.log(1 / (mirrorR1 * mirrorR2));

  // Threshold current density
  const d_cm = activeThickness * 1e-4;
  const eta_i = 0.8; // internal quantum efficiency
  const Gamma = 0.02; // confinement factor
  const q = 1.6e-19;
  const J_th = q * d_cm * g_th / (Gamma * eta_i);

  // Threshold current
  const stripe_cm = stripeWidth * 1e-4;
  const I_th = J_th * stripe_cm * cavityLength * 1e-4;

  // External differential quantum efficiency
  const eta_d = eta_i * mirrorLoss / (alpha_i * L_cm + mirrorLoss);

  // Slope efficiency (optical)
  const eta_slope = eta_d * (lambda_m / (1.24e-6)); // P_opt / I

  // Series resistance and thermal
  const V_j = 1.1; // junction voltage
  const P_elec = I_th * V_j;

  // L-I curve
  const liData = useMemo(() => {
    const currents = Array.from({ length: 150 }, (_, i) => i * 200 / 150); // mA
    const Popt = currents.map(I => I > I_th * 1000 ? eta_slope * (I - I_th * 1000) * 1e-3 : 0);
    const Pmax = Math.max(...Popt);
    return [
      { x: currents, y: Popt, type: "scatter", mode: "lines", name: "Output Power (mW)", line: { color: "#60a5fa", width: 2 } },
      { x: currents, y: currents.map(() => I_th * 1000), type: "scatter", mode: "lines", name: "I_th", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [I_th, eta_slope]);

  // Threshold gain vs cavity length
  const gthVsL = useMemo(() => {
    const Ls = Array.from({ length: 100 }, (_, i) => 50 + i * 1500 / 100);
    const gths = Ls.map(L => {
      const Lc = L * 1e-4;
      return alpha_i + (1 / (2 * Lc)) * Math.log(1 / (mirrorR1 * mirrorR2));
    });
    return [{ x: Ls, y: gths, type: "scatter", mode: "lines", name: "g_th (cm⁻¹)", line: { color: "#34d399", width: 2 } }];
  }, [alpha_i, mirrorR1, mirrorR2]);

  // η_d vs cavity length
  const etaVsL = useMemo(() => {
    const Ls = Array.from({ length: 100 }, (_, i) => 50 + i * 1500 / 100);
    const etas = Ls.map(L => {
      const Lc = L * 1e-4;
      const ml = (1 / (2 * Lc)) * Math.log(1 / (mirrorR1 * mirrorR2));
      return eta_i * ml / (alpha_i * Lc + ml);
    });
    return [{ x: Ls, y: etas.map(e => e * 100), type: "scatter", mode: "lines", name: "η_d (%)", line: { color: "#a78bfa", width: 2 } }];
  }, [alpha_i, mirrorR1, mirrorR2]);

  // Far-field divergence
  const theta_perp = lambda_m / (Math.PI * activeThickness * 1e-6) * (180 / Math.PI);
  const theta_par = lambda_m / (Math.PI * stripeWidth * 1e-6) * (180 / Math.PI);

  // Far field pattern
  const farFieldData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => -45 + i * 90 / 200);
    const I_perp = angles.map(a => Math.pow(Math.cos(a * Math.PI / 180), 2) * Math.exp(-Math.pow(a / (theta_perp / 2), 2)));
    const I_par = angles.map(a => Math.pow(Math.cos(a * Math.PI / 180), 2) * Math.exp(-Math.pow(a / (theta_par / 2), 2)));
    return [
      { x: angles, y: I_perp, type: "scatter", mode: "lines", name: "⊥ (fast axis)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: I_par, type: "scatter", mode: "lines", name: "∥ (slow axis)", line: { color: "#fbbf24", width: 2 } },
    ];
  }, [theta_perp, theta_par]);

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
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Cavity Length (µm)</label><input type="number" className={inputStyle} value={cavityLength} onChange={e => setCavityLength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Stripe Width (µm)</label><input type="number" className={inputStyle} value={stripeWidth} onChange={e => setStripeWidth(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Active Thickness (µm)</label><input type="number" className={inputStyle} value={activeThickness} onChange={e => setActiveThickness(+e.target.value)} step={0.01} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Wavelength (nm)</label><input type="number" className={inputStyle} value={wavelength} onChange={e => setWavelength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Internal Loss (cm⁻¹)</label><input type="number" className={inputStyle} value={alpha_i} onChange={e => setAlpha_i(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Facet R₁</label><input type="number" className={inputStyle} value={mirrorR1} onChange={e => setMirrorR1(+e.target.value)} step={0.01} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Facet R₂</label><input type="number" className={inputStyle} value={mirrorR2} onChange={e => setMirrorR2(+e.target.value)} step={0.01} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Effective Index</label><input type="number" className={inputStyle} value={n_eff} onChange={e => setN_eff(+e.target.value)} step={0.1} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">g_th</div><div className="text-xl font-bold text-blue-400">{g_th.toFixed(1)} cm⁻¹</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">I_th</div><div className="text-xl font-bold text-green-400">{(I_th * 1000).toFixed(1)} mA</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">η_d</div><div className="text-xl font-bold text-yellow-400">{(eta_d * 100).toFixed(1)}%</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">θ⊥ (FWHM)</div><div className="text-xl font-bold text-red-400">{theta_perp.toFixed(1)}°</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">θ∥ (FWHM)</div><div className="text-xl font-bold text-purple-400">{theta_par.toFixed(1)}°</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>g_th = α_i + (1/2L)·ln(1/(R₁R₂))</p>
          <p>J_th = q·d·g_th / (Γ·η_i)</p>
          <p>η_d = η_i · α_m / (α_i·L + α_m), α_m = (1/2L)·ln(1/(R₁R₂))</p>
          <p>θ ≈ λ / (π·w₀) [rad]</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">L-I Curve</h3><ChartPanel data={liData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Current (mA)" }, yaxis: { ...plotLayout.yaxis, title: "Power (mW)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Far-Field Pattern</h3><ChartPanel data={farFieldData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Angle (°)" }, yaxis: { ...plotLayout.yaxis, title: "Intensity (a.u.)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Threshold Gain vs Cavity Length</h3><ChartPanel data={gthVsL} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "L (µm)" }, yaxis: { ...plotLayout.yaxis, title: "g_th (cm⁻¹)" } }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">η_d vs Cavity Length</h3><ChartPanel data={etaVsL} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "L (µm)" }, yaxis: { ...plotLayout.yaxis, title: "η_d (%)" } }} /></div>
      </div>
    </div>
  );
}
