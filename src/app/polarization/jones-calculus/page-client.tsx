"use client";

import { useState, useMemo } from "react";
import type { Complex } from "../../../physics/complex";
import {
  IDENTITY,
  LCP,
  RCP,
  intensity,
  linearPolarizer,
  linearRetarder,
  linearState,
  propagate,
  rotator,
  stokesFromJones,
  type JonesMatrix,
  type JonesVector,
} from "../../../physics/polarization/jones";
import { CONVENTION_NOTE, degOrDash, fix, stateLabel } from "../../../components/polarization-format";
import { ellipseAngles } from "../../../physics/polarization/stokes";

const DEG = Math.PI / 180;

type ElementType = "polarizer-h" | "polarizer-v" | "polarizer-45" | "polarizer-135" | "qwp-fast-h" | "qwp-fast-v" | "hwp-fast-h" | "hwp-fast-v" | "rotator";

const ELEMENT_OPTIONS: { type: ElementType; label: string; hasAngle: boolean; defaultAngle: number }[] = [
  { type: "polarizer-h", label: "Polarizer → H", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-v", label: "Polarizer → V", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-45", label: "Polarizer → 45°", hasAngle: false, defaultAngle: 0 },
  { type: "polarizer-135", label: "Polarizer → 135°", hasAngle: false, defaultAngle: 0 },
  { type: "qwp-fast-h", label: "λ/4 fast axis H", hasAngle: false, defaultAngle: 0 },
  { type: "qwp-fast-v", label: "λ/4 fast axis V", hasAngle: false, defaultAngle: 0 },
  { type: "hwp-fast-h", label: "λ/2 fast axis H", hasAngle: false, defaultAngle: 0 },
  { type: "hwp-fast-v", label: "λ/2 fast axis V", hasAngle: false, defaultAngle: 0 },
  { type: "rotator", label: "Rotator", hasAngle: true, defaultAngle: 45 },
];

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

function getJonesMatrix(el: JonesEl): JonesMatrix {
  switch (el.type) {
    case "polarizer-h": return linearPolarizer(0);
    case "polarizer-v": return linearPolarizer(90 * DEG);
    case "polarizer-45": return linearPolarizer(45 * DEG);
    case "polarizer-135": return linearPolarizer(135 * DEG);
    case "qwp-fast-h": return linearRetarder(90 * DEG, 0);
    case "qwp-fast-v": return linearRetarder(90 * DEG, 90 * DEG);
    case "hwp-fast-h": return linearRetarder(180 * DEG, 0);
    case "hwp-fast-v": return linearRetarder(180 * DEG, 90 * DEG);
    case "rotator": return rotator((el.angle ?? 45) * DEG);
    default: return IDENTITY;
  }
}

type InputPreset = "linear-h" | "linear-v" | "linear-45" | "linear-135" | "rcp" | "lcp";

const INPUT_PRESETS: Record<InputPreset, { jones: JonesVector; label: string }> = {
  "linear-h": { jones: linearState(0), label: "Linear H" },
  "linear-v": { jones: linearState(90 * DEG), label: "Linear V" },
  "linear-45": { jones: linearState(45 * DEG), label: "Linear 45°" },
  "linear-135": { jones: linearState(-45 * DEG), label: "Linear 135°" }, // 135° = −45°
  rcp: { jones: RCP, label: "RCP" },
  lcp: { jones: LCP, label: "LCP" },
};

export default function JonesCalculusPage() {
  const [elements, setElements] = useState<JonesEl[]>([]);
  const [inputKey, setInputKey] = useState<InputPreset>("linear-h");

  const addElement = (type: ElementType, hasAngle: boolean, defaultAngle: number) => {
    if (elements.length >= 5) return;
    setElements([...elements, { type, angle: hasAngle ? defaultAngle : undefined }]);
  };

  const removeElement = (idx: number) => {
    setElements(elements.filter((_, i) => i !== idx));
  };

  const updateAngle = (idx: number, angle: number) => {
    const newEls = [...elements];
    newEls[idx] = { ...newEls[idx], angle };
    setElements(newEls);
  };

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
  }, [elements, inputKey]);

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
          <h2 className="text-lg font-semibold mb-3">Element Chain ({elements.length}/5)</h2>
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
                const opt = ELEMENT_OPTIONS.find((o) => o.type === el.type);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-gray-800 rounded px-3 py-2">
                    <span className="text-gray-500 text-sm">{idx + 1}.</span>
                    <span className="text-sm flex-1">{opt?.label}</span>
                    {opt?.hasAngle && (
                      <input type="number" value={el.angle ?? 0} step="1" aria-label={`Rotation angle of element ${idx + 1} (°)`}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (Number.isFinite(v)) updateAngle(idx, v);
                        }}
                        className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white" />
                    )}
                    <button onClick={() => removeElement(idx)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
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
