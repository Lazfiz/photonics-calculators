"use client";

import { useMemo } from "react";
import { useURLState } from "../../../hooks/use-url-state";
import ChartPanel from "../../../components/chart-panel";
import type { Complex } from "../../../physics/complex";
import {
  JONES_CHAIN_ELEMENTS,
  JONES_CHAIN_INPUTS,
  intensity,
  propagate,
  stokesFromJones,
  type JonesVector,
} from "../../../physics/polarization/jones";
import { CONVENTION_NOTE, degOrDash, fix, stateLabel } from "../../../components/polarization-format";
import { axisRatio, ellipseAngles } from "../../../physics/polarization/stokes";

const inputOf = (id: string) => JONES_CHAIN_INPUTS[id] ?? JONES_CHAIN_INPUTS.h;

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
  const [input, setInput] = useURLState("input", "h");
  const [e1, setE1] = useURLState("element1", "qwp-fast-h");
  const [e2, setE2] = useURLState("element2", "none");
  const [e3, setE3] = useURLState("element3", "none");
  const [e4, setE4] = useURLState("element4", "none");
  const [e5, setE5] = useURLState("element5", "none");
  const [e6, setE6] = useURLState("element6", "none");
  const setters = [setE1, setE2, setE3, setE4, setE5, setE6];
  const defaults = ["qwp-fast-h", "none", "none", "none", "none", "none"];
  // An unknown id in the URL falls back to the slot's default.
  const slots = [e1, e2, e3, e4, e5, e6].map((v, i) => (v === "none" || Object.hasOwn(JONES_CHAIN_ELEMENTS, v) ? v : defaults[i]));
  const active = slots.flatMap((id, slot) => (id === "none" ? [] : [{ id, slot }]));
  const firstFree = slots.indexOf("none");

  const addElement = () => { if (firstFree >= 0) setters[firstFree]("qwp-fast-h"); };
  const removeElement = (slot: number) => setters[slot]("none");

  const inputState = Object.hasOwn(JONES_CHAIN_INPUTS, input) ? input : "h";
  const inputField = inputOf(inputState).jones;

  // Element 1 acts first.
  const outputField = useMemo(() => {
    const matrices = active.map(({ id }) => JONES_CHAIN_ELEMENTS[id].matrix);
    const states = propagate(matrices, inputField);
    return states[states.length - 1];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.join(","), inputField]);

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
          <select value={inputState} onChange={e => setInput(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            {Object.entries(JONES_CHAIN_INPUTS).map(([id, st]) => <option key={id} value={id}>{st.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-200">Jones Elements</h2>
        <button onClick={addElement} disabled={firstFree < 0} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-3 py-1 rounded">+ Add</button>
      </div>

      <div className="space-y-2 mb-6">
        {active.map(({ id: el, slot }, i) => (
          <div key={slot} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
            <select value={el} onChange={e => setters[slot](e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm">
              {Object.entries(JONES_CHAIN_ELEMENTS).map(([id, e]) => <option key={id} value={id}>{e.label}</option>)}
            </select>
            <button onClick={() => removeElement(slot)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
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
