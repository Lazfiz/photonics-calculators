"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import InputSlider from "../../../components/input-slider";
import { poincareWireframeTraces } from "../../../components/poincare-wireframe";
import { CONVENTION_NOTE, fix, stateLabel, stokesProblem } from "../../../components/polarization-format";
import { useURLState } from "../../../hooks/use-url-state";
import {
  axisRatio,
  degreeOfCircularPolarization,
  degreeOfLinearPolarization,
  degreeOfPolarization,
  ellipseAngles,
  type Stokes,
} from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

type Preset = "linear-h" | "linear-v" | "linear-45" | "linear-135" | "rcp" | "lcp" | "elliptical";

const presets: Record<Preset, { I: number; Q: number; U: number; V: number; label: string }> = {
  "linear-h": { I: 1, Q: 1, U: 0, V: 0, label: "Linear Horizontal" },
  "linear-v": { I: 1, Q: -1, U: 0, V: 0, label: "Linear Vertical" },
  "linear-45": { I: 1, Q: 0, U: 1, V: 0, label: "Linear 45°" },
  "linear-135": { I: 1, Q: 0, U: -1, V: 0, label: "Linear 135°" },
  rcp: { I: 1, Q: 0, U: 0, V: 1, label: "Right Circular" },
  lcp: { I: 1, Q: 0, U: 0, V: -1, label: "Left Circular" },
  elliptical: { I: 1, Q: 0.5, U: 0.5, V: 0.7071, label: "Elliptical" },
};

export default function StokesPage() {
  const [I, setI] = useURLState("I", 1);
  const [Q, setQ] = useURLState("Q", 0.5);
  const [U, setU] = useURLState("U", 0.3);
  const [V, setV] = useURLState("V", 0.2);

  const wireframe = useMemo(() => poincareWireframeTraces(), []);

  const S: Stokes = [I, Q, U, V];
  const problem = stokesProblem(S);
  const physical = problem === null;

  const { psi, chi } = ellipseAngles(S);
  const results = physical
    ? {
        dop: degreeOfPolarization(S),
        dolp: degreeOfLinearPolarization(S),
        docp: degreeOfCircularPolarization(S),
        psi: psi / DEG, // NaN for circular and unpolarized light
        chi: chi / DEG, // NaN for unpolarized light
        ar: axisRatio(S),
        handedness: stateLabel(S),
      }
    : null;

  const applyPreset = (p: Preset) => {
    const v = presets[p];
    setI(v.I);
    setQ(v.Q);
    setU(v.U);
    setV(v.V);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Stokes Vector Input</h2>
          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-2">Presets</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(presets) as Preset[]).map((p) => (
                <button key={p} onClick={() => applyPreset(p)} className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500 transition">
                  {presets[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <InputSlider label="I (Intensity)" value={I} onChange={setI} min={0.1} max={2} step={0.01} />
            <InputSlider label="Q" value={Q} onChange={setQ} min={-1} max={1} step={0.01} />
            <InputSlider label="U" value={U} onChange={setU} min={-1} max={1} step={0.01} />
            <InputSlider label="V" value={V} onChange={setV} min={-1} max={1} step={0.01} />
          </div>

          <div className="mt-4 text-sm text-gray-500">S = [{I.toFixed(2)}, {Q.toFixed(2)}, {U.toFixed(2)}, {V.toFixed(2)}]</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Polarization Analysis</h2>
          {problem && <p className="mb-3 text-red-400">{problem}</p>}
          <div className="space-y-3">
            <ResultRow label="Degree of Polarization (DOP)" value={results ? fix(results.dop, 4) : "—"} />
            <ResultRow label="Degree of Linear Polarization (DOLP)" value={results ? fix(results.dolp, 4) : "—"} />
            <ResultRow label="DOCP (S₃/S₀, + = right)" value={results ? fix(results.docp, 4) : "—"} />
            <ResultRow label="Orientation angle ψ" value={results && !Number.isNaN(results.psi) ? `${fix(results.psi, 2)}°` : "—"} />
            <ResultRow label="Ellipticity angle χ" value={results && !Number.isNaN(results.chi) ? `${fix(results.chi, 2)}°` : "—"} />
            <ResultRow label="Axis ratio b/a" value={results ? fix(results.ar, 4) : "—"} />
            <ResultRow label="Handedness" value={results ? results.handedness : "—"} />
          </div>
          <p className="mt-4 text-xs text-gray-500">{CONVENTION_NOTE}</p>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Poincaré Sphere</h2>
          <ChartPanel
            data={[
              ...wireframe,
              ...(physical
                ? [{ type: "scatter3d" as const, mode: "markers" as const, x: [Q / I], y: [U / I], z: [V / I], marker: { size: 10, color: "#3b82f6", symbol: "circle" }, name: "Polarization state" }]
                : []),
            ]}
            layout={{
              scene: { xaxis: { title: "S₁/Q", range: [-1.2, 1.2], color: "#9ca3af" }, yaxis: { title: "S₂/U", range: [-1.2, 1.2], color: "#9ca3af" }, zaxis: { title: "S₃/V", range: [-1.2, 1.2], color: "#9ca3af" }, bgcolor: "#111827" },
              margin: { l: 0, r: 0, t: 0, b: 0 }, paper_bgcolor: "#111827", font: { color: "#d1d5db" },
              showlegend: true, legend: { x: 0, y: 1, bgcolor: "rgba(0,0,0,0)" },
            }}
          />
        </div>
      </div>
    </>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-800">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}
