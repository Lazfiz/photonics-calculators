"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { planckExitance } from "../../../physics/blackbody";
import { coatingResponse, glazingPerformance, paneResponse, type CoatingLayer } from "../../../physics/thin-film/low-emissivity";

const NM = 1e-9;
const UM = 1e-6;
const pct = (x: number, digits = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(digits)} %` : "—");

export default function HeatMirrorPage() {
  // A single-silver low-e coating: dielectric | Ag | dielectric on glass (TiO₂/Ag/TiO₂, Fan & Bachner 1976).
  const [nD, setND] = useURLState("nD", 2.35);
  const [dOuter, setDOuter] = useURLState("dOuter", 30);
  const [dAg, setDAg] = useURLState("dAg", 12);
  const [dInner, setDInner] = useURLState("dInner", 30);
  const [nSub, setNSub] = useURLState("nSub", 1.52);
  const [temp, setTemp] = useURLState("temp", 300);

  const valid = nD > 0 && nSub > 0 && dOuter >= 0 && dAg >= 0 && dInner >= 0 && temp >= 50 && temp <= 1000;

  const coating = useMemo<CoatingLayer[]>(() => [
    { material: "dielectric", n: nD, thickness: dOuter * NM },
    { material: "Ag", thickness: dAg * NM },
    { material: "dielectric", n: nD, thickness: dInner * NM },
  ], [nD, dOuter, dAg, dInner]);

  const perf = useMemo(() => (valid ? glazingPerformance(coating, nSub, temp) : null), [valid, coating, nSub, temp]);
  const bare = useMemo(() => (valid ? glazingPerformance([], nSub, temp) : null), [valid, nSub, temp]);

  const solar = useMemo(() => {
    if (!valid) return null;
    const x = Array.from({ length: 441 }, (_, i) => 300 + 5 * i);
    const pane = x.map((w) => paneResponse(coating, nSub, w * NM));
    return { x, T: pane.map((p) => p.T), R: pane.map((p) => p.R) };
  }, [valid, coating, nSub]);

  const thermal = useMemo(() => {
    if (!valid) return null;
    const x = Array.from({ length: 241 }, (_, i) => 2.5 * 20 ** (i / 240));
    const R = x.map((um) => coatingResponse(coating, { material: "dielectric", n: nSub }, um * UM).R);
    const M = x.map((um) => planckExitance(um * UM, temp));
    const peak = M.reduce((a, b) => Math.max(a, b), 0);
    return { x, R, planck: M.map((m) => m / peak) };
  }, [valid, coating, nSub, temp]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Ag thickness (nm)" value={dAg} onChange={setDAg} min={0} max={100} step="1" />
        <ValidatedNumberInput label={<>n of the dielectric (TiO₂ ≈ 2.35)</>} value={nD} onChange={setND} min={1} max={4} step="0.01" />
        <ValidatedNumberInput label="Outer dielectric (nm)" value={dOuter} onChange={setDOuter} min={0} max={500} step="1" />
        <ValidatedNumberInput label="Inner dielectric, on the glass (nm)" value={dInner} onChange={setDInner} min={0} max={500} step="1" />
        <ValidatedNumberInput label={<>n<sub>glass</sub></>} value={nSub} onChange={setNSub} min={1} max={4} step="0.01" />
        <ValidatedNumberInput label="Surface temperature for ε (K)" value={temp} onChange={setTemp} min={50} max={1000} step="1" />
      </div>

      {!valid && <p className="text-yellow-400 text-sm mb-6">Set positive indices, non-negative thicknesses and a temperature in 50–1000 K.</p>}

      {perf && bare && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Light transmittance τ<sub>v</sub> (D65)</p>
            <p className="text-2xl font-bold text-green-400">{pct(perf.Tvis)}</p>
            <p className="text-sm text-gray-500 mt-1">ρ<sub>v</sub> = {pct(perf.Rvis)}; bare pane {pct(bare.Tvis)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Solar transmittance τ<sub>e</sub> (AM1.5 G)</p>
            <p className="text-2xl font-bold text-amber-400">{pct(perf.Tsol)}</p>
            <p className="text-sm text-gray-500 mt-1">ρ<sub>e</sub> = {pct(perf.Rsol)}, absorbed {pct(1 - perf.Tsol - perf.Rsol)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400">Normal emittance ε<sub>n</sub> at {temp} K</p>
            <p className="text-2xl font-bold text-red-400">{Number.isFinite(perf.emittance) ? perf.emittance.toFixed(3) : "—"}</p>
            <p className="text-sm text-gray-500 mt-1">Uncoated glass (this model): {bare.emittance.toFixed(3)}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded p-4 mb-6">
        <p className="text-gray-300 text-xs">
          A heat mirror passes visible light and reflects thermal infrared: a silver film thin enough to see through (≈ 10–20 nm) reflects
          like a metal beyond about 2 µm, and the two high-index layers cancel its visible reflection (an induced-transmission filter).
          τ<sub>v</sub> and ρ<sub>v</sub> weight the pane&apos;s T and R with D65 × V(λ) (ISO 9050, EN 410), τ<sub>e</sub> with the ASTM G173 AM1.5
          global spectrum, 280–4000 nm; the glass&apos;s back face is included, its absorption isn&apos;t. ε<sub>n</sub> is the Planck-weighted
          1 − R of the coated face over 2.5–50 µm (Kirchhoff, glass opaque there); glazing standards use the hemispherical value, which for a
          low-e surface is somewhat higher. Ag uses the n, k Yang et al. (2015) measured on template-stripped silver (0.27–24.9 µm, a matched Drude term
          beyond), the dielectric a constant index. Real Ag films this thin conduct worse than the model, which raises ε. The bare-glass ε here is too high: glass
          with a constant index lacks the strong reflection real glass has near 9 µm.
        </p>
      </div>

      {solar && (
        <div className="mb-6">
          <ChartPanel title="Pane, solar range" data={[
            { x: solar.x, y: solar.T, type: "scatter", mode: "lines", name: "Transmittance", line: { color: "#34d399" } },
            { x: solar.x, y: solar.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          ]} layout={{
            paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "T / R", gridcolor: "#374151", range: [0, 1.02] },
            margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
          }} />
        </div>
      )}

      {thermal && (
        <ChartPanel title="Coated face, thermal infrared" data={[
          { x: thermal.x, y: thermal.R, type: "scatter", mode: "lines", name: "Reflectance", line: { color: "#f87171" } },
          { x: thermal.x, y: thermal.planck, type: "scatter", mode: "lines", name: `Planck, ${temp} K`, line: { color: "#fbbf24", dash: "dot" } },
        ]} layout={{
          paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
          xaxis: { title: "Wavelength (µm)", gridcolor: "#374151", type: "log" },
          yaxis: { title: "R, Planck (peak = 1)", gridcolor: "#374151", range: [0, 1.02] },
          margin: { t: 20, b: 40, l: 50, r: 20 }, autosize: true,
        }} />
      )}
    </>
  );
}
