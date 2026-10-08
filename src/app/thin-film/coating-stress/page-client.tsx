"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { stoneyCurvature } from "../../../physics/thin-film/stoney";

const fmtRadius = (kappa: number) => {
  if (!Number.isFinite(kappa)) return "—";
  const R = 1 / Math.abs(kappa);
  return R > 1e6 ? "> 1000 km" : R >= 1000 ? `${(R / 1000).toFixed(2)} km` : `${R.toPrecision(4)} m`;
};
const fmtKappa = (kappa: number) => (!Number.isFinite(kappa) ? "—" : kappa === 0 ? "0" : kappa.toExponential(3));

export default function CoatingStressPage() {
  const [sigmaFilm, setSigmaFilm] = useURLState("sigmaFilm", 200); // MPa, film stress (tensile > 0)
  const [dFilm, setDFilm] = useURLState("dFilm", 500); // nm, per layer
  const [eSub, setESub] = useURLState("eSub", 70); // GPa, substrate Young's modulus
  const [nuSub, setNuSub] = useURLState("nuSub", 0.17); // substrate Poisson's ratio
  const [tSub, setTSub] = useURLState("tSub", 1.0); // mm, substrate thickness
  const [numLayers, setNumLayers] = useURLState("numLayers", 10);

  const curvature = useMemo(() => {
    const perLayer = (d_nm: number) => stoneyCurvature(sigmaFilm * 1e6, d_nm * 1e-9, eSub * 1e9, nuSub, tSub * 1e-3);
    return { perLayer, kappa1: perLayer(dFilm) };
  }, [sigmaFilm, dFilm, eSub, nuSub, tSub]);
  const { kappa1 } = curvature;
  const kappaN = kappa1 * numLayers;

  const layerData = useMemo(() => {
    const layers = Array.from({ length: 20 }, (_, i) => i + 1);
    const kappas = layers.map((n) => kappa1 * n);
    return [
      {
        x: layers, y: kappas,
        type: "scatter", mode: "lines+markers", name: "Curvature (m⁻¹)", line: { color: "#f87171" }, yaxis: "y1",
      },
      {
        x: layers, y: kappas.map((k) => (Math.abs(1 / k) > 1000 ? NaN : 1 / Math.abs(k))),
        type: "scatter", mode: "lines+markers", name: "Radius of curvature (m)", line: { color: "#60a5fa" }, yaxis: "y2",
      },
    ];
  }, [kappa1]);

  const thicknessData = useMemo(() => {
    const thicknesses = Array.from({ length: 101 }, (_, i) => 100 + i * 20);
    return [{
      x: thicknesses, y: thicknesses.map((d) => curvature.perLayer(d) * numLayers),
      type: "scatter", mode: "lines", name: "κ", line: { color: "#a78bfa" },
    }];
  }, [curvature, numLayers]);

  const shape = (kappa: number) => (kappa > 0 ? "film side concave" : kappa < 0 ? "film side convex" : "flat");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label={<>σ<sub>film</sub> (MPa, tensile &gt; 0)</>} value={sigmaFilm} onChange={setSigmaFilm} min={-10000} max={10000} step="10" />
        <ValidatedNumberInput label={<>d<sub>film</sub> per layer (nm)</>} value={dFilm} onChange={setDFilm} min={0} max={100000} step="10" />
        <ValidatedNumberInput label="Number of layers" value={numLayers} onChange={setNumLayers} min={1} max={100} />
        <ValidatedNumberInput label={<>E<sub>substrate</sub> (GPa)</>} value={eSub} onChange={setESub} min={0.1} max={1500} step="1" />
        <ValidatedNumberInput label={<>ν<sub>substrate</sub></>} value={nuSub} onChange={setNuSub} min={0} max={0.5} step="0.01" />
        <ValidatedNumberInput label={<>t<sub>substrate</sub> (mm)</>} value={tSub} onChange={setTSub} min={0.01} max={100} step="0.1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Curvature, 1 layer" value={`${fmtKappa(kappa1)} m⁻¹`} tone="blue" subtext={`R = ${fmtRadius(kappa1)}, ${shape(kappa1)}`} />
        <ResultCard label={`Curvature, ${numLayers} layers`} value={`${fmtKappa(kappaN)} m⁻¹`} tone="green" subtext={`R = ${fmtRadius(kappaN)}, ${shape(kappaN)}`} />
      </div>

      <h3 className="text-lg font-semibold mb-3 text-gray-200">Curvature vs Number of Layers</h3>
      <ChartPanel data={layerData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Number of layers", gridcolor: "#374151" },
        yaxis: { title: "Curvature (m⁻¹)", gridcolor: "#374151", side: "left", color: "#f87171" },
        yaxis2: { title: "Radius (m)", gridcolor: "#374151", side: "right", overlaying: "y", color: "#60a5fa" },
        margin: { t: 20, b: 40, l: 60, r: 60 }, autosize: true,
        legend: { x: 0.02, y: 0.98 },
      }} />

      <h3 className="text-lg font-semibold mb-3 mt-6 text-gray-200">Curvature vs Layer Thickness ({numLayers} layers)</h3>
      <ChartPanel data={thicknessData} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        xaxis: { title: "Layer thickness (nm)", gridcolor: "#374151" },
        yaxis: { title: "Curvature (m⁻¹)", gridcolor: "#374151" },
        margin: { t: 20, b: 40, l: 60, r: 20 }, autosize: true,
      }} />

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mt-8">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">κ = 6 σ<sub>f</sub> d<sub>f</sub> N (1 − ν<sub>s</sub>) / (E<sub>s</sub> t<sub>s</sub>²)</p>
          <p>
            Stoney&apos;s equation with the substrate&apos;s biaxial modulus E<sub>s</sub>/(1 − ν<sub>s</sub>) (Janssen et al.,
            Thin Solid Films 517, 1858, 2009). The forces σ<sub>f</sub>d<sub>f</sub> of identical layers add. Textbook
            approximation: valid for a total coating thickness much smaller than the substrate, deflections small compared
            with t<sub>s</sub>, uniform stress and an isotropic substrate.
          </p>
        </div>
      </div>
    </>
  );
}
