"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { airyPeakWidth, coefficientOfFinesse } from "../../../physics/thin-film/interference";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function AmplitudeSplittingPage() {
  const [n1, setN1] = useURLState("n1", 1.0);
  const [nFilm, setNFilm] = useURLState("nFilm", 1.38);
  const [n2, setN2] = useURLState("n2", 1.52);
  const [thickness, setThickness] = useURLState("thickness", 200);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    // The multiple-beam sum (see Theory) in closed form: the characteristic matrix of one film.
    // T includes the admittance ratio n₂/n₁, so R + T = 1.
    const stack = { incident: n1, layers: [{ n: nFilm, thickness: thickness * 1e-9 }], substrate: { n: n2 } };
    const response = wls.map((wl) => stackResponse(stack, wl * 1e-9));
    const reflected = response.map((r) => r.R);
    const transmitted = response.map((r) => r.T);
    return [
      { x: wls, y: reflected, type: "scatter" as const, mode: "lines" as const, name: "Reflected", line: { color: "#f87171" } },
      { x: wls, y: transmitted, type: "scatter" as const, mode: "lines" as const, name: "Transmitted", line: { color: "#60a5fa" } },
    ];
  }, [n1, nFilm, n2, thickness]);

  const r01 = (n1 - nFilm) / (n1 + nFilm);
  const r12 = (nFilm - n2) / (nFilm + n2);
  const F = coefficientOfFinesse(r01 ** 2, r12 ** 2);
  // Finesse = FSR / FWHM = 2π / (4 asin(1/√F)); NaN for F < 1, where T never falls to half its peak.
  const finesse = (2 * Math.PI) / airyPeakWidth(F);
  const fixed = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n₁ (incident)" value={n1} onChange={setN1} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n (film)" value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n₂ (substrate)" value={n2} onChange={setN2} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Thickness (nm)" value={thickness} onChange={setThickness} min={1} step="10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₀₁</p>
          <p className="text-xl font-bold text-green-400">{fixed(r01, 4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">r₁₂</p>
          <p className="text-xl font-bold text-blue-400">{fixed(r12, 4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Coefficient F</p>
          <p className="text-xl font-bold text-yellow-400">{fixed(F, 4)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Finesse (FSR/FWHM)</p>
          <p className="text-xl font-bold text-red-400">
            {Number.isFinite(finesse) ? finesse.toFixed(2) : "— (F < 1: T never falls to half)"}
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Amplitude Splitting Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Eᵣ = r₀₁ + t₀₁t₁₀r₁₂e^(−iδ) + t₀₁t₁₀r₁₂²r₁₀e^(−2iδ) + ...</p>
          <p>Sum: r = (r₀₁ + r₁₂e^(−iδ)) / (1 + r₀₁r₁₂e^(−iδ)), &nbsp; T = (n₂/n₁)·|t|²</p>
          <p className="text-xs text-gray-400">(e^(+iωt) convention; R and T don&apos;t depend on it)</p>
          <p>Airy function: T = T_max / (1 + F·sin²((δ − δ_max)/2))</p>
          <p>F = 4√(R₁R₂) / (1 − √(R₁R₂))², &nbsp; R₁ = r₀₁², R₂ = r₁₂²</p>
          <p>Finesse ℱ = FSR/FWHM = 2π / (4 asin(1/√F)) ≈ π√F / 2 for F ≫ 1 (needs F ≥ 1)</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R, T", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </>
  );
}
