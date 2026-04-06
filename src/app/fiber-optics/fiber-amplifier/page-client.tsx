"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";


export default function FiberAmplifierCalculator() {
  const [amplifierType, setAmplifierType] = useState<"EDFA" | "YDFA">("EDFA");
  const [fiberLength, setFiberLength] = useURLState("fiberLength", 10); // m
  const [pumpPower, setPumpPower] = useURLState("pumpPower", 200); // mW
  const [pumpWavelength, setPumpWavelength] = useURLState("pumpWavelength", 980); // nm
  const [signalWavelength, setSignalWavelength] = useURLState("signalWavelength", 1550); // nm
  const [inputPower, setInputPower] = useState<number>(-10); // dBm
  const [erbiumConc, setErbiumConc] = useURLState("erbiumConc", 1e24); // ions/m³
  const [coreRadius, setCoreRadius] = useURLState("coreRadius", 2.2); // µm
  const [overlap, setOverlap] = useURLState("overlap", 0.8); // Γ factor

  // Emission and absorption cross-sections (approximate)
  const crossSections = useMemo(() => {
    if (amplifierType === "EDFA") {
      return { emission: 3.5e-25, absorption: 2.5e-25 }; // m² at 1550nm
    }
    return { emission: 2.8e-25, absorption: 0.8e-25 }; // m² at 1064nm for YDFA
  }, [amplifierType]);

  // Gain in dB
  const smallSignalGain = useMemo(() => {
    const A = Math.PI * (coreRadius * 1e-6) ** 2; // core area m²
    const Nt = erbiumConc;
    const se = crossSections.emission;
    const sa = crossSections.absorption;
    // Simplified gain: G ≈ Γ · (se·N2 - sa·N1) · L
    // For fully inverted: N2 ≈ Nt, N1 ≈ 0
    const g = overlap * se * Nt * fiberLength;
    const gainLinear = Math.exp(g);
    return 10 * Math.log10(gainLinear);
  }, [amplifierType, fiberLength, erbiumConc, coreRadius, overlap, crossSections]);

  // Pump absorption
  const pumpAbsorption = useMemo(() => {
    const alpha = 0.5; // dB/m typical
    return Math.min(alpha * fiberLength, 30);
  }, [fiberLength]);

  // Saturated gain (simplified)
  const saturatedGain = useMemo(() => {
    const PoutLinear = Math.pow(10, inputPower / 10) * 1e-3; // W
    const Psat = 10e-3; // 10 mW saturation power
    const Gss = Math.pow(10, smallSignalGain / 10);
    const Gsat = 1 + (Gss - 1) / (1 + PoutLinear / Psat);
    return 10 * Math.log10(Gsat);
  }, [smallSignalGain, inputPower]);

  // Output power
  const outputPower = inputPower + saturatedGain;

  // NF (noise figure) estimate
  const noiseFigure = useMemo(() => {
    const nf = 3 * Math.exp(-pumpPower / 100); // rough model
    return 3 + nf * 2; // 3-5 dB typical
  }, [pumpPower]);

  // Gain vs wavelength
  const gainSpectrum = useMemo(() => {
    const wavelengths: number[] = [];
    const gains: number[] = [];

    const range = amplifierType === "EDFA" ? [1500, 1620] : [1030, 1100];

    for (let w = range[0]; w <= range[1]; w += 0.5) {
      wavelengths.push(w);

      let se, sa;
      if (amplifierType === "EDFA") {
        // Approximate EDFA gain spectrum (peaks at ~1530 and ~1550)
        const g1530 = 7e-25 * Math.exp(-0.5 * ((w - 1530) / 8) ** 2);
        const g1550 = 3.5e-25 * Math.exp(-0.5 * ((w - 1550) / 20) ** 2);
        se = g1530 + g1550;
        sa = 2.5e-25 * Math.exp(-0.5 * ((w - 1530) / 12) ** 2);
      } else {
        se = 2.8e-25 * Math.exp(-0.5 * ((w - 1064) / 15) ** 2);
        sa = 0.8e-25 * Math.exp(-0.5 * ((w - 1040) / 10) ** 2);
      }

      const A = Math.PI * (coreRadius * 1e-6) ** 2;
      const g = overlap * (se - sa) * erbiumConc * fiberLength;
      const gainLin = Math.exp(g);
      gains.push(10 * Math.log10(gainLin));
    }

    return [{ x: wavelengths, y: gains, type: "scatter" as const, mode: "lines" as const, name: "Small-Signal Gain (dB)", line: { color: "#10b981", width: 2 } }];
  }, [amplifierType, fiberLength, erbiumConc, coreRadius, overlap]);

  // Gain vs pump power
  const gainVsPump = useMemo(() => {
    const pumps: number[] = [];
    const gains: number[] = [];

    for (let p = 0; p <= 500; p += 2) {
      pumps.push(p);
      // Gain increases with pump power, saturates
      const inversion = p / (p + 50); // simplified inversion
      const A = Math.PI * (coreRadius * 1e-6) ** 2;
      const g = overlap * (crossSections.emission * inversion - crossSections.absorption * (1 - inversion)) * erbiumConc * fiberLength;
      const gainLin = Math.exp(g);
      gains.push(10 * Math.log10(gainLin));
    }

    return [{ x: pumps, y: gains, type: "scatter" as const, mode: "lines" as const, name: "Gain (dB)", line: { color: "#3b82f6", width: 2 } }];
  }, [fiberLength, erbiumConc, coreRadius, overlap, crossSections]);

  const layout1 = {
    title: `${amplifierType} Gain Spectrum`,
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Gain vs Pump Power",
    xaxis: { title: "Pump Power (mW)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amplifier Type</label>
              <select value={amplifierType} onChange={(e) => {
                setAmplifierType(e.target.value as "EDFA" | "YDFA");
                if (e.target.value === "EDFA") {
                  setSignalWavelength(1550); setPumpWavelength(980);
                  setErbiumConc(1e24); setCoreRadius(2.2);
                } else {
                  setSignalWavelength(1064); setPumpWavelength(976);
                  setErbiumConc(3e25); setCoreRadius(3.5);
                }
              }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="EDFA">EDFA (Erbium-Doped)</option>
                <option value="YDFA">YDFA (Ytterbium-Doped)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Power (mW)</label>
              <input type="number" value={pumpPower} onChange={(e) => setPumpPower(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pump Wavelength (nm)</label>
              <input type="number" value={pumpWavelength} onChange={(e) => setPumpWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Signal Wavelength (nm)</label>
              <input type="number" value={signalWavelength} onChange={(e) => setSignalWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Input Signal Power (dBm)</label>
              <input type="number" value={inputPower} onChange={(e) => setInputPower(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dopant Conc. (ions/m³)</label>
                <input type="number" value={erbiumConc} onChange={(e) => setErbiumConc(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1e23" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Overlap Factor Γ</label>
                <input type="number" value={overlap} onChange={(e) => setOverlap(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.05" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Small-signal gain:</span><span className="font-mono text-green-400 text-lg">{smallSignalGain.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Saturated gain:</span><span className="font-mono">{saturatedGain.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Output power:</span><span className="font-mono text-blue-400">{outputPower.toFixed(1)} dBm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Noise figure (est.):</span><span className="font-mono text-yellow-400">{noiseFigure.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Pump absorption:</span><span className="font-mono">{pumpAbsorption.toFixed(1)} dB</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">G = exp(Γ · (σ_e·N₂ - σ_a·N₁) · L)</p>
              <p className="font-mono text-sm mt-1">NF ≥ 2·n_sp·(G-1)/G ≈ 3 dB (quantum limit)</p>
              <p className="font-mono text-sm mt-1">G_sat = G_ss / (1 + P/P_sat)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={gainSpectrum} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={gainVsPump} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
