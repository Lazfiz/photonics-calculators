"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function PMFiberCalculator() {
  const [fiberType, setFiberType] = useState<"PANDA" | "Bowtie" | "Elliptical">("PANDA");
  const [wavelength, setWavelength] = useURLState("wavelength", 1550); // nm
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 4.5); // μm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.468);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.463);
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 1000); // m
  const [extinctionRatio, setExtinctionRatio] = useURLState("extinctionRatio", 30); // dB

  // Birefringence estimates per fiber type
  const birefringenceMap = { PANDA: 3.5e-4, Bowtie: 5.0e-4, Elliptical: 1.0e-4 };
  const attenuationMap = { PANDA: 0.3, Bowtie: 0.5, Elliptical: 1.0 }; // dB/km
  const beatLengthMap = { PANDA: 2.5, Bowtie: 1.5, Elliptical: 10 }; // mm (approximate)

  const B = birefringenceMap[fiberType];
  const beatLength = useMemo(() => wavelength / B, [wavelength, B]);
  const attenuation = attenuationMap[fiberType];
  const totalAttenuation = (attenuation * fiberLength) / 1000;

  // Polarization extinction ratio after propagation
  const hParameter = useMemo(() => {
    // h-parameter typical values (rad²/m)
    const hMap = { PANDA: 1e-6, Bowtie: 5e-7, Elliptical: 1e-5 };
    return hMap[fiberType];
  }, [fiberType]);

  const outputPER = useMemo(() => {
    const inputLinear = Math.pow(10, extinctionRatio / 10);
    const degradation = Math.exp(-2 * hParameter * fiberLength);
    const outputLinear = inputLinear * degradation;
    return 10 * Math.log10(outputLinear);
  }, [extinctionRatio, hParameter, fiberLength]);

  // Coupling length for maximum power transfer between axes
  const couplingLength = useMemo(() => {
    return beatLength / 2;
  }, [beatLength]);

  // Plot: PER vs fiber length
  const plotData = useMemo(() => {
    const lengths: number[] = [];
    const pers: number[] = [];

    for (let l = 0; l <= 10000; l += 50) {
      lengths.push(l);
      const inputLinear = Math.pow(10, extinctionRatio / 10);
      const degradation = Math.exp(-2 * hParameter * l);
      const out = 10 * Math.log10(inputLinear * degradation);
      pers.push(out);
    }

    return [
      {
        x: lengths, y: pers, type: "scatter" as const, mode: "lines" as const,
        name: "Output PER", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: [fiberLength], y: [outputPER], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 },
      },
      {
        x: [0, 10000], y: [20, 20], type: "scatter" as const, mode: "lines" as const,
        name: "Min acceptable PER", line: { color: "#ef4444", width: 1, dash: "dash" as const },
      },
    ];
  }, [extinctionRatio, hParameter, fiberLength, outputPER]);

  const layout = {
    title: "Polarization Extinction Ratio vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "PER (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  const na = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  const vNumber = (2 * Math.PI * coreRadius * na) / wavelength;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Type</label>
              <select value={fiberType} onChange={(e) => setFiberType(e.target.value as "PANDA" | "Bowtie" | "Elliptical")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="PANDA">PANDA</option>
                <option value="Bowtie">Bowtie</option>
                <option value="Elliptical">Elliptical Core</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Radius (μm)</label>
              <input type="number" value={coreRadius} onChange={(e) => setCoreRadius(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Index / Cladding Index</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={coreIndex} onChange={(e) => setCoreIndex(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none text-sm" step="0.0001" />
                <input type="number" value={claddingIndex} onChange={(e) => setCladdingIndex(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none text-sm" step="0.0001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input PER (dB)</label>
              <input type="number" value={extinctionRatio} onChange={(e) => setExtinctionRatio(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Birefringence:</span><span className="font-mono">{(B * 1e4).toFixed(1)} ×10⁻⁴</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Beat length:</span><span className="font-mono">{(beatLength / 1000).toFixed(3)} mm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Attenuation:</span><span className="font-mono">{attenuation} dB/km</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total attenuation:</span><span className="font-mono">{totalAttenuation.toFixed(2)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">h-parameter:</span><span className="font-mono">{hParameter.toExponential(1)} rad²/m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Output PER:</span><span className={`font-mono text-lg ${outputPER >= 20 ? "text-green-400" : "text-red-400"}`}>{outputPER.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Coupling length:</span><span className="font-mono">{(couplingLength / 1000).toFixed(3)} mm</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">L_beat = λ / B</p>
              <p className="font-mono text-sm mt-1">PER_out = PER_in · exp(-2hL)</p>
              <p className="font-mono text-sm mt-1">L_c = L_beat / 2</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
          <ChartPanel data={plotData} layout={layout} />
        </div>
      </div>
    </div>
  );
}
