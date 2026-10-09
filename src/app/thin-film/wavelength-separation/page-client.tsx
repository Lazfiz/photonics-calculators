"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { nonOverlappingRatio } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, reflectanceSpectrum, stackResponse, type Layer } from "../../../physics/thin-film/transfer-matrix";

export default function WavelengthSeparationPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairsRaw, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [sepRatioRaw, setSepRatio] = useURLState("sepRatio", 1.4); // λ₂/λ₁

  // The URL isn't range-checked: use an integer number of pairs in 1–30 and λ₂/λ₁ in 1.05–3 everywhere.
  const numPairs = Math.round(clampToRange(numPairsRaw, 1, 30));
  const sepRatio = clampToRange(sepRatioRaw, 1.05, 3);
  const lambda1 = designWl;
  const lambda2 = designWl * sepRatio;

  const chartData = useMemo(() => {
    // Window 0.6 λ₁ to 1.4 λ₂ (900 points)
    const lo = 0.6 * lambda1;
    const hi = 1.4 * lambda2;
    const wls = Array.from({ length: 900 }, (_, i) => lo + ((hi - lo) * i) / 899);
    const lambdas = wls.map((wl) => wl * 1e-9);

    // (HL)^N quarter-wave stacks: A reflects λ₁, B reflects λ₂
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const layersA = quarterWaveLayers(indices, lambda1 * 1e-9);
    const layersB = quarterWaveLayers(indices, lambda2 * 1e-9);

    // Combined: A on top of B
    const layersAB = [...layersA, ...layersB];

    const spectrum = (layers: Layer[]) => reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, lambdas);
    const R_A = spectrum(layersA);
    const R_B = spectrum(layersB);
    const R_AB = spectrum(layersAB);

    return [
      { x: wls, y: R_A, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₁ = ${Math.round(lambda1 * 10) / 10} nm`, line: { color: "#f87171", width: 2 } },
      { x: wls, y: R_B, type: "scatter" as const, mode: "lines" as const,
        name: `Reflects λ₂ = ${Math.round(lambda2 * 10) / 10} nm`, line: { color: "#60a5fa", width: 2 } },
      { x: wls, y: R_AB, type: "scatter" as const, mode: "lines" as const,
        name: "Combined stack", line: { color: "#34d399", width: 2, dash: "dash" } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, lambda1, lambda2]);

  // Stack A alone: R at λ₁ (reflected) and T = 1 − R at λ₂ (transmitted)
  const indicesA = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
  const stackA = { incident: nInc, layers: quarterWaveLayers(indicesA, lambda1 * 1e-9), substrate: { n: nSub } };
  const RA1 = stackResponse(stackA, lambda1 * 1e-9).R;
  const TA2 = 1 - stackResponse(stackA, lambda2 * 1e-9).R;
  const minRatio = nonOverlappingRatio(nH, nL);
  const overlap = Number.isFinite(minRatio) && sepRatio < minRatio;
  const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(2)}%` : "—");

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Pairs per stack (N)" value={numPairs} onChange={setNumPairs} min={1} max={30} step="1" />
        <ValidatedNumberInput label="λ₁ center (nm)" value={designWl} onChange={setDesignWl} min={1} step="10" />
        <ValidatedNumberInput label="λ₂/λ₁" value={sepRatio} onChange={setSepRatio} min={1.05} max={3} step="0.05" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">λ₁ = <span className="text-blue-400 font-mono">{lambda1} nm</span>, λ₂ = <span className="text-blue-400 font-mono">{lambda2.toFixed(0)} nm</span></p>
        <p className="text-gray-300">R<sub>A</sub>(λ₁) = <span className="text-blue-400 font-mono">{pct(RA1)}</span></p>
        <p className="text-gray-300">T<sub>A</sub>(λ₂) = 1 − R<sub>A</sub>(λ₂) = <span className="text-blue-400 font-mono">{pct(TA2)}</span> (stack A alone)</p>
        <p className="text-gray-300">Smallest λ₂/λ₁ for separate stop bands = <span className="text-green-400 font-mono">{Number.isFinite(minRatio) ? minRatio.toFixed(3) : "—"}</span></p>
        {overlap && (
          <p className="text-yellow-400 text-sm">
            λ₂/λ₁ = {sepRatio.toFixed(3)} is below {minRatio.toFixed(3)}: the stop bands overlap.
          </p>
        )}
        <p className="text-gray-300">Total layers (combined) = <span className="text-blue-400 font-mono">{numPairs * 4}</span></p>
        <p className="text-gray-300 text-xs mt-2">Each stack: (HL)<sup>N</sup>. Combined: Stack₁ | Stack₂ on substrate.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
    </>
  );
}
