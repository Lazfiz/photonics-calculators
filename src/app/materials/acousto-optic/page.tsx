"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


interface AOMaterial {
  name: string;
  density: number; // kg/m³
  soundVelocity: number; // m/s
  refractiveIndex: number;
  M2_10e15: number; // figure of merit M₂ × 10⁻¹⁵ s³/kg
  opticalTransmissionMin: number; // μm
  opticalTransmissionMax: number; // μm
  acousticLoss: number; // dB/cm·GHz²
  wavelength: number; // measurement wavelength (nm)
}

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"];

const materials: Record<string, AOMaterial> = {
  "TeO₂": {
    name: "TeO₂ (Tellurium Dioxide)", density: 5990, soundVelocity: 617,
    refractiveIndex: 2.26, M2_10e15: 793,
    opticalTransmissionMin: 0.35, opticalTransmissionMax: 5.0,
    acousticLoss: 15, wavelength: 633,
  },
  "PbMoO₄": {
    name: "PbMoO₄ (Lead Molybdate)", density: 6810, soundVelocity: 3632,
    refractiveIndex: 2.39, M2_10e15: 36.3,
    opticalTransmissionMin: 0.42, opticalTransmissionMax: 5.5,
    acousticLoss: 5, wavelength: 633,
  },
  " quartz": {
    name: "Fused Silica (SiO₂)", density: 2200, soundVelocity: 5960,
    refractiveIndex: 1.46, M2_10e15: 1.56,
    opticalTransmissionMin: 0.18, opticalTransmissionMax: 3.5,
    acousticLoss: 2, wavelength: 633,
  },
  "BGO": {
    name: "BGO (Bi₁₂GeO₂₀)", density: 9200, soundVelocity: 3340,
    refractiveIndex: 2.55, M2_10e15: 29.4,
    opticalTransmissionMin: 0.45, opticalTransmissionMax: 6.0,
    acousticLoss: 4, wavelength: 633,
  },
  "GaP": {
    name: "GaP (Gallium Phosphide)", density: 4130, soundVelocity: 6320,
    refractiveIndex: 3.31, M2_10e15: 44.6,
    opticalTransmissionMin: 0.6, opticalTransmissionMax: 12.0,
    acousticLoss: 3, wavelength: 1064,
  },
  "Ge": {
    name: "Ge (Germanium)", density: 5323, soundVelocity: 5400,
    refractiveIndex: 4.0, M2_10e15: 540,
    opticalTransmissionMin: 2.0, opticalTransmissionMax: 14.0,
    acousticLoss: 10, wavelength: 10600,
  },
  "Tl₃AsSe₃": {
    name: "Tl₃AsSe₃ (TAS)", density: 7800, soundVelocity: 2100,
    refractiveIndex: 3.15, M2_10e15: 1900,
    opticalTransmissionMin: 1.3, opticalTransmissionMax: 14.0,
    acousticLoss: 30, wavelength: 10600,
  },
  "Hg₂Cl₂": {
    name: "Hg₂Cl₂ (Calomel)", density: 7150, soundVelocity: 1650,
    refractiveIndex: 2.65, M2_10e15: 350,
    opticalTransmissionMin: 0.4, opticalTransmissionMax: 14.0,
    acousticLoss: 20, wavelength: 633,
  },
  "LiNbO₃": {
    name: "LiNbO₃", density: 4640, soundVelocity: 6570,
    refractiveIndex: 2.20, M2_10e15: 7.0,
    opticalTransmissionMin: 0.33, opticalTransmissionMax: 5.5,
    acousticLoss: 2, wavelength: 633,
  },
  "AgGaS₂": {
    name: "AgGaS₂", density: 4700, soundVelocity: 3560,
    refractiveIndex: 2.42, M2_10e15: 16.0,
    opticalTransmissionMin: 0.5, opticalTransmissionMax: 13.0,
    acousticLoss: 5, wavelength: 10600,
  },
};

export default function AcoustoOpticPage() {
  const [selected, setSelected] = useState("TeO₂");
  const [frequency, setFrequency] = useState(100); // MHz
  const [wavelength, setWavelength] = useState(633); // nm

  const m = materials[selected];

  // Bragg angle: sin(θB) = λf / (2v)
  const braggAngle = Math.asin((wavelength * 1e-9 * frequency * 1e6) / (2 * m.soundVelocity)) * (180 / Math.PI);

  // Deflection angle = 2θB
  const deflectionAngle = 2 * braggAngle;

  // Resolution N = Δf / bandwidth ≈ f·τ where τ = D/v
  // Peak efficiency approximation
  const bandwidth = frequency * 0.6; // rough

  const m2Chart = useMemo(() => {
    const entries = Object.entries(materials).sort((a, b) => b[1].M2_10e15 - a[1].M2_10e15);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.M2_10e15),
      type: "bar" as const,
      marker: { color: entries.map(([k]) => k === selected ? "#3b82f6" : "#4b5563") },
    }];
  }, [selected]);

  const velocityChart = useMemo(() => {
    const entries = Object.entries(materials).sort((a, b) => b[1].soundVelocity - a[1].soundVelocity);
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => cr.soundVelocity),
      type: "bar" as const,
      marker: { color: "#22c55e" },
    }];
  }, []);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Acousto-Optic Materials" description="Acousto-optic figure of merit, Bragg angle, and deflection calculations">
            
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">RF Frequency (MHz)</label>
          <input type="number" value={frequency} onChange={e => setFrequency(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={10} max={3000} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Optical Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={300} max={15000} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">M₂ (×10⁻¹⁵ s³/kg)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{m.M2_10e15}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Sound Velocity (m/s)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{m.soundVelocity}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Bragg Angle</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{isNaN(braggAngle) ? "N/A" : braggAngle.toFixed(3)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Deflection Angle</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{isNaN(deflectionAngle) ? "N/A" : deflectionAngle.toFixed(3)}°</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n</p>
          <p className="text-lg font-bold text-cyan-400 mt-1">{m.refractiveIndex}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Density (kg/m³)</p>
          <p className="text-lg font-bold text-rose-400 mt-1">{m.density}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">Bragg condition: <span className="text-white">sin(θ<sub>B</sub>) = λf / (2v)</span></p>
        <p className="text-sm text-gray-400 mt-1">sin(θ<sub>B</sub>) = ({wavelength}nm × {frequency}MHz) / (2 × {m.soundVelocity} m/s) = {((wavelength * 1e-9 * frequency * 1e6) / (2 * m.soundVelocity)).toFixed(6)}</p>
      </div>

      <ChartPanel data={m2Chart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Material", gridcolor: "#374151" },
          yaxis: { title: "M₂ (×10⁻¹⁵ s³/kg)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 100, l: 60 },
        }}
       
       
      />

      <ChartPanel data={velocityChart}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Material", gridcolor: "#374151" },
          yaxis: { title: "Sound Velocity (m/s)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 100, l: 60 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
