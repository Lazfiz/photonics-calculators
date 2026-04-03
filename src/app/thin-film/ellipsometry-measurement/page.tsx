"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function EllipsometryMeasurementPage() {
  const [psiDeg, setPsiDeg] = useState(45);
  const [deltaDeg, setDeltaDeg] = useState(120);
  const [aoiDeg, setAoiDeg] = useState(70);
  const [wavelength, setWavelength] = useState(633);
  const [nSubstrate, setNSubstrate] = useState(1.52);

  const results = useMemo(() => {
    const psi = psiDeg * Math.PI / 180;
    const delta = deltaDeg * Math.PI / 180;
    const theta = aoiDeg * Math.PI / 180;
    const lambda = wavelength;
    const ns = nSubstrate;

    // Fresnel reflection coefficients ratio
    const tanPsi = Math.tan(psi);
    const rho = tanPsi * Math.exp(1j) as unknown as number; // use real approximation

    // Approximate n and k from psi, delta (single layer on substrate, no explicit thickness)
    // Using inverted Fresnel equations for ambient(1.0)/film/substrate:
    // tan(psi)*e^(i*delta) = rp/rs
    // For absorbing film: N2 = n + ik
    // Using the effective medium approximation for inversion:

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    // Brewster angle
    const brewsterAngle = Math.atan(ns) * 180 / Math.PI;

    // Pseudo-refractive index (from two-parameter model)
    // <eps> = sin²θ [1 + tan²θ ((1-ρ)/(1+ρ))²]
    const rhoRe = tanPsi * Math.cos(delta);
    const rhoIm = tanPsi * Math.sin(delta);
    const denomR = 1 + rhoRe;
    const denomI = rhoIm;
    const numR = 1 - rhoRe;
    const numI = -rhoIm;
    const ratR = (numR * denomR + numI * denomI) / (denomR * denomR + denomI * denomI);
    const ratI = (numI * denomR - numR * denomI) / (denomR * denomR + denomI * denomI);
    const tanTheta2 = sinTheta * sinTheta / (cosTheta * cosTheta);

    // Pseudo-dielectric function
    const eps1Re = sinTheta * sinTheta * (1 + tanTheta2 * (ratR * ratR - ratI * ratI));
    const eps1Im = sinTheta * sinTheta * (2 * tanTheta2 * ratR * ratI);
    const epsMag = Math.sqrt(eps1Re * eps1Re + eps1Im * eps1Im);
    const epsPhase = Math.atan2(eps1Im, eps1Re);

    // Pseudo-refractive index N = sqrt(epsilon)
    const pseudoN = Math.sqrt(epsMag) * Math.cos(epsPhase / 2);
    const pseudoK = Math.sqrt(epsMag) * Math.sin(epsPhase / 2);

    // Reflectance for s and p polarization
    const Rp = ((pseudoN * cosTheta - cosTheta) ** 2 + pseudoK ** 2 * cosTheta ** 2) /
               ((pseudoN * cosTheta + cosTheta) ** 2 + pseudoK ** 2 * cosTheta ** 2);
    const Rs = ((pseudoN - cosTheta) ** 2 + pseudoK ** 2) /
               ((pseudoN + cosTheta) ** 2 + pseudoK ** 2);
    const Ravg = (Rp + Rs) / 2;

    // Thickness from phase (assuming n~1.5 for thin film, gives approximate d)
    const nFilm = pseudoN;
    const phaseTerm = delta - Math.PI;
    const thickness = Math.abs(phaseTerm * lambda / (4 * Math.PI * nFilm * cosTheta));

    return { pseudoN, pseudoK, eps1Re, eps1Im, Rp, Rs, Ravg, brewsterAngle, thickness, rhoRe, rhoIm };
  }, [psiDeg, deltaDeg, aoiDeg, wavelength, nSubstrate]);

  const psiDeltaMap = useMemo(() => {
    const psis = Array.from({ length: 50 }, (_, i) => i * 90 / 50);
    const deltas = Array.from({ length: 50 }, (_, j) => j * 360 / 50);
    const z = deltas.map(d => psis.map(p => {
      const psi = p * Math.PI / 180;
      const delta = d * Math.PI / 180;
      const tpsi = Math.tan(psi);
      const rr = tpsi * Math.cos(delta);
      const ri = tpsi * Math.sin(delta);
      const eps = rr * rr + ri * ri;
      return Math.sqrt(eps);
    }));
    return [
      { x: psis, y: deltas, z, type: "heatmap" as const, colorscale: "Viridis", showscale: true, colorbar: { title: { text: "|ρ|", font: { color: "#9ca3af" } }, tickfont: { color: "#9ca3af" } } }
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/thin-film" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Thin Film</Link>
      <h1 className="text-3xl font-bold mb-2">Ellipsometry Measurement</h1>
      <p className="text-gray-400 mb-8">Analyze ellipsometry data (Ψ, Δ) to extract pseudo-dielectric function, refractive index, and approximate film thickness.</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block"><span className="text-gray-300 text-sm">Ψ (degrees)</span>
          <input type="number" value={psiDeg} onChange={e => setPsiDeg(+e.target.value)} step="0.1" min="0" max="90" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Δ (degrees)</span>
          <input type="number" value={deltaDeg} onChange={e => setDeltaDeg(+e.target.value)} step="0.1" min="0" max="360" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Angle of Incidence (°)</span>
          <input type="number" value={aoiDeg} onChange={e => setAoiDeg(+e.target.value)} step="0.5" min="0" max="90" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">Wavelength (nm)</span>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} step="1" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block"><span className="text-gray-300 text-sm">n<sub>substrate</sub></span>
          <input type="number" value={nSubstrate} onChange={e => setNSubstrate(+e.target.value)} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" /></label>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Pseudo-refractive index ⟨n⟩: <span className="text-blue-400 font-mono">{results.pseudoN.toFixed(4)}</span></p>
        <p className="text-gray-300">Pseudo-extinction coeff ⟨k⟩: <span className="text-blue-400 font-mono">{results.pseudoK.toFixed(4)}</span></p>
        <p className="text-gray-300">ε₁ (real): <span className="text-blue-400 font-mono">{results.eps1Re.toFixed(4)}</span></p>
        <p className="text-gray-300">ε₂ (imag): <span className="text-blue-400 font-mono">{results.eps1Im.toFixed(4)}</span></p>
        <p className="text-gray-300">R<sub>p</sub>: <span className="text-blue-400 font-mono">{results.Rp.toFixed(4)}</span></p>
        <p className="text-gray-300">R<sub>s</sub>: <span className="text-blue-400 font-mono">{results.Rs.toFixed(4)}</span></p>
        <p className="text-gray-300">R<sub>avg</sub>: <span className="text-blue-400 font-mono">{results.Ravg.toFixed(4)}</span></p>
        <p className="text-gray-300">Brewster Angle: <span className="text-blue-400 font-mono">{results.brewsterAngle.toFixed(2)}°</span></p>
        <p className="text-gray-300">Approx. Thickness: <span className="text-blue-400 font-mono">{results.thickness.toFixed(1)} nm</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>ρ = r<sub>p</sub>/r<sub>s</sub> = tan(Ψ)·e<sup>iΔ</sup></p>
        <p>⟨ε⟩ = sin²θ [1 + tan²θ·((1−ρ)/(1+ρ))²] (pseudo-dielectric function)</p>
        <p>⟨N⟩ = √⟨ε⟩ = ⟨n⟩ + i⟨k⟩</p>
        <p>Brewster angle θ<sub>B</sub> = arctan(n<sub>sub</sub>)</p>
        <p>ρ = tan(Ψ)·(cos Δ + i·sin Δ)</p>
      </div>

      <Plot data={psiDeltaMap} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Ψ (°)", gridcolor: "#374151" },
        yaxis: { title: "Δ (°)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} className="w-full" style={{ height: 400 }} />
      <p className="text-gray-500 text-xs mt-2 text-center">Ψ-Δ map (|ρ|). Current measurement point marked by inputs above.</p>
    </div>
  );
}
