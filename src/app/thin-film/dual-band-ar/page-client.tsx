"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { firstCrossing } from "../../../physics/math";
import { dualBandReflectance, fitDualBandAr } from "../../../physics/thin-film/dual-band-ar";

const NM = 1e-9;
const pct = (x: number, digits = 3) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");
const LEVEL = 0.01;

export default function DualBandARPage() {
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [wl1, setWl1] = useURLState("wl1", 450);
  const [wl2, setWl2] = useURLState("wl2", 1064);
  const [n1, setN1] = useURLState("n1", 1.38);
  const [n2, setN2] = useURLState("n2", 2.1);
  const [n3, setN3] = useURLState("n3", 1.65);

  const valid = nSub > 0 && n1 > 0 && n2 > 0 && n3 > 0 && wl1 >= 200 && wl1 <= 5000 && wl2 >= 200 && wl2 <= 5000;
  const problem = useMemo(
    () => ({ incident: 1, indices: [n1, n2, n3], substrate: nSub, lambda1: wl1 * NM, lambda2: wl2 * NM }),
    [n1, n2, n3, nSub, wl1, wl2],
  );
  const fit = useMemo(() => (valid ? fitDualBandAr(problem) : null), [valid, problem]);

  // Width of the band around each design wavelength where R stays below 1 %.
  const bands = useMemo(() => {
    if (!fit) return null;
    const R = (lam: number) => dualBandReflectance(problem, fit.thicknesses, lam);
    const width = (lam: number) => {
      if (!(R(lam) < LEVEL)) return null;
      const lo = firstCrossing(R, lam, lam * 0.5, LEVEL, 400);
      const hi = firstCrossing(R, lam, lam * 1.5, LEVEL, 400);
      // No crossing within λ/2 … 1.5λ: report the scan limit.
      return { lo: Number.isFinite(lo) ? lo : lam * 0.5, hi: Number.isFinite(hi) ? hi : lam * 1.5, open: [!Number.isFinite(lo), !Number.isFinite(hi)] };
    };
    return [width(problem.lambda1), width(problem.lambda2)];
  }, [fit, problem]);

  const spectrum = useMemo(() => {
    if (!fit) return null;
    const lo = 0.7 * Math.min(wl1, wl2), hi = 1.3 * Math.max(wl1, wl2);
    const x = Array.from({ length: 601 }, (_, i) => lo + ((hi - lo) * i) / 600);
    return { x, R: x.map((w) => 100 * dualBandReflectance(problem, fit.thicknesses, w * NM)) };
  }, [fit, problem, wl1, wl2]);

  const bare = ((nSub - 1) / (nSub + 1)) ** 2;
  const bandText = (b: { lo: number; hi: number; open: boolean[] } | null) =>
    b ? `${b.open[0] ? "≤ " : ""}${(b.lo / NM).toFixed(0)} – ${b.open[1] ? "≥ " : ""}${(b.hi / NM).toFixed(0)} nm` : "R ≥ 1 % at the centre";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Wavelength λ₁ (nm)" value={wl1} onChange={setWl1} min={200} max={5000} step="1" />
        <ValidatedNumberInput label="Wavelength λ₂ (nm)" value={wl2} onChange={setWl2} min={200} max={5000} step="1" />
        <ValidatedNumberInput label={<>n<sub>1</sub> (outer layer)</>} value={n1} onChange={setN1} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>2</sub> (middle layer)</>} value={n2} onChange={setN2} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>3</sub> (layer on the substrate)</>} value={n3} onChange={setN3} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSub} onChange={setNSub} min={1} max={5} step="0.01" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices and wavelengths in 200–5000 nm.</p>}

      {fit && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">R at λ₁ = {wl1} nm</p>
            <p className="text-2xl font-bold text-blue-400">{pct(fit.R1)}</p>
            <p className="text-sm text-gray-500 mt-1">R &lt; 1 %: {bandText(bands?.[0] ?? null)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">R at λ₂ = {wl2} nm</p>
            <p className="text-2xl font-bold text-green-400">{pct(fit.R2)}</p>
            <p className="text-sm text-gray-500 mt-1">R &lt; 1 %: {bandText(bands?.[1] ?? null)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Fitted thicknesses (outer → substrate)</p>
            <p className="text-lg font-bold text-amber-400 font-mono">{fit.thicknesses.map((d) => (d / NM).toFixed(1)).join(" / ")} nm</p>
            <p className="text-sm text-gray-500 mt-1">Uncoated face: R = {pct(bare, 2)}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 text-xs">
          The three thicknesses are fitted to minimise R(λ₁) + R(λ₂): a grid search with each layer between 0 and a half wave at the
          longer wavelength, refined by Nelder–Mead. Three layers have enough freedom for two zeros only for some index sets; otherwise the
          fit returns the best compromise it finds, which need not be the global one. Quarter waves at each wavelength (the usual first
          guess) don&apos;t work: with the defaults they leave 12.9 % at 1064 nm. Exact transfer matrix at normal incidence, lossless layers
          with constant indices (real coating materials disperse, which shifts a dual-band design), substrate back face ignored.
        </p>
      </div>

      {spectrum && (
        <ChartPanel title="Reflectance of the fitted coating" data={[
          { x: spectrum.x, y: spectrum.R, type: "scatter", mode: "lines", name: "R (%)", line: { color: "#f87171" } },
          { x: [wl1, wl2], y: [100 * (fit?.R1 ?? NaN), 100 * (fit?.R2 ?? NaN)], type: "scatter", mode: "markers", name: "λ₁, λ₂", marker: { color: "#fbbf24", size: 8 } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
          yaxis: { title: "R (%)", gridcolor: "#374151", rangemode: "tozero" },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
