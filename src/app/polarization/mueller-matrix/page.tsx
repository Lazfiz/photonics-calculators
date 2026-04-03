"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

// Ideal Mueller matrices for common elements
const ELEMENTS: Record<string, number[][]> = {
  "Horizontal Polarizer": [
    [0.5, 0.5, 0, 0],
    [0.5, 0.5, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  "Vertical Polarizer": [
    [0.5, -0.5, 0, 0],
    [-0.5, 0.5, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  "Quarter-Wave (Fast-H)": [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [0, 0, -1, 0],
  ],
  "Quarter-Wave (Fast-V)": [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, -1],
    [0, 0, 1, 0],
  ],
  "Half-Wave (Fast-H)": [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, -1, 0],
    [0, 0, 0, -1],
  ],
  "45° Polarizer": [
    [0.5, 0, 0.5, 0],
    [0, 0, 0, 0],
    [0.5, 0, 0.5, 0],
    [0, 0, 0, 0],
  ],
  "Circular Polarizer (RCP)": [
    [0.5, 0, 0, 0.5],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0.5, 0, 0, 0.5],
  ],
  "Rotator (45°)": [
    [1, 0, 0, 0],
    [0, 0, 1, 0],
    [0, -1, 0, 0],
    [0, 0, 0, 1],
  ],
};

function matMul(a: number[][], b: number[][]): number[][] {
  const n = a.length;
  const r: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++)
        r[i][j] += a[i][k] * b[k][j];
  return r;
}

const STOKES_LABELS = ["S₀ (I)", "S₁", "S₂", "S₃"];

export default function MuellerMatrixPage() {
  const [elements, setElements] = useState<string[]>(["Horizontal Polarizer"]);
  const [inputStokes, setInputStokes] = useState([1, 1, 0, 0]); // horizontal linear

  const addElement = () => setElements([...elements, "Horizontal Polarizer"]);
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i: number, val: string) => {
    const copy = [...elements];
    copy[i] = val;
    setElements(copy);
  };

  const outputStokes = useMemo(() => {
    if (elements.length === 0) return inputStokes;
    let result = [...inputStokes] as number[];
    // Apply in reverse order: last element acts first on light
    for (let i = elements.length - 1; i >= 0; i--) {
      const M = ELEMENTS[elements[i]];
      if (!M) continue;
      result = M.map(row => row.reduce((s, v, j) => s + v * result[j], 0));
    }
    return result;
  }, [elements, inputStokes]);

  const combinedMatrix = useMemo(() => {
    if (elements.length === 0) return null;
    let result = ELEMENTS[elements[elements.length - 1]];
    for (let i = elements.length - 2; i >= 0; i--) {
      result = matMul(ELEMENTS[elements[i]], result);
    }
    return result;
  }, [elements]);

  const chartData = useMemo(() => {
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
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Mueller Matrix Calculator</h1>
      <p className="text-gray-400 mb-8">Chain optical elements using Mueller matrices and compute output Stokes vector.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">S_out = M_n · M_(n-1) · … · M₁ · S_in</p>
      </div>

      <h2 className="text-lg font-semibold mb-3 text-gray-200">Input Stokes Vector</h2>
      <div className="grid gap-4 grid-cols-4 mb-6">
        {STOKES_LABELS.map((label, i) => (
          <label key={i} className="block">
            <span className="text-gray-300 text-sm">{label}</span>
            <input type="number" value={inputStokes[i]} onChange={e => {
              const copy = [...inputStokes]; copy[i] = +e.target.value; setInputStokes(copy);
            }} step="0.01" className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" />
          </label>
        ))}
      </div>

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
            {outputStokes.map((v, i) => (
              <div key={i} className="text-center">
                <p className="text-xs text-gray-500">{STOKES_LABELS[i]}</p>
                <p className="text-lg font-bold text-blue-400">{v.toFixed(3)}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            DOP: {(Math.sqrt(outputStokes[1]**2 + outputStokes[2]**2 + outputStokes[3]**2) / Math.max(outputStokes[0], 1e-10) * 100).toFixed(1)}%
          </p>
        </div>

        {combinedMatrix && (
          <div className="bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm text-gray-400 mb-2">Combined Mueller Matrix</h3>
            <div className="font-mono text-xs text-gray-300 space-y-0.5">
              {combinedMatrix.map((row, i) => (
                <div key={i}>[{row.map(v => v.toFixed(2).padStart(6)).join(", ")}]</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <Plot data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          barmode: "group",
          xaxis: { gridcolor: "#374151" },
          yaxis: { title: "Stokes Parameter", gridcolor: "#374151" },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} config={{ responsive: true, displayModeBar: false }} />
      </div>
    </div>
  );
}
