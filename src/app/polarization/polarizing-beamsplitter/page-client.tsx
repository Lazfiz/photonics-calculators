"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function PBSPage() {
  const [wavelength, setWavelength] = useState(633);
  const [nO, setNO] = useState(1.6557);
  const [nE, setNE] = useState(1.4852);
  const [cutAngleDeg, setCutAngleDeg] = useState(42.5);

  const cutAngle = cutAngleDeg * Math.PI / 180;
  const lamUm = wavelength / 1000;
  const lamMm = wavelength / 1e6;

  // Critical angle for o-ray at air gap (n_o → n_air = 1)
  const criticalO = Math.asin(1 / nO);
  const criticalE = Math.asin(1 / nE);

  // At cut angle, ray inside prism makes angle (90° - cut) with normal to hypotenuse
  const rayAngleAtInterface = Math.PI / 2 - cutAngle;

  const oTIR = rayAngleAtInterface > criticalO;
  const eTIR = rayAngleAtInterface > criticalE;

  // Separation angle (approximate for small birefringence)
  const birefringence = nO - nE;
  const separationDeg = 2 * birefringence * Math.tan(cutAngle) * (180 / Math.PI);

  // Beam walk-off (spatial separation)
  const prismSize = 10; // mm
  const beamSepMm = prismSize * Math.tan(separationDeg * Math.PI / 180);

  // Angular acceptance
  const acceptanceO = (rayAngleAtInterface - criticalO) * 180 / Math.PI;
  const acceptanceE = (cutAngle - criticalE) * 180 / Math.PI;

  const spectralData = useMemo(() => {
    // Birefringence vs wavelength (simplified Cauchy-like model for calcite)
    const wls = Array.from({ length: 300 }, (_, i) => 300 + (i / 300) * 1500);
    const nOs = wls.map(w => nO + 0.01 * ((633 - w) / 300));
    const nEs = wls.map(w => nE + 0.008 * ((633 - w) / 300));
    const bires = nOs.map((no, i) => no - nEs[i]);
    const seps = bires.map(b => 2 * b * Math.tan(cutAngle) * (180 / Math.PI));

    return [
      { x: wls, y: nOs, type: "scatter" as const, mode: "lines" as const, name: "n_o", line: { color: "#60a5fa" } },
      { x: wls, y: nEs, type: "scatter" as const, mode: "lines" as const, name: "n_e", line: { color: "#f87171" } },
      { x: wls, y: bires, type: "scatter" as const, mode: "lines" as const, name: "Δn", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [nO, nE, cutAngle]);

  const angleData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => 30 + (i / 200) * 25);
    const rayAngles = angles.map(a => (Math.PI / 2 - a * Math.PI / 180));
    const oReflect = angles.map(a => {
      const ra = Math.PI / 2 - a * Math.PI / 180;
      return ra > criticalO ? 1 : 0;
    });
    const eTransmit = angles.map(a => {
      const ra = Math.PI / 2 - a * Math.PI / 180;
      return ra > criticalE ? 0 : 1;
    });

    return [
      { x: angles, y: oReflect, type: "scatter" as const, mode: "lines" as const, name: "o-ray (TIR reflect)", line: { color: "#60a5fa", width: 2 } },
      { x: angles, y: eTransmit, type: "scatter" as const, mode: "lines" as const, name: "e-ray (transmit)", line: { color: "#f87171", width: 2 } },
      { x: [cutAngleDeg, cutAngleDeg], y: [0, 1], type: "scatter" as const, mode: "lines" as const, name: "Current cut", line: { color: "#4ade80", dash: "dash" } },
    ];
  }, [cutAngleDeg, criticalO, criticalE]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Polarizing Beamsplitter (PBS) Design" description="Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">θ<sub>c,o</sub> = arcsin(1/n<sub>o</sub>), θ<sub>c,e</sub> = arcsin(1/n<sub>e</sub>)</p>
        <p className="text-gray-300 text-sm font-mono">Ray angle at interface = 90° − θ<sub>cut</sub></p>
        <p className="text-gray-500 text-xs mt-1">o-ray TIR → reflected, e-ray transmits → orthogonal output beams</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={300} max={2000} step="1" />
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>o</sub></span>
          <input type="number" value={nO} onChange={e => setNO(+e.target.value)} step="0.001" min="1.3" max="2.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>e</sub></span>
          <input type="number" value={nE} onChange={e => setNE(+e.target.value)} step="0.001" min="1.3" max="2.5"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <ValidatedNumberInput label="Cut Angle (°)" value={cutAngleDeg} onChange={setCutAngleDeg} min={30} max={60} step="0.5" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.6557); setNE(1.4852); setCutAngleDeg(42.5); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite (633nm)</button>
        <button onClick={() => { setNO(1.658); setNE(1.486); setCutAngleDeg(45); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite (broadband)</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); setCutAngleDeg(38); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNO(1.973); setNE(2.165); setCutAngleDeg(35); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Rutile</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Birefringence (Δn)</p>
          <p className="text-2xl font-bold text-blue-400">{birefringence.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">o-ray TIR</p>
          <p className={`text-2xl font-bold ${oTIR ? "text-green-400" : "text-red-400"}`}>{oTIR ? "✓ Yes" : "✗ No"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Beam Separation</p>
          <p className="text-2xl font-bold text-yellow-400">{separationDeg.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">θ<sub>c,o</sub> / θ<sub>c,e</sub></p>
          <p className="text-lg font-bold text-purple-400">{(criticalO * 180 / Math.PI).toFixed(1)}° / {(criticalE * 180 / Math.PI).toFixed(1)}°</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Refractive Indices vs Wavelength</h3>
          <ChartPanel data={spectralData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Refractive Index", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">TIR / Transmission vs Cut Angle</h3>
          <ChartPanel data={angleData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Cut Angle (°)", gridcolor: "#374151" },
            yaxis: { title: "Fraction", gridcolor: "#374151", range: [-0.1, 1.1] },
            margin: { t: 20, r: 20, b: 50, l: 50 },
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
