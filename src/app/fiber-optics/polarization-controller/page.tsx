"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";


export default function PolarizationControllerCalculator() {
  const [birefringence, setBirefringence] = useState<number>(3e-4); // Δn
  const [fiberLength, setFiberLength] = useState<number>(1); // m per coil section
  const [numSections, setNumSections] = useState<number>(3);
  const [wavelength, setWavelength] = useState<number>(1550); // nm
  const [inputAzimuth, setInputAzimuth] = useState<number>(0); // degrees
  const [inputEllipticity, setInputEllipticity] = useState<number>(0); // degrees (0=linear)
  const [coilRadii, setCoilRadii] = useState<number>(15); // mm

  // Phase retardation per section
  const phasePerSection = useMemo(() => {
    const delta = birefringence * fiberLength * 1e9 / (wavelength * 1e-9) * 2 * Math.PI; // NOT right, let me fix
    // δ = 2π · Δn · L / λ
    return (2 * Math.PI * birefringence * fiberLength) / (wavelength * 1e-9);
  }, [birefringence, fiberLength, wavelength]);

  // Retardation in waves
  const retardationWaves = phasePerSection / (2 * Math.PI);

  // Stress-induced birefringence from bending
  const bendingBirefringence = useMemo(() => {
    const r = coilRadii * 1e-3; // mm to m
    const E = 72e9; // silica Young's modulus
    const nu = 0.17; // Poisson ratio
    const d = 125e-6; // cladding diameter
    const deltaN = 0.5 * E * (d / 2) ** 2 * (1 + nu) / (r ** 2);
    // Simplified: Δn ≈ C · (d/2r)² where C ≈ 0.13 for silica
    return 0.13 * (125 / 2 / coilRadii) ** 2;
  }, [coilRadii]);

  // Poincaré sphere representation - Stokes parameters after each section
  const stokesParams = useMemo(() => {
    const sections: number[] = [];
    const s1: number[] = [];
    const s2: number[] = [];
    const s3: number[] = [];

    // Input Stokes from azimuth and ellipticity
    const az = inputAzimuth * Math.PI / 180;
    const el = inputEllipticity * Math.PI / 180;
    let S1 = Math.cos(2 * el) * Math.cos(2 * az);
    let S2 = Math.cos(2 * el) * Math.sin(2 * az);
    let S3 = Math.sin(2 * el);

    sections.push(0);
    s1.push(S1);
    s2.push(S2);
    s3.push(S3);

    for (let i = 1; i <= numSections; i++) {
      const delta = phasePerSection;
      // Rotate around S1 axis (simplified: each section adds retardation)
      const cosD = Math.cos(delta);
      const sinD = Math.sin(delta);
      const newS1 = S1;
      const newS2 = S2 * cosD - S3 * sinD;
      const newS3 = S2 * sinD + S3 * cosD;
      S1 = newS1; S2 = newS2; S3 = newS3;
      sections.push(i);
      s1.push(S1);
      s2.push(S2);
      s3.push(S3);
    }

    return { sections, s1, s2, s3 };
  }, [birefringence, fiberLength, wavelength, numSections, inputAzimuth, inputEllipticity]);

  // Output state
  const outputAzimuth = useMemo(() => {
    const s1 = stokesParams.s1[stokesParams.s1.length - 1];
    const s2 = stokesParams.s2[stokesParams.s2.length - 1];
    return (Math.atan2(s2, s1) * 180 / Math.PI / 2) % 180;
  }, [stokesParams]);

  const outputEllipticity = useMemo(() => {
    const s3 = stokesParams.s3[stokesParams.s3.length - 1];
    return Math.asin(Math.max(-1, Math.min(1, s3))) * 180 / Math.PI / 2;
  }, [stokesParams]);

  // Rotation needed for linear → circular
  const quarterWaveLength = useMemo(() => {
    return wavelength / (4 * birefringence);
  }, [wavelength, birefringence]);

  const halfWaveLength = useMemo(() => {
    return wavelength / (2 * birefringence);
  }, [wavelength, birefringence]);

  // Stokes parameter evolution
  const stokesPlot = useMemo(() => {
    return [
      { x: stokesParams.sections, y: stokesParams.s1, type: "scatter" as const, mode: "lines+markers" as const, name: "S₁", line: { color: "#ef4444", width: 2 } },
      { x: stokesParams.sections, y: stokesParams.s2, type: "scatter" as const, mode: "lines+markers" as const, name: "S₂", line: { color: "#10b981", width: 2 } },
      { x: stokesParams.sections, y: stokesParams.s3, type: "scatter" as const, mode: "lines+markers" as const, name: "S₃", line: { color: "#3b82f6", width: 2 } },
    ];
  }, [stokesParams]);

  // Polarization ellipse at output
  const polEllipse = useMemo(() => {
    const t: number[] = [];
    const ex: number[] = [];
    const ey: number[] = [];

    const s1 = stokesParams.s1[stokesParams.s1.length - 1];
    const s2 = stokesParams.s2[stokesParams.s2.length - 1];
    const s3 = stokesParams.s3[stokesParams.s3.length - 1];
    const az = 0.5 * Math.atan2(s2, s1);
    const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, s3)));
    const a = Math.cos(chi);
    const b = Math.sin(Math.abs(chi));

    for (let th = 0; th <= 2 * Math.PI; th += 0.05) {
      t.push(th);
      ex.push(a * Math.cos(th) * Math.cos(az) - b * Math.sin(th) * Math.sin(az));
      ey.push(a * Math.cos(th) * Math.sin(az) + b * Math.sin(th) * Math.cos(az));
    }

    return [{ x: ex, y: ey, type: "scatter" as const, mode: "lines" as const, name: "Output Polarization", line: { color: "#f59e0b", width: 2.5 } }];
  }, [stokesParams]);

  const layout1 = {
    title: "Stokes Parameters Evolution",
    xaxis: { title: "Section", gridcolor: "#374151", dtick: 1 },
    yaxis: { title: "Stokes Parameter", gridcolor: "#374151", range: [-1.1, 1.1] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  const layout2 = {
    title: "Output Polarization Ellipse",
    xaxis: { title: "Ex", gridcolor: "#374151", range: [-1.2, 1.2], scaleanchor: "y" },
    yaxis: { title: "Ey", gridcolor: "#374151", range: [-1.2, 1.2] },
    paper_bgcolor: "#111827", plot_bgcolor: "#1f2937",
    font: { color: "#f3f4f6" }, showlegend: true, legend: { x: 0.02, y: 0.98 }, height: 380,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
                
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Birefringence Δn</label>
              <input type="number" value={birefringence} onChange={(e) => setBirefringence(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="1e-5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fiber Length per Section (m)</label>
              <input type="number" value={fiberLength} onChange={(e) => setFiberLength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" step="0.1" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Number of Sections</label>
              <input type="number" value={numSections} onChange={(e) => setNumSections(Math.max(1, Math.min(6, Number(e.target.value))))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Wavelength (nm)</label>
              <input type="number" value={wavelength} onChange={(e) => setWavelength(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Input Azimuth (°)</label>
                <input type="number" value={inputAzimuth} onChange={(e) => setInputAzimuth(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Input Ellipticity (°)</label>
                <input type="number" value={inputEllipticity} onChange={(e) => setInputEllipticity(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coil Radius (mm)</label>
              <input type="number" value={coilRadii} onChange={(e) => setCoilRadii(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-gray-400">Retardation per section:</span><span className="font-mono">{retardationWaves.toFixed(3)} waves ({phasePerSection.toFixed(1)} rad)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Output azimuth:</span><span className="font-mono text-blue-400">{outputAzimuth.toFixed(1)}°</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Output ellipticity:</span><span className="font-mono text-green-400">{outputEllipticity.toFixed(1)}°</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Bending birefringence:</span><span className="font-mono">{bendingBirefringence.toExponential(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Quarter-wave length:</span><span className="font-mono text-yellow-400">{quarterWaveLength.toFixed(3)} m</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Half-wave length:</span><span className="font-mono text-yellow-400">{halfWaveLength.toFixed(3)} m</span></div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Formulas</h3>
              <p className="font-mono text-sm">δ = 2π · Δn · L / λ</p>
              <p className="font-mono text-sm mt-1">S₁ = cos(2χ)·cos(2ψ)</p>
              <p className="font-mono text-sm mt-1">S₂ = cos(2χ)·sin(2ψ)</p>
              <p className="font-mono text-sm mt-1">S₃ = sin(2χ)</p>
              <p className="font-mono text-sm mt-1">L_λ/4 = λ / (4·Δn)</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={stokesPlot} layout={layout1} />
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <ChartPanel data={polEllipse} layout={layout2} />
          </div>
        </div>
      </div>
    </div>
  );
}
