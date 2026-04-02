"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

type C = { re: number; im: number };
type M2 = C[][];

function cm(a: C, b: C): C ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
function ca(a: C, b: C): C ({ re: a.re + b.re, im: a.im + b.im });
function cmul2(A: M2, B: M2): M2 {
  return [
    [ca(cm(A[0][0], B[0][0]), cm(A[0][1], B[1][0])), ca(cm(A[0][0], B[0][1]), cm(A[0][1], B[1][1]))],
    [ca(cm(A[1][0], B[0][0]), cm(A[1][1], B[1][0])), ca(cm(A[1][0], B[0][1]), cm(A[1][1], B[1][1]))],
  ];
}

const ELEMENTS: Record<string, M2> = {
  "Horizontal Polarizer": [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: 0 }]],
  "Vertical Polarizer": [[{ re: 0, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 1, im: 0 }]],
  "45° Polarizer": [[{ re: 0.5, im: 0 }, { re: 0.5, im: 0 }], [{ re: 0.5, im: 0 }, { re: 0.5, im: 0 }]],
  "Quarter-Wave (Fast-H)": [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: -1 }]],
  "Quarter-Wave (Fast-V)": [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: 0, im: 1 }]],
  "Half-Wave (Fast-H)": [[{ re: 1, im: 0 }, { re: 0, im: 0 }], [{ re: 0, im: 0 }, { re: -1, im: 0 }]],
  "Half-Wave (Fast-45°)": [[{ re: 0, im: 0 }, { re: 1, im: 0 }], [{ re: 1, im: 0 }, { re: 0, im: 0 }]],
  "RCP (Right Circular)": [[{ re: 0.5, im: 0 }, { re: 0, im: 0.5 }], [{ re: 0, im: -0.5 }, { re: 0.5, im: 0 }]],
  "LCP (Left Circular)": [[{ re: 0.5, im: 0 }, { re: 0, im: -0.5 }], [{ re: 0, im: 0.5 }, { re: 0.5, im: 0 }]],
};

const INPUT_STATES: Record<string, C[]> = {
  "Horizontal": [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  "Vertical": [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  "45° Linear": [{ re: 1 / Math.SQRT2, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }],
  "RCP": [{ re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: -1 / Math.SQRT2 }],
  "LCP": [{ re: 1 / Math.SQRT2, im: 0 }, { re: 0, im: 1 / Math.SQRT2 }],
  "Elliptical": [{ re: 1, im: 0 }, { re: 0.5, im: -0.3 }],
};

function fmt(c: C): string {
  const r = c.re.toFixed(3);
  const i = c.im.toFixed(3);
  if (c.im === 0) return r;
  if (c.re === 0) return i + "i";
  return `${r}${c.im >= 0 ? "+" : ""}${i}i`;
}

export default function JonesChainPage() {
  const [elements, setElements] = useState<string[]>(["Quarter-Wave (Fast-H)"]);
  const [inputState, setInputState] = useState("Horizontal");

  const addElement = () => setElements([...elements, "Quarter-Wave (Fast-H)"]);
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));

  const outputField = useMemo(() => {
    if (elements.length === 0) return INPUT_STATES[inputState];
    let result = [...INPUT_STATES[inputState]] as C[];
    for (let i = elements.length - 1; i >= 0; i--) {
      const M = ELEMENTS[elements[i]];
      if (!M) continue;
      result = [
        ca(cm(M[0][0], result[0]), cm(M[0][1], result[1])),
        ca(cm(M[1][0], result[0]), cm(M[1][1], result[1])),
      ];
    }
    return result;
  }, [elements, inputState]);

  const intensity = Math.abs(outputField[0].re) ** 2 + Math.abs(outputField[0].im) ** 2 + Math.abs(outputField[1].re) ** 2 + Math.abs(outputField[1].im) ** 2;

  // Ellipse params
  const ex = Math.abs(outputField[0].re) ** 2 + Math.abs(outputField[0].im) ** 2;
  const ey = Math.abs(outputField[1].re) ** 2 + Math.abs(outputField[1].im) ** 2;
  const exy = 2 * (outputField[0].re * outputField[1].re + outputField[0].im * outputField[1].im);
  const chi = 0.5 * Math.atan2(exy, ex - ey);
  const ellipticity = Math.abs(Math.tan(chi));
  const psi = 0.5 * Math.atan2(2 * exy, ex - ey) * 180 / Math.PI;

  const chartData = useMemo(() => {
    const t = Array.from({ length: 200 }, (_, i) => (i / 200) * 2 * Math.PI);
    const inp = INPUT_STATES[inputState];
    const outX = t.map(tt => inp[0].re * Math.cos(tt) - inp[0].im * Math.sin(tt));
    const outY = t.map(tt => inp[1].re * Math.cos(tt) - inp[1].im * Math.sin(tt));
    const resX = t.map(tt => outputField[0].re * Math.cos(tt) - outputField[0].im * Math.sin(tt));
    const resY = t.map(tt => outputField[1].re * Math.cos(tt) - outputField[1].im * Math.sin(tt));
    return [
      { x: outX, y: outY, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#60a5fa", dash: "dash" } },
      { x: resX, y: resY, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#f87171", width: 2 } },
    ];
  }, [inputState, outputField]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-5xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Jones Matrix Chain</h1>
      <p className="text-gray-400 mb-8">Chain Jones matrices to transform input polarization states and visualize the output ellipse.</p>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">E_out = M_n · M_{n-1} · … · M₁ · E_in</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block">
          <span className="text-gray-300 text-sm">Input Polarization</span>
          <select value={inputState} onChange={e => setInputState(e.target.value)}
            className="mt-1 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.keys(INPUT_STATES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Jones Elements</h2>
        <button onClick={addElement} className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-3 py-1 rounded">+ Add</button>
      </div>

      <div className="space-y-2 mb-6">
        {elements.map((el, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
            <select value={el} onChange={e => { const c = [...elements]; c[i] = e.target.value; setElements(c); }}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm">
              {Object.keys(ELEMENTS).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => removeElement(i)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Output E-field</p>
          <p className="font-mono text-sm text-blue-400">Ex = {fmt(outputField[0])}</p>
          <p className="font-mono text-sm text-green-400">Ey = {fmt(outputField[1])}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Intensity</p>
          <p className="text-2xl font-bold text-yellow-400">{intensity.toFixed(4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Orientation ψ</p>
          <p className="text-2xl font-bold text-purple-400">{psi.toFixed(1)}°</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ellipticity</p>
          <p className="text-2xl font-bold text-pink-400">{ellipticity.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Polarization Ellipse</h3>
          <Plot data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Ex", gridcolor: "#374151", scaleanchor: "y" },
            yaxis: { title: "Ey", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 50 },
            showlegend: true, legend: { font: { size: 10 } },
          }} config={{ responsive: true, displayModeBar: false }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Polarization Description</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <p>Type: <span className="text-white font-semibold">{ellipticity < 0.01 ? "Linear" : ellipticity > 0.99 ? "Circular" : "Elliptical"}</span></p>
            <p>Handedness: <span className="text-white font-semibold">{outputField[1].im > 0 ? "Left" : "Right"} (using physics convention)</span></p>
            <p>Transmission: <span className="text-white font-semibold">{(intensity * 100).toFixed(1)}%</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
