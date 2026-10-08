"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackResponse } from "../../../physics/thin-film/transfer-matrix";
// Silver optical constants (simplified Drude)
function silverN(wlNm: number): { n: number; k: number } {
  const wl = wlNm / 1000; // μm
  const epsInf = 5.0;
  const wp = 9.01; // plasma frequency eV
  const gamma = 0.048; // damping eV
  const E = 1.24 / wl; // photon energy eV
  const epsR = epsInf - wp * wp / (E * E + gamma * gamma);
  const epsI = wp * wp * gamma / (E * (E * E + gamma * gamma));
  const n = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) + epsR) / 2);
  const k = Math.sqrt((Math.sqrt(epsR * epsR + epsI * epsI) - epsR) / 2);
  return { n, k };
}

export default function ProtectedSilverPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [agThickness, setAgThickness] = useURLState("agThickness", 80);
  const [nProtect, setNProtect] = useURLState("nProtect", 1.38);
  const [protectThick, setProtectThick] = useURLState("protectThick", 50);
  const [nAdhesion, setNAdhesion] = useURLState("nAdhesion", 2.35);
  const [adhesionThick, setAdhesionThick] = useURLState("adhesionThick", 10);

  const tmm = useMemo(() => {
    const N = 400;
    const wls = Array.from({ length: N }, (_, i) => 300 + i * 900 / N);

    // Air | overcoat | Ag | adhesion layer | substrate
    const resp = wls.map(wl => {
      const Ag = silverN(wl);
      const layers = [
        { n: nProtect, thickness: protectThick * 1e-9 },
        { n: Ag.n, k: Ag.k, thickness: agThickness * 1e-9 },
        { n: nAdhesion, thickness: adhesionThick * 1e-9 },
      ];
      return stackResponse({ incident: 1, layers, substrate: { n: nSub } }, wl * 1e-9);
    });

    return { wls, R: resp.map((r) => r.R), T: resp.map((r) => r.T), A: resp.map((r) => r.A) };
  }, [nSub, agThickness, nProtect, protectThick, nAdhesion, adhesionThick]);

  const avgR = tmm.R.reduce((a, b) => a + b, 0) / tmm.R.length;

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Protected Silver Mirror" description="Protected silver coating — high reflectance UV-Vis-IR with dielectric overcoat and adhesion layer.">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} step="0.01" />
        <ValidatedNumberInput label="Ag Thickness (nm)" value={agThickness} onChange={setAgThickness} />
        <ValidatedNumberInput label={<>n<sub>protect</sub> (overcoat)</>} value={nProtect} onChange={setNProtect} step="0.01" />
        <ValidatedNumberInput label="Overcoat Thickness (nm)" value={protectThick} onChange={setProtectThick} />
        <ValidatedNumberInput label={<>n<sub>adhesion</sub></>} value={nAdhesion} onChange={setNAdhesion} step="0.01" />
        <ValidatedNumberInput label="Adhesion Layer (nm)" value={adhesionThick} onChange={setAdhesionThick} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Average R (300–1200 nm)</p>
          <p className="text-3xl font-bold text-blue-400">{(avgR * 100).toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <p className="text-sm text-gray-400">Structure</p>
          <p className="text-lg font-bold text-gray-300">Air | {nProtect} ({protectThick}nm) | Ag ({agThickness}nm) | {nAdhesion} ({adhesionThick}nm) | Sub</p>
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
    </CalculatorShell>
  );
}
