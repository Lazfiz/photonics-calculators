"use client";

import { useMemo } from "react";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  determinant, expectedDeterminant, systemMatrix, traceRay, type AbcdElement,
} from "../../../physics/wave-optics/abcd";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const MAX_ELEMENTS = 20;
const LEN = 1e6; // mm, limit for distances, focal lengths and radii
const DEFAULT_ELEMENTS = "d150_f100_d300";

type Kind = AbcdElement["kind"];
// UI element: lengths in mm. URL token per element, joined by "_": d<mm>, f<mm>, m, r<mm>, n<n₁>x<n₂>.
type UiElement = { kind: Kind; a: number; b: number };

const KINDS: { kind: Kind; label: string; a?: string; b?: string; defaults: [number, number] }[] = [
  { kind: "space", label: "Free space", a: "Distance d (mm)", defaults: [50, 0] },
  { kind: "lens", label: "Thin lens", a: "Focal length f (mm)", defaults: [100, 0] },
  { kind: "flat-mirror", label: "Flat mirror", defaults: [0, 0] },
  { kind: "curved-mirror", label: "Curved mirror", a: "Radius R (mm, concave > 0)", defaults: [200, 0] },
  { kind: "interface", label: "Flat interface", a: "n₁", b: "n₂", defaults: [1, 1.5] },
];
const PREFIX: Record<Kind, string> = { space: "d", lens: "f", "flat-mirror": "m", "curved-mirror": "r", interface: "n" };

function parseElements(s: string): UiElement[] {
  const out: UiElement[] = [];
  for (const token of s.split("_").slice(0, MAX_ELEMENTS)) {
    const kind = (Object.keys(PREFIX) as Kind[]).find((k) => PREFIX[k] === token[0]);
    if (!kind) continue;
    const [a, b] = token.slice(1).split("x").map(Number);
    if (kind === "flat-mirror") out.push({ kind, a: 0, b: 0 });
    else if (kind === "space") out.push({ kind, a: clamp(a, 0, LEN, 50), b: 0 });
    else if (kind === "interface") out.push({ kind, a: clamp(a, 1, 5, 1), b: clamp(b, 1, 5, 1.5) });
    else out.push({ kind, a: clamp(a, -LEN, LEN, kind === "lens" ? 100 : 200), b: 0 });
  }
  return out;
}

function serialize(els: UiElement[]): string {
  if (els.length === 0) return "0"; // an unknown token, so an empty list survives the round trip
  return els
    .map((e) => PREFIX[e.kind] + (e.kind === "flat-mirror" ? "" : e.kind === "interface" ? `${e.a}x${e.b}` : `${e.a}`))
    .join("_");
}

function toPhysics(e: UiElement): AbcdElement {
  switch (e.kind) {
    case "space": return { kind: "space", d: e.a * 1e-3 };
    case "lens": return { kind: "lens", f: e.a * 1e-3 };
    case "flat-mirror": return { kind: "flat-mirror" };
    case "curved-mirror": return { kind: "curved-mirror", R: e.a * 1e-3 };
    case "interface": return { kind: "interface", n1: e.a, n2: e.b };
  }
}

export default function ABCDMatrixPage() {
  const [elementsRaw, setElementsRaw] = useURLState("elements", DEFAULT_ELEMENTS);
  const [heightRaw, setInputHeight] = useURLState("inputHeight", 1); // mm
  const [angleRaw, setInputAngle] = useURLState("inputAngle", 0); // mrad

  const elements = useMemo(() => parseElements(elementsRaw), [elementsRaw]);
  const setElements = (els: UiElement[]) => setElementsRaw(serialize(els));
  const inputHeight = clamp(heightRaw, -1e6, 1e6, 1);
  const inputAngle = clamp(angleRaw, -500, 500, 0);

  const addElement = () => {
    if (elements.length < MAX_ELEMENTS) setElements([...elements, { kind: "space", a: 50, b: 0 }]);
  };
  const removeElement = (i: number) => setElements(elements.filter((_, idx) => idx !== i));
  const updateElement = (i: number, patch: Partial<UiElement>) => setElements(elements.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const changeKind = (i: number, kind: Kind) => {
    const [a, b] = KINDS.find((k) => k.kind === kind)!.defaults;
    updateElement(i, { kind, a, b });
  };

  // SI matrix: B in m, C in 1/m. Shown with B in mm and C in 1/mm.
  const physics = elements.map(toPhysics);
  const M = systemMatrix(physics);
  const det = determinant(M);
  const detExpected = expectedDeterminant(physics);
  const ray = traceRay(M, inputHeight * 1e-3, inputAngle * 1e-3);
  const valid = [M.A, M.B, M.C, M.D].every(Number.isFinite);
  const isImaging = valid && Math.abs(M.B) < 1e-9;
  const efl_mm = valid && M.C !== 0 ? -1e3 / M.C : NaN; // −1/C in m, shown in mm (rear focal length f′ = n_out/P)
  // Output medium index: n₂ of the last interface element (1 if none). Real-angle convention: C = −P/n_out, EFL = 1/P.
  const nOut = [...elements].reverse().find((e) => e.kind === "interface")?.b ?? 1;
  const eflPower_mm = Number.isFinite(efl_mm) ? efl_mm / nOut : NaN;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Input ray height y (mm)" value={heightRaw} onChange={setInputHeight} min={-1e6} max={1e6} />
        <ValidatedNumberInput label="Input ray angle θ (mrad)" value={angleRaw} onChange={setInputAngle} min={-500} max={500} />
      </div>

      <div className="space-y-3 mb-8">
        {elements.map((el, i) => {
          const spec = KINDS.find((k) => k.kind === el.kind)!;
          const lo = el.kind === "interface" ? 1 : el.kind === "space" ? 0 : -LEN;
          const hi = el.kind === "interface" ? 5 : LEN;
          return (
            <div key={i} className="flex flex-wrap gap-2 items-end bg-gray-900 border border-gray-800 rounded-lg p-4">
              <label className="flex-1 min-w-[10rem]">
                <span className="text-xs text-gray-500">Element {i + 1}</span>
                <select value={el.kind} onChange={(e) => changeKind(i, e.target.value as Kind)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1">
                  {KINDS.map((o) => <option key={o.kind} value={o.kind}>{o.label}</option>)}
                </select>
              </label>
              {spec.a && (
                <div className="flex-1 min-w-[10rem]">
                  <ValidatedNumberInput label={spec.a} value={el.a} onChange={(v) => updateElement(i, { a: v })} min={lo} max={hi} />
                </div>
              )}
              {spec.b && (
                <div className="flex-1 min-w-[10rem]">
                  <ValidatedNumberInput label={spec.b} value={el.b} onChange={(v) => updateElement(i, { b: v })} min={lo} max={hi} />
                </div>
              )}
              <button onClick={() => removeElement(i)} aria-label={`Remove element ${i + 1}`} className="text-red-400 hover:text-red-300 px-2 py-1 text-sm">✕</button>
            </div>
          );
        })}
        {elements.length < MAX_ELEMENTS && (
          <button onClick={addElement} className="text-blue-400 hover:text-blue-300 text-sm">+ Add element</button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">System ABCD matrix (B in mm, C in 1/mm)</p>
          <div className="font-mono text-lg">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-blue-400">{fmt(M.A, 4)}</span>
              <span className="text-green-400">{fmt(M.B * 1e3, 4)}</span>
              <span className="text-orange-400">{fmt(M.C * 1e-3, 6)}</span>
              <span className="text-purple-400">{fmt(M.D, 4)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            det M = {fmt(det, 6)} {valid && (Math.abs(det - detExpected) < 1e-6 ? "✓" : "⚠")} (expected n<sub>in</sub>/n<sub>out</sub> = {fmt(detExpected, 6)})
          </p>
          {!valid && <p className="text-sm text-red-400 mt-2">An element has f = 0 or R = 0, which has no ray matrix.</p>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Output ray</p>
          <p className="text-lg">Height: <span className="text-blue-400 font-bold">{fmt(ray.y * 1e3, 4)} mm</span></p>
          <p className="text-lg">Angle: <span className="text-green-400 font-bold">{fmt(ray.theta * 1e3, 4)} mrad</span></p>
          <p className="text-sm text-gray-400 mt-2">Rear focal length f′ = −1/C: {Number.isFinite(efl_mm) ? `${fmt(efl_mm, 3)} mm${nOut !== 1 ? `; EFL = f′/n_out = ${fmt(eflPower_mm, 3)} mm` : ""}` : "— (afocal, C = 0)"}</p>
          {isImaging && <p className="text-sm text-yellow-400 mt-2">Imaging condition (B = 0): magnification A = {fmt(M.A, 4)}</p>}
        </div>
      </div>

      <p className="text-sm text-gray-400">
        Real ray angles: a flat interface multiplies the angle by n₁/n₂, so det M = n<sub>in</sub>/n<sub>out</sub>. Mirrors are
        unfolded along the reflected axis; a concave mirror (R &gt; 0) acts as a lens of focal length R/2.
      </p>
    </>
  );
}
