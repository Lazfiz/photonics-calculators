"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
export default function ABCDMatrixPage() {
  const [elements, setElements] = useState<Array<{ type: string; p1: string; p2: string }>>([
    { type: "free-space", p1: "100", p2: "" },
  ]);
  const [inputHeight, setInputHeight] = useURLState("inputHeight", 1);
  const [inputAngle, setInputAngle] = useURLState("inputAngle", 0);

  const typeOptions = [
    { value: "free-space", label: "Free Space", p1: "Distance d (mm)", p2: "" },
    { value: "thin-lens", label: "Thin Lens", p1: "Focal length f (mm)", p2: "" },
    { value: "flat-mirror", label: "Flat Mirror", p1: "", p2: "" },
    { value: "curved-mirror", label: "Curved Mirror", p1: "Radius R (mm)", p2: "" },
    { value: "dielectric", label: "Dielectric Interface", p1: "n₁", p2: "n₂" },
  ];

  const addElement = () => setElements([...elements, { type: "free-space", p1: "50", p2: "" }]);
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i: number, field: string, value: string) => {
    const updated = [...elements];
    updated[i] = { ...updated[i], [field]: value };
    setElements(updated);
  };

  const result = useMemo(() => {
    // Start with identity matrix
    let M = { A: 1, B: 0, C: 0, D: 1 };

    for (const el of elements) {
      let m: { A: number; B: number; C: number; D: number };
      switch (el.type) {
        case "free-space": {
          const d = parseFloat(el.p1) || 0;
          m = { A: 1, B: d, C: 0, D: 1 };
          break;
        }
        case "thin-lens": {
          const f = parseFloat(el.p1) || Infinity;
          m = { A: 1, B: 0, C: -1 / f, D: 1 };
          break;
        }
        case "flat-mirror":
          m = { A: 1, B: 0, C: 0, D: 1 };
          break;
        case "curved-mirror": {
          const R = parseFloat(el.p1) || Infinity;
          m = { A: 1, B: 0, C: -2 / R, D: 1 };
          break;
        }
        case "dielectric": {
          const n1 = parseFloat(el.p1) || 1;
          const n2 = parseFloat(el.p2) || 1.5;
          m = { A: 1, B: 0, C: 0, D: n1 / n2 };
          break;
        }
        default:
          m = { A: 1, B: 0, C: 0, D: 1 };
      }
      // Multiply M * m
      const { A, B, C, D } = M;
      M = {
        A: A * m.A + B * m.C,
        B: A * m.B + B * m.D,
        C: C * m.A + D * m.C,
        D: C * m.B + D * m.D,
      };
    }

    const outHeight = M.A * inputHeight + M.B * inputAngle;
    const outAngle = M.C * inputHeight + M.D * inputAngle;
    const det = M.A * M.D - M.B * M.C;
    const isImaging = Math.abs(M.B) < 1e-10;

    return { ...M, outHeight, outAngle, det, isImaging };
  }, [elements, inputHeight, inputAngle]);

  return (
    <CalculatorShell backHref="/wave-optics" backLabel="Wave Optics" title="ABCD Matrix Calculator" description="Build an optical system from sequential elements and compute the ray transfer matrix.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Input Ray Height (mm)" value={inputHeight} onChange={setInputHeight} step="any" />
        <ValidatedNumberInput label="Input Ray Angle (mrad)" value={inputAngle} onChange={setInputAngle} step="any" />
      </div>

      <div className="space-y-3 mb-8">
        {elements.map((el, i) => (
          <div key={i} className="flex gap-2 items-end bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex-1">
              <span className="text-xs text-gray-500">Element {i + 1}</span>
              <select value={el.type} onChange={e => updateElement(i, "type", e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1">
                {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {typeOptions.find(o => o.value === el.type)?.p1 && (
              <div className="flex-1">
                <span className="text-xs text-gray-500">{typeOptions.find(o => o.value === el.type)!.p1}</span>
                <input type="number" value={el.p1} onChange={e => updateElement(i, "p1", e.target.value)} step="any" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1" />
              </div>
            )}
            {typeOptions.find(o => o.value === el.type)?.p2 && (
              <div className="flex-1">
                <span className="text-xs text-gray-500">{typeOptions.find(o => o.value === el.type)!.p2}</span>
                <input type="number" value={el.p2} onChange={e => updateElement(i, "p2", e.target.value)} step="any" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1" />
              </div>
            )}
            <button onClick={() => removeElement(i)} className="text-red-400 hover:text-red-300 px-2 py-1 text-sm">✕</button>
          </div>
        ))}
        <button onClick={addElement} className="text-blue-400 hover:text-blue-300 text-sm">+ Add Element</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">System ABCD Matrix</p>
          <div className="font-mono text-lg">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-blue-400">{result.A.toFixed(4)}</span>
              <span className="text-green-400">{result.B.toFixed(4)}</span>
              <span className="text-orange-400">{result.C.toFixed(6)}</span>
              <span className="text-purple-400">{result.D.toFixed(4)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">det(M) = {result.det.toFixed(6)} {Math.abs(result.det - 1) < 0.001 ? "✓" : "⚠"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Output Ray</p>
          <p className="text-lg">Height: <span className="text-blue-400 font-bold">{result.outHeight.toFixed(4)} mm</span></p>
          <p className="text-lg">Angle: <span className="text-green-400 font-bold">{result.outAngle.toFixed(4)} mrad</span></p>
          {result.isImaging && <p className="text-sm text-yellow-400 mt-2">✓ Imaging condition (B ≈ 0)</p>}
        </div>
      </div>
    </CalculatorShell>
  );
}
