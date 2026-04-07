"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";
import { useURLState } from "../../../hooks/use-url-state";
interface MOMaterial {
  name: string;
  type: string; // "diamagnetic" or "paramagnetic"
  Verdet_633: number; // rad/T·m at 633 nm
  Verdet_1064: number;
  Verdet_1550: number;
  n: number;
  transparencyMin: number;
  transparencyMax: number;
  // Verdet constant ~ λ⁻², so we extrapolate
  refWavelength: number; // nm for reference Verdet
  refVerdet: number; // rad/T·m at ref wavelength
}

const materials: Record<string, MOMaterial> = {
  "TGG": {
    name: "TGG (Tb₃Ga₅O₁₂)", type: "paramagnetic",
    Verdet_633: -134, Verdet_1064: -40, Verdet_1550: -18,
    n: 1.95, transparencyMin: 0.4, transparencyMax: 1.5,
    refWavelength: 632, refVerdet: -134,
  },
  "TSAG": {
    name: "TSAG (Tb₃Sc₂Al₃O₁₂)", type: "paramagnetic",
    Verdet_633: -170, Verdet_1064: -50, Verdet_1550: -22,
    n: 1.85, transparencyMin: 0.4, transparencyMax: 1.5,
    refWavelength: 632, refVerdet: -170,
  },
  "CeF₃": {
    name: "CeF₃", type: "paramagnetic",
    Verdet_633: -120, Verdet_1064: -38, Verdet_1550: -16,
    n: 1.62, transparencyMin: 0.3, transparencyMax: 5.0,
    refWavelength: 632, refVerdet: -120,
  },
  "YIG": {
    name: "YIG (Y₃Fe₅O₁₂)", type: "ferromagnetic",
    Verdet_633: -3200, Verdet_1064: -900, Verdet_1550: -400,
    n: 2.22, transparencyMin: 1.1, transparencyMax: 5.5,
    refWavelength: 1310, refVerdet: -600,
  },
  "Bi:YIG": {
    name: "Bi:YIG (bismuth-substituted)", type: "ferromagnetic",
    Verdet_633: -8000, Verdet_1064: -3000, Verdet_1550: -1500,
    n: 2.55, transparencyMin: 1.1, transparencyMax: 6.0,
    refWavelength: 1310, refVerdet: -2000,
  },
  "SiO₂": {
    name: "Fused Silica (SiO₂)", type: "diamagnetic",
    Verdet_633: 3.67, Verdet_1064: 1.32, Verdet_1550: 0.63,
    n: 1.46, transparencyMin: 0.18, transparencyMax: 3.5,
    refWavelength: 632, refVerdet: 3.67,
  },
  "SF11": {
    name: "Schott SF11", type: "diamagnetic",
    Verdet_633: 25, Verdet_1064: 9.0, Verdet_1550: 4.2,
    n: 1.78, transparencyMin: 0.38, transparencyMax: 2.5,
    refWavelength: 632, refVerdet: 25,
  },
  "ZnSe": {
    name: "ZnSe", type: "diamagnetic",
    Verdet_633: 80, Verdet_1064: 30, Verdet_1550: 15,
    n: 2.59, transparencyMin: 0.5, transparencyMax: 18.0,
    refWavelength: 1064, refVerdet: 30,
  },
  "CdMnTe": {
    name: "CdMnTe", type: "paramagnetic (semimagnetic)",
    Verdet_633: -500, Verdet_1064: -200, Verdet_1550: -100,
    n: 2.75, transparencyMin: 0.8, transparencyMax: 16.0,
    refWavelength: 1064, refVerdet: -200,
  },
  "Diamagnetic Glass": {
    name: "FR5 (Terbium Glass)", type: "paramagnetic",
    Verdet_633: -68, Verdet_1064: -25, Verdet_1550: -12,
    n: 1.72, transparencyMin: 0.4, transparencyMax: 2.0,
    refWavelength: 632, refVerdet: -68,
  },
};

const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#a855f7"];

function verdetAt(m: MOMaterial, lambdaNm: number): number {
  // Verdet ∝ 1/λ²
  return m.refVerdet * Math.pow(m.refWavelength / lambdaNm, 2);
}

export default function MagnetoOpticPage() {
  const [selected, setSelected] = useState("TGG");
  const [wavelength, setWavelength] = useURLState("wavelength", 633);
  const [fieldStrength, setFieldStrength] = useURLState("fieldStrength", 0.5); // Tesla
  const [length, setLength] = useURLState("length", 20); // mm

  const m = materials[selected];
  const V = verdetAt(m, wavelength);
  const faradayRotation = V * fieldStrength * (length / 1000); // radians
  const faradayDegrees = faradayRotation * (180 / Math.PI);

  // Field needed for 45° rotation
  const fieldFor45 = Math.abs(45 * Math.PI / 180 / (V * (length / 1000)));

  const verdetSpectrum = useMemo(() => {
    const ws: number[] = [];
    for (let w = 400; w <= 2000; w += 10) ws.push(w);
    return Object.entries(materials).map(([key, mat], i) => ({
      x: ws,
      y: ws.map(w => verdetAt(mat, w)),
      type: "scatter" as const, mode: "lines" as const, name: mat.name,
      line: { color: colors[i % colors.length], width: key === selected ? 3 : 1.5 },
    }));
  }, [selected]);

  const comparisonBar = useMemo(() => {
    const entries = Object.entries(materials).sort((a, b) => Math.abs(verdetAt(b[1], wavelength)) - Math.abs(verdetAt(a[1], wavelength)));
    return [{
      x: entries.map(([, cr]) => cr.name),
      y: entries.map(([, cr]) => Math.abs(verdetAt(cr, wavelength))),
      type: "bar" as const,
      marker: { color: entries.map(([k]) => k === selected ? "#3b82f6" : "#4b5563") },
    }];
  }, [selected, wavelength]);

  return (
    <CalculatorShell backHref="/materials" backLabel="Materials" title="Magneto-Optic Materials" description="Faraday rotation, Verdet constants, and isolator design calculations">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Material</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {Object.entries(materials).map(([k, v]) => <option key={k} value={k}>{v.name} ({v.type})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Wavelength (nm)</label>
          <input type="number" value={wavelength} onChange={e => setWavelength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={300} max={2000} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Magnetic Field (T)</label>
          <input type="number" value={fieldStrength} onChange={e => setFieldStrength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={0.01} max={5} step={0.01} />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Crystal Length (mm)</label>
          <input type="number" value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" min={1} max={100} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">V at {wavelength} nm</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{V.toFixed(1)} rad/T·m</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Faraday Rotation</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{faradayDegrees.toFixed(2)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{m.n.toFixed(3)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">B for 45° (T)</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{fieldFor45.toFixed(3)}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-400">Faraday rotation: <span className="text-white">θ = V · B · L = {V.toFixed(1)} × {fieldStrength} × {length / 1000} = {faradayDegrees.toFixed(2)}°</span></p>
        <p className="text-sm text-gray-400 mt-1">Type: <span className="text-cyan-400 font-bold">{m.type}</span> | Transparency: <span className="text-cyan-400 font-bold">{m.transparencyMin}–{m.transparencyMax} μm</span></p>
      </div>

      <ChartPanel data={verdetSpectrum}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Verdet Constant (rad/T·m)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 50, l: 60 },
          legend: { orientation: "h", y: -0.35 },
        }}
       
       
      />

      <h2 className="text-xl font-bold mt-8 mb-4">|V| Comparison at {wavelength} nm</h2>
      <ChartPanel data={comparisonBar}
        layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Material", gridcolor: "#374151" },
          yaxis: { title: "|V| (rad/T·m)", gridcolor: "#374151" },
          margin: { t: 20, r: 20, b: 100, l: 60 },
        }}
       
       
      />
    </CalculatorShell>
  );
}
