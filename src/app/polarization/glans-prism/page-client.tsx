"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function GlansPrismPage() {
  const [wavelength, setWavelength] = useURLState("wavelength", 589);
  const [nO, setNO] = useURLState("nO", 1.658);
  const [nE, setNE] = useURLState("nE", 1.486);
  const [cutAngleDeg, setCutAngleDeg] = useURLState("cutAngleDeg", 38.3);
  const [prismType, setPrismType] = useState<"taylor" | "thompson">("taylor");

  const cutAngle = cutAngleDeg * Math.PI / 180;

  // Glan-Taylor: air gap between two calcite prisms
  // Glan-Thompson: cement between prisms (higher acceptance, lower damage threshold)
  const gapIndex = prismType === "taylor" ? 1.0 : 1.54; // air or Canada balsam

  // Critical angles
  const criticalO = Math.asin(gapIndex / nO);
  const criticalE = Math.asin(gapIndex / nE);

  // Ray angle at interface
  const rayAngle = Math.PI / 2 - cutAngle;

  const oTIR = rayAngle >= criticalO;
  const eTIR = rayAngle >= criticalE;

  // Field of view (half-angle)
  // Max angle where o-ray still TIR and e-ray still transmits
  const maxAngleForTIR = (Math.PI / 2 - criticalO) * 180 / Math.PI;
  const minAngleForTransmit = (Math.PI / 2 - criticalE) * 180 / Math.PI;

  // FOV approximation
  const fovHalf = Math.min(
    Math.abs(cutAngleDeg - maxAngleForTIR),
    Math.abs(minAngleForTransmit - cutAngleDeg)
  );

  // Length-to-aperture ratio
  const LA_ratio = prismType === "taylor"
    ? 2 * Math.tan(cutAngle) + 1
    : 3 * Math.tan(cutAngle) + 1;

  // Transmission losses
  const brewsterAngle = Math.atan(nE / gapIndex);
  const RpBrewster = 0;
  const RsBrewster = ((nE * Math.cos(brewsterAngle) - gapIndex * Math.cos(Math.asin(gapIndex / nE * Math.sin(brewsterAngle)))) /
    (nE * Math.cos(brewsterAngle) + gapIndex * Math.cos(Math.asin(gapIndex / nE * Math.sin(brewsterAngle))))) ** 2;

  const transmissionData = useMemo(() => {
    const angles = Array.from({ length: 300 }, (_, i) => (i / 300) * 15 - 5);
    const To = angles.map(a => {
      const ra = rayAngle + a * Math.PI / 180;
      return ra >= criticalO ? 0.96 : 0;
    });
    const Te = angles.map(a => {
      const ra = rayAngle + a * Math.PI / 180;
      return ra < criticalE ? 0.92 : 0;
    });
    return [
      { x: angles, y: To, type: "scatter" as const, mode: "lines" as const, name: "o-ray (reflected)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: Te, type: "scatter" as const, mode: "lines" as const, name: "e-ray (transmitted)", line: { color: "#f87171", width: 2 } },
      { x: [0, 0], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Normal", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [rayAngle, criticalO, criticalE]);

  const spectralData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + (i / 300) * 1500);
    const dn = wls.map(w => (nO - nE) + 0.005 * ((589 - w) / 400));
    const criticalOArr = wls.map(() => criticalO * 180 / Math.PI);
    const criticalEArr = wls.map(() => criticalE * 180 / Math.PI);
    return [
      { x: wls, y: dn, type: "scatter" as const, mode: "lines" as const, name: "Δn (birefringence)", line: { color: "#a78bfa", width: 2 } },
    ];
  }, [nO, nE, criticalO, criticalE]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Glan Prism Polarizer Design" description="Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">θ<sub>c,o</sub> = arcsin(n<sub>gap</sub>/n<sub>o</sub>), θ<sub>c,e</sub> = arcsin(n<sub>gap</sub>/n<sub>e</sub>)</p>
        <p className="text-gray-300 text-sm font-mono">Glan-Taylor: n<sub>gap</sub> = 1 (air), Glan-Thompson: n<sub>gap</sub> ≈ 1.54 (cement)</p>
      </div>

      <div role="group" aria-label="Options" className="flex gap-4 mb-6">
        <button onClick={() => setPrismType("taylor")} className={`text-sm px-4 py-2 rounded ${prismType === "taylor" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>Glan-Taylor (Air)</button>
        <button onClick={() => setPrismType("thompson")} className={`text-sm px-4 py-2 rounded ${prismType === "thompson" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>Glan-Thompson (Cement)</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={2500} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>o</sub></span>
          <ValidatedNumberInput label="no" value={nO} onChange={setNO} step="0.001" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>e</sub></span>
          <ValidatedNumberInput label="ne" value={nE} onChange={setNE} step="0.001" />
        </label>
        <ValidatedNumberInput label="Cut Angle (°)" value={cutAngleDeg} onChange={setCutAngleDeg} min={30} max={55} step="0.5" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.658); setNE(1.486); setCutAngleDeg(38.3); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite (589nm)</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); setCutAngleDeg(40); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNO(1.973); setNE(2.165); setCutAngleDeg(32); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Rutile</button>
        <button onClick={() => setCutAngleDeg(Math.round((maxAngleForTIR + minAngleForTransmit) / 2 * 10) / 10)} className="text-xs bg-blue-900 hover:bg-blue-800 border border-blue-700 rounded px-2 py-1 text-blue-300">Optimal Cut</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">o-ray TIR</p>
          <p className={`text-2xl font-bold ${oTIR ? "text-green-400" : "text-red-400"}`}>{oTIR ? "✓" : "✗"} {(criticalO * 180 / Math.PI).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">e-ray Transmits</p>
          <p className={`text-2xl font-bold ${!eTIR ? "text-green-400" : "text-red-400"}`}>{!eTIR ? "✓" : "✗"} {(criticalE * 180 / Math.PI).toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">FOV (half-angle)</p>
          <p className="text-2xl font-bold text-yellow-400">{fovHalf.toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">L/A Ratio</p>
          <p className="text-2xl font-bold text-purple-400">{LA_ratio.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Comparison</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Extinction Ratio</span><span className="text-white">{prismType === "taylor" ? "> 100,000:1" : "> 100,000:1"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Damage Threshold</span><span className="text-white">{prismType === "taylor" ? "~500 MW/cm²" : "~100 MW/cm²"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Spectral Range</span><span className="text-white">{prismType === "taylor" ? "210–2300 nm" : "350–2000 nm"}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Aperture</span><span className="text-white">{prismType === "taylor" ? "Smaller" : "Larger"}</span></div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Birefringence vs Wavelength</h3>
          <ChartPanel data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Δn", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
            height: 200,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Angular Acceptance (transmission vs incidence angle)</h3>
        <ChartPanel data={transmissionData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Off-axis Angle (°)", gridcolor: "#374151" },
          yaxis: { title: "Transmission", gridcolor: "#374151", range: [-0.05, 1.05] },
          margin: { t: 20, r: 20, b: 50, l: 50 },
        }} />
      </div>
    </CalculatorShell>
  );
}
