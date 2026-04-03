"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function RareEarthFiberCalculator() {
  const [dopant, setDopant] = useState<"Er" | "Yb" | "Er/Yb" | "Tm" | "Ho">("Er");
  const [dopantConcentration, setDopantConcentration] = useState<number>(1e24); // ions/m³
  const [fiberLength, setFiberLength] = useState<number>(5); // m
  const [coreDiameter, setCoreDiameter] = useState<number>(4.4); // µm
  const [numericalAperture, setNumericalAperture] = useState<number>(0.16);
  const [pumpWavelength, setPumpWavelength] = useState<number>(980); // nm
  const [signalWavelength, setSignalWavelength] = useState<number>(1550); // nm
  const [overlapFactor, setOverlapFactor] = useState<number>(0.75);

  // Dopant properties
  const dopantInfo = useMemo(() => {
    const info: Record<string, { name: string; pumpBands: number[]; signalRange: [number, number]; absCross: number; emCross: number; lifetime: number; color: string }> = {
      "Er": { name: "Erbium (Er³⁺)", pumpBands: [980, 1480], signalRange: [1500, 1620], absCross: 2.5e-25, emCross: 3.5e-25, lifetime: 10, color: "#10b981" },
      "Yb": { name: "Ytterbium (Yb³⁺)", pumpBands: [915, 976], signalRange: [1030, 1100], absCross: 0.8e-25, emCross: 2.8e-25, lifetime: 0.84, color: "#3b82f6" },
      "Er/Yb": { name: "Erbium-Ytterbium (Er³⁺/Yb³⁺)", pumpBands: [915, 976], signalRange: [1530, 1565], absCross: 2.0e-25, emCross: 3.2e-25, lifetime: 8, color: "#8b5cf6" },
      "Tm": { name: "Thulium (Tm³⁺)", pumpBands: [790, 1150], signalRange: [1800, 2100], absCross: 1.5e-25, emCross: 1.8e-25, lifetime: 0.4, color: "#ef4444" },
      "Ho": { name: "Holmium (Ho³⁺)", pumpBands: [1150, 1950], signalRange: [2050, 2200], absCross: 0.5e-25, emCross: 1.2e-25, lifetime: 3, color: "#f59e0b" },
    };
    return info[dopant];
  }, [dopant]);

  // Core area
  const coreArea = Math.PI * (coreDiameter / 2 * 1e-6) ** 2;

  // Total number of dopant ions
  const totalIons = dopantConcentration * coreArea * fiberLength;

  // Absorption at pump wavelength (dB/m)
  const absorptionPerMeter = useMemo(() => {
    return overlapFactor * dopantInfo.absCross * dopantConcentration * 4.343; // convert to dB/m
  }, [overlapFactor, dopantConcentration, dopantInfo]);

  // Total pump absorption
  const totalAbsorption = absorptionPerMeter * fiberLength;

  // Small-signal gain
  const smallSignalGain = useMemo(() => {
    const g = overlapFactor * dopantInfo.emCross * dopantConcentration * fiberLength;
    return 10 * Math.log10(Math.exp(g));
  }, [overlapFactor, dopantInfo, dopantConcentration, fiberLength]);

  // Optimal length (for ~90% pump absorption)
  const optimalLength = useMemo(() => {
    if (absorptionPerMeter <= 0) return fiberLength;
    return 2.3 / absorptionPerMeter; // ln(10)/absorption ≈ 90% absorbed
  }, [absorptionPerMeter]);

  // V-number
  const vNumber = useMemo(() => {
    const lambda = signalWavelength * 1e-9;
    return Math.PI * (coreDiameter / 2 * 1e-6) * numericalAperture / lambda;
  }, [coreDiameter, numericalAperture, signalWavelength]);

  // Absorption spectrum
  const absSpectrum = useMemo(() => {
    const wavelengths: number[] = [];
    const absorption: number[] = [];

    const [start, end] = dopantInfo.signalRange;
    for (let w = start - 50; w <= end + 50; w += 1) {
      wavelengths.push(w);
      // Gaussian approximation centered on pump band
      const pumpCenter = dopantInfo.pumpBands[0];
      const abs = dopantInfo.absCross * Math.exp(-0.5 * ((w - pumpCenter) / 30) ** 2) * dopantConcentration * 4.343 * fiberLength * overlapFactor;
      absorption.push(abs);
    }

    return [{ x: wavelengths, y: absorption, type: "scatter" as const, mode: "lines" as const, name: "Absorption (dB)", line: { color: "#ef4444", width: 2 }, fill: "tozeroy" }];
  }, [dopantInfo, dopantConcentration, fiberLength, overlapFactor]);

  // Gain vs fiber length
  const gainVsLength = useMemo(() => {
    const lengths: number[] = [];
    const gains: number[] = [];
    const absorbed: number[] = [];

    for (let l = 0; l <= 30; l += 0.2) {
      lengths.push(l);
      const g = overlapFactor * dopantInfo.emCross * dopantConcentration * l;
      gains.push(10 * Math.log10(Math.exp(g)));
      absorbed.push(100 * (1 - Math.exp(-absorptionPerMeter * l)));
    }

    return [
      { x: lengths, y: gains, type: "scatter" as const, mode: "lines" as const, name: "Gain (dB)", line: { color: "#10b981", width: 2 }, yaxis: "y" },
      { x: lengths, y: absorbed, type: "scatter" as const, mode: "lines" as const, name: "Pump Absorbed (%)", line: { color: "#f59e0b", width: 2 }, yaxis: "y2" },
    ];
  }, [dopantInfo, dopantConcentration, fiberLength, overlapFactor, absorptionPerMeter]);

  const layout1 = {
    title: `${dopantInfo.name} Absorption Profile`,
    xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
    yaxis: { title: "Absorption (dB)", gridcolor: "#374151" },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Gain & Pump Absorption vs Fiber Length",
    xaxis: { title: "Fiber Length (m)", gridcolor: "#374151" },
    yaxis: { title: "Gain (dB)", gridcolor: "#374151", titlefont: { color: "#10b981" } },
    yaxis2: { title: "Pump Absorbed (%)", gridcolor: "#374151", overlaying: "y", side: "right", titlefont: { color: "#f59e0b" }, range: [0, 105] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 mb-6 inline-block">← Back to Fiber Optics</Link>
        <h1 className="text-3xl font-bold mb-2">Rare Earth Fiber Design Calculator</h1>
        <p className="text-gray-400 mb-8">Design Er³⁺, Yb³⁺, Tm³⁺, Ho³⁺, and co-doped fibers — absorption, gain, optimal length</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Dopant Ion</label>
              <select value={dopant} onChange={(e) => {
                const d = e.target.value as "Er" | "Yb" | "Er/Yb" | "Tm" | "Ho";
                setDopant(d);
                if (d === "Er") { setPumpWavelength(980); setSignalWavelength(1550); setDopantConcentration(1e24); }
                else if (d === "Yb") { setPumpWavelength(976); setSignalWavelength(1064); setDopantConcentration(3e25); }
                else if (d === "Er/Yb") { setPumpWavelength(976); setSignalWavelength(1550); setDopantConcentration(5e24); }
                else if (d === "Tm") { setPumpWavelength(790); setSignalWavelength(1950); setDopantConcentration(2e24); }
                else { setPumpWavelength(1150); setSignalWavelength(2100); setDopantConcentration(5e23); }
              }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
                <option value="Er">Er³⁺ (Erbium)</option>
                <option value="Yb">Yb³⁺ (Ytterbium)</option>
                <option value="Er/Yb">Er³⁺/Yb³⁺ (Co-doped)</option>
                <option value="Tm">Tm³⁺ (Thulium)</option>
                <option value="Ho">Ho³⁺ (Holmium)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dopant Concentration (ions/m³)</label>
              <input type="number" value={dopantConcentration} onChange={(e) => setDopantConcentration(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1e23" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Core Diameter (µm)</label>
              <input type="number" value={coreDiameter} onChange={(e) => setCoreDiameter(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Numerical Aperture</label>
              <input type="number" value={numericalAperture} onChange={(e) => setNumericalAperture(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.01" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Overlap Factor Γ</label>
              <input type="number" value={overlapFactor} onChange={(e) => setOverlapFactor(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.05" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">{dopantInfo.name} Properties</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Pump bands:</span><span className="font-mono">{dopantInfo.pumpBands.join(", ")} nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Signal range:</span><span className="font-mono">{dopantInfo.signalRange[0]}–{dopantInfo.signalRange[1]} nm</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Upper state lifetime:</span><span className="font-mono">{dopantInfo.lifetime} ms</span></div>
                <div className="flex justify-between"><span className="text-gray-400">σ_absorption:</span><span className="font-mono">{(dopantInfo.absCross * 1e25).toFixed(1)} × 10⁻²⁵ m²</span></div>
                <div className="flex justify-between"><span className="text-gray-400">σ_emission:</span><span className="font-mono">{(dopantInfo.emCross * 1e25).toFixed(1)} × 10⁻²⁵ m²</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Design Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Absorption:</span><span className="font-mono">{absorptionPerMeter.toFixed(1)} dB/m ({totalAbsorption.toFixed(1)} dB total)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Small-signal gain:</span><span className="font-mono text-green-400 text-lg">{smallSignalGain.toFixed(1)} dB</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Optimal length (~90% abs.):</span><span className="font-mono text-yellow-400">{optimalLength.toFixed(1)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">V-number:</span><span className="font-mono">{vNumber.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Total ions in fiber:</span><span className="font-mono">{totalIons.toExponential(2)}</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">α = Γ · σ_abs · N_t · 4.343 (dB/m)</p>
              <p className="font-mono text-sm mt-1">G = exp(Γ · σ_em · N_t · L)</p>
              <p className="font-mono text-sm mt-1">L_opt ≈ 2.3 / α (90% pump absorption)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <Plot data={absSpectrum} layout={layout1} config={{ responsive: true }} className="w-full" />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <Plot data={gainVsLength} layout={layout2} config={{ responsive: true }} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
