"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { CONVENTION_NOTE, fix, stokesProblem } from "../../../components/polarization-format";
import {
  applyMueller,
  chainMueller,
  muellerCircularPolarizer,
  muellerPolarizer,
  muellerRetarder,
  muellerRotator,
  type MuellerMatrix,
} from "../../../physics/polarization/mueller";
import { degreeOfPolarization, isPhysicalStokes, type Stokes } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

// Ideal Mueller matrices for common elements
const ELEMENTS: Record<string, MuellerMatrix> = {
  "Horizontal Polarizer": muellerPolarizer(0),
  "Vertical Polarizer": muellerPolarizer(90 * DEG),
  "45° Polarizer": muellerPolarizer(45 * DEG),
  "Quarter-Wave (Fast-H)": muellerRetarder(90 * DEG, 0),
  "Quarter-Wave (Fast-V)": muellerRetarder(90 * DEG, 90 * DEG),
  "Half-Wave (Fast-H)": muellerRetarder(180 * DEG, 0),
  "Right Circular Polarizer": muellerCircularPolarizer("right"),
  "Left Circular Polarizer": muellerCircularPolarizer("left"),
  "Rotator (+45°)": muellerRotator(45 * DEG),
};

const STOKES_LABELS = ["S₀ (I)", "S₁", "S₂", "S₃"];

export default function MuellerMatrixPage() {
  const [elements, setElements] = useState<string[]>(["Horizontal Polarizer"]);
  const [inputStokes, setInputStokes] = useState<Stokes>([1, 1, 0, 0]); // horizontal linear

  const addElement = () => setElements([...elements, "Horizontal Polarizer"]);
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i: number, val: string) => {
    const copy = [...elements];
    copy[i] = val;
    setElements(copy);
  };

  const problem = stokesProblem(inputStokes);

  // Element 1 acts first: M = M_n ⋯ M_1.
  const combinedMatrix = useMemo(
    () => chainMueller(elements.map((name) => ELEMENTS[name]).filter((M): M is MuellerMatrix => M !== undefined)),
    [elements],
  );

  const outputStokes = useMemo<Stokes | null>(() => {
    if (!isPhysicalStokes(inputStokes)) return null;
    return applyMueller(combinedMatrix, inputStokes);
  }, [combinedMatrix, inputStokes]);

  // No light left (e.g. crossed polarizers): the output has no defined state.
  const dop = outputStokes && outputStokes[0] > 1e-12 * inputStokes[0] ? degreeOfPolarization(outputStokes) : NaN;

  const chartData = useMemo(() => {
    if (!outputStokes) return null;
    return [
      {
        x: STOKES_LABELS, y: inputStokes,
        type: "bar" as const, name: "Input Stokes",
        marker: { color: "#60a5fa" },
      },
      {
        x: STOKES_LABELS, y: outputStokes,
        type: "bar" as const, name: "Output Stokes",
        marker: { color: "#f87171" },
      },
    ];
  }, [inputStokes, outputStokes]);

  return (
    <>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S_out = M_n · M_(n-1) · … · M₁ · S_in</p>
        <p className="text-gray-500 text-xs mt-1">{CONVENTION_NOTE}</p>
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-200">Input Stokes Vector</h2>
      <div className={`grid gap-4 grid-cols-4 ${problem ? "mb-3" : "mb-6"}`}>
        {STOKES_LABELS.map((label, i) => (
          <label key={i} className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
            <span className="text-sm text-gray-300">{label}</span>
            <input type="number" value={inputStokes[i]} onChange={e => {
              const v = +e.target.value;
              if (!Number.isFinite(v)) return;
              const copy: Stokes = [...inputStokes]; copy[i] = v; setInputStokes(copy);
            }} step="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        ))}
      </div>
      {problem && <p className="mb-6 text-sm text-red-400">{problem}</p>}

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Optical Elements (light travels →)</h2>
        <button onClick={addElement} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded">+ Add Element</button>
      </div>

      <div className="space-y-2 mb-6">
        {elements.map((el, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
            <select value={el} onChange={e => updateElement(i, e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm">
              {Object.keys(ELEMENTS).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <button onClick={() => removeElement(i)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Output Stokes Vector</h3>
          <div className="grid grid-cols-4 gap-2">
            {STOKES_LABELS.map((label, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-blue-400">{outputStokes ? fix(outputStokes[i], 3) : "—"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            DOP: {Number.isFinite(dop) ? `${fix(dop * 100, 1)}%` : "—"}
          </p>
        </div>

        {elements.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-2">Combined Mueller Matrix</h3>
            <div className="font-mono text-xs text-gray-300 space-y-0.5">
              {combinedMatrix.map((row, i) => (
                <div key={i}>[{row.map(v => fix(v, 2).padStart(6)).join(", ")}]</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {chartData && (
        <div className="bg-gray-900 rounded-lg p-4">
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            barmode: "group",
            xaxis: { gridcolor: "#374151" },
            yaxis: { title: "Stokes Parameter", gridcolor: "#374151" },
            margin: { t: 30, r: 30, b: 50, l: 70 },
          }} />
        </div>
      )}
    </>
  );
}
