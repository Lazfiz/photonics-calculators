"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  diversityThreshold, fresnelZone, irradianceCorrelation, logIrradianceCorrelation, rytovVariance, scintillationIndex,
  type Combiner,
} from "../../../physics/free-space-comms/turbulence";

const fmt = (x: number, digits = 3) =>
  !Number.isFinite(x) ? "—" : x === 0 ? "0" : Math.abs(x) >= 0.01 && Math.abs(x) < 1e5 ? x.toPrecision(digits) : x.toExponential(2);
const chartLayout = (xTitle: string, yTitle: string) => ({
  xaxis: { title: xTitle, color: "#9ca3af", gridcolor: "#374151" },
  yaxis: { title: yTitle, color: "#9ca3af", gridcolor: "#374151" },
  margin: { l: 60, r: 20, t: 20, b: 50 }, paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#d1d5db" },
  legend: { x: 0.02, y: 0.98, bgcolor: "rgba(0,0,0,0)" },
});

const combiners: { id: Combiner; label: string; color: string }[] = [
  { id: "sc", label: "Selection", color: "#06b6d4" },
  { id: "egc", label: "Equal-gain", color: "#a78bfa" },
  { id: "mrc", label: "Maximal-ratio", color: "#22c55e" },
];
const marginDb = (t: number) => -10 * Math.log10(t);

export default function DiversityReceptionPage() {
  const [numRx, setNumRx] = useURLState("numRx", 2, { min: 1, max: 8 });
  const [separation, setSeparation] = useURLState("separation", 5, { min: 0, max: 1000 }); // cm
  const [c2n, setC2n] = useURLState("c2n", 1e-14, { min: 1e-18, max: 1e-11 }); // m^(−2/3)
  const [wavelength, setWavelength] = useURLState("wavelength", 1550, { min: 200, max: 20000 }); // nm
  const [range, setRange] = useURLState("range", 1, { min: 0.001, max: 1000 }); // km
  const [combiner, setCombiner] = useURLState("combiner", "egc");
  const [pOut, setPOut] = useURLState("pOut", 1e-6, { min: 1e-12, max: 0.1 });

  const n = Math.min(8, Math.max(1, Math.round(numRx)));
  const selected: Combiner = combiner === "sc" || combiner === "mrc" ? combiner : "egc";

  const base = useMemo(() => {
    const lambda = wavelength * 1e-9;
    const L = range * 1e3;
    const sigmaR2 = rytovVariance(c2n, lambda, L);
    const sigmaI2 = scintillationIndex(sigmaR2, lambda, L);
    return { lambda, L, sigmaR2, sigmaI2 };
  }, [wavelength, range, c2n]);

  const results = useMemo(() => {
    const { lambda, L, sigmaI2 } = base;
    const bI = irradianceCorrelation(separation * 1e-2, lambda, L);
    const rho = logIrradianceCorrelation(bI, sigmaI2);
    const single = marginDb(diversityThreshold(pOut, 1, sigmaI2, rho, "sc"));
    const margins = combiners.map((c) => ({ ...c, margin: marginDb(diversityThreshold(pOut, n, sigmaI2, rho, c.id)) }));
    const sel = margins.find((m) => m.id === selected)!.margin;
    return { bI, rho, single, margins, gain: single - sel, selMargin: sel };
  }, [base, separation, pOut, n, selected]);

  const sepData = useMemo(() => {
    const { lambda, L, sigmaI2 } = base;
    const sMax = Math.max(3 * Math.sqrt(lambda * L), 1.2 * separation * 1e-2);
    // 17 points: each separation needs its own N-branch sum tables (≈ 10 ms each at N = 8).
    const seps = Array.from({ length: 17 }, (_, i) => (sMax * i) / 16);
    const x = seps.map((s) => s * 100);
    const rhos = seps.map((s) => logIrradianceCorrelation(irradianceCorrelation(s, lambda, L), sigmaI2));
    const single = marginDb(diversityThreshold(pOut, 1, sigmaI2, 0, "sc"));
    const gain = combiners.map((c) => ({
      type: "scatter", mode: "lines", x, name: c.label, line: { color: c.color, width: 2 },
      y: rhos.map((r) => single - marginDb(diversityThreshold(pOut, n, sigmaI2, r, c.id))),
    }));
    const corr = [{
      type: "scatter", mode: "lines", x, name: "b_I", line: { color: "#3b82f6", width: 2 },
      y: seps.map((s) => irradianceCorrelation(s, lambda, L)),
    }];
    return { gain, corr };
  }, [base, pOut, n, separation]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Number of Receivers N" value={numRx} onChange={setNumRx} min={1} max={8} step="1" />
        <ValidatedNumberInput label="Receiver Separation (cm)" value={separation} onChange={setSeparation} min={0} max={1000} step="any" />
        <ValidatedNumberInput label="Cn² (m⁻²ᐟ³)" value={c2n} onChange={setC2n} min={1e-18} max={1e-11} step="any" />
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelength} onChange={setWavelength} min={200} max={20000} />
        <ValidatedNumberInput label="Link Distance (km)" value={range} onChange={setRange} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label="Target Outage P_out" value={pOut} onChange={setPOut} min={1e-12} max={0.1} step="any" />
      </div>
      <div className="mb-8 max-w-xs">
        <label className="block text-sm text-gray-400 mb-1" htmlFor="combiner">Combiner</label>
        <select id="combiner" value={selected} onChange={(e) => setCombiner(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white">
          {combiners.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {base.sigmaR2 > 1 && (
        <div role="alert" className="mb-6 rounded-lg border border-yellow-600 bg-yellow-900/30 p-4 text-sm text-yellow-200">
          σ_R² &gt; 1: the irradiance correlation and the log-normal model hold for weak fluctuations only. Treat the margins as indicative.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Rytov variance σ_R²" value={fmt(base.sigmaR2)} tone="blue" />
        <ResultCard label="Scintillation index σ_I² (point)" value={fmt(base.sigmaI2)} tone="purple" />
        <ResultCard label={`Irradiance correlation b_I(${fmt(separation)} cm)`} value={fmt(results.bI)} tone="cyan"
          subtext={`Fresnel zone ${fmt(fresnelZone(base.lambda, base.L) * 100)} cm`} />
        <ResultCard label="Log-irradiance correlation ρ_ln" value={fmt(results.rho)} tone="gray"
          subtext={results.rho < 0 ? "negative ρ treated as 0 (conservative)" : undefined} />
        <ResultCard label="Fade margin, single receiver" value={`${fmt(results.single)} dB`} tone="orange" subtext={`for P_out = ${fmt(pOut)}`} />
        <ResultCard label={`Fade margin, ${combiners.find((c) => c.id === selected)!.label}, N = ${n}`} value={`${fmt(results.selMargin)} dB`} tone="green" />
        <ResultCard label="Diversity gain" value={`${fmt(results.gain)} dB`} tone="green" subtext="single margin − combiner margin" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-4">Required margin by combiner (N = {n})</h2>
        <table className="w-full text-sm text-left">
          <thead className="text-gray-400"><tr><th className="py-1">Combiner</th><th>Margin (dB)</th><th>Gain (dB)</th></tr></thead>
          <tbody>
            {results.margins.map((m) => (
              <tr key={m.id} className="border-t border-gray-800">
                <td className="py-1">{m.label}</td><td>{fmt(m.margin)}</td><td>{fmt(results.single - m.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Diversity gain vs separation</h2>
          <ChartPanel data={[...sepData.gain, { type: "scatter", mode: "markers", x: [separation], y: [results.gain], name: "Current", marker: { color: "#facc15", size: 10 } }]} layout={chartLayout("Receiver separation (cm)", "Diversity gain (dB)")} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Irradiance correlation vs separation</h2>
          <ChartPanel data={[...sepData.corr, { type: "scatter", mode: "markers", x: [separation], y: [results.bI], name: "Current", marker: { color: "#facc15", size: 10 } }]} layout={chartLayout("Receiver separation (cm)", "b_I")} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-2">
        <h3 className="text-lg font-semibold">Model</h3>
        <p className="font-mono">M = −10·log10(t),   P(combined irradiance &lt; t⟨I⟩) = P_out</p>
        <p>
          Point receivers with log-normal irradiance, σ_I² from the all-regime plane-wave expression and the
          spatial correlation b_I(d) of the Kolmogorov spectrum; ρ_ln is the correlation of ln I. Equicorrelation
          assumes every pair of receivers is separated by d, which is conservative for a line or grid array. Each receiver
          has the single receiver&apos;s aperture, so EGC and MRC include the √N array gain. All three combiners are computed
          exactly (to &lt; 0.001 dB): given the common part of the fading the receivers are independent, and the sum of N
          independent log-normals is built by numerical convolution.
        </p>
        <p>
          Valid for weak fluctuations (σ_R² &lt; 1). Margins are relative to one receiver&apos;s mean irradiance.
        </p>
      </div>
    </>
  );
}
