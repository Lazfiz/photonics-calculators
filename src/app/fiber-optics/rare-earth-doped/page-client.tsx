"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function RareEarthDopedFiberCalculator() {
  const [dopantType, setDopantType] = useState<"Er" | "Yb" | "ErYb" | "Tm" | "Nd">("Er");
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 5); // m
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 2.5); // μm
  const [coreIndex, setCoreIndex] = useURLState("coreIndex", 1.462);
  const [claddingIndex, setCladdingIndex] = useURLState("claddingIndex", 1.457);
  const [dopantConcentration, setDopantConcentration] = useURLState("dopantConcentration", 1000); // ppm by weight
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 200); // mW
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 980); // nm
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1550); // nm

  // Dopant properties
  const dopantParams = {
    Er: { emissionCross: 6.6e-25, absorptionCross: 2.5e-25, lifetime: 10.2, peakEmission: 1531, peakAbsorption: 1530, pumpBands: [980, 1480] },
    Yb: { emissionCross: 2.5e-25, absorptionCross: 2.0e-25, lifetime: 0.84, peakEmission: 1030, peakAbsorption: 975, pumpBands: [915, 975] },
    ErYb: { emissionCross: 6.6e-25, absorptionCross: 2.5e-25, lifetime: 10.2, peakEmission: 1531, peakAbsorption: 1530, pumpBands: [980] },
    Tm: { emissionCross: 2.0e-25, absorptionCross: 1.5e-25, lifetime: 0.4, peakEmission: 1850, peakAbsorption: 1630, pumpBands: [790, 1150] },
    Nd: { emissionCross: 3.0e-25, absorptionCross: 2.0e-25, lifetime: 0.23, peakEmission: 1060, peakAbsorption: 808, pumpBands: [808] },
  };

  const dp = dopantParams[dopantType];

  const na = Math.sqrt(coreIndex ** 2 - claddingIndex ** 2);
  const lambdaS = signalWavelength * 1e-9;
  const lambdaP = pumpWavelength * 1e-9;
  const h = 6.626e-34;
  const c = 3e8;

  // Ion density from ppm (weight)
  const ionDensity = useMemo(() => {
    // Approximate: 1000 ppm ≈ 1.2e25 ions/m³ for Er in silica
    const factor = { Er: 1.2e22, Yb: 1.4e22, ErYb: 1.2e22, Tm: 1.0e22, Nd: 1.1e22 };
    return dopantConcentration * factor[dopantType]; // ions/m³
  }, [dopantConcentration, dopantType]);

  // Small-signal gain coefficient
  const smallSignalGainCoeff = useMemo(() => {
    return ionDensity * dp.emissionCross * 1e-3; // per meter (scaled)
  }, [ionDensity, dp.emissionCross]);

  // Small-signal gain (dB)
  const smallSignalGain = useMemo(() => {
    return 4.343 * smallSignalGainCoeff * fiberLength;
  }, [smallSignalGainCoeff, fiberLength]);

  // Saturation power
  const saturationPower = useMemo(() => {
    const Aeff = Math.PI * coreRadius ** 2 * 1e-12; // m²
    return (h * c * lambdaS) / (dp.emissionCross * dp.lifetime * 1e-3 * Aeff) * 1e3; // mW
  }, [lambdaS, dp, coreRadius]);

  // Noise figure (approximate)
  const noiseFigure = useMemo(() => {
    const nf = 3 + 0.5 * Math.log10(pumpPower / 100); // rough model
    return Math.max(3, nf);
  }, [pumpPower]);

  // Pump absorption
  const pumpAbsorption = useMemo(() => {
    return ionDensity * dp.absorptionCross * fiberLength * 4.343;
  }, [ionDensity, dp.absorptionCross, fiberLength]);

  // Plot: gain vs fiber length
  const plotData = useMemo(() => {
    const lengths: number[] = [];
    const gains: number[] = [];

    for (let l = 0.1; l <= 20; l += 0.1) {
      lengths.push(l);
      const g = 4.343 * smallSignalGainCoeff * l;
      // Simple saturation model
      const satFactor = pumpPower / (pumpPower + saturationPower * (1 - Math.exp(-ionDensity * dp.absorptionCross * l)));
      gains.push(g * Math.min(1, satFactor));
    }

    return [
      {
        x: lengths, y: gains, type: "scatter" as const, mode: "lines" as const,
        name: "Gain", line: { color: "#3b82f6", width: 2 },
      },
      {
        x: [fiberLength], y: [smallSignalGain], type: "scatter" as const, mode: "markers" as const,
        name: "Current", marker: { color: "#22c55e", size: 12 },
      },
      {
        x: [0.1, 20], y: [0, 0], type: "scatter" as const, mode: "lines" as const,
        name: "0 dB", line: { color: "#ef4444", width: 1, dash: "dash" as const },
      },
    ];
  }, [smallSignalGainCoeff, fiberLength, smallSignalGain, pumpPower, saturationPower, ionDensity, dp.absorptionCross]);

  const layout = {
    title: "Small-Signal Gain vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true,
    legend: { x: 0.02, y: 0.98 }, height: 400,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Dopant Type</label>
              <select value={dopantType} onChange={(e) => setDopantType(e.target.value as "Er" | "Yb" | "ErYb" | "Tm" | "Nd")}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="Er">Erbium (Er³⁺)</option>
                <option value="Yb">Ytterbium (Yb³⁺)</option>
                <option value="ErYb">Erbium-Ytterbium (Er/Yb)</option>
                <option value="Tm">Thulium (Tm³⁺)</option>
                <option value="Nd">Neodymium (Nd³⁺)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.5" min="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Radius (μm)</label>
              <input type="number" value={coreRadius} onChange={(e) => setCoreRadius(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dopant Concentration (ppm wt)</label>
              <input type="number" value={dopantConcentration} onChange={(e) => setDopantConcentration(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="100" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Power (mW)</label>
              <input type="number" value={pumpPower} onChange={(e) => setPumpPower(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Signal λ (nm)</label>
              <input type="number" value={signalWavelength} onChange={(e) => setSignalWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">NA:</span><span className="font-mono">{na.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Ion density:</span><span className="font-mono">{ionDensity.toExponential(2)} m⁻³</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Gain coefficient:</span><span className="font-mono">{(smallSignalGainCoeff * 1e3).toFixed(2)} /km</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Small-signal gain:</span><span className={`font-mono text-lg text-green-400`}>{smallSignalGain.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Saturation power:</span><span className="font-mono text-blue-400">{saturationPower.toFixed(1)} mW</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Noise figure:</span><span className="font-mono">{noiseFigure.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pump absorption:</span><span className="font-mono">{pumpAbsorption.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Upper-state lifetime:</span><span className="font-mono">{dp.lifetime} ms</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Peak emission:</span><span className="font-mono">{dp.peakEmission} nm</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">G_ss = 4.343 · N · σ_e · L</p>
              <p className="font-mono text-sm mt-1">P_sat = hν · A_eff / (σ_e · τ)</p>
              <p className="font-mono text-sm mt-1">α_p = 4.343 · N · σ_a · L</p>
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
