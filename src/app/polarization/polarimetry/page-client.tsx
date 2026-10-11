"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import { poincareWireframeTraces } from "../../../components/poincare-wireframe";
import { CONVENTION_NOTE, degOrDash, fix, stokesProblem } from "../../../components/polarization-format";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  analyzerIntensity,
  degreeOfCircularPolarization,
  degreeOfLinearPolarization,
  degreeOfPolarization,
  ellipseAngles,
  isPhysicalStokes,
  type Stokes,
} from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

export default function PolarimetryPage() {
  const [s0, setS0] = useURLState("s0", 1);
  const [s1, setS1] = useURLState("s1", 0.5);
  const [s2, setS2] = useURLState("s2", 0.3);
  const [s3, setS3] = useURLState("s3", 0.2);
  const [analyzerAngleDeg, setAnalyzerAngleDeg] = useURLState("analyzerAngleDeg", 0);

  const S: Stokes = [s0, s1, s2, s3];
  const problem = stokesProblem(S);
  const physical = problem === null;

  const dop = degreeOfPolarization(S);
  const dolp = degreeOfLinearPolarization(S);
  const docp = degreeOfCircularPolarization(S); // signed: > 0 right-handed
  const { psi, chi } = ellipseAngles(S);
  const transmitted = physical ? analyzerIntensity(S, analyzerAngleDeg * DEG) : NaN;

  const wireframe = useMemo(() => poincareWireframeTraces(), []);

  const poincareData = useMemo(() => {
    const traces: Record<string, unknown>[] = [...wireframe];
    if (!isPhysicalStokes([s0, s1, s2, s3])) return traces;
    const dopValue = degreeOfPolarization([s0, s1, s2, s3]);

    // Current state
    traces.push({
      x: [s1 / s0], y: [s2 / s0], z: [s3 / s0],
      type: "scatter3d" as const, mode: "markers" as const, name: "State",
      marker: { color: "#f87171", size: 10 },
    });

    // DOP sphere: radius = degree of polarization, full sphere
    if (dopValue > 1e-9) {
      const u = Array.from({ length: 30 }, (_, i) => (i / 30) * 2 * Math.PI);
      const v = Array.from({ length: 15 }, (_, i) => (i / 14) * Math.PI - Math.PI / 2);
      const surfX: number[][] = [];
      const surfY: number[][] = [];
      const surfZ: number[][] = [];
      for (let i = 0; i < v.length; i++) {
        surfX.push([]);
        surfY.push([]);
        surfZ.push([]);
        for (let j = 0; j < u.length; j++) {
          surfX[i].push(dopValue * Math.cos(v[i]) * Math.cos(u[j]));
          surfY[i].push(dopValue * Math.cos(v[i]) * Math.sin(u[j]));
          surfZ[i].push(dopValue * Math.sin(v[i]));
        }
      }
      traces.push({
        type: "surface" as const, x: surfX, y: surfY, z: surfZ,
        surfacecolor: surfZ, colorscale: [[0, "#1e3a5f"], [1, "#3b82f6"]],
        opacity: 0.2, showscale: false, name: "DOP sphere",
      });
    }

    return traces;
  }, [wireframe, s0, s1, s2, s3]);

  const analyzerData = useMemo(() => {
    if (!isPhysicalStokes([s0, s1, s2, s3])) return null;
    const angles = Array.from({ length: 180 }, (_, i) => i);
    const trans = angles.map(a => analyzerIntensity([s0, s1, s2, s3], a * DEG));
    return [
      { x: angles, y: trans, type: "scatter" as const, mode: "lines" as const, name: "Transmission", line: { color: "#60a5fa", width: 2 } },
      { x: [analyzerAngleDeg, analyzerAngleDeg], y: [0, Math.max(...trans)], type: "scatter" as const, mode: "lines" as const, name: "Analyzer", line: { color: "#f87171", dash: "dash" } },
    ];
  }, [s0, s1, s2, s3, analyzerAngleDeg]);

  return (
    <>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S = [S₀, S₁, S₂, S₃]ᵀ</p>
        <p className="text-gray-300 text-sm font-mono">DOP = √(S₁² + S₂² + S₃²) / S₀</p>
        <p className="text-gray-300 text-sm font-mono">ψ = ½atan2(S₂, S₁), χ = ½asin(S₃/|S|)</p>
        <p className="text-gray-500 text-xs mt-1">{CONVENTION_NOTE}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ValidatedNumberInput label="S₀ (total intensity)" value={s0} onChange={setS0} step="0.1" />
        <ValidatedNumberInput label="S₁ (H−V)" value={s1} onChange={setS1} step="0.1" />
        <ValidatedNumberInput label="S₂ (+45°−−45°)" value={s2} onChange={setS2} step="0.1" />
        <ValidatedNumberInput label="S₃ (RCP−LCP)" value={s3} onChange={setS3} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Analyzer angle (°)" value={analyzerAngleDeg} onChange={setAnalyzerAngleDeg} step="1" />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmitted intensity</p>
          <p className="text-2xl font-bold text-blue-400">{fix(transmitted, 3)}</p>
        </div>
      </div>

      {problem && <p className="mb-4 text-sm text-red-400">{problem}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => { setS0(1); setS1(1); setS2(0); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">H linear</button>
        <button onClick={() => { setS0(1); setS1(0); setS2(1); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">+45° linear</button>
        <button onClick={() => { setS0(1); setS1(0.707); setS2(0); setS3(0.707); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Elliptical</button>
        <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">RCP</button>
        <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(-1); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">LCP</button>
        <button onClick={() => { setS0(1); setS1(0); setS2(0); setS3(0); }} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Unpolarized</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOP</p>
          <p className="text-2xl font-bold text-blue-400">{physical ? `${fix(dop * 100, 1)}%` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOLP</p>
          <p className="text-2xl font-bold text-green-400">{physical ? `${fix(dolp * 100, 1)}%` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">DOCP (S₃/S₀, + = right)</p>
          <p className="text-2xl font-bold text-yellow-400">{physical ? `${fix(docp * 100, 1)}%` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Orientation ψ / Ellipticity χ</p>
          <p className="text-lg font-bold text-purple-400">{physical ? `${degOrDash(psi)} / ${degOrDash(chi)}` : "— / —"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Poincaré Sphere</h3>
          <ChartPanel data={poincareData} layout={{
            paper_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            scene: {
              xaxis: { title: "S₁", gridcolor: "#374151", range: [-1.2, 1.2] },
              yaxis: { title: "S₂", gridcolor: "#374151", range: [-1.2, 1.2] },
              zaxis: { title: "S₃", gridcolor: "#374151", range: [-1.2, 1.2] },
            },
            margin: { t: 10, r: 10, b: 10, l: 10 },
            showlegend: false,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Analyzer Transmission</h3>
          {analyzerData ? (
            <ChartPanel data={analyzerData} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
              yaxis: { title: "Transmission", gridcolor: "#374151" },
              margin: { t: 20, r: 20, b: 50, l: 50 },
            }} />
          ) : (
            <p className="text-gray-500">—</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-2">Stokes Vector</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div><p className="text-xs text-gray-500">S₀</p><p className="font-mono text-blue-400">{fix(s0, 3)}</p></div>
          <div><p className="text-xs text-gray-500">S₁</p><p className="font-mono text-green-400">{fix(s1, 3)}</p></div>
          <div><p className="text-xs text-gray-500">S₂</p><p className="font-mono text-yellow-400">{fix(s2, 3)}</p></div>
          <div><p className="text-xs text-gray-500">S₃</p><p className="font-mono text-purple-400">{fix(s3, 3)}</p></div>
        </div>
      </div>
    </>
  );
}
