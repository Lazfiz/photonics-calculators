"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function FreeElectronLaserPage() {
  const [electronEnergy, setElectronEnergy] = useState(100); // MeV
  const [undulatorPeriod, setUndulatorPeriod] = useState(30); // mm
  const [undulatorK, setUndulatorK] = useState(1.5);
  const [undulatorLength, setUndulatorLength] = useState(2); // m
  const [beamCurrent, setBeamCurrent] = useState(100); // A
  const [beamEmittance, setBeamEmittance] = useState(5); // mm-mrad
  const [energySpread, setEnergySpread] = useState(0.001); // relative

  const c = 2.998e8;
  const m_e = 0.511; // MeV/c²
  const gamma = electronEnergy / m_e + 1;
  const beta = Math.sqrt(1 - 1 / (gamma * gamma));
  const lambda_u = undulatorPeriod * 1e-3;

  // Resonance wavelength
  const lambda_r = lambda_u / (2 * gamma * gamma) * (1 + undulatorK * undulatorK / 2);
  const wavelength_nm = lambda_r * 1e9;

  // Pierce parameter
  const rho = (1 / gamma) * Math.pow(undulatorK * beamCurrent * 1e3 / (17e3 * Math.PI), 1/3) * Math.pow((1 + undulatorK * undulatorK / 2), -1/3);

  // Gain length
  const L_g = lambda_u / (4 * Math.PI * Math.sqrt(3) * rho);

  // Saturation length
  const L_sat = L_g * 10;

  // Saturated power estimate
  const P_beam = beamCurrent * 1e3 * electronEnergy * 1e6 * 1.6e-19; // W
  const P_sat = rho * P_beam;

  // Slippage length
  const N_periods = undulatorLength / lambda_u;
  const L_slip = N_periods * lambda_r;

  // Gain length vs K
  const gainVsK = useMemo(() => {
    const Ks = Array.from({ length: 100 }, (_, i) => 0.5 + i * 3 / 100);
    const Lgs = Ks.map(K => {
      const r = (1 / gamma) * Math.pow(K * beamCurrent * 1e3 / (17e3 * Math.PI), 1/3) * Math.pow((1 + K * K / 2), -1/3);
      return lambda_u / (4 * Math.PI * Math.sqrt(3) * r);
    });
    return [{ x: Ks, y: Lgs, type: "scatter", mode: "lines", name: "L_g (m)", line: { color: "#60a5fa", width: 2 } }];
  }, [gamma, beamCurrent, lambda_u]);

  // Wavelength vs energy
  const wlVsE = useMemo(() => {
    const Es = Array.from({ length: 100 }, (_, i) => 20 + i * 500 / 100);
    const wls = Es.map(E => {
      const g = E / m_e + 1;
      return (lambda_u / (2 * g * g) * (1 + undulatorK * undulatorK / 2)) * 1e9;
    });
    return [{ x: Es, y: wls, type: "scatter", mode: "lines", name: "λ (nm)", line: { color: "#34d399", width: 2 } }];
  }, [lambda_u, undulatorK]);

  // Gain vs undulator length
  const gainVsL = useMemo(() => {
    const Ls = Array.from({ length: 100 }, (_, i) => 0.1 + i * 10 / 100);
    const G = Ls.map(L => Math.exp(L / L_g));
    return [{ x: Ls, y: G, type: "scatter", mode: "lines", name: "Gain", line: { color: "#a78bfa", width: 2 } }];
  }, [L_g]);

  // Power evolution (exponential growth model)
  const powerEvolution = useMemo(() => {
    const zs = Array.from({ length: 200 }, (_, i) => i * undulatorLength / 200);
    const Ps = zs.map(z => {
      if (z < L_sat) {
        return P_sat * (1 - Math.exp(-z / L_g)) * 0.01;
      }
      return P_sat * 0.01 * Math.exp((z - L_sat) / (L_g * 2));
    });
    return [
      { x: zs, y: Ps, type: "scatter", mode: "lines", name: "P(z)", line: { color: "#fbbf24", width: 2 } },
      { x: zs, y: zs.map(() => P_sat * 0.01), type: "scatter", mode: "lines", name: "P_sat", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [undulatorLength, L_g, L_sat, P_sat]);

  // Spectrum (harmonics)
  const spectrumData = useMemo(() => {
    const harmonics = [1, 3, 5, 7, 9];
    const intensities = harmonics.map(n => {
      const lambda_n = lambda_r / n * 1e9;
      const I_rel = n === 1 ? 1 : 0.3 / Math.pow(n - 1, 1.5);
      return { x: [lambda_n], y: [I_rel], type: "bar" as const, name: `n=${n}`, marker: { color: ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"][n - 1] } };
    });
    return intensities;
  }, [lambda_r]);

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
      <h1 className="text-3xl font-bold mb-2">⚡ Free-Electron Laser</h1>
      <p className="text-gray-400 mb-6">FEL fundamentals — resonance condition, Pierce parameter, gain length, and power scaling.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Electron Energy (MeV)</label><input type="number" className={inputStyle} value={electronEnergy} onChange={e => setElectronEnergy(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Undulator Period λᵤ (mm)</label><input type="number" className={inputStyle} value={undulatorPeriod} onChange={e => setUndulatorPeriod(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Undulator K</label><input type="number" className={inputStyle} value={undulatorK} onChange={e => setUndulatorK(+e.target.value)} step={0.1} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Undulator Length (m)</label><input type="number" className={inputStyle} value={undulatorLength} onChange={e => setUndulatorLength(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Peak Beam Current (A)</label><input type="number" className={inputStyle} value={beamCurrent} onChange={e => setBeamCurrent(+e.target.value)} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><label className="text-sm text-gray-400">Energy Spread (ΔE/E)</label><input type="number" className={inputStyle} value={energySpread} onChange={e => setEnergySpread(+e.target.value)} step={0.0001} /></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">γ</div><div className="text-xl font-bold text-blue-400">{gamma.toFixed(1)}</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">λ_resonance</div><div className="text-xl font-bold text-green-400">{wavelength_nm.toFixed(2)} nm</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">ρ (Pierce)</div><div className="text-xl font-bold text-yellow-400">{(rho * 100).toFixed(3)}%</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">L_g (1D)</div><div className="text-xl font-bold text-red-400">{L_g.toFixed(2)} m</div></div>
        <div className="bg-gray-800 rounded-lg p-4 text-center"><div className="text-xs text-gray-400">P_sat (est)</div><div className="text-xl font-bold text-purple-400">{(P_sat / 1e9).toFixed(2)} GW</div></div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-semibold mb-3">Key Formulas</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>λ_r = λᵤ / (2γ²) · (1 + K²/2)</p>
          <p>ρ = (1/γ) · [K·I / (17kA·π)]^(1/3) · (1 + K²/2)^(-1/3)</p>
          <p>L_g = λᵤ / (4π√3·ρ)</p>
          <p>P_sat ≈ ρ · P_beam</p>
          <p>L_sat ≈ 10·L_g</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Wavelength vs Electron Energy</h3><Plot data={wlVsE} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "E (MeV)" }, yaxis: { ...plotLayout.yaxis, title: "λ (nm)", type: "log" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Gain Length vs K</h3><Plot data={gainVsK} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "K" }, yaxis: { ...plotLayout.yaxis, title: "L_g (m)" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Gain vs Undulator Length</h3><Plot data={gainVsL} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "z (m)" }, yaxis: { ...plotLayout.yaxis, title: "Gain", type: "log" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4"><h3 className="font-semibold mb-2">Power Evolution</h3><Plot data={powerEvolution} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "z (m)" }, yaxis: { ...plotLayout.yaxis, title: "P (W)" } }} config={{ responsive: true }} /></div>
        <div className="bg-gray-800 rounded-lg p-4 md:col-span-2"><h3 className="font-semibold mb-2">Harmonic Spectrum</h3><Plot data={spectrumData} layout={{ ...plotLayout, xaxis: { ...plotLayout.xaxis, title: "Wavelength (nm)" }, yaxis: { ...plotLayout.yaxis, title: "Relative Intensity" }, barmode: "group" }} config={{ responsive: true }} /></div>
      </div>
    </div>
  );
}
