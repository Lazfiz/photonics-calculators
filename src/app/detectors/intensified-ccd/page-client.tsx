"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function IntensifiedCCDPage() {
  const [photocathodeType, setPhotocathodeType] = useState<"s20" | "gaas" | "inagaas" | "s25">("gaas");
  const [mcpGain, setMcpGain] = useURLState("mcpGain", 1e4);
  const [phosphorType, setPhosphorType] = useState<"p43" | "p46" | "p20">("p43");
  const [fiberCoupling, setFiberCoupling] = useURLState("fiberCoupling", 0.6);
  const [ccdReadNoise, setCcdReadNoise] = useURLState("ccdReadNoise", 5);
  const [signalPhotons, setSignalPhotons] = useURLState("signalPhotons", 100);

  const photocathodes = { s20: { qe: 0.2, label: "S20 (multialkali)", range: "300-850nm" }, gaas: { qe: 0.35, label: "GaAs", range: "300-900nm" }, inagaas: { qe: 0.15, label: "InGaAs", range: "900-1700nm" }, s25: { qe: 0.25, label: "S25 (ERMA)", range: "200-900nm" } };
  const phosphors = { p43: { eff: 0.15, decay: 1.2, label: "P43 (Gd₂O₂S:Tb)" }, p46: { eff: 0.25, decay: 0.08, label: "P46 (Y₂O₂S:Tb)" }, p20: { eff: 0.12, decay: 0.06, label: "P20 (Y₂SiO₅:Ce)" } };

  const pc = photocathodes[photocathodeType];
  const ph = phosphors[phosphorType];
  const detectedElectrons = signalPhotons * pc.qe;
  const electronGain = mcpGain * ph.eff * fiberCoupling;
  const outputSignal = detectedElectrons * electronGain;
  const mcpNoiseFactor = 2; // stochastic
  const totalNoise = Math.sqrt(detectedElectrons * electronGain ** 2 * mcpNoiseFactor + ccdReadNoise ** 2);
  const snr = outputSignal / totalNoise;

  const gainChart = useMemo(() => {
    const gains = Array.from({ length: 200 }, (_, i) => 1e2 * Math.pow(1e6 / 1e2, i / 200));
    return [
      { x: gains, y: gains.map(g => detectedElectrons * g * ph.eff * fiberCoupling), type: "scatter", mode: "lines", name: "Output signal", line: { color: "#60a5fa" }, yaxis: "y" },
      { x: gains, y: gains.map(g => Math.sqrt(detectedElectrons * g ** 2 * ph.eff ** 2 * fiberCoupling ** 2 * 2 + ccdReadNoise ** 2)), type: "scatter", mode: "lines", name: "Total noise", line: { color: "#f87171" }, yaxis: "y" },
      { x: gains, y: gains.map(g => { const s = detectedElectrons * g * ph.eff * fiberCoupling; const n = Math.sqrt(detectedElectrons * g ** 2 * ph.eff ** 2 * fiberCoupling ** 2 * 2 + ccdReadNoise ** 2); return s / n; }), type: "scatter", mode: "lines", name: "SNR", line: { color: "#34d399" }, yaxis: "y2" },
    ];
  }, [detectedElectrons, ph.eff, fiberCoupling, ccdReadNoise]);

  const gateChart = useMemo(() => {
    const widths = Array.from({ length: 100 }, (_, i) => 1 + i * 100 / 100);
    return [{ x: widths, y: widths.map(w => { const t = w * 1e-9; const bgRate = 1e6; const bg = bgRate * t * pc.qe * electronGain; return bg / ccdReadNoise; }), type: "scatter", mode: "lines", name: "BG / Read Noise", line: { color: "#fbbf24", width: 2 } }];
  }, [pc.qe, electronGain, ccdReadNoise]);

  return (
    <CalculatorShell backHref="/detectors" backLabel="Detectors" title="Intensified CCD (ICCD)" description="Photocathode → MCP → phosphor → CCD gain chain with gating and noise analysis." maxWidthClassName="max-w-5xl">
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3"><label className="block text-xs text-gray-400">Photocathode</label><select value={photocathodeType} onChange={e => setPhotocathodeType(e.target.value as any)} className="mt-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white">{Object.entries(photocathodes).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-3"><label className="block text-xs text-gray-400">Phosphor</label><select value={phosphorType} onChange={e => setPhosphorType(e.target.value as any)} className="mt-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white">{Object.entries(phosphors).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="MCP Gain" value={mcpGain} onChange={setMcpGain} />
        <ValidatedNumberInput label="Fiber Coupling" value={fiberCoupling} onChange={setFiberCoupling} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="CCD Read Noise (e⁻)" value={ccdReadNoise} onChange={setCcdReadNoise} min={0.5} step="0.5" />
        <ValidatedNumberInput label="Signal (photons/pix)" value={signalPhotons} onChange={setSignalPhotons} min={0.1} step="1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="PC QE" value={`${(pc.qe * 100).toFixed(0)}%`} tone="blue" subtext={pc.range} />
        <ResultCard label="Electron Gain" value={electronGain.toExponential(2)} tone="green" />
        <ResultCard label="Output Signal" value={outputSignal.toExponential(2)} tone="yellow" />
        <ResultCard label="SNR" value={snr.toFixed(2)} tone="purple" />
      </div>
      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono space-y-1"><p>Gain = η_pc × G_MCP × η_phos × η_fiber</p><p>σ²_total = S·G²·F + σ_read², F_MCP ≈ 2</p><p>Phosphor decay: {ph.label} → {ph.decay} ms</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={gainChart} layout={{ xaxis: { title: "MCP Gain", gridcolor: "#374151", type: "log" }, yaxis: { title: "Signal / Noise (e⁻)", gridcolor: "#374151", type: "log" }, yaxis2: { title: "SNR", gridcolor: "#374151", overlaying: "y", side: "right" } }} title="SNR vs MCP Gain" />
        <ChartPanel data={gateChart} layout={{ xaxis: { title: "Gate Width (ns)", gridcolor: "#374151" }, yaxis: { title: "BG / Read Noise", gridcolor: "#374151", type: "log" } }} title="Background vs Gate" />
      </div>
    </CalculatorShell>
  );
}
