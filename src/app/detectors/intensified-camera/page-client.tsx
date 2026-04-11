"use client";

import { useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function IntensifiedCameraPage() {
  const [photocathodeQE, setPhotocathodeQE] = useURLState("photocathodeQE", 0.25);
  const [mcpGain, setMcpGain] = useURLState("mcpGain", 1e4);
  const [phosphorEff, setPhosphorEff] = useURLState("phosphorEff", 0.15);
  const [fiberCoupling, setFiberCoupling] = useURLState("fiberCoupling", 0.5);
  const [ccdQE, setCcdQE] = useURLState("ccdQE", 0.5);
  const [ccdReadNoise, setCcdReadNoise] = useURLState("ccdReadNoise", 10);

  const totalGain = photocathodeQE * mcpGain * phosphorEff * fiberCoupling * ccdQE;
  const electronGain = mcpGain * phosphorEff * fiberCoupling * ccdQE;
  const noiseFactor = Math.sqrt(2); // MCP stochastic gain
  const effectiveNoise = ccdReadNoise / electronGain;

  const gainChart = useMemo(() => {
    const mcpGains = Array.from({ length: 200 }, (_, i) => 1e2 * Math.pow(1e6 / 1e2, i / 200));
    const eg = mcpGains.map(g => g * phosphorEff * fiberCoupling * ccdQE);
    const effNoise = mcpGains.map(g => ccdReadNoise / (g * phosphorEff * fiberCoupling * ccdQE));
    return [
      { x: mcpGains, y: eg, type: "scatter", mode: "lines", name: "Electron gain", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
      { x: mcpGains, y: effNoise, type: "scatter", mode: "lines", name: "Eff. read noise", line: { color: "#f87171", width: 2 }, yaxis: "y2" },
    ];
  }, [phosphorEff, fiberCoupling, ccdQE, ccdReadNoise]);

  const sensitivityChart = useMemo(() => {
    const photons = Array.from({ length: 200 }, (_, i) => 0.1 + i * 0.5);
    const eg = mcpGain * phosphorEff * fiberCoupling * ccdQE;
    const iccdSNR = photons.map(p => p * photocathodeQE / Math.sqrt(p * photocathodeQE * noiseFactor ** 2 + (ccdReadNoise / eg) ** 2));
    const emccdSNR = photons.map(p => p / Math.sqrt(p * 2 + 1.5 ** 2));
    return [
      { x: photons, y: iccdSNR, type: "scatter", mode: "lines", name: "ICCD", line: { color: "#60a5fa" } },
      { x: photons, y: emccdSNR, type: "scatter", mode: "lines", name: "EMCCD (QE≈100%, read≈1.5e⁻)", line: { color: "#34d399" } },
    ];
  }, [photocathodeQE, mcpGain, phosphorEff, fiberCoupling, ccdQE, ccdReadNoise, noiseFactor]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Intensified Camera (ICCD)" description="Gain chain: photocathode → MCP → phosphor → fiber optic → CCD. Noise and sensitivity analysis." maxWidthClassName="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Photocathode QE" value={photocathodeQE} onChange={setPhotocathodeQE} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="MCP Gain" value={mcpGain} onChange={setMcpGain} />
        <ValidatedNumberInput label="Phosphor Efficiency" value={phosphorEff} onChange={setPhosphorEff} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Fiber Coupling" value={fiberCoupling} onChange={setFiberCoupling} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD QE" value={ccdQE} onChange={setCcdQE} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD Read Noise (e⁻)" value={ccdReadNoise} onChange={setCcdReadNoise} min={0.5} step="0.5" />
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
