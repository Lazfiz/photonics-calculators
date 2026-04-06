"use client";

import { useState, useMemo } from "react";
import CalculatorShell from "../../../components/calculator-shell";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";

export default function CoatingStressPage() {
  const [sigmaFilm, setSigmaFilm] = useURLState("sigmaFilm", 200); // MPa, film stress
  const [dFilm, setDFilm] = useURLState("dFilm", 500); // nm
  const [eSub, setESub] = useURLState("eSub", 70); // GPa, substrate Young's modulus
  const [nuSub, setNuSub] = useURLState("nuSub", 0.17); // Poisson's ratio
  const [tSub, setTSub] = useURLState("tSub", 1.0); // mm, substrate thickness
  const [numLayers, setNumLayers] = useURLState("numLayers", 10);

  const chartData = useMemo(() => {
    const layers = Array.from({ length: 20 }, (_, i) => i + 1);
    const sigmaMPa = sigmaFilm; // MPa
    const dNm = dFilm; // nm
    const tMm = tSub; // mm

    const curvatures = layers.map(n => {
      // Stoney equation: κ = 6·σ_f·d_f·N / (E_s·t_s²)
      // σ_f in Pa, d_f in m, t_s in m, E_s in Pa → κ in 1/m
      const kappa = (6 * sigmaMPa * 1e6 * dNm * 1e-9 * n) / (eSub * 1e9 * (tMm * 1e-3) ** 2);
      return { n, kappa, radius: 1 / kappa };
    });

    return [
      {
        x: layers, y: curvatures.map(c => c.kappa),
        type: "scatter" as const, mode: "lines+markers" as const, name: "Curvature (m⁻¹)",
        line: { color: "#f87171" }, yaxis: "y1",
      },
      {
        x: layers, y: curvatures.map(c => c.radius > 1000 ? NaN : c.radius),
        type: "scatter" as const, mode: "lines+markers" as const, name: "Radius of curvature (m)",
        line: { color: "#60a5fa" }, yaxis: "y2",
      },
    ];
  }, [sigmaFilm, dFilm, eSub, nuSub, tSub, numLayers]);

  // Stoney equation: κ = 6σ_f d_f / (E_s t_s²) for single layer
  const kappa1 = (6 * sigmaFilm * 1e6 * dFilm * 1e-9) / (eSub * 1e9 * (tSub * 1e-3) ** 2);
  const radius1 = 1 / kappa1;
  const kappaN = kappa1 * numLayers;

  const stressThicknessData = useMemo(() => {
    // Stress vs thickness for fixed number of layers
    const thicknesses = Array.from({ length: 100 }, (_, i) => 100 + i * 2000 / 100);
    const curvatures = thicknesses.map(d => {
      return (6 * sigmaFilm * 1e6 * d * 1e-9 * numLayers) / (eSub * 1e9 * (tSub * 1e-3) ** 2);
    });
    return [
      { x: thicknesses, y: curvatures, type: "scatter" as const, mode: "lines" as const, name: "κ", line: { color: "#a78bfa" } },
    ];
  }, [sigmaFilm, eSub, tSub, numLayers]);

  return (
    <CalculatorShell backHref="/thin-film" backLabel="Thin Film" title="Coating Stress &amp; Curvature" description="Stoney equation: κ = 6σfdf / (Ests²). 
        Relates thin-film stress to substrate curvature. Valid for thin films (df ≪ ts).">
            
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">σ<sub>film</sub> (MPa)</span>
          <input type="number" value={sigmaFilm} onChange={e => setSigmaFilm(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">d<sub>film</sub> (nm)</span>
          <input type="number" value={dFilm} onChange={e => setDFilm(+e.target.value)} step="10" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">E<sub>substrate</sub> (GPa)</span>
          <input type="number" value={eSub} onChange={e => setESub(+e.target.value)} step="1" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">ν<sub>substrate</sub></span>
          <input type="number" value={nuSub} onChange={e => setNuSub(+e.target.value)} step="0.01" min="0" max="0.5" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4"><span className="text-sm text-gray-300">t<sub>substrate</sub> (mm)</span>
          <input type="number" value={tSub} onChange={e => setTSub(+e.target.value)} step="0.1" min="0.01" className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white" /></label>
        <ValidatedNumberInput label="Number of layers" value={numLayers} onChange={setNumLayers} min={1} max={100} />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">κ (1 layer) = <span className="text-blue-400 font-mono">{kappa1.toFixed(4)} m⁻¹</span></p>
        <p className="text-gray-300">R (1 layer) = <span className="text-blue-400 font-mono">{radius1 > 1e6 ? ">1000 km" : `${radius1.toFixed(2)} m`}</span></p>
        <p className="text-gray-300">κ ({numLayers} layers) = <span className="text-green-400 font-mono">{kappaN.toFixed(4)} m⁻¹</span></p>
        <p className="text-gray-300">R ({numLayers} layers) = <span className="text-green-400 font-mono">{(1 / kappaN) > 1e6 ? ">1000 km" : `${(1 / kappaN).toFixed(2)} m`}</span></p>
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-200">Curvature vs Number of Layers</h3>
      <ChartPanel data={chartData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Number of layers", gridcolor: "#374151" },
        yaxis: { title: "Curvature (m⁻¹)", gridcolor: "#374151", side: "left", color: "#f87171" },
        yaxis2: { title: "Radius (m)", gridcolor: "#374151", side: "right", overlaying: "y", color: "#60a5fa" },
        margin: { t: 20, b: 40, l: 60, r: 60 }, autosize: true,
        legend: { x: 0.02, y: 0.98 },
      }} />

      <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-200">Curvature vs Film Thickness</h3>
      <ChartPanel data={stressThicknessData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Film thickness (nm)", gridcolor: "#374151" },
        yaxis: { title: "Curvature (m⁻¹)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} />
    </CalculatorShell>
  );
}
