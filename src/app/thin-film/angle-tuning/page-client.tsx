"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { clampToRange } from "../../../lib/number-input";
import { stopBandCentreAtAngle } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function AngleTuningPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairsRaw, setNumPairs] = useURLState("numPairs", 5);
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  // The URL isn't range-checked: use an integer number of pairs in 1–30 everywhere.
  const numPairs = Math.round(clampToRange(numPairsRaw, 1, 30));

  const chartData = useMemo(() => {
    // Window 0.6–1.3 λ₀ (701 points)
    const wls = Array.from({ length: 701 }, (_, i) => designWl * (0.6 + (0.7 * i) / 700));
    const lambdas = wls.map((wl) => wl * 1e-9);
    const indices = Array.from({ length: numPairs * 2 }, (_, j) => (j % 2 === 0 ? nH : nL));
    const stack = { incident: nInc, layers: quarterWaveLayers(indices, designWl * 1e-9), substrate: { n: nSub } };

    const traces: Record<string, unknown>[] = [];
    const angles = [0, 15, 30, 45];
    const angleColors = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"];

    for (let ai = 0; ai < angles.length; ai++) {
      const angle = angles[ai] * Math.PI / 180;
      const RTE = reflectanceSpectrum(stack, lambdas, angle, "s");
      const RTM = reflectanceSpectrum(stack, lambdas, angle, "p");

      traces.push({
        x: wls, y: RTE, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TE (s)`, line: { color: angleColors[ai], width: 2 },
      });
      traces.push({
        x: wls, y: RTM, type: "scatter" as const, mode: "lines" as const,
        name: `${angles[ai]}° TM (p)`, line: { color: angleColors[ai], width: 1, dash: "dash" },
      });
    }

    // Centre wavelength vs angle, first order: λ_c(θ) = λ₀(cos θ_H + cos θ_L)/2. Angles where the light
    // doesn't propagate in both layers give NaN and are skipped.
    const angleSweep: number[] = [];
    const lambdaShift: number[] = [];
    for (let a = 0; a <= 89; a++) {
      const centre_nm = stopBandCentreAtAngle(designWl * 1e-9, nH, nL, (a * Math.PI) / 180, nInc) * 1e9;
      if (!Number.isFinite(centre_nm)) continue;
      angleSweep.push(a);
      lambdaShift.push(centre_nm);
    }

    return { mainTraces: traces, angleSweep, lambdaShift };
  }, [nH, nL, nSub, nInc, numPairs, designWl]);

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Number of pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={30} step="1" />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} min={1} step="10" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs">Solid lines = TE (s-pol), Dashed = TM (p-pol). Each color = different angle.</p>
        <p className="text-gray-300 text-xs font-mono">
          λ_c(θ) ≈ λ₀(cos θ_H + cos θ_L)/2, cos θ_i = √(1 − (n₀ sin θ/n_i)²) (first order)
        </p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Wavelength at Various Angles", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 9 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.angleSweep, y: chartData.lambdaShift, type: "scatter" as const, mode: "lines" as const, name: "λ_center(θ)", line: { color: "#a78bfa", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Center Wavelength Shift vs Angle", font: { size: 13 } },
        xaxis: { title: "Angle of incidence (°)", gridcolor: "#374151" },
        yaxis: { title: "λ_center (nm)", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
