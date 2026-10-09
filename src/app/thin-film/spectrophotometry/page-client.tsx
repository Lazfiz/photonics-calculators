"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";
export default function SpectrophotometryPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.46);
  const [kFilm, setKFilm] = useURLState("kFilm", 0.001);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [thickness, setThickness] = useURLState("thickness", 100);
  const [angleDegRaw, setAngleDeg] = useURLState("angleDeg", 0);
  const [nInc, setNInc] = useURLState("nInc", 1.0);

  // The URL isn't range-checked: 90° and above give NaN, so clamp here and use this value everywhere.
  const angleDeg = clampToRange(angleDegRaw, 0, 89);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 400 }, (_, i) => 300 + i * 1000 / 400);
    const theta = angleDeg * Math.PI / 180;

    // Incident | film (n + ik) | substrate, exact for s and p at the angle of incidence;
    // T and A are for unpolarized light (the mean of s and p).
    const stack = { incident: nInc, layers: [{ n: nFilm, k: kFilm, thickness: thickness * 1e-9 }], substrate: { n: nSub } };
    const s = wls.map((wl) => stackResponse(stack, wl * 1e-9, theta, "s"));
    const p = wls.map((wl) => stackResponse(stack, wl * 1e-9, theta, "p"));
    const RsVals = s.map((r) => r.R);
    const RpVals = p.map((r) => r.R);
    const Ravg = wls.map((_, i) => (RsVals[i] + RpVals[i]) / 2);
    const T = wls.map((_, i) => (s[i].T + p[i].T) / 2);
    const A = wls.map((_, i) => (s[i].A + p[i].A) / 2);

    return [
      { x: wls, y: RsVals, type: "scatter" as const, mode: "lines" as const, name: "Rs", line: { color: "#f87171", dash: "dash" } },
      { x: wls, y: RpVals, type: "scatter" as const, mode: "lines" as const, name: "Rp", line: { color: "#fbbf24", dash: "dash" } },
      { x: wls, y: Ravg, type: "scatter" as const, mode: "lines" as const, name: "R avg", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "T into the substrate (no back surface)", line: { color: "#60a5fa" } },
      { x: wls, y: A, type: "scatter" as const, mode: "lines" as const, name: "A", line: { color: "#34d399" } },
    ];
  }, [nFilm, kFilm, nSub, thickness, angleDeg, nInc]);

  // Optical thickness info
  const wavelength_nm = 550;
  const opticalThickness = nFilm * thickness;
  const halfWaves = (2 * nFilm * thickness) / wavelength_nm;
  const qwoThickness = wavelength_nm / (4 * nFilm);
  // α = 4πk/λ in m⁻¹, shown in cm⁻¹
  const alpha_cm = (4 * Math.PI * kFilm) / (wavelength_nm * 1e-9) / 100;
  const fixed = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub></>} value={nFilm} onChange={setNFilm} step="0.01" />
        <ValidatedNumberInput label={<>k<sub>film</sub> (extinction)</>} value={kFilm} onChange={setKFilm} min={0} step="0.001" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} step="1" />
        <ValidatedNumberInput label="Angle of Incidence (°)" value={angleDeg} onChange={setAngleDeg} min={0} max={89} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Optical Thickness (nd): <span className="text-blue-400 font-mono">{fixed(opticalThickness, 1)} nm</span></p>
        <p className="text-gray-300">QWOT at 550 nm: <span className="text-blue-400 font-mono">{fixed(qwoThickness, 1)} nm</span></p>
        <p className="text-gray-300">Optical thickness 2nd/λ at 550 nm: <span className="text-blue-400 font-mono">{fixed(halfWaves, 2)}</span></p>
        <p className="text-gray-300">α at 550 nm (n, k constant in λ): <span className="text-blue-400 font-mono">{fixed(alpha_cm, 0)} cm⁻¹</span></p>
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-400">
        <p className="font-semibold text-gray-200 mb-2">Key Formulas</p>
        <p>N = n + ik (complex refractive index)</p>
        <p>r<sub>01</sub> = (n₁cosθ₁ − N₂cosθ₂)/(n₁cosθ₁ + N₂cosθ₂) (s-pol Fresnel)</p>
        <p>r<sub>total</sub> = (r₀₁ + r₁₂·e<sup>2iδ</sup>)/(1 + r₀₁·r₁₂·e<sup>2iδ</sup>) (thin film)</p>
        <p>δ = 2πN₂d·cosθ₂/λ (phase thickness)</p>
        <p>A = 1 − R − T (energy conservation)</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true, legend: { x: 0.01, y: 0.99 }
      }} />
    </>
  );
}
