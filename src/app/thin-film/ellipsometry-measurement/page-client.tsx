"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { filmPsiDelta, pseudoOpticalConstants, transparentFilmThickness } from "../../../physics/thin-film/ellipsometry";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function EllipsometryMeasurementPage() {
  const [psiDeg, setPsiDeg] = useURLState("psiDeg", 10.573, { min: 0, max: 90 });
  const [deltaDeg, setDeltaDeg] = useURLState("deltaDeg", 179.230, { min: 0, max: 360 });
  const [aoiDeg, setAoiDeg] = useURLState("aoiDeg", 70, { min: 0, max: 90 });
  const [lambdaNm, setLambdaNm] = useURLState("lambdaNm", 632.8, { min: 1 });
  const [filmN, setFilmN] = useURLState("filmN", 1.457, { min: 1 });
  const [subN, setSubN] = useURLState("subN", 3.882, { min: 0 });
  const [subK, setSubK] = useURLState("subK", 0.019, { min: 0 });

  const film = useMemo(
    () => transparentFilmThickness(psiDeg * Math.PI / 180, deltaDeg * Math.PI / 180, aoiDeg * Math.PI / 180, lambdaNm * 1e-9, filmN, { n: subN, k: subK }),
    [psiDeg, deltaDeg, aoiDeg, lambdaNm, filmN, subN, subK],
  );
  const filmMismatch = Number.isFinite(film.absX) && Math.abs(film.absX - 1) > 0.02;
  const sinTheta = Math.sin(aoiDeg * Math.PI / 180);
  const filmErrors = [
    !(aoiDeg > 0 && aoiDeg < 90) && "the angle of incidence must lie between 0° and 90°",
    !(psiDeg < 90) && "Ψ must be below 90°",
    !(filmN > sinTheta) && `the film index must exceed sin θ = ${sinTheta.toFixed(3)} (else the film is evanescent)`,
    !(lambdaNm > 0) && "the wavelength must be positive",
    !(subN + subK > 0) && "the substrate index can't be zero",
  ].filter((e): e is string => typeof e === "string");

  const results = useMemo(() => {
    const theta = aoiDeg * Math.PI / 180;
    const pseudo = pseudoOpticalConstants(psiDeg * Math.PI / 180, deltaDeg * Math.PI / 180, theta);
    // Reflectances of the bare pseudo-substrate (no layers, so the wavelength only has to be valid, not shown) at the measurement angle (NaN if ⟨k⟩ < 0).
    const bare = { incident: 1, layers: [], substrate: { n: pseudo.n, k: pseudo.k } };
    const Rs = stackResponse(bare, 633e-9, theta, "s").R;
    const Rp = stackResponse(bare, 633e-9, theta, "p").R;
    return { ...pseudo, Rs, Rp, Ravg: (Rs + Rp) / 2 };
  }, [psiDeg, deltaDeg, aoiDeg]);

  // Ψ-Δ trajectory of the film model over one thickness period; a null breaks the line where Δ wraps past 360°.
  const filmPath = useMemo(() => {
    const x: (number | null)[] = [];
    const y: (number | null)[] = [];
    if (!Number.isFinite(film.period)) return { x, y };
    let last = NaN;
    for (let i = 0; i <= 300; i++) {
      const f = filmPsiDelta(film.period * i / 300, aoiDeg * Math.PI / 180, lambdaNm * 1e-9, filmN, { n: subN, k: subK });
      const d = f.delta * 180 / Math.PI;
      if (Math.abs(d - last) > 180) { x.push(null); y.push(null); }
      x.push(f.psi * 180 / Math.PI);
      y.push(d);
      last = d;
    }
    return { x, y };
  }, [film.period, aoiDeg, lambdaNm, filmN, subN, subK]);

  const psiDeltaMap = useMemo(() => {
    const theta = aoiDeg * Math.PI / 180;
    const psis = Array.from({ length: 50 }, (_, i) => i * 90 / 50);
    const deltas = Array.from({ length: 50 }, (_, j) => j * 360 / 50);
    const z = deltas.map(d => psis.map(p => pseudoOpticalConstants(p * Math.PI / 180, d * Math.PI / 180, theta).n));
    return [
      { x: psis, y: deltas, z, zmin: 0, zmax: 5, type: "heatmap" as const, colorscale: "Viridis", showscale: true, colorbar: { title: { text: "⟨n⟩", font: { color: "#9ca3af" } }, tickfont: { color: "#9ca3af" } } },
      { x: filmPath.x, y: filmPath.y, type: "scatter" as const, mode: "lines" as const, name: "Film, d = 0 to D_φ", line: { color: "#f9fafb", width: 2 } },
      { x: [psiDeg], y: [deltaDeg], type: "scatter" as const, mode: "markers" as const, name: "Measurement", marker: { color: "#f87171", size: 10, symbol: "x" } },
    ];
  }, [aoiDeg, psiDeg, deltaDeg, filmPath]);

  const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(4) : "—");

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-2">
        <ValidatedNumberInput label="Ψ (degrees)" value={psiDeg} onChange={setPsiDeg} min={0} max={90} step="0.1" />
        <ValidatedNumberInput label="Δ (degrees)" value={deltaDeg} onChange={setDeltaDeg} min={0} max={360} step="0.1" />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={aoiDeg} onChange={setAoiDeg} min={0} max={90} step="0.5" />
      </div>
      <p className="text-gray-500 text-xs mb-8">Default: bulk Si at 633 nm and 70° (N = 3.882 − 0.019i in this page’s N = n − ik convention)</p>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Pseudo-refractive index ⟨n⟩: <span className="text-blue-400 font-mono">{fmt(results.n)}</span></p>
        <p className="text-gray-300">Pseudo-extinction coeff ⟨k⟩: <span className="text-blue-400 font-mono">{fmt(results.k)}</span></p>
        <p className="text-gray-300">⟨ε₁⟩: <span className="text-blue-400 font-mono">{fmt(results.eps1)}</span></p>
        <p className="text-gray-300">⟨ε₂⟩: <span className="text-blue-400 font-mono">{fmt(results.eps2)}</span></p>
        <p className="text-gray-300">R<sub>p</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Rp)}</span></p>
        <p className="text-gray-300">R<sub>s</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Rs)}</span></p>
        <p className="text-gray-300">R<sub>avg</sub> at θ: <span className="text-blue-400 font-mono">{fmt(results.Ravg)}</span></p>
      </div>

      <h2 className="text-lg font-semibold text-gray-200 mb-2">Film thickness (transparent film of known index)</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={lambdaNm} onChange={setLambdaNm} min={1} step="1" />
        <ValidatedNumberInput label="Film index n₁ (lossless)" value={filmN} onChange={setFilmN} min={1} step="0.001" />
        <ValidatedNumberInput label="Substrate n" value={subN} onChange={setSubN} min={0} step="0.001" />
        <ValidatedNumberInput label="Substrate k (N = n − ik)" value={subK} onChange={setSubK} min={0} step="0.001" />
      </div>
      <p className="text-gray-500 text-xs mb-4">Default: thermal SiO₂ (n₁ = 1.457) on Si at 632.8 nm. The default Ψ, Δ are bare Si, so d ≈ 0.</p>
      {filmErrors.length > 0 && (
        <p className="mb-4 text-sm text-yellow-300" role="status">No thickness: {filmErrors.join("; ")}.</p>
      )}
      {filmErrors.length === 0 && Number.isFinite(film.period) && (
        <div className="bg-gray-900 rounded p-4 mb-4 space-y-1">
          <p className="text-gray-300">Film thickness d: <span className="text-blue-400 font-mono">{Number.isFinite(film.thickness) ? `${(Math.abs(film.thickness) < 0.005e-9 ? 0 : film.thickness * 1e9).toFixed(2)} nm` : "—"}</span>{" "}
            <span className="text-gray-500 text-sm">+ m·D<sub>φ</sub>, m = 0, 1, 2, …</span></p>
          <p className="text-gray-300">Thickness period D<sub>φ</sub>: <span className="text-blue-400 font-mono">{(film.period * 1e9).toFixed(2)} nm</span></p>
          <p className="text-gray-300">|X| (1 for a consistent fit): <span className="text-blue-400 font-mono">{fmt(film.absX)}</span></p>
        </div>
      )}
      {Number.isFinite(film.period) && !Number.isFinite(film.thickness) && (
        <p className="mb-4 text-sm text-yellow-300" role="status">
          No thickness: with this film index the film doesn&apos;t change Ψ and Δ (it matches the ambient or the substrate).
        </p>
      )}
      {filmMismatch && (
        <p className="mb-4 text-sm text-yellow-300" role="status">
          |X| = {fmt(film.absX)} is not 1: no transparent film of index {filmN} on this substrate gives this Ψ, Δ. The
          index, the substrate or the angle is off, or the film absorbs or is rough; the thickness shown is only the phase of X.
        </p>
      )}
      {Number.isFinite(film.thickness) && film.thickness <= -0.005e-9 && (
        <p className="mb-4 text-sm text-gray-400">A slightly negative thickness: a bare substrate within the measurement error.</p>
      )}
      <p className="text-gray-500 text-xs mb-8">
        Ψ and Δ repeat every D<sub>φ</sub>, so one measurement fixes d only modulo D<sub>φ</sub>: a second angle or wavelength (or
        a rough idea of d) picks m. Where the white curve moves slowly with d (for SiO₂ on Si at 70°, around Ψ ≈ 34°, Δ ≈ 80°),
        small errors in Ψ and Δ move d the most; near its top (Ψ → 90°) d is pinned best.
      </p>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>ρ = r<sub>p</sub>/r<sub>s</sub> = tan(Ψ)·e<sup>iΔ</sup></p>
        <p>⟨ε⟩ = sin²θ [1 + tan²θ·((1−ρ)/(1+ρ))²] (pseudo-dielectric function)</p>
        <p>⟨N⟩ = √⟨ε⟩ = ⟨n⟩ − i⟨k⟩, ⟨ε⟩ = ⟨ε₁⟩ − i⟨ε₂⟩ (Nebraska convention: Δ = 180° at normal incidence)</p>
        <p>Exact for a bare substrate; with a film on top these are “pseudo” values, not material constants.</p>
        <p className="mt-2">Film: R<sub>ν</sub> = (r<sub>01ν</sub> + r<sub>12ν</sub>X)/(1 + r<sub>01ν</sub>r<sub>12ν</sub>X), X = e<sup>−i2β</sup>, β = 2πd·n₁cos φ₁/λ</p>
        <p>ρ = R<sub>p</sub>/R<sub>s</sub> is a quadratic in X (Azzam &amp; Bashara): take the root with |X| nearest 1; d = (−arg X)/(2π)·D<sub>φ</sub></p>
        <p>D<sub>φ</sub> = λ / (2√(n₁² − sin²θ))</p>
      </div>

      <ChartPanel data={psiDeltaMap} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Ψ (°)", gridcolor: "#374151" },
        yaxis: { title: "Δ (°)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true
      }} />
      <p className="text-gray-500 text-xs mt-2 text-center">⟨n⟩ over the Ψ-Δ plane at the current angle of incidence. The white curve is the film model from d = 0 (bare substrate) to one period; the red × is the measurement.</p>
    </>
  );
}
