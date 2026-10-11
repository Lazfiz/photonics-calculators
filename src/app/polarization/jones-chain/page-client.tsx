"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import type { Complex } from "../../../physics/complex";
import {
  LCP,
  RCP,
  circularPolarizer,
  ellipticalState,
  intensity,
  linearPolarizer,
  linearRetarder,
  linearState,
  propagate,
  stokesFromJones,
  type JonesMatrix,
  type JonesVector,
} from "../../../physics/polarization/jones";
import { CONVENTION_NOTE, degOrDash, fix, stateLabel } from "../../../components/polarization-format";
import { axisRatio, ellipseAngles } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

const ELEMENTS: Record<string, JonesMatrix> = {
  "Horizontal Polarizer": linearPolarizer(0),
  "Vertical Polarizer": linearPolarizer(90 * DEG),
  "45° Polarizer": linearPolarizer(45 * DEG),
  "Quarter-Wave (Fast-H)": linearRetarder(90 * DEG, 0),
  "Quarter-Wave (Fast-V)": linearRetarder(90 * DEG, 90 * DEG),
  "Half-Wave (Fast-H)": linearRetarder(180 * DEG, 0),
  "Half-Wave (Fast-45°)": linearRetarder(180 * DEG, 45 * DEG),
  "Right Circular Polarizer": circularPolarizer("right"),
  "Left Circular Polarizer": circularPolarizer("left"),
};

// Unit intensity
const INPUT_STATES: Record<string, JonesVector> = {
  "Horizontal": linearState(0),
  "Vertical": linearState(90 * DEG),
  "45° Linear": linearState(45 * DEG),
  "RCP": RCP,
  "LCP": LCP,
  "Elliptical (ψ 20°, χ 15°)": ellipticalState(20 * DEG, 15 * DEG),
};

function fmt(c: Complex): string {
  const r = fix(c.re, 3);
  const i = fix(c.im, 3);
  if (Number(i) === 0) return r;
  if (Number(r) === 0) return `${i}i`;
  return `${r}${c.im >= 0 ? "+" : ""}${i}i`;
}

/** The ellipse Re{E e^{iωt}} traced over one period, closed. */
function ellipsePoints(E: JonesVector, n = 200): { x: number[]; y: number[] } {
  const t = Array.from({ length: n + 1 }, (_, i) => (i / n) * 2 * Math.PI);
  return {
    x: t.map((tt) => E[0].re * Math.cos(tt) - E[0].im * Math.sin(tt)),
    y: t.map((tt) => E[1].re * Math.cos(tt) - E[1].im * Math.sin(tt)),
  };
}

export default function JonesChainPage() {
  const [elements, setElements] = useState<string[]>(["Quarter-Wave (Fast-H)"]);
  const [inputState, setInputState] = useState("Horizontal");

  const addElement = () => setElements([...elements, "Quarter-Wave (Fast-H)"]);
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));

  const inputField = INPUT_STATES[inputState];

  // Element 1 acts first.
  const outputField = useMemo(() => {
    const matrices = elements.map((name) => ELEMENTS[name]).filter((M): M is JonesMatrix => M !== undefined);
    const states = propagate(matrices, INPUT_STATES[inputState]);
    return states[states.length - 1];
  }, [elements, inputState]);

  const outIntensity = intensity(outputField);
  const transmission = outIntensity / intensity(inputField);
  const dark = outIntensity < 1e-12;

  const S = stokesFromJones(outputField);
  const { psi, chi } = dark ? { psi: NaN, chi: NaN } : ellipseAngles(S);
  const ratio = dark ? NaN : axisRatio(S);
  const label = dark ? "No light transmitted" : stateLabel(S);

  const chartData = useMemo(() => {
    const inEllipse = ellipsePoints(inputField);
    const outEllipse = ellipsePoints(outputField);
    return [
      { x: inEllipse.x, y: inEllipse.y, type: "scatter" as const, mode: "lines" as const, name: "Input", line: { color: "#60a5fa", dash: "dash" } },
      { x: outEllipse.x, y: outEllipse.y, type: "scatter" as const, mode: "lines" as const, name: "Output", line: { color: "#f87171", width: 2 } },
    ];
  }, [inputField, outputField]);

  return (
    <>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <p className="text-gray-300 text-sm font-mono">E_out = M_n ⋯ M₂ · M₁ · E_in (element 1 acts first)</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Input Polarization</span>
          <select value={inputState} onChange={e => setInputState(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
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
          <p className="text-2xl font-bold text-yellow-400">{fix(outIntensity, 4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Orientation ψ</p>
          <p className="text-2xl font-bold text-purple-400">{degOrDash(psi)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Ellipticity angle χ</p>
          <p className="text-2xl font-bold text-pink-400">{degOrDash(chi)}</p>
          <p className="text-xs text-gray-500">axis ratio b/a = {Number.isNaN(ratio) ? "—" : ratio.toFixed(3)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Polarization Ellipse</h3>
          <ChartPanel data={chartData} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" },
            xaxis: { title: "Ex", gridcolor: "#374151", scaleanchor: "y" },
            yaxis: { title: "Ey", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 40, l: 50 },
            showlegend: true, legend: { font: { size: 10 } },
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-sm text-gray-400 mb-2">Polarization Description</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <p>State: <span className="text-white font-semibold">{label}</span></p>
            <p>Transmission: <span className="text-white font-semibold">{(transmission * 100).toFixed(1)}%</span></p>
          </div>
          <p className="mt-3 text-xs text-gray-500">{CONVENTION_NOTE}</p>
        </div>
      </div>
    </>
  );
}
