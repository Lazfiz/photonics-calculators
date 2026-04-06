"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";

export default function IntensifiedCameraPage() {
  const [gain, setGain] = useState(1000);
  const [photocathodeQE, setPhotocathodeQE] = useState(0.25);
  const [mcpGain, setMcpGain] = useState(1e4);
  const [phosphorEff, setPhosphorEff] = useState(0.15);
  const [fiberCoupling, setFiberCoupling] = useState(0.5);
  const [ccdQE, setCcdQE] = useState(0.5);
  const [ccdReadNoise, setCcdReadNoise] = useState(10);
  const [wavelength, setWavelength] = useState(550);

  const totalGain = photocathodeQE * mcpGain * phosphorEff * fiberCoupling * ccdQE * gain;
  const electronGain = mcpGain * phosphorEff * fiberCoupling;
  const noiseFactor = Math.sqrt(2); // MCP stochastic gain
  const effectiveNoise = ccdReadNoise / (mcpGain * phosphorEff * fiberCoupling);
  const snr = totalGain / Math.sqrt(totalGain * noiseFactor ** 2 + ccdReadNoise ** 2 / (mcpGain * phosphorEff * fiberCoupling) ** 2);

  const gainChart = useMemo(() => {
    const mcpGains = Array.from({ length: 200 }, (_, i) => 1e2 * Math.pow(1e6 / 1e2, i / 200));
    const eg = mcpGains.map(g => g * phosphorEff * fiberCoupling);
    const effNoise = mcpGains.map(g => ccdReadNoise / (g * phosphorEff * fiberCoupling));
    return [
      { x: mcpGains, y: eg, type: "scatter", mode: "lines", name: "Electron gain", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: mcpGains, y: effNoise, type: "scatter", mode: "lines", name: "Eff. read noise", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [mcpGain, phosphorEff, fiberCoupling, ccdReadNoise]);

  const sensitivityChart = useMemo(() => {
    const photons = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.5);
    const iccdSNR = photons.map(p => { const eg = mcpGain * phosphorEff * fiberCoupling; return p * photocathodeQE * eg / Math.sqrt(p * photocathodeQE * eg * 2 + ccdReadNoise ** 2); });
    const emccdSNR = photons.map(p => p / Math.sqrt(p * 2 + 1.5 ** 2));
    return [
      { x: photons, y: iccdSNR, type: "scatter", mode: "lines", name: "ICCD", line: { color: "#60a5fa" } },
      { x: photons, y: emccdSNR, type: "scatter", mode: "lines", name: "EMCCD", line: { color: "#34d399" } },
    ];
  }, [photocathodeQE, mcpGain, phosphorEff, fiberCoupling, ccdReadNoise]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Intensified Camera (ICCD)" description="Gain chain: photocathode → MCP → phosphor → fiber optic → CCD. Noise and sensitivity analysis." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Photocathode QE</span><input type="number" value={photocathodeQE} onChange={e => setPhotocathodeQE(+e.target.value)} min="0.01" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">MCP Gain</span><input type="number" value={mcpGain} onChange={e => setMcpGain(+e.target.value)} className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Phosphor Efficiency</span><input type="number" value={phosphorEff} onChange={e => setPhosphorEff(+e.target.value)} min="0.01" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">Fiber Coupling</span><input type="number" value={fiberCoupling} onChange={e => setFiberCoupling(+e.target.value)} min="0.01" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">CCD QE</span><input type="number" value={ccdQE} onChange={e => setCcdQE(+e.target.value)} min="0.01" max="1" step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">CCD Read Noise (e⁻)</span><input type="number" value={ccdReadNoise} onChange={e => setCcdReadNoise(+e.target.value)} min="0.5" step="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Electron Gain" value={electronGain.toExponential(2)} tone="blue" />
        <ResultCard label="Total System Gain" value={totalGain.toExponential(2)} tone="green" />
        <ResultCard label="Eff. Read Noise" value={`${effectiveNoise.toExponential(2)} e⁻`} tone="yellow" />
        <ResultCard label="Noise Factor" value={`√2 ≈ ${noiseFactor.toFixed(3)}`} tone="red" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>Gain chain: η_pc × G_MCP × η_phos × η_fiber × η_CCD</p><p>MCP noise factor F ≈ √2 (stochastic)</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={gainChart} layout={{ xaxis: { title: "MCP Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "Electron Gain", gridcolor: "#374151", type: "log" }, yaxis2: { title: "Eff. Read Noise (e⁻)", gridcolor: "#374151", type: "log", overlaying: "y", side: "right" } }} title="Gain vs MCP" />
        <ChartPanel data={sensitivityChart} layout={{ xaxis: { title: "Photons/pix/frame", gridcolor: "#374151" }, yaxis: { title: "SNR", gridcolor: "#374151" } }} title="ICCD vs EMCCD Sensitivity" />
      </div>
    </CalculatorShell>
  );
}
