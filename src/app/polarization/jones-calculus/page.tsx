"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

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

// Complex number arithmetic
type C = { re: number; im: number };
const czero = { re: 0, im: 0 };
const cone = { re: 1, im: 0 };
const ci = { re: 0, im: 1 };
function cmul(a: C, b: C): C {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cadd(a: C, b: C): C {
  return { re: a.re + b.re, im: a.im + b.im };
}
function cfmt(c: C): string {
  if (Math.abs(c.im) < 1e-10) return c.re.toFixed(3);
  if (Math.abs(c.re) < 1e-10) return `${c.im.toFixed(3)}i`;
  return `${c.re.toFixed(3)}${c.im >= 0 ? "+" : ""}${c.im.toFixed(3)}i`;
}

interface JonesEl {
  type: ElementType;
  angle?: number;
}

function getJonesMatrixC(el: JonesEl): C[][] {
  switch (el.type) {
    case "polarizer-h": return [[cone, czero], [czero, czero]];
    case "polarizer-v": return [[czero, czero], [czero, cone]];
    case "polarizer-45": return [[{ re: 0.5, im: 0 }, { re: 0.5, im: 0 }], [{ re: 0.5, im: 0 }, { re: 0.5, im: 0 }]];
    case "polarizer-135": return [[{ re: 0.5, im: 0 }, { re: -0.5, im: 0 }], [{ re: -0.5, im: 0 }, { re: 0.5, im: 0 }]];
    case "qwp-fast-h": return [[cone, czero], [czero, { re: Math.cos(-Math.PI / 2), im: Math.sin(-Math.PI / 2) }]];
    case "qwp-fast-v": return [[{ re: Math.cos(-Math.PI / 2), im: Math.sin(-Math.PI / 2) }, czero], [czero, cone]];
    case "hwp-fast-h": return [[cone, czero], [czero, { re: Math.cos(-Math.PI), im: Math.sin(-Math.PI) }]];
    case "hwp-fast-v": return [[{ re: Math.cos(-Math.PI), im: Math.sin(-Math.PI) }, czero], [czero, cone]];
    case "rotator": {
      const a = ((el.angle || 45) * Math.PI) / 180;
      return [[{ re: Math.cos(a), im: 0 }, { re: -Math.sin(a), im: 0 }], [{ re: Math.sin(a), im: 0 }, { re: Math.cos(a), im: 0 }]];
    }
    default: return [[cone, czero], [czero, cone]];
  }
}

function matVec(m: C[][], v: C[]): C[] {
  return [
    cadd(cmul(m[0][0], v[0]), cmul(m[0][1], v[1])),
    cadd(cmul(m[1][0], v[0]), cmul(m[1][1], v[1])),
  ];
}

function intensity(v: C[]): number {
  return v[0].re * v[0].re + v[0].im * v[0].im + v[1].re * v[1].re + v[1].im * v[1].im;
}

type InputPreset = "linear-h" | "linear-v" | "linear-45" | "linear-135" | "rcp" | "lcp";

const INPUT_PRESETS: Record<InputPreset, { jones: C[]; label: string }> = {
  "linear-h": { jones: [cone, czero], label: "Linear H" },
  "linear-v": { jones: [czero, cone], label: "Linear V" },
  "linear-45": { jones: [{ re: 1 / Math.sqrt(2), im: 0 }, { re: 1 / Math.sqrt(2), im: 0 }], label: "Linear 45°" },
  "linear-135": { jones: [{ re: 1 / Math.sqrt(2), im: 0 }, { re: -1 / Math.sqrt(2), im: 0 }], label: "Linear 135°" },
  rcp: { jones: [{ re: 1 / Math.sqrt(2), im: 0 }, { re: 0, im: 1 / Math.sqrt(2) }], label: "RCP" },
  lcp: { jones: [{ re: 1 / Math.sqrt(2), im: 0 }, { re: 0, im: -1 / Math.sqrt(2) }], label: "LCP" },
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
    const states: { label: string; ex: C; ey: C; intensity: number; matrix: C[][] }[] = [];
    let state = [...inputState] as C[];
    states.push({ label: "Input", ex: state[0], ey: state[1], intensity: intensity(state), matrix: [[cone, czero], [czero, cone]] });

    for (const el of elements) {
      const opt = ELEMENT_OPTIONS.find((o) => o.type === el.type);
      const mat = getJonesMatrixC(el);
      state = matVec(mat, state);
      states.push({
        label: opt?.label || el.type,
        ex: state[0],
        ey: state[1],
        intensity: intensity(state),
        matrix: mat,
      });
    }
    return states;
  }, [elements, inputKey]);

  const inputIntensity = intensity(inputState);
  const outputIntensity = chain.length > 0 ? chain[chain.length - 1].intensity : 0;
  const transmission = inputIntensity > 0 ? outputIntensity / inputIntensity : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
      <Link href="/polarization" className="text-blue-400 hover:underline mb-6 inline-block">← Polarization</Link>
      <h1 className="text-3xl font-bold mb-2">Jones Calculus</h1>
      <p className="text-gray-400 mb-6">Chain Jones matrices for polarizers, waveplates, and rotators. Up to 5 elements.</p>

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
                      <input type="number" value={el.angle || 0} step="1"
                        onChange={(e) => updateAngle(idx, parseFloat(e.target.value) || 0)}
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
                    <td className="py-2 font-mono">{cfmt(s.ex)}</td>
                    <td className="py-2 font-mono">{cfmt(s.ey)}</td>
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
    </div>
  );
}
