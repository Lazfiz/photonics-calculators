"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { unwrapPhase } from "../../../physics/math";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

const NM = 1e-9;
const DEG = 180 / Math.PI;
const deg = (rad: number) => (Number.isFinite(rad) ? `${(rad * DEG).toFixed(2)}°` : "—");

/** Unwrapped phases (rad), shifted by a multiple of 2π so the value at index `ref` lies in (−π, π]. */
function continuousPhase(phases: number[], ref: number): number[] {
  const u = unwrapPhase(phases);
  const shift = 2 * Math.PI * Math.round((u[ref] - phases[ref]) / (2 * Math.PI));
  return u.map((p) => p - shift);
}

export default function PhaseShiftCoatingPage() {
  const [n1, setN1] = useURLState("n1", 1.0);
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [nSubstrate, setNSubstrate] = useURLState("nSubstrate", 1.52);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [fractionalThickness, setFractionalThickness] = useURLState("fractionalThickness", 0.5);

  const valid = n1 > 0 && nFilm > 0 && nSubstrate > 0 && designWl >= 100 && designWl <= 20000 && fractionalThickness >= 0;
  const lambda0 = designWl * NM;
  // A film of f quarter waves at λ₀: d = f λ₀/(4n), round-trip phase 2β = 4πnd/λ₀ = πf.
  const thickness = (fractionalThickness * lambda0) / (4 * nFilm);
  const stack = useMemo(
    () => ({ incident: n1, layers: [{ n: nFilm, thickness }], substrate: { n: nSubstrate } }),
    [n1, nFilm, thickness, nSubstrate],
  );
  const at0 = valid ? stackResponse(stack, lambda0) : null;
  const argR0 = at0 ? Math.atan2(at0.r.im, at0.r.re) : NaN;
  const argT0 = at0 ? Math.atan2(at0.t.im, at0.t.re) : NaN;
  const r01 = (n1 - nFilm) / (n1 + nFilm);
  const r12 = (nFilm - nSubstrate) / (nFilm + nSubstrate);

  const curves = useMemo(() => {
    if (!valid) return null;
    // 0.6–1.8 λ₀, with λ₀ itself at index 100.
    const wls = Array.from({ length: 301 }, (_, i) => lambda0 * (0.6 + 0.004 * i));
    const res = wls.map((wl) => stackResponse(stack, wl));
    const x = wls.map((wl) => wl / NM);
    return {
      x,
      argR: continuousPhase(res.map((s) => Math.atan2(s.r.im, s.r.re)), 100).map((p) => p * DEG),
      argT: continuousPhase(res.map((s) => Math.atan2(s.t.im, s.t.re)), 100).map((p) => p * DEG),
      R: res.map((s) => s.R * 100),
    };
  }, [valid, lambda0, stack]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (incident medium)" value={n1} onChange={setN1} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n (film)" value={nFilm} onChange={setNFilm} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="n (substrate)" value={nSubstrate} onChange={setNSubstrate} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Design wavelength λ₀ (nm)" value={designWl} onChange={setDesignWl} min={100} max={20000} step="10" />
        <ValidatedNumberInput label="Film thickness (quarter waves at λ₀)" value={fractionalThickness} onChange={setFractionalThickness} min={0} max={3} step="0.05" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Film thickness</p>
          <p className="text-xl font-bold text-green-400">{valid ? `${(thickness / NM).toFixed(1)} nm` : "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Round trip 2β = {valid ? `${(fractionalThickness * 180).toFixed(1)}°` : "—"} at λ₀</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Reflected phase arg r at λ₀</p>
          <p className="text-xl font-bold text-yellow-400">{deg(argR0)}</p>
          <p className="text-sm text-gray-500 mt-1">R = {at0 ? `${(at0.R * 100).toFixed(3)} %` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Transmitted phase arg t at λ₀</p>
          <p className="text-xl font-bold text-blue-400">{deg(argT0)}</p>
          <p className="text-sm text-gray-500 mt-1">T = {at0 ? `${(at0.T * 100).toFixed(3)} %` : "—"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Interface coefficients</p>
          <p className="text-lg font-bold text-red-400 font-mono">r₀₁ = {r01.toFixed(4)}</p>
          <p className="text-lg font-bold text-red-400 font-mono">r₁₂ = {r12.toFixed(4)}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Phase relations</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>2β = 4π·n·d / λ (round trip in the film); quarter wave: 2β = π at λ₀, half wave: 2π</p>
          <p>r = (r₀₁ + r₁₂·e^(2iβ)) / (1 + r₀₁·r₁₂·e^(2iβ))</p>
          <p>t = t₀₁·t₁₂·e^(iβ) / (1 + r₀₁·r₁₂·e^(2iβ)),  r<sub>ij</sub> = (n<sub>i</sub> − n<sub>j</sub>)/(n<sub>i</sub> + n<sub>j</sub>), t<sub>ij</sub> = 2n<sub>i</sub>/(n<sub>i</sub> + n<sub>j</sub>)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Born &amp; Wolf §1.6.4, time dependence e^(−iωt); with e^(+iωt) (Macleod, Hecht) every phase changes sign. Normal incidence,
          lossless film. arg r is referred to the front face, arg t to the field at the substrate face over the incident field at the
          front face. The phase curves are unwrapped across the spectrum and placed in (−180°, 180°] at λ₀.
        </p>
      </div>

      {curves && (
        <div className="mb-6">
          <ChartPanel title="Phase on reflection and transmission" data={[
            { x: curves.x, y: curves.argR, type: "scatter", mode: "lines", name: "arg r (°)", line: { color: "#fbbf24" } },
            { x: curves.x, y: curves.argT, type: "scatter", mode: "lines", name: "arg t (°)", line: { color: "#60a5fa" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Phase (°)", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      {curves && (
        <ChartPanel title="Reflectance" data={[
          { x: curves.x, y: curves.R, type: "scatter", mode: "lines", name: "R (%)", line: { color: "#f87171" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "Reflectance (%)", gridcolor: "#374151" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
