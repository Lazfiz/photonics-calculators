"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function SlowLightPage() {
  const [nGroup, setNGroup] = useState(10); // group index
  const [nBase, setNBase] = useState(1.5);
  const [wavelength, setWavelength] = useState(1550);
  const [bandwidth, setBandwidth] = useState(1); // nm
  const [structureLength, setStructureLength] = useState(1); // mm

  const vGroup = 3e8 / nGroup;
  const slowFactor = nBase / nGroup;
  const delay = structureLength * 1e-3 * nGroup / 3e8 * 1e12; // ps
  const delayPerLength = delay / structureLength; // ps/mm
  const lossDb = 0.1 * nGroup; // approximate: more slowing = more loss
  const bandwidthDelayProduct = bandwidth * 1e-9 * 3e8 / wavelength * delay * 1e-12; // dimensionless approx
  const gvd = Math.pow(wavelength * 1e-9, 2) / (2 * Math.PI * 3e8) * (2 * nGroup / bandwidth) * 1e-9 * 1e24; // fs²/mm approx

  const chartData = useMemo(() => {
    const N = 300;
    const ns = Array.from({ length: N }, (_, i) => 1 + i / N * (nGroup - 1));
    const vgs = ns.map(n => 3e8 / n);
    const delays = ns.map(n => structureLength * 1e-3 * n / 3e8 * 1e12);

    // Dispersion curve near resonance (simplified Lorentzian)
    const freqs = Array.from({ length: N }, (_, i) => 190 + i / N * 20); // THz around 1550nm
    const freq0 = 193.4; // c/1550nm
    const nDisp = freqs.map(f => {
      const df = f - freq0;
      return nBase + (nGroup - nBase) / (1 + Math.pow(df / (bandwidth * 0.193), 2));
    });

    return [
      { x: ns, y: delays, type: "scatter" as const, mode: "lines" as const, name: "Delay (ps)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [nGroup, nBase, structureLength, bandwidth]);

  const dispData = useMemo(() => {
    const N = 300;
    const freqs = Array.from({ length: N }, (_, i) => 190 + i / N * 7);
    const freq0 = 193.4;
    const nDisp = freqs.map(f => {
      const df = f - freq0;
      const gamma = bandwidth * 0.1;
      return nBase + (nGroup - nBase) * gamma * gamma / (df * df + gamma * gamma);
    });
    return [
      { x: freqs, y: nDisp, type: "scatter" as const, mode: "lines" as const, name: "n_g(ω)", line: { color: "#4ade80", width: 2 } },
      { x: [freq0, freq0], y: [nBase - 1, nGroup + 1], type: "scatter" as const, mode: "lines" as const, name: "λ₀", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [nGroup, nBase, bandwidth]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="Slow Light Structures" description="Group velocity reduction in photonic crystals and EIT media.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Group Index n_g" value={nGroup} onChange={setNGroup} step="any" />
        <ValidatedNumberInput label="Base Index n₀" value={nBase} onChange={setNBase} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} />
        <ValidatedNumberInput label="Bandwidth (nm)" value={bandwidth} onChange={setBandwidth} step="any" />
        <ValidatedNumberInput label="Structure Length (mm)" value={structureLength} onChange={setStructureLength} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Group Velocity</p>
          <p className="text-xl font-bold text-blue-400">{(vGroup / 3e8 * 100).toFixed(2)}% c</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Delay</p>
          <p className="text-xl font-bold text-green-400">{delay.toFixed(3)} ps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Slowdown Factor</p>
          <p className="text-xl font-bold text-orange-400">{nGroup.toFixed(1)}×</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Delay per mm</p>
          <p className="text-xl font-bold text-purple-400">{delayPerLength.toFixed(3)} ps/mm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm mb-2 font-mono">v<sub>g</sub> = c/n<sub>g</sub> &nbsp;|&nbsp; τ = L·n<sub>g</sub>/c &nbsp;|&nbsp; N·Δf·τ ~ 1 (delay-bandwidth limit)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Delay vs Group Index</p>
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "n_g", gridcolor: "#374151" },
            yaxis: { title: "Delay (ps)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Dispersion n_g(ω)</p>
          <ChartPanel data={dispData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Frequency (THz)", gridcolor: "#374151" },
            yaxis: { title: "n_g", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 60 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
