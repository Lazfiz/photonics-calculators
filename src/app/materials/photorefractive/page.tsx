"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface PhotorefractiveMaterial { name: string; n0: number; r33: number; r13: number; epsilon: number; color: string; type: string }

const MATERIALS: Record<string, PhotorefractiveMaterial> = {
  LiNbO3_Fe: { name: "Fe:LiNbO₃", n0: 2.29, r33: 30, r13: 8, epsilon: 28, color: "#60a5fa", type: "oxide" },
  LiNbO3_Mg: { name: "Mg:LiNbO₃", n0: 2.28, r33: 25, r13: 6, epsilon: 28, color: "#34d399", type: "oxide" },
  BaTiO3: { name: "BaTiO₃", n0: 2.39, r33: 80, r13: 24, epsilon: 135, color: "#f87171", type: "oxide" },
  SBN: { name: "SBN (Sr₀.₇₅Ba₀.₂₅Nb₂O₆)", n0: 2.31, r33: 420, r13: 55, epsilon: 880, color: "#f59e0b", type: "oxide" },
  BSO: { name: "Bi₁₂SiO₂₀ (BSO)", n0: 2.53, r33: 5, r13: 4.5, epsilon: 56, color: "#a78bfa", type: "sillenite" },
  BTO: { name: "Bi₁₂TiO₂₀ (BTO)", n0: 2.55, r33: 5.8, r13: 5.2, epsilon: 47, color: "#ec4899", type: "sillenite" },
  GaAs_Cr: { name: "Cr:GaAs", n0: 3.4, r33: 1.43, r13: 0.67, epsilon: 12.9, color: "#84cc16", type: "semiconductor" },
  InP_Fe: { name: "Fe:InP", n0: 3.29, r33: 1.34, r13: 0.52, epsilon: 12.5, color: "#06b6d4", type: "semiconductor" },
  KTN: { name: "KTN (KTa₁₋ₓNbₓO₃)", n0: 2.30, r33: 400, r13: 30, epsilon: 500, color: "#fb923c", type: "oxide" },
};

function refractiveChange(mat: PhotorefractiveMaterial, E_field: number, pol: "e" | "o"): number {
  const r = pol === "e" ? mat.r33 : mat.r13;
  return -0.5 * mat.n0 * mat.n0 * mat.n0 * r * E_field * 1e-12; // Δn for E in V/m
}

function twoBeamCouplingGain(mat: PhotorefractiveMaterial, E_field: number, wavelength_nm: number): number {
  const lambda = wavelength_nm * 1e-9;
  const r33 = mat.r33 * 1e-12;
  const n3 = mat.n0 * mat.n0 * mat.n0;
  return Math.PI * n3 * r33 * E_field / (lambda * Math.cos(30 * Math.PI / 180)); // simplified, 30° angle
}

export default function PhotorefractivePage() {
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("BaTiO3");
  const [field, setField] = useState(10000); // V/m
  const [wavelength, setWavelength] = useState(532);
  const [pol, setPol] = useState<"e" | "o">("e");

  const mat = MATERIALS[material];
  const deltaN = refractiveChange(mat, field, pol);
  const gain = twoBeamCouplingGain(mat, field, wavelength);

  const fieldData = useMemo(() => {
    const fields = Array.from({ length: 200 }, (_, i) => 1000 + i * 500);
    return [
      { x: fields.map(f => f / 1000), y: fields.map(f => Math.abs(refractiveChange(mat, f, pol)) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "|Δn| (e-ray)", line: { color: mat.color, width: 2 } },
      { x: fields.map(f => f / 1000), y: fields.map(f => Math.abs(refractiveChange(mat, f, "o")) * 1e6), type: "scatter" as const, mode: "lines" as const, name: "|Δn| (o-ray)", line: { color: "#9ca3af", width: 2, dash: "dash" } },
    ];
  }, [material, pol]);

  const wlData = useMemo(() => {
    const wls = Array.from({ length: 200 }, (_, i) => 400 + i * 5);
    return [{ x: wls, y: wls.map(wl => twoBeamCouplingGain(mat, field, wl)), type: "scatter" as const, mode: "lines" as const, name: "Γ (cm⁻¹)", line: { color: mat.color, width: 2 } }];
  }, [material, field]);

  const comparisonData = useMemo(() => {
    const keys = Object.keys(MATERIALS);
    return [
      { x: keys.map(k => MATERIALS[k].name.split(" (")[0]), y: keys.map(k => MATERIALS[k].r33), type: "bar" as const, name: "r₃₃ (pm/V)", marker: { color: keys.map(k => MATERIALS[k].color) } },
    ];
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/materials" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Materials</Link>
      <h1 className="text-3xl font-bold mb-2">Photorefractive Effect</h1>
      <p className="text-gray-400 mb-8">Light-induced refractive index changes via space-charge fields in electro-optic materials. Key for holographic storage, phase conjugation, and beam coupling.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={material} onChange={e => setMaterial(e.target.value as any)} className="w-full bg-gray-800 rounded px-3 py-2">
            {Object.entries(MATERIALS).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.type})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Applied Field (V/m): {field.toExponential(2)}</label>
          <input type="range" min={1000} max={100000} step={1000} value={field} onChange={e => setField(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(+e.target.value)} className="w-full bg-gray-800 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Polarization</label>
          <div className="flex gap-2">
            <button onClick={() => setPol("e")} className={`px-4 py-2 rounded ${pol === "e" ? "bg-blue-600" : "bg-gray-800"}`}>Extraordinary</button>
            <button onClick={() => setPol("o")} className={`px-4 py-2 rounded ${pol === "o" ? "bg-blue-600" : "bg-gray-800"}`}>Ordinary</button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><div className="text-xs text-gray-500">n₀</div><div className="text-lg font-bold text-blue-400">{mat.n0}</div></div>
        <div><div className="text-xs text-gray-500">r₃₃</div><div className="text-lg font-bold text-green-400">{mat.r33} pm/V</div></div>
        <div><div className="text-xs text-gray-500">|Δn|</div><div className="text-lg font-bold text-yellow-400">{(deltaN * 1e6).toFixed(2)} ppm</div></div>
        <div><div className="text-xs text-gray-500">2BC Gain Γ</div><div className="text-lg font-bold text-red-400">{gain.toFixed(2)} cm⁻¹</div></div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">|Δn| vs Applied Field</h3>
        <Plot data={fieldData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Field (kV/m)", gridcolor: "#374151" }, yaxis: { title: "|Δn| (ppm)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 20, b: 60, l: 60, r: 20 } }} style={{ width: "100%", height: 380 }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-bold mb-2">Two-Beam Coupling Gain vs Wavelength</h3>
        <Plot data={wlData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" }, yaxis: { title: "Γ (cm⁻¹)", gridcolor: "#374151" }, legend: { orientation: "h", y: -0.2 }, margin: { t: 20, b: 60, l: 60, r: 20 } }} style={{ width: "100%", height: 350 }} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Effective EO Coefficient r₃₃ Comparison</h3>
        <Plot data={comparisonData} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" }, xaxis: { title: "Material", gridcolor: "#374151", tickangle: -30 }, yaxis: { title: "r₃₃ (pm/V)", gridcolor: "#374151" }, margin: { t: 20, b: 80, l: 60, r: 20 } }} style={{ width: "100%", height: 350 }} />
      </div>

      <div className="mt-8 bg-gray-900 rounded-lg p-4 text-sm text-gray-400">
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">Δn = −½n₀³r<sub>eff</sub>E<sub>sc</sub> | Δ(1/n²)<sub>i</sub> = Σr<sub>ij</sub>E<sub>j</sub></p>
        <p className="font-mono bg-gray-800 p-2 rounded mb-2">Γ = πn³r<sub>33</sub>E<sub>sc</sub> / (λ cos θ) | Two-beam coupling gain</p>
        <p className="font-mono bg-gray-800 p-2 rounded">E<sub>sc</sub> = E<sub>q</sub>[1 + (E<sub>d</sub>/E<sub>q</sub>)²]⁻¹/² | E<sub>d</sub> diffusion, E<sub>q</sub> saturation</p>
        <div className="mt-3 text-xs">
          <p><strong>BaTiO₃</strong>: highest gain among photorefractive crystals, used in real-time holography and phase conjugation.</p>
          <p><strong>Fe:LiNbO₃</strong>: most widely used, excellent for holographic data storage (thermal fixing).</p>
          <p><strong>Semiconductors</strong> (GaAs, InP): fast response, IR-sensitive, lower gain but GHz speeds.</p>
        </div>
      </div>
    </div>
  );
}
