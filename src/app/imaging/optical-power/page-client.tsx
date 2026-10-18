"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  emmetropicAxialLength, ocularRefraction, opticalPower, spectacleCorrection, twoElementPower,
} from "../../../physics/imaging/gaussian-optics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const mm = 1e-3;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);

const fmt = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");
const signed = (x: number, digits: number, unit = "") => (Number.isFinite(x) ? `${x > 0 ? "+" : ""}${x.toFixed(digits)}${unit}` : "—");

export default function OpticalPowerPage() {
  const [focalLengthRaw, setFocalLength] = useURLState("focalLengthMm", 100);
  // Gullstrand's exact eye: cornea and lens powers, and the spacing of their principal planes.
  const [corneaRaw, setCornea] = useURLState("corneaPower", 43.05);
  const [lensRaw, setLens] = useURLState("lensPower", 19.11);
  const [separationRaw, setSeparation] = useURLState("separationMm", 5.73);
  const [indexRaw, setIndex] = useURLState("n", 1.336);
  const [axialRaw, setAxial] = useURLState("axialLengthMm", 24);
  const [vertexRaw, setVertex] = useURLState("vertexMm", 12);
  const fMm = clamp(focalLengthRaw, -10000, 10000, 100);
  const P1 = clamp(corneaRaw, 30, 60, 43.05);
  const P2 = clamp(lensRaw, 0, 35, 19.11);
  const tMm = clamp(separationRaw, 0, 10, 5.73);
  const n = clamp(indexRaw, 1.3, 1.4, 1.336);
  const LMm = clamp(axialRaw, 15, 35, 24);
  const vertexMm = clamp(vertexRaw, 0, 20, 12);

  const lensPower = Math.abs(fMm) < 0.1 ? NaN : opticalPower(fMm * mm);

  const P = twoElementPower(P1, P2, tMm * mm, n);
  const Lemm = emmetropicAxialLength(P1, P2, tMm * mm, n) / mm;
  const K = ocularRefraction(P1, P2, tMm * mm, n, LMm * mm);
  const Kspec = spectacleCorrection(K, vertexMm * mm);
  const dKdL = (ocularRefraction(P1, P2, tMm * mm, n, (LMm + 0.05) * mm) - ocularRefraction(P1, P2, tMm * mm, n, (LMm - 0.05) * mm)) / 0.1;
  const state = !Number.isFinite(K) ? "" : Math.abs(K) < 0.25 ? "emmetropic" : K < 0 ? "myopic" : "hyperopic";

  const Ls = Array.from({ length: 121 }, (_, k) => 20 + k * 0.1);
  const chart = [
    { x: Ls, y: Ls.map((L) => ocularRefraction(P1, P2, tMm * mm, n, L * mm)), type: "scatter" as const, mode: "lines" as const, name: "Refraction at the cornea K (D)", line: { color: "#60a5fa" } },
    ...(Number.isFinite(K) ? [{ x: [LMm], y: [K], type: "scatter" as const, mode: "markers" as const, name: "Current eye", marker: { color: "#f87171", size: 10 } }] : []),
  ];

  const layout = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" }, margin: { l: 70, r: 20, t: 20, b: 60 } };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Lens power</h2>
          <ValidatedNumberInput label="Focal length in air f (mm, negative for a diverging lens)" value={focalLengthRaw} onChange={setFocalLength} min={-10000} max={10000} step="0.1" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Result</h2>
          {Number.isFinite(lensPower) ? row("Optical power P = 1/f", signed(lensPower, 3, " D"), "text-blue-400") : <p className="text-red-400">The focal length must not be 0.</p>}
          <p className="text-xs text-gray-500">1 dioptre (D) = 1 m⁻¹. Powers of thin lenses in contact add.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <h2 className="text-lg font-semibold">Two-element eye</h2>
          <ValidatedNumberInput label="Cornea power φ₁ (D)" value={corneaRaw} onChange={setCornea} min={30} max={60} step="0.01" />
          <ValidatedNumberInput label="Crystalline lens power φ₂ (D, 0 without a lens)" value={lensRaw} onChange={setLens} min={0} max={35} step="0.01" />
          <ValidatedNumberInput label="Cornea-to-lens spacing t (mm)" value={separationRaw} onChange={setSeparation} min={0} max={10} step="0.01" />
          <ValidatedNumberInput label="Index of the aqueous and vitreous n" value={indexRaw} onChange={setIndex} min={1.3} max={1.4} step="0.001" />
          <ValidatedNumberInput label="Axial length, cornea to retina (mm)" value={axialRaw} onChange={setAxial} min={15} max={35} step="0.01" />
          <ValidatedNumberInput label="Spectacle vertex distance (mm)" value={vertexRaw} onChange={setVertex} min={0} max={20} step="0.5" />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Eye power φ = φ₁ + φ₂ − (t/n)φ₁φ₂", fmt(P, 2, " D"), "text-green-400")}
          {row("Focal lengths, in air and in the eye (1/φ, n/φ)", `${fmt(1000 / P, 2)}, ${fmt((1000 * n) / P, 2)} mm`)}
          {row("Rear focal point from the cornea (emmetropic length)", fmt(Lemm, 2, " mm"))}
          {row("Refraction at the cornea K", signed(K, 2, " D"), "text-yellow-400")}
          {row("Eye", state, "text-purple-400")}
          {row("Contact lens correction", signed(K, 2, " D"), "text-blue-400")}
          {row(`Spectacle correction at ${vertexMm} mm`, signed(Kspec, 2, " D"), "text-blue-400")}
          {row("Change per mm of axial length", signed(dKdL, 2, " D/mm"))}
          {!Number.isFinite(K) && <p className="text-red-400 text-sm">The axial length must exceed the cornea-to-lens spacing.</p>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Refraction vs axial length</h2>
        <ChartPanel data={chart} layout={{ ...layout, xaxis: { title: "Axial length (mm)", gridcolor: "#333" }, yaxis: { title: "K (D)", gridcolor: "#333" }, showlegend: true }} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-1 font-mono">
          <p>P = 1/f; two elements in index n: φ = φ₁ + φ₂ − (t/n)φ₁φ₂ (Gullstrand)</p>
          <p>Back from the retina: V₃ = n/(L − t), V₂ = V₃ − φ₂, V₁ = V₂/(1 + (t/n)V₂), K = V₁ − φ₁</p>
          <p>Spectacle lens at vertex distance d: F = K/(1 + dK)</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Paraxial eye of two thin elements: the cornea at the vertex and the crystalline lens t behind it, unaccommodated.
          The defaults are Gullstrand&apos;s exact eye (43.05 D and 19.11 D, principal planes 5.73 mm apart, 58.64 D in
          all) with a typical 24 mm axial length. K is the vergence at the cornea that focuses on the retina: negative
          for myopia (far point in front of the eye), positive for hyperopia, and it is the contact-lens correction.
          Thin elements put the rear focal point about 0.1 mm in front of the thick-lens eye&apos;s, so refractions read
          about 0.2 D more myopic than in the full schematic eye.
        </p>
      </div>
    </>
  );
}
