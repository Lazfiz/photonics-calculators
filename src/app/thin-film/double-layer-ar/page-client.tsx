"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  quarterQuarterArInnerIndex,
  quarterWaveLayers,
  quarterWaveStackReflectance,
  reflectanceSpectrum,
} from "../../../physics/thin-film/transfer-matrix";

export default function DoubleLayerARPage() {
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 1.70);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    // Window 0.5–1.5 λ₀ (401 points, so λ₀ is a grid point)
    const wls = Array.from({ length: 401 }, (_, i) => designWl * (0.5 + i / 400));
    // Quarter-wave pair at λ₀: incident | n1 | n2 | substrate
    const layers = quarterWaveLayers([n1, n2], designWl * 1e-9);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, wls.map((wl) => wl * 1e-9));

    const T = wls.map((_, i) => 1 - R[i]);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
    ];
  }, [n1, n2, nSub, nInc, designWl]);

  const d1 = designWl / (4 * n1);
  const d2 = designWl / (4 * n2);
  // Equal-step pair (one of many R = 0 pairs); n₂ for R = 0 given the entered n₁ from the closed form.
  const optN1 = Math.pow(nInc * nInc * nInc * nSub, 0.25);
  const optN2 = Math.pow(nInc * nSub * nSub * nSub, 0.25);
  const n2ForZero = quarterQuarterArInnerIndex(nInc, n1, nSub);
  const R0 = quarterWaveStackReflectance(nInc, [n1, n2], nSub);
  const fixed = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n₁ (outer layer)" value={n1} onChange={setN1} min={0.1} step="0.01" />
        <ValidatedNumberInput label="n₂ (inner layer)" value={n2} onChange={setN2} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} min={1} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">d₁ = λ/(4n₁) = <span className="text-blue-400 font-mono">{fixed(d1, 1)} nm</span></p>
        <p className="text-gray-300">d₂ = λ/(4n₂) = <span className="text-blue-400 font-mono">{fixed(d2, 1)} nm</span></p>
        <p className="text-gray-300">n₂ for R = 0 at λ₀ (given n₁) = <span className="text-green-400 font-mono">{fixed(n2ForZero, 3)}</span></p>
        <p className="text-gray-300">R at λ₀ = <span className="text-green-400 font-mono">{Number.isFinite(R0) ? `${(R0 * 100).toPrecision(4)}%` : "—"}</span></p>
        <p className="text-gray-300">
          Equal-step pair: n₁ = (n₀³n<sub>s</sub>)<sup>¼</sup> = <span className="text-green-400 font-mono">{fixed(optN1, 3)}</span>,
          {" "}n₂ = (n₀n<sub>s</sub>³)<sup>¼</sup> = <span className="text-green-400 font-mono">{fixed(optN2, 3)}</span>
          {" "}(one of many R = 0 pairs)
        </p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "R / T", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
