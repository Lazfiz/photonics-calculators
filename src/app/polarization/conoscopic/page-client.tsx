"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
export default function ConoscopicPage() {
  const [nO, setNO] = useState(1.658);
  const [nE, setNE] = useState(1.486);
  const [thickness, setThickness] = useState(0.05); // mm
  const [wavelength, setWavelength] = useState(550);
  const [na, setNA] = useState(0.25);
  const [crystalType, setCrystalType] = useState<"uniaxial_pos" | "uniaxial_neg" | "biaxial">("uniaxial_pos");

  const dn = Math.abs(nO - nE);
  const d = thickness; // mm
  const lam = wavelength * 1e-6; // mm

  // Maximum retardation at edge of cone (max angle)
  const maxAngle = Math.asin(na); // half-angle of NA cone
  const maxAngleDeg = maxAngle * 180 / Math.PI;

  // Retardation at angle θ from optic axis:
  // δ(θ) = 2π d Δn sin²θ / λ (for uniaxial)
  const retCenter = 0; // along optic axis
  const retEdge = (2 * Math.PI * d * dn * Math.sin(maxAngle) ** 2) / lam;
  const retEdgeWaves = retEdge / (2 * Math.PI);

  // Isochromatic fringe order at edge
  const fringeOrder = retEdge / (2 * Math.PI);

  // Biaxial: 2V angle approximation
  const nx = 1.6, ny = 1.63, nz = 1.68;
  const biax2V = Math.atan(Math.sqrt((nz - ny) / (ny - nx))) * 2 * 180 / Math.PI;

  // Generate conoscopic interference figure
  const figureData = useMemo(() => {
    const N = 80;
    const xArr: number[] = [];
    const yArr: number[] = [];
    const cArr: number[] = [];
    const sArr: number[] = [];

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const px = (i / N - 0.5) * 2 * na;
        const py = (j / N - 0.5) * 2 * na;
        const r = Math.sqrt(px ** 2 + py ** 2);
        if (r > na) continue;

        const theta = Math.asin(r);
        const phi = Math.atan2(py, px);

        // Retardation depends on angle from optic axis
        const sin2theta = Math.sin(theta) ** 2;
        let ret: number;
        if (crystalType === "uniaxial_pos" || crystalType === "uniaxial_neg") {
          ret = (2 * Math.PI * d * dn * sin2theta) / lam;
        } else {
          // Biaxial approximation: varies with azimuth too
          const cos2phi = Math.cos(2 * phi);
          const dnLocal = dn * (1 + 0.3 * cos2phi);
          ret = (2 * Math.PI * d * dnLocal * sin2theta) / lam;
        }

        // Interference color from retardation (Michel-Lévy simplified)
        const phase = (ret / (2 * Math.PI)) % 1;
        const intensity = Math.sin(ret / 2) ** 2;

        // Isogyre pattern (cross for uniaxial, lemniscate for biaxial)
        let isogyre = 0;
        if (crystalType === "uniaxial_pos" || crystalType === "uniaxial_neg") {
          // Maltese cross: dark when E-field || polarizer
          isogyre = Math.abs(Math.cos(phi)) > 0.95 || Math.abs(Math.sin(phi)) > 0.95 ? 0.1 : 1;
        } else {
          // Biaxial: hyperbolic isogyres
          const sep = 0.15;
          const dx = px - sep, dy = py - sep;
          const dx2 = px + sep, dy2 = py + sep;
          isogyre = (Math.abs(Math.atan2(dy, dx)) < 0.3 || Math.abs(Math.atan2(dy2, dx2)) < 0.3) ? 0.3 : 1;
        }

        xArr.push(px);
        yArr.push(py);
        cArr.push(intensity * isogyre);
        sArr.push(ret / (2 * Math.PI));
      }
    }

    return [
      {
        x: xArr, y: yArr, type: "scatter" as const, mode: "markers" as const,
        marker: { color: cArr, size: 3, colorscale: "Viridis", showscale: true, colorbar: { title: "Intensity", tickfont: { color: "#9ca3af" } } },
        name: "Interference",
      },
    ];
  }, [nO, nE, dn, d, lam, na, crystalType]);

  const radialData = useMemo(() => {
    const angles = Array.from({ length: 200 }, (_, i) => (i / 200) * maxAngleDeg);
    const rets = angles.map(a => {
      const theta = a * Math.PI / 180;
      return (2 * Math.PI * d * dn * Math.sin(theta) ** 2) / lam / (2 * Math.PI);
    });
    return [
      { x: angles, y: rets, type: "scatter" as const, mode: "lines" as const, name: "Fringe order", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [dn, d, lam, maxAngleDeg]);

  return (
    <CalculatorShell backHref="/polarization" backLabel="Polarization" title="Conoscopic Observation" description="Simulate conoscopic interference figures (isochromates and isogyres) for uniaxial and biaxial crystals between crossed polarizers.">
            
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">δ(θ) = 2π Δn d sin²θ / λ, I = sin²(δ/2)</p>
        <p className="text-gray-300 text-sm font-mono">Isogyres: dark bands where E-field ∥ polarizer/analyzer</p>
      </div>

      <div className="flex gap-4 mb-6">
        {(["uniaxial_pos", "uniaxial_neg", "biaxial"] as const).map(t => (
          <button key={t} onClick={() => setCrystalType(t)} className={`text-sm px-4 py-2 rounded ${crystalType === t ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300 border border-gray-600"}`}>
            {t === "uniaxial_pos" ? "Uniaxial (+)" : t === "uniaxial_neg" ? "Uniaxial (−)" : "Biaxial"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>o</sub></span>
          <input type="number" value={nO} onChange={e => setNO(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">n<sub>e</sub></span>
          <input type="number" value={nE} onChange={e => setNE(+e.target.value)} step="0.001"
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
        </label>
        <ValidatedNumberInput label="Thickness (mm)" value={thickness} onChange={setThickness} min={0.01} max={1} step="0.01" />
        <ValidatedNumberInput label="Objective NA" value={na} onChange={setNA} min={0.1} max={1.4} step="0.05" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setNO(1.658); setNE(1.486); setThickness(0.03); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Calcite thin</button>
        <button onClick={() => { setNO(1.544); setNE(1.553); setThickness(0.05); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Quartz</button>
        <button onClick={() => { setNA(0.95); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">High NA (0.95)</button>
        <button onClick={() => { setNA(0.25); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Low NA (0.25)</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Δn</p>
          <p className="text-2xl font-bold text-blue-400">{dn.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Max Cone Angle</p>
          <p className="text-2xl font-bold text-yellow-400">{maxAngleDeg.toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Fringe Order (edge)</p>
          <p className="text-2xl font-bold text-green-400">{fringeOrder.toFixed(1)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Biaxial 2V</p>
          <p className="text-2xl font-bold text-purple-400">{crystalType === "biaxial" ? `${biax2V.toFixed(1)}°` : "N/A"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Conoscopic Figure (crossed polars)</h3>
          <ChartPanel data={figureData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "#111827",
            font: { color: "#9ca3af" },
            xaxis: { title: "kx (NA)", gridcolor: "#374151", scaleanchor: "y", scaleratio: 1, range: [-na * 1.1, na * 1.1] },
            yaxis: { title: "ky (NA)", gridcolor: "#374151", range: [-na * 1.1, na * 1.1] },
            margin: { t: 20, r: 60, b: 50, l: 50 }, height: 400,
            shapes: [{ type: "circle" as const, xref: "x", yref: "y", x0: -na, y0: -na, x1: na, y1: na, line: { color: "#4b5563", width: 1 } }],
          }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Retardation vs Aperture Angle</h3>
          <ChartPanel data={radialData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Angle from axis (°)", gridcolor: "#374151" },
            yaxis: { title: "Fringe Order (waves)", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 50 }, height: 400,
          }} />
        </div>
      </div>
    </CalculatorShell>
  );
}
