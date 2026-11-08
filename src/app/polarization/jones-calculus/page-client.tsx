"use client";

import { useMemo } from "react";
import { useURLState } from "../../../hooks/use-url-state";
import type { Complex } from "../../../physics/complex";
import {
  IDENTITY,
  JONES_CALCULUS_ELEMENTS,
  JONES_CALCULUS_INPUTS,
  intensity,
  jonesCalculusMatrix,
  propagate,
  stokesFromJones,
  type JonesCalculusElementType,
  type JonesCalculusInputKey,
  type JonesMatrix,
} from "../../../physics/polarization/jones";
import { CONVENTION_NOTE, degOrDash, fix, stateLabel } from "../../../components/polarization-format";
import { ellipseAngles } from "../../../physics/polarization/stokes";

type ElementType = JonesCalculusElementType;
const ELEMENT_OPTIONS = JONES_CALCULUS_ELEMENTS;

function cfmt(c: Complex): string {
  const r = fix(c.re, 3);
  const i = fix(c.im, 3);
  if (Number(i) === 0) return r;
  if (Number(r) === 0) return `${i}i`;
  return `${r}${c.im >= 0 ? "+" : ""}${i}i`;
}

interface JonesEl {
  type: ElementType;
  angle?: number;
}

const getJonesMatrix = (el: JonesEl): JonesMatrix => jonesCalculusMatrix(el.type, el.angle);

type InputPreset = JonesCalculusInputKey;
const INPUT_PRESETS = JONES_CALCULUS_INPUTS;

export default function JonesCalculusPage() {
  const [input, setInput] = useURLState("input", "linear-h");
  const [e1, setE1] = useURLState("element1", "none");
  const [e2, setE2] = useURLState("element2", "none");
  const [e3, setE3] = useURLState("element3", "none");
  const [e4, setE4] = useURLState("element4", "none");
  const [e5, setE5] = useURLState("element5", "none");
  const [e6, setE6] = useURLState("element6", "none");
  const [a1, setA1] = useURLState("angle1", 45, { min: -180, max: 180 });
  const [a2, setA2] = useURLState("angle2", 45, { min: -180, max: 180 });
  const [a3, setA3] = useURLState("angle3", 45, { min: -180, max: 180 });
  const [a4, setA4] = useURLState("angle4", 45, { min: -180, max: 180 });
  const [a5, setA5] = useURLState("angle5", 45, { min: -180, max: 180 });
  const [a6, setA6] = useURLState("angle6", 45, { min: -180, max: 180 });
  const setters = [setE1, setE2, setE3, setE4, setE5, setE6];
  const angleSetters = [setA1, setA2, setA3, setA4, setA5, setA6];
  const angles = [a1, a2, a3, a4, a5, a6];
  // An unknown id in the URL counts as an empty slot.
  const slotTypes = [e1, e2, e3, e4, e5, e6].map((v) => ELEMENT_OPTIONS.find((o) => o.type === v)?.type ?? null);
  const slotKey = slotTypes.map((t, i) => `${t}:${angles[i]}`).join(",");
  const elements: (JonesEl & { slot: number })[] = slotTypes.flatMap((type, slot) => (type === null ? [] : [{ type, angle: angles[slot], slot }]));
  const firstFree = slotTypes.indexOf(null);
  const inputKey: InputPreset = Object.hasOwn(INPUT_PRESETS, input) ? (input as InputPreset) : "linear-h";
  const setInputKey = (k: InputPreset) => setInput(k);

  const addElement = (type: ElementType, hasAngle: boolean, defaultAngle: number) => {
    if (firstFree < 0) return;
    setters[firstFree](type);
    if (hasAngle) angleSetters[firstFree](defaultAngle);
  };

  const removeElement = (slot: number) => setters[slot]("none");

  const updateAngle = (slot: number, angle: number) => angleSetters[slot](angle);

  const inputState = INPUT_PRESETS[inputKey].jones;

  const chain = useMemo(() => {
    const matrices = elements.map(getJonesMatrix);
    const fields = propagate(matrices, INPUT_PRESETS[inputKey].jones);
    return fields.map((E, i) => {
      const opt = i === 0 ? undefined : ELEMENT_OPTIONS.find((o) => o.type === elements[i - 1].type);
      return {
        label: i === 0 ? "Input" : opt?.label || elements[i - 1].type,
        E,
        intensity: intensity(E),
        matrix: i === 0 ? IDENTITY : matrices[i - 1],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, inputKey]);

  const inputIntensity = intensity(inputState);
  const final = chain[chain.length - 1];
  const outputIntensity = final.intensity;
  const transmission = inputIntensity > 0 ? outputIntensity / inputIntensity : 0;

  // Final stage: the state of the light after the last element (the input when the chain is empty).
  const dark = outputIntensity < 1e-12;
  const finalStokes = stokesFromJones(final.E);
  const finalAngles = dark ? { psi: NaN, chi: NaN } : ellipseAngles(finalStokes);
  const finalLabel = dark ? "No light transmitted" : stateLabel(finalStokes);

  return (
    <>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Input State</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.keys(INPUT_PRESETS) as InputPreset[]).map((k) => (
              <button key={k} onClick={() => setInputKey(k)}
                className={`px-3 py-1 text-xs border rounded transition ${inputKey === k ? "border-blue-500 bg-blue-900/30 text-blue-400" : "border-gray-700 bg-gray-800 hover:border-blue-500"}`}>
                {INPUT_PRESETS[k].label}
              </button>
            ))}
          </div>
          <div className="font-mono text-sm text-gray-300">
            <p>E_x = {cfmt(inputState[0])}</p>
            <p>E_y = {cfmt(inputState[1])}</p>
          </div>
        </div>

        {/* Element chain */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">Element Chain ({elements.length}/6)</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {ELEMENT_OPTIONS.map((opt) => (
              <button key={opt.type} onClick={() => addElement(opt.type, opt.hasAngle, opt.defaultAngle)}
                className="px-3 py-1 text-xs bg-gray-800 border border-gray-700 rounded hover:border-blue-500 transition">
                + {opt.label}
              </button>
            ))}
          </div>
          {elements.length === 0 ? (
            <p className="text-gray-500 text-sm">Add elements to build the optical chain. Light propagates left → right.</p>
          ) : (
            <div className="space-y-2">
              {elements.map((el, idx) => {
                const slot = el.slot;
                const opt = ELEMENT_OPTIONS.find((o) => o.type === el.type);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-800 rounded px-3 py-2">
                    <span className="text-gray-500 text-sm">{idx + 1}.</span>
                    <span className="text-sm flex-1">{opt?.label}</span>
                    {opt?.hasAngle && (
                      <input type="number" value={el.angle ?? 0} step="1" aria-label={`Rotation angle of element ${idx + 1} (°)`}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) updateAngle(slot, v);
                        }}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
                    )}
                    <button onClick={() => removeElement(slot)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Propagation Results</h2>
          <div className="mb-4 flex gap-4">
            <div className="bg-gray-800 rounded px-4 py-2">
              <span className="text-gray-400 text-sm">Input Intensity</span>
              <p className="font-mono">{inputIntensity.toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 rounded px-4 py-2">
              <span className="text-gray-400 text-sm">Output Intensity</span>
              <p className="font-mono">{outputIntensity.toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 rounded px-4 py-2">
              <span className="text-gray-400 text-sm">Transmission</span>
              <p className="font-mono">{(transmission * 100).toFixed(2)}%</p>
            </div>
          </div>

          <p className="mb-1 text-sm text-gray-300">
            Output state: <span className="text-white font-semibold">{finalLabel}</span>
            {!dark && <span className="font-mono">, ψ = {degOrDash(finalAngles.psi)}, χ = {degOrDash(finalAngles.chi)}</span>}
          </p>
          <p className="mb-4 text-xs text-gray-500">{CONVENTION_NOTE}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Stage</th>
                  <th className="text-left py-2 text-gray-400">E_x</th>
                  <th className="text-left py-2 text-gray-400">E_y</th>
                  <th className="text-left py-2 text-gray-400">Intensity</th>
                  <th className="text-left py-2 text-gray-400">Jones Matrix</th>
                </tr>
              </thead>
              <tbody>
                {chain.map((s, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 font-semibold text-blue-400">{s.label}</td>
                    <td className="py-2 font-mono">{cfmt(s.E[0])}</td>
                    <td className="py-2 font-mono">{cfmt(s.E[1])}</td>
                    <td className="py-2 font-mono">{s.intensity.toFixed(4)}</td>
                    <td className="py-2 font-mono text-xs text-gray-500">
                      [{cfmt(s.matrix[0][0])}, {cfmt(s.matrix[0][1])}]<br/>
                      [{cfmt(s.matrix[1][0])}, {cfmt(s.matrix[1][1])}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
