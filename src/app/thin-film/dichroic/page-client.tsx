"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stopBandCentreAtAngle } from "../../../physics/thin-film/quarter-wave-stack";
import { quarterWaveLayers, reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

export default function DichroicPage() {
  const [nH, setNH] = useURLState("nH", 2.35);
  const [nL, setNL] = useURLState("nL", 1.45);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [numPairsRaw, setNumPairs] = useURLState("numPairs", 7);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [aoiRaw, setAoi] = useURLState("aoi", 45);
  // useURLState does not clamp URL values, so clamp here and use these everywhere.
  const numPairs = Math.min(30, Math.max(1, Math.round(numPairsRaw)));
  const aoi = Math.min(89, Math.max(0, aoiRaw));

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 500 }, (_, i) => 300 + i * 700 / 500);
    // Quarter-wave stack incident | (HL)^N | substrate (thicknesses for normal incidence), at the angle of incidence
    const indices = Array.from({ length: 2 * numPairs }, (_, j) => (j % 2 === 0 ? nH : nL));
    const stack = { incident: nInc, layers: quarterWaveLayers(indices, designWl * 1e-9), substrate: { n: nSub } };
    const wlsM = wls.map((wl) => wl * 1e-9);
    const angle = (aoi * Math.PI) / 180;
    const R_s = reflectanceSpectrum(stack, wlsM, angle, "s");
    const R_p = reflectanceSpectrum(stack, wlsM, angle, "p");

    const R_avg = wls.map((_, i) => (R_s[i] + R_p[i]) / 2);
    return [
      { x: wls, y: R_s, type: "scatter" as const, mode: "lines" as const, name: "R (s-pol)", line: { color: "#f87171" } },
      { x: wls, y: R_p, type: "scatter" as const, mode: "lines" as const, name: "R (p-pol)", line: { color: "#34d399" } },
      { x: wls, y: R_avg, type: "scatter" as const, mode: "lines" as const, name: "R (avg)", line: { color: "#60a5fa", width: 2 } },
    ];
  }, [nH, nL, nSub, nInc, numPairs, designWl, aoi]);

  // Angles inside the high- and low-index layers (Snell), and the first-order stop-band centre at this angle.
  const angleRad = (aoi * Math.PI) / 180;
  const sinInc = nInc * Math.sin(angleRad);
  const cosH = Math.sqrt(1 - (sinInc / nH) ** 2);
  const cosL = Math.sqrt(1 - (sinInc / nL) ** 2);
  const centreNm = stopBandCentreAtAngle(designWl * 1e-9, nH, nL, angleRad, nInc) * 1e9;
  const fmt = (v: number, digits: number) => (Number.isFinite(v) ? v.toFixed(digits) : "—");

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>H</sub></>} value={nH} onChange={setNH} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub></>} value={nL} onChange={setNL} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} step="0.01" />
        <ValidatedNumberInput label="Pairs (N)" value={numPairs} onChange={setNumPairs} min={1} max={30} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Angle of incidence (°)" value={aoi} onChange={setAoi} min={0} max={89} step="1" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">cos θ<sub>H</sub> = <span className="text-blue-400 font-mono">{fmt(cosH, 3)}</span>, cos θ<sub>L</sub> = <span className="text-blue-400 font-mono">{fmt(cosL, 3)}</span> (angles inside the layers)</p>
        <p className="text-gray-300">Total layers = <span className="text-blue-400 font-mono">{numPairs * 2}</span></p>
        <p className="text-gray-300 text-xs mt-2">Stop-band centre at θ ≈ λ₀(cos θ<sub>H</sub> + cos θ<sub>L</sub>)/2 = <span className="text-blue-400 font-mono">{fmt(centreNm, 1)} nm</span> (first order). The p band is narrower than the s band.</p>
      </div>

      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
