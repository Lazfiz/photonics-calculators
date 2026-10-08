"use client";

import { useState, useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stackResponse, type Stack } from "../../../physics/thin-film/transfer-matrix";

export default function MetalDielectricPage() {
  const [nMetal, setNMetal] = useURLState("nMetal", 0.5);
  const [kMetal, setKMetal] = useURLState("kMetal", 3.0);
  const [nDielectric, setNDielectric] = useURLState("nDielectric", 2.1);
  const [dDielectric, setDDielectric] = useURLState("dDielectric", 50);
  const [dMetal, setDMetal] = useURLState("dMetal", 10);
  const [nSub, setNSub] = useURLState("nSub", 1.52);

  // Air | dielectric overcoat | metal (n + ik) | substrate
  const stack = useMemo<Stack>(() => ({
    incident: 1,
    layers: [
      { n: nDielectric, thickness: dDielectric * 1e-9 },
      { n: nMetal, k: kMetal, thickness: dMetal * 1e-9 },
    ],
    substrate: { n: nSub },
  }), [nMetal, kMetal, nDielectric, dDielectric, dMetal, nSub]);

  const chartData = useMemo(() => {
    const wls = Array.from({ length: 300 }, (_, i) => 300 + i * 2);
    const resp = wls.map((wl) => stackResponse(stack, wl * 1e-9));
    const R = resp.map((r) => r.R);
    const T = resp.map((r) => r.T);
    const A = resp.map((r) => r.A);
    return [
      { x: wls, y: R, type: "scatter" as const, mode: "lines" as const, name: "Reflectance", line: { color: "#f87171" } },
      { x: wls, y: T, type: "scatter" as const, mode: "lines" as const, name: "Transmittance", line: { color: "#60a5fa" } },
      { x: wls, y: A, type: "scatter" as const, mode: "lines" as const, name: "Absorptance", line: { color: "#fbbf24" } },
    ];
  }, [stack]);

  const absorptance550 = stackResponse(stack, 550e-9).A;
  const nEff = nMetal * nMetal - kMetal * kMetal;

  return (
    <>
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="n (metal, real part)" value={nMetal} onChange={setNMetal} min={0} step="0.05" />
        <ValidatedNumberInput label="k (metal, extinction coeff)" value={kMetal} onChange={setKMetal} min={0} step="0.1" />
        <ValidatedNumberInput label="n (dielectric)" value={nDielectric} onChange={setNDielectric} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Dielectric Thickness (nm)" value={dDielectric} onChange={setDDielectric} min={0} step="5" />
        <ValidatedNumberInput label="Metal Thickness (nm)" value={dMetal} onChange={setDMetal} min={1} step="1" />
        <ValidatedNumberInput label="n (substrate)" value={nSub} onChange={setNSub} min={0.1} step="0.01" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Absorptance @ 550 nm</p>
          <p className="text-xl font-bold text-yellow-400">{(absorptance550 * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">n²−k²</p>
          <p className="text-xl font-bold text-green-400">{nEff.toFixed(2)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">Skin depth ≈ λ/(4πk)</p>
          <p className="text-xl font-bold text-red-400">{(550 / (4 * Math.PI * kMetal)).toFixed(1)} nm</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-200">Metal-Dielectric Theory</h2>
        <div className="space-y-2 text-sm text-gray-300 font-mono">
          <p>Complex index: ñ = n + ik</p>
          <p>Single-pass attenuation in the metal: exp(−4πkd/λ)</p>
          <p>Skin depth: δ = λ/(4πk)</p>
          <p>R + T + A = 1 (energy conservation)</p>
          <p>Dielectric overcoat tunes R via interference</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4">
        <ChartPanel data={chartData} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent",
          font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R / T / A", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 30, r: 30, b: 50, l: 70 },
          legend: { x: 0.02, y: 0.98 },
        }} />
      </div>
    </>
  );
}
