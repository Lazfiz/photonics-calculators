"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export default function EllipsometryPage() {
  const [psiDeg, setPsiDeg] = useState(45);
  const [deltaDeg, setDeltaDeg] = useState(90);
  const [incidentAngle, setIncidentAngle] = useState(60);
  const [nSubstrate, setNSubstrate] = useState(3.88); // Si
  const [kSubstrate, setKSubstrate] = useState(0.02);
  const [nAmbient, setNAmbient] = useState(1.0);
  const [nFilm, setNFilm] = useState(1.46); // SiO2
  const [kFilm, setKFilm] = useState(0);
  const [filmThickness, setFilmThickness] = useState(100); // nm
  const [wavelength, setWavelength] = useState(632.8); // nm HeNe

  // Compute ρ = tan(ψ) · e^(iΔ)
  const rho = useMemo(() => {
    const psi = psiDeg * Math.PI / 180;
    const delta = deltaDeg * Math.PI / 180;
    return { real: Math.tan(psi) * Math.cos(delta), imag: Math.tan(psi) * Math.sin(delta) };
  }, [psiDeg, deltaDeg]);

  // Complex reflection coefficients from ψ, Δ
  const reflectionCoeffs = useMemo(() => {
    const psi = psiDeg * Math.PI / 180;
    const delta = deltaDeg * Math.PI / 180;
    const rpMag = Math.tan(psi); // |rp/rs| = tan(ψ)
    // rp = rpMag * e^(iΔ) relative to rs
    // We normalize: rs = 1 (reference)
    const rpReal = rpMag * Math.cos(delta);
    const rpImag = rpMag * Math.sin(delta);
    return { rp: { real: rpReal, imag: rpImag }, rs: { real: 1, imag: 0 } };
  }, [psiDeg, deltaDeg]);

  // Fresnel equations for bare substrate
  const fresnelPsiDelta = useMemo(() => {
    const thetaI = incidentAngle * Math.PI / 180;
    const sinThetaI = Math.sin(thetaI);
    const n1 = nAmbient;
    const n2 = nSubstrate;
    const k2 = kSubstrate;
    const cosThetaI = Math.cos(thetaI);

    // Snell's law for complex index
    const cosThetaT = Math.sqrt(1 - (n1 * sinThetaI / n2) ** 2 + (k2 / n2 * sinThetaI) ** 2);
    const n1c = n1, n2c = { real: n2, imag: k2 };

    // rp and rs
    const rsNum = n1 * cosThetaI;
    const rsDen = { real: n2 * cosThetaT, imag: k2 * cosThetaT };
    const rsMag = Math.abs(rsNum / Math.sqrt(rsDen.real ** 2 + rsDen.imag ** 2));
    const rsPhase = 0; // reference

    const rpNum = { real: n2, imag: k2 };
    const rpDen = n1 * cosThetaI;
    const rpMag = Math.sqrt(rpNum.real ** 2 + rpNum.imag ** 2) * cosThetaT / rpDen;
    const rpPhase = Math.atan2(rpNum.imag, rpNum.real);

    const psiCalc = Math.atan(rpMag / rsMag) * 180 / Math.PI;
    const deltaCalc = (rpPhase - rsPhase) * 180 / Math.PI;

    return { psiCalc, deltaCalc };
  }, [incidentAngle, nSubstrate, kSubstrate, nAmbient]);

  // Ψ and Δ vs angle of incidence (Fresnel model)
  const angleSweep = useMemo(() => {
    const angles = Array.from({ length: 90 }, (_, i) => 10 + i);
    const psiVals: number[] = [];
    const deltaVals: number[] = [];

    for (const angle of angles) {
      const thetaI = angle * Math.PI / 180;
      const cosI = Math.cos(thetaI);
      const sinI = Math.sin(thetaI);
      const cosT = Math.sqrt(1 - (nAmbient * sinI / nSubstrate) ** 2);

      const rs = (nAmbient * cosI - nSubstrate * cosT) / (nAmbient * cosI + nSubstrate * cosT);
      const rp = (nSubstrate * cosI - nAmbient * cosT) / (nSubstrate * cosI + nAmbient * cosT);

      const psi = Math.atan(Math.abs(rp / rs)) * 180 / Math.PI;
      const delta = (Math.atan2(rp < 0 ? -1 : 1, 1) - Math.atan2(rs < 0 ? -1 : 1, 1)) * 180 / Math.PI;
      psiVals.push(psi);
      deltaVals.push(delta);
    }
    return { angles, psiVals, deltaVals };
  }, [nSubstrate, nAmbient]);

  // Film thickness oscillation (Cauchy model for Ψ, Δ vs thickness)
  const thicknessSweep = useMemo(() => {
    const thicknesses = Array.from({ length: 200 }, (_, i) => i * 1.5);
    const psiVals: number[] = [];
    const deltaVals: number[] = [];

    for (const d of thicknesses) {
      const thetaI = incidentAngle * Math.PI / 180;
      const cosI = Math.cos(thetaI);
      const sinI = Math.sin(thetaI);
      const n1 = nAmbient, n2 = nFilm, n3 = nSubstrate;
      const cosT2 = Math.sqrt(1 - (n1 * sinI / n2) ** 2);
      const cosT3 = Math.sqrt(1 - (n1 * sinI / n3) ** 2);

      const r12s = (n1 * cosI - n2 * cosT2) / (n1 * cosI + n2 * cosT2);
      const r23s = (n2 * cosT2 - n3 * cosT3) / (n2 * cosT2 + n3 * cosT3);
      const r12p = (n2 * cosI - n1 * cosT2) / (n2 * cosI + n1 * cosT2);
      const r23p = (n3 * cosT2 - n2 * cosT3) / (n3 * cosT2 + n2 * cosT3);

      const phase = 2 * Math.PI * n2 * d * cosT2 / wavelength;
      const cosP = Math.cos(2 * phase);
      const sinP = Math.sin(2 * phase);
      // rp real/imag parts
      const rpRe = (r12p + r23p * cosP) / (1 + r12p * r23p * cosP);
      const rpIm = (r23p * sinP) / (1 + r12p * r23p * cosP);
      const rsRe = (r12s + r23s * cosP) / (1 + r12s * r23s * cosP);
      const rsIm = (r23s * sinP) / (1 + r12s * r23s * cosP);

      // ratio = rp/rs (complex division)
      const rsMag2 = rsRe * rsRe + rsIm * rsIm;
      const ratioRe = (rpRe * rsRe + rpIm * rsIm) / rsMag2;
      const ratioIm = (rpIm * rsRe - rpRe * rsIm) / rsMag2;
      const ratioMag = Math.sqrt(ratioRe * ratioRe + ratioIm * ratioIm);
      psiVals.push(Math.atan(ratioMag) * 180 / Math.PI);
      deltaVals.push(Math.atan2(ratioIm, ratioRe) * 180 / Math.PI);
    }
    return { thicknesses, psiVals, deltaVals };
  }, [incidentAngle, nAmbient, nFilm, nSubstrate, wavelength]);

  const plotLayout: Partial<Plotly.Layout> = {
    paper_bgcolor: "transparent",
    plot_bgcolor: "#111827",
    font: { color: "#e5e7eb" },
    margin: { t: 30, b: 40, l: 50, r: 50 },
    xaxis: { color: "#9ca3af", gridcolor: "#374151" },
    yaxis: { color: "#9ca3af", gridcolor: "#374151" },
    legend: { font: { color: "#9ca3af" } },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Ellipsometry</h1>
      <p className="text-gray-400 mb-6">Calculate Ψ, Δ from Fresnel equations; model thin film interference in ellipsometry.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Measured Parameters</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Ψ (amplitude ratio) [°]</label>
            <input type="number" step={0.1} value={psiDeg} onChange={(e) => setPsiDeg(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-400 block mb-1">Δ (phase difference) [°]</label>
            <input type="number" step={0.1} value={deltaDeg} onChange={(e) => setDeltaDeg(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
          </div>

          <h3 className="text-sm font-semibold mb-2 mt-4">Fresnel Model (Bare Substrate)</h3>
          {[
            { label: "n (substrate)", val: nSubstrate, set: setNSubstrate, step: 0.01 },
            { label: "k (substrate)", val: kSubstrate, set: setKSubstrate, step: 0.001 },
            { label: "n (ambient)", val: nAmbient, set: setNAmbient, step: 0.01 },
            { label: "Angle of incidence (°)", val: incidentAngle, set: setIncidentAngle, step: 0.5 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step={step} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}

          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => { setNSubstrate(3.88); setKSubstrate(0.02); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">Si</button>
            <button onClick={() => { setNSubstrate(1.77); setKSubstrate(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">SiO₂</button>
            <button onClick={() => { setNSubstrate(2.0); setKSubstrate(0); }}
              className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500">GaAs</button>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Results</h2>
          <div className="space-y-1">
            <ResultRow label="ρ = tan(Ψ)·e^(iΔ) real" value={rho.real.toFixed(6)} />
            <ResultRow label="ρ = tan(Ψ)·e^(iΔ) imag" value={rho.imag.toFixed(6)} />
            <ResultRow label="|ρ|" value={Math.sqrt(rho.real ** 2 + rho.imag ** 2).toFixed(6)} />
            <ResultRow label="tan(Ψ)" value={Math.tan(psiDeg * Math.PI / 180).toFixed(6)} />
            <ResultRow label="Fresnel Ψ (bare)" value={`${fresnelPsiDelta.psiCalc.toFixed(2)}°`} />
            <ResultRow label="Fresnel Δ (bare)" value={`${fresnelPsiDelta.deltaCalc.toFixed(2)}°`} />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Thin Film Model</h2>
          {[
            { label: "n (film)", val: nFilm, set: setNFilm, step: 0.01 },
            { label: "k (film)", val: kFilm, set: setKFilm, step: 0.001 },
            { label: "Thickness (nm)", val: filmThickness, set: setFilmThickness, step: 1 },
            { label: "Wavelength (nm)", val: wavelength, set: setWavelength, step: 0.1 },
          ].map(({ label, val, set, step }) => (
            <div key={label} className="mb-3">
              <label className="text-sm text-gray-400 block mb-1">{label}</label>
              <input type="number" step={step} value={val} onChange={(e) => set(parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Ψ and Δ vs Angle of Incidence</h2>
          <Plot data={[
            { x: angleSweep.angles, y: angleSweep.psiVals, name: "Ψ", type: "scatter", mode: "lines", line: { color: "#3b82f6" } },
            { x: angleSweep.angles, y: angleSweep.deltaVals, name: "Δ", type: "scatter", mode: "lines", line: { color: "#ef4444" } },
          ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Angle (°)" }, yaxis: { ...plotLayout.yaxis, title: "Degrees" } }} config={{ displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Ψ and Δ vs Film Thickness</h2>
          <Plot data={[
            { x: thicknessSweep.thicknesses, y: thicknessSweep.psiVals, name: "Ψ", type: "scatter", mode: "lines", line: { color: "#3b82f6" } },
            { x: thicknessSweep.thicknesses, y: thicknessSweep.deltaVals, name: "Δ", type: "scatter", mode: "lines", line: { color: "#ef4444" } },
          ]} layout={{ ...plotLayout, height: 300, xaxis: { ...plotLayout.xaxis, title: "Thickness (nm)" }, yaxis: { ...plotLayout.yaxis, title: "Degrees" } }} config={{ displayModeBar: false }} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mt-6">
        <h2 className="text-lg font-semibold mb-3">Key Formulas</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>ρ = rₚ/rₛ = tan(Ψ) · e^(iΔ)</p>
          <p>Ψ = atan(|rₚ/rₛ|)</p>
          <p>Δ = arg(rₚ) − arg(rₛ)</p>
          <p>rₛ = (n₁cosθᵢ − n₂cosθₜ)/(n₁cosθᵢ + n₂cosθₜ)</p>
          <p>rₚ = (n₂cosθᵢ − n₁cosθₜ)/(n₂cosθᵢ + n₁cosθₜ)</p>
          <p>Film: r_total = (r₁₂ + r₂₃·e^(2iβ))/(1 + r₁₂·r₂₃·e^(2iβ))</p>
          <p>Phase: β = 2π·n₂·d·cosθ₂ / λ</p>
        </div>
      </div>
    </div>
  );
}
