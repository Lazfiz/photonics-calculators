"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";

import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { quarterWaveStackReflectance, quarterWaveThickness, reflectanceSpectrum, stackResponse } from "../../../physics/thin-film/transfer-matrix";

export default function PartialReflectorPage() {
  const [nFilm, setNFilm] = useURLState("nFilm", 1.7);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [nInc, setNInc] = useURLState("nInc", 1.0);
  const [thicknessRatio, setThicknessRatio] = useURLState("thicknessRatio", 1.0); // ratio to QWL
  const [designWl, setDesignWl] = useURLState("designWl", 550);

  const chartData = useMemo(() => {
    // Window 0.5–1.5 λ₀ (501 points, so λ₀ is a grid point)
    const wls = Array.from({ length: 501 }, (_, i) => designWl * (0.5 + i / 500));
    const lambdas = wls.map((wl) => wl * 1e-9);
    // One film of `ratio` quarter-waves at λ₀
    const filmSpectrum = (ratio: number) => {
      const film = { n: nFilm, thickness: ratio * quarterWaveThickness(nFilm, designWl * 1e-9) };
      return reflectanceSpectrum({ incident: nInc, layers: [film], substrate: { n: nSub } }, lambdas);
    };

    // Single layer
    const R_single = filmSpectrum(thicknessRatio);

    const traces: Record<string, unknown>[] = [
      { x: wls, y: R_single, type: "scatter" as const, mode: "lines" as const,
        name: `Single layer (${thicknessRatio} × λ₀/4n)`, line: { color: "#60a5fa", width: 2 } },
    ];

    // Sweep thickness ratios
    const ratios = [0.25, 0.5, 1.0, 1.5, 2.0];
    const ratioColors = ["#f87171", "#fbbf24", "#34d399", "#a78bfa", "#fb923c"];
    for (let ri = 0; ri < ratios.length; ri++) {
      if (Math.abs(ratios[ri] - thicknessRatio) < 0.01) continue;
      const Rr = filmSpectrum(ratios[ri]);
      traces.push({
        x: wls, y: Rr, type: "scatter" as const, mode: "lines" as const,
        name: `${ratios[ri]} × λ₀/4n`, line: { color: ratioColors[ri], width: 1, dash: "dash" },
      });
    }

    // R at the design wavelength of a quarter-wave layer, for various nFilm
    const nRange = Array.from({ length: 200 }, (_, i) => 1.0 + i * 2.5 / 200);
    const R_vs_n = nRange.map((n) => quarterWaveStackReflectance(nInc, [n], nSub));

    return { mainTraces: traces, nRange, R_vs_n };
  }, [nFilm, nSub, nInc, thicknessRatio, designWl]);

  // R of a quarter-wave film (closed form), and R at λ₀ for the film of the entered thickness
  const Rdesign = quarterWaveStackReflectance(nInc, [nFilm], nSub);
  const Rthis = stackResponse(
    {
      incident: nInc,
      layers: [{ n: nFilm, thickness: thicknessRatio * quarterWaveThickness(nFilm, designWl * 1e-9) }],
      substrate: { n: nSub },
    },
    designWl * 1e-9,
  ).R;
  const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(2)}%` : "—");
  const thickness_nm = (thicknessRatio * designWl) / (4 * nFilm);

  return (
    <>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label={<>n<sub>film</sub></>} value={nFilm} onChange={setNFilm} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={0.1} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nInc} onChange={setNInc} min={0.1} step="0.01" />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designWl} onChange={setDesignWl} min={1} step="10" />
        <ValidatedNumberInput label="Thickness ratio (d / λ₀/4n)" value={thicknessRatio} onChange={setThicknessRatio} min={0.1} max={3} step="0.05" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 space-y-1">
        <p className="text-gray-300">R for a quarter-wave film = <span className="text-blue-400 font-mono">{pct(Rdesign)}</span></p>
        <p className="text-gray-300">R at λ₀ for this thickness = <span className="text-blue-400 font-mono">{pct(Rthis)}</span></p>
        <p className="text-gray-300">d = <span className="text-blue-400 font-mono">{Number.isFinite(thickness_nm) ? thickness_nm.toFixed(1) : "—"} nm</span></p>
        <p className="text-gray-300 text-xs mt-2">R = [r₁² + r₂² + 2r₁r₂cos(2δ)] / [1 + r₁²r₂² + 2r₁r₂cos(2δ)] where δ = 2πn<sub>f</sub>d/λ</p>
      </div>

      <ChartPanel data={chartData.mainTraces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance vs Wavelength", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <div className="h-6" />

      <ChartPanel data={[{ x: chartData.nRange, y: chartData.R_vs_n, type: "scatter" as const, mode: "lines" as const, name: "R (QWL)", line: { color: "#34d399", width: 2 } }]} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "QWL Reflectance vs Film Index", font: { size: 13 } },
        xaxis: { title: "n_film", gridcolor: "#374151" },
        yaxis: { title: "R (at λ₀)", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
      }} />
    </>
  );
}
