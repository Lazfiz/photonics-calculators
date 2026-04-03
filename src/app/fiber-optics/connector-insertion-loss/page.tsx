"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function ConnectorInsertionLossPage() {
  const [connectorType, setConnectorType] = useState<"FC" | "SC" | "LC" | "ST" | "MU" | "MPO">("SC");
  const [polishType, setPolishType] = useState<"PC" | "UPC" | "APC">("UPC");
  const [numConnectors, setNumConnectors] = useState(4);
  const [fiberCoreDiam, setFiberCoreDiam] = useState(9); // µm MFD
  const [lateralOffset, setLateralOffset] = useState(0.3); // µm
  const [angularMisalign, setAngularMisalign] = useState(0.3); // degrees
  const [gapDistance, setGapDistance] = useState(0.05); // µm
  const [refractiveIndex, setRefractiveIndex] = useState(1.468);
  const [wavelength, setWavelength] = useState(1550); // nm

  // Typical connector losses by type
  const typicalLoss: Record<string, Record<string, number>> = {
    FC: { PC: 0.5, UPC: 0.3, APC: 0.4 },
    SC: { PC: 0.5, UPC: 0.3, APC: 0.35 },
    LC: { PC: 0.4, UPC: 0.25, APC: 0.3 },
    ST: { PC: 0.5, UPC: 0.3, APC: 0.4 },
    MU: { PC: 0.4, UPC: 0.3, APC: 0.35 },
    MPO: { PC: 0.7, UPC: 0.5, APC: 0.55 },
  };

  const typicalRL: Record<string, Record<string, number>> = {
    FC: { PC: 35, UPC: 50, APC: 60 },
    SC: { PC: 35, UPC: 50, APC: 60 },
    LC: { PC: 30, UPC: 50, APC: 60 },
    ST: { PC: 35, UPC: 50, APC: 60 },
    MU: { PC: 30, UPC: 45, APC: 55 },
    MPO: { PC: 20, UPC: 35, APC: 45 },
  };

  const calc = useMemo(() => {
    const w = fiberCoreDiam / 2; // mode field radius
    const lambda = wavelength * 1e-3; // µm

    // Fresnel reflection loss (two air-glass interfaces)
    const R = ((refractiveIndex - 1) / (refractiveIndex + 1)) ** 2;
    const fresnelLoss = -10 * Math.log10(1 - R); // dB per interface
    const totalFresnel = fresnelLoss * 2; // two surfaces

    // Lateral offset loss (Gaussian beam)
    const latLoss = 4.343 * (lateralOffset / w) ** 2;

    // Angular misalignment loss
    const theta = (angularMisalign * Math.PI) / 180;
    const angLoss = 4.343 * (Math.PI * w * refractiveIndex * Math.sin(theta) / lambda) ** 2;

    // Gap loss (Fresnel already counted, this is just diffraction)
    const gapLoss = gapDistance > 0
      ? -10 * Math.log10(1 / (1 + (gapDistance * lambda / (Math.PI * w * w)) ** 2))
      : 0;

    // Physical contact reduces gap and Fresnel loss
    const contactFactor = polishType === "PC" ? 0.3 : polishType === "UPC" ? 0.1 : 0.1;
    const effectiveGapLoss = gapLoss * contactFactor;
    const effectiveFresnel = polishType === "APC" ? 0.05 : contactFactor * totalFresnel;

    const totalLoss = latLoss + angLoss + effectiveGapLoss + effectiveFresnel;

    // Return loss
    const apcAngle = polishType === "APC" ? 8 : 0; // degrees
    const apcRL = apcAngle > 0 ? -10 * Math.log10(R) + 2 * (-10 * Math.log10(Math.cos(apcAngle * Math.PI / 180) ** 4)) : -10 * Math.log10(R);

    // Budget
    const typicalLossPer = typicalLoss[connectorType][polishType];
    const budgetTypical = typicalLossPer * numConnectors;
    const budgetWorst = (typicalLossPer + 0.2) * numConnectors;

    return {
      latLoss, angLoss, effectiveGapLoss, effectiveFresnel, totalLoss,
      R, fresnelLoss, apcRL, budgetTypical, budgetWorst, typicalLossPer,
      typicalRL: typicalRL[connectorType][polishType],
    };
  }, [connectorType, polishType, numConnectors, fiberCoreDiam, lateralOffset, angularMisalign, gapDistance, refractiveIndex, wavelength]);

  const offsetData = useMemo(() => {
    const offsets = Array.from({ length: 100 }, (_, i) => i * 0.05);
    const w = fiberCoreDiam / 2;
    const loss = offsets.map(d => 4.343 * (d / w) ** 2);
    return [{ x: offsets, y: loss, type: "scatter" as const, mode: "lines" as const, name: "Loss (dB)", line: { color: "#f87171", width: 2 } }];
  }, [fiberCoreDiam]);

  const budgetData = useMemo(() => {
    const counts = Array.from({ length: 20 }, (_, i) => i + 1);
    const typical = typicalLoss[connectorType][polishType];
    return [
      { x: counts, y: counts.map(n => typical * n), type: "scatter" as const, mode: "lines" as const, name: "Typical", line: { color: "#22c55e", width: 2 }, fill: "tozeroy" as const, fillcolor: "rgba(34,197,94,0.1)" },
      { x: counts, y: counts.map(n => (typical + 0.2) * n), type: "scatter" as const, mode: "lines" as const, name: "Worst Case", line: { color: "#f87171", width: 2, dash: "dash" } },
    ];
  }, [connectorType, polishType]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/fiber-optics" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Fiber Optics</Link>
      <h1 className="text-3xl font-bold mb-2">Connector Insertion Loss</h1>
      <p className="text-gray-400 mb-8">Calculate connector insertion loss from misalignment parameters and build link budgets for different connector types.</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <label className="block">
          <span className="text-gray-300 text-sm">Connector Type</span>
          <select value={connectorType} onChange={e => setConnectorType(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {["FC", "SC", "LC", "ST", "MU", "MPO"].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Polish Type</span>
          <select value={polishType} onChange={e => setPolishType(e.target.value as any)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="PC">PC (Physical Contact)</option>
            <option value="UPC">UPC (Ultra PC)</option>
            <option value="APC">APC (Angled PC)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Number of Connectors</span>
          <input type="number" value={numConnectors} onChange={e => setNumConnectors(+e.target.value)} min={1}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Lateral Offset (µm)</span>
          <input type="number" value={lateralOffset} onChange={e => setLateralOffset(+e.target.value)} step="0.05" min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Angular Misalign (°)</span>
          <input type="number" value={angularMisalign} onChange={e => setAngularMisalign(+e.target.value)} step="0.1" min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">End-face Gap (µm)</span>
          <input type="number" value={gapDistance} onChange={e => setGapDistance(+e.target.value)} step="0.01" min={0}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">MFD (µm)</span>
          <input type="number" value={fiberCoreDiam} onChange={e => setFiberCoreDiam(+e.target.value)} step="0.1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Refractive Index</span>
          <input type="number" value={refractiveIndex} onChange={e => setRefractiveIndex(+e.target.value)} step="0.001"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="1"
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Lateral Loss</p>
          <p className="text-xl font-bold text-red-400">{calc.latLoss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Angular Loss</p>
          <p className="text-xl font-bold text-blue-400">{calc.angLoss.toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fresnel/Gap</p>
          <p className="text-xl font-bold text-yellow-400">{(calc.effectiveFresnel + calc.effectiveGapLoss).toFixed(3)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total per Connector</p>
          <p className="text-xl font-bold text-green-400">{calc.totalLoss.toFixed(3)} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">{connectorType}-{polishType} Typical IL</p>
          <p className="text-xl font-bold text-cyan-400">{calc.typicalLossPer.toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Budget (typical ×{numConnectors})</p>
          <p className="text-xl font-bold text-green-400">{calc.budgetTypical.toFixed(2)} dB</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Typical Return Loss</p>
          <p className="text-xl font-bold text-purple-400">{calc.typicalRL} dB</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Loss vs Lateral Offset</h3>
          <Plot data={offsetData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Offset (µm)", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Loss (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 300,
            shapes: [{ type: "line" as const, x0: lateralOffset, x1: lateralOffset, y0: 0, y1: 5, line: { color: "#fbbf24", dash: "dash" } }],
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Link Budget vs # Connectors</h3>
          <Plot data={budgetData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            xaxis: { title: "Number of Connectors", gridcolor: "#374151", color: "#9ca3af" },
            yaxis: { title: "Total Loss (dB)", gridcolor: "#374151", color: "#9ca3af" },
            font: { color: "#e5e7eb" }, margin: { t: 20, r: 20, b: 40, l: 50 }, height: 300,
            legend: { bgcolor: "transparent", font: { color: "#9ca3af" } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Formulas & Notes</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>Fresnel: R = ((n-1)/(n+1))², Loss = -10·log₁₀(1-R)</p>
          <p>Lateral: α_lat = 4.343·(d/w)² dB</p>
          <p>Angular: α_ang = 4.343·(π·n·w·sin(θ)/λ)² dB</p>
          <p>APC polish angle: 8°, eliminates Fresnel back-reflection</p>
          <p>Typical IL: {connectorType}-{polishType} = {calc.typicalLossPer} dB, RL = {calc.typicalRL} dB</p>
        </div>
      </div>
    </div>
  );
}
