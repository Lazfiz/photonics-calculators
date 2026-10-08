"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";
import { hc_eV_nm } from "../../../physics/constants";
// Aluminum optical constants (simplified)
function aluminumN(wlNm: number): { n: number; k: number } {
  const wl = wlNm / 1000;
  const E = hc_eV_nm / (wl * 1e3);
  // Simplified Drude + interband
  const epsInf = 1.0;
  const wp = 14.98;
  const gamma = 0.047;
  const epsR = epsInf - wp * wp / (E * E + gamma * gamma);
  const epsI = wp * wp * gamma / (E * (E * E + gamma * gamma));
  const n = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) + epsR) / 2);
  const k = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) - epsR) / 2);
  return { n: Math.max(n, 0.01), k: Math.max(k, 0.1) };
}

export default function EnhancedAluminumPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [alThick, setAlThick] = useURLState("alThick", 80);
  const [nProtect, setNProtect] = useURLState("nProtect", 1.38);
  const [protectThick, setProtectThick] = useURLState("protectThick", 25);
  const [designWl, setDesignWl] = useURLState("designWl", 550);
  const [adhesionThick, setAdhesionThick] = useURLState("adhesionThick", 3);

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => 200 + i * 1000 / N);

    // Air | overcoat | Al | Cr adhesion (n = 3.0, lossless here) | substrate
    const resp = wls.map(wl => {
      const Al = aluminumN(wl);
      const layers = [
        { n: nProtect, thickness: protectThick * 1e-9 },
        { n: Al.n, k: Al.k, thickness: alThick * 1e-9 },
        { n: 3.0, thickness: adhesionThick * 1e-9 },
      ];
      return stackResponse({ incident: 1, layers, substrate: { n: nSub } }, wl * 1e-9);
    });

    return { wls, R: resp.map((r) => r.R), T: resp.map((r) => r.T), A: resp.map((r) => r.A) };
  }, [nSub, alThick, nProtect, protectThick, adhesionThick]);

  const designIdx = Math.round((designWl - 200) / 1000 * 400);
  const designR = tmm.R[Math.min(Math.max(designIdx, 0), 399)];
  const avgR = tmm.R.reduce((a, b) => a + b, 0) / tmm.R.length;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Al Thickness (nm)" value={alThick} onChange={setAlThick} />
        <ValidatedNumberInput label={<>n<sub>overcoat</sub></>} value={nProtect} onChange={setNProtect} step="0.01" />
        <ValidatedNumberInput label="Overcoat Thickness (nm)" value={protectThick} onChange={setProtectThick} />
        <ValidatedNumberInput label="Design λ (nm)" value={designWl} onChange={setDesignWl} />
        <ValidatedNumberInput label="Adhesion Layer (nm)" value={adhesionThick} onChange={setAdhesionThick} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">R at Design λ</p>
          <p className="text-3xl font-bold text-blue-400">{(designR * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Average R (200–1200 nm)</p>
          <p className="text-3xl font-bold text-green-400">{(avgR * 100).toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Formulas</h3>
                              </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={[
          { x: tmm.wls, y: tmm.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#60a5fa" } },
          { x: tmm.wls, y: tmm.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
          { x: tmm.wls, y: tmm.A, type: "scatter", mode: "lines", name: "Absorptance", line: { color: "#fbbf24" } },
        ]} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
        }} />
      </div>
    </>
  );
}
