"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CONVENTION_NOTE, fix, stokesProblem } from "../../../components/polarization-format";
import {
  applyMueller,
  chainMueller,
  muellerDepolarizer,
  muellerPolarizer,
  muellerRetarder,
  muellerRotator,
  type MuellerMatrix,
} from "../../../physics/polarization/mueller";
import { analyzerIntensity, degreeOfPolarization, isPhysicalStokes, polarizedIntensity, type Stokes } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

type ElementKind = "polarizer" | "retarder" | "rotator" | "depolarizer";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** The Mueller matrix of one element: `param` is an angle (°), the retardance (°) or the depolarization (%). */
function elementMatrix(kind: ElementKind, param: number, fastAxisDeg: number): MuellerMatrix {
  switch (kind) {
    case "polarizer": return muellerPolarizer(param * DEG);
    case "retarder": return muellerRetarder(param * DEG, fastAxisDeg * DEG);
    case "rotator": return muellerRotator(param * DEG);
    case "depolarizer": return muellerDepolarizer(1 - clamp(param, 0, 100) / 100);
  }
}

const PARAM_LABELS: Record<ElementKind, string> = {
  polarizer: "Transmission axis (°)",
  retarder: "Retardance (°)",
  rotator: "Rotation (°, counter-clockwise)",
  depolarizer: "Depolarization (%)",
};

export default function MuellerPolarimetryPage() {
  const [inputS, setInputS] = useState<Stokes>([1, 1, 0, 0]); // H linear
  const [element1, setElement1] = useState<ElementKind>("retarder");
  const [param1, setParam1] = useURLState("param1", 90); // retardance, angle or depolarization
  const [axis1, setAxis1] = useURLState("axis1", 0); // fast axis of a retarder
  const [element2, setElement2] = useState<ElementKind>("polarizer");
  const [param2, setParam2] = useURLState("param2", 0);
  const [axis2, setAxis2] = useURLState("axis2", 0);
  const [analyzerAngle, setAnalyzerAngle] = useURLState("analyzerAngle", 45);

  const problem = stokesProblem(inputS);

  // M = M2 · M1: element 1 acts first.
  const outputS = useMemo<Stokes | null>(() => {
    if (!isPhysicalStokes(inputS)) return null;
    const M = chainMueller([elementMatrix(element1, param1, axis1), elementMatrix(element2, param2, axis2)]);
    return applyMueller(M, inputS);
  }, [inputS, element1, param1, axis1, element2, param2, axis2]);

  // No light left (e.g. crossed polarizers): the output has no defined state.
  const lit = outputS !== null && outputS[0] > 1e-12 * inputS[0];

  const finalIntensity = outputS ? analyzerIntensity(outputS, analyzerAngle * DEG) : NaN;
  const dopOut = outputS && lit ? degreeOfPolarization(outputS) : NaN;

  const scanData = useMemo(() => {
    if (!outputS) return null;
    const angles = Array.from({ length: 180 }, (_, i) => i);
    const intensities = angles.map(a => analyzerIntensity(outputS, a * DEG));
    return [
      { x: angles, y: intensities, type: "scatter" as const, mode: "lines" as const, name: "I(θ)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [outputS]);

  const elementCard = (
    title: string,
    kind: ElementKind,
    setKind: (k: ElementKind) => void,
    param: number,
    setParam: (v: number) => void,
    axis: number,
    setAxis: (v: number) => void,
  ) => (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm text-gray-400 mb-3">{title}</h3>
      <select value={kind} onChange={e => setKind(e.target.value as ElementKind)} aria-label={`${title} type`} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white mb-3">
        <option value="polarizer">Linear Polarizer</option>
        <option value="retarder">Retarder (QWP/HWP)</option>
        <option value="rotator">Rotator</option>
        <option value="depolarizer">Depolarizer</option>
      </select>
      {kind === "depolarizer"
        ? <ValidatedNumberInput label={PARAM_LABELS[kind]} value={clamp(param, 0, 100)} onChange={setParam} min={0} max={100} step="1" />
        : <ValidatedNumberInput label={PARAM_LABELS[kind]} value={param} onChange={setParam} step="1" />}
      {kind === "retarder" && (
        <div className="mt-3">
          <ValidatedNumberInput label="Fast axis (°)" value={axis} onChange={setAxis} step="1" />
        </div>
      )}
    </div>
  );

  return (
    <>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S_out = M · S_in, M_total = M_n · ... · M_2 · M_1</p>
        <p className="text-gray-500 text-xs mt-1">Mueller calculus: 4×4 matrices operate on 4×1 Stokes vectors</p>
        <p className="text-gray-500 text-xs mt-1">{CONVENTION_NOTE}</p>
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-200">Input Stokes Vector</h2>
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        {["S₀", "S₁", "S₂", "S₃"].map((label, i) => (
          <label key={label} className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">{label}</span>
            <input type="number" value={inputS[i]} onChange={e => {
              const v = +e.target.value;
              if (!Number.isFinite(v)) return;
              const newS: Stokes = [...inputS];
              newS[i] = v;
              setInputS(newS);
            }} step="0.1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        ))}
      </div>

      <div className={`flex flex-wrap gap-2 ${problem ? "mb-3" : "mb-8"}`}>
        <button onClick={() => setInputS([1, 1, 0, 0])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">H linear</button>
        <button onClick={() => setInputS([1, 0, 1, 0])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">+45° linear</button>
        <button onClick={() => setInputS([1, 0, 0, 1])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">RCP</button>
        <button onClick={() => setInputS([1, 0.3, 0.2, 0.1])} className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-300">Partial</button>
      </div>

      {problem && <p className="mb-8 text-sm text-red-400">{problem}</p>}

      <div className="grid gap-6 sm:grid-cols-2 mb-8">
        {elementCard("Element 1", element1, setElement1, param1, setParam1, axis1, setAxis1)}
        {elementCard("Element 2", element2, setElement2, param2, setParam2, axis2, setAxis2)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output S₀</p>
          <p className="text-2xl font-bold text-blue-400">{outputS ? fix(outputS[0], 3) : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output DOP</p>
          <p className="text-2xl font-bold text-green-400">{Number.isFinite(dopOut) ? `${fix(dopOut * 100, 1)}%` : "—"}</p>
        </div>
        <ValidatedNumberInput label="Analyzer angle (°)" value={analyzerAngle} onChange={setAnalyzerAngle} />
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Final Intensity</p>
          <p className="text-2xl font-bold text-yellow-400">{fix(finalIntensity, 3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Analyzer Scan</h3>
          {scanData ? (
            <ChartPanel data={scanData} layout={{
              paper_bgcolor: "transparent", plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              xaxis: { title: "Analyzer Angle (°)", gridcolor: "#374151" },
              yaxis: { title: "Intensity", gridcolor: "#374151" },
              margin: { t: 20, r: 20, b: 50, l: 50 },
            }} />
          ) : (
            <p className="text-gray-500">—</p>
          )}
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Output Stokes</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500">S₁</p><p className="font-mono text-green-400">{outputS ? fix(outputS[1], 3) : "—"}</p></div>
            <div><p className="text-xs text-gray-500">S₂</p><p className="font-mono text-yellow-400">{outputS ? fix(outputS[2], 3) : "—"}</p></div>
            <div><p className="text-xs text-gray-500">S₃</p><p className="font-mono text-purple-400">{outputS ? fix(outputS[3], 3) : "—"}</p></div>
            <div><p className="text-xs text-gray-500">|S|</p><p className="font-mono text-blue-400">{outputS ? fix(polarizedIntensity(outputS), 3) : "—"}</p></div>
          </div>
        </div>
      </div>
    </>
  );
}
