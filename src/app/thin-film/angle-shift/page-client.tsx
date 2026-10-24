"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stopBandCentreAtAngle } from "../../../physics/thin-film/quarter-wave-stack";

const DEG = Math.PI / 180;
/** Quarter-wave point of one film (n_H = n_L = n), incidence from air: λ₀ cos θ_film. */
const shifted = (lambda0_nm: number, n: number, angleDeg: number) =>
  stopBandCentreAtAngle(lambda0_nm * 1e-9, n, n, angleDeg * DEG) * 1e9;

export default function AngleShiftPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38, { min: 1 });
  const [designWl, setDesignWl] = useURLState("designWl", 550, { min: 1 });
  const [maxAngle, setMaxAngle] = useURLState("maxAngle", 60, { min: 1, max: 89 });
  const [angle, setAngle] = useURLState("angle", 45, { min: 0, max: 89 });

  const valid = nFilm >= 1 && designWl > 0 && maxAngle >= 1 && maxAngle <= 89 && angle >= 0 && angle <= 89;

  const chartData = useMemo(() => {
    if (!valid) return [];
    const angles = Array.from({ length: 201 }, (_, i) => (i * maxAngle) / 200);
    // The phase thickness 2πnd·cos θ_film/λ is the same for s and p, so the quarter-wave point of
    // a film moves to λ₀·cos θ_film for both (incidence from air). A multilayer's effective index
    // differs slightly for s and p (Macleod ch. 9), so there the curve is a first-order estimate.
    return [
      { x: angles, y: angles.map((a) => shifted(designWl, nFilm, a)), type: "scatter" as const, mode: "lines" as const, name: "λ₀·cos θ_film (s and p)", line: { color: "#60a5fa" } },
    ];
  }, [valid, nFilm, designWl, maxAngle]);

  const atAngle = valid ? shifted(designWl, nFilm, angle) : NaN;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub> (or effective index)</>} value={nFilm} onChange={setNFilm} min={1} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} min={1} />
        <ValidatedNumberInput label="Angle of incidence (°)" value={angle} onChange={setAngle} min={0} max={89} />
        <ValidatedNumberInput label="Max Angle (°)" value={maxAngle} onChange={setMaxAngle} min={1} max={89} />
      </div>

      {!valid && (
        <p className="mb-6 text-sm text-yellow-300" role="status">
          No result: the index must be at least 1, the wavelength positive, the angle between 0° and 89° and the maximum angle between 1° and 89°.
        </p>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300">Effective λ at {angle}° = <span className="text-blue-400 font-mono">{Number.isFinite(atAngle) ? `${atAngle.toFixed(1)} nm` : "—"}</span></p>
        <p className="text-gray-300">Blue shift at {angle}° = <span className="text-blue-400 font-mono">{Number.isFinite(atAngle) ? `${(designWl - atAngle).toFixed(1)} nm` : "—"}</span></p>
      </div>

      <ChartPanel data={chartData} layout={{ paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" }, xaxis: { title: "Angle of Incidence (°)", gridcolor: "#374151" }, yaxis: { title: "Effective λ (nm)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true }} />
    </>
  );
}
