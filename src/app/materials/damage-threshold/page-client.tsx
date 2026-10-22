"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  THERMAL_SCALING_MIN_TAU,
  energyAtFluence,
  gaussianPeakFluence,
  scaleDamageThreshold,
} from "../../../physics/materials/laser-damage";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const NS = 1e-9;
const J_CM2 = 1e4; // J/m² per J/cm²
const CHART_TAU = Array.from({ length: 61 }, (_, i) => 10 ** (-11 + i * 0.1)); // 10 ps to 10 µs

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function DamageThresholdPage() {
  const [fRefRaw, setFRef] = useURLState("fRef", 10); // J/cm²
  const [tauRefRaw, setTauRef] = useURLState("tauRef", 10); // ns
  const [tauRaw, setTau] = useURLState("tau", 5); // ns
  const [expRaw, setExp] = useURLState("exponent", 0.5);
  const [energyRaw, setEnergy] = useURLState("energy", 0.1); // J
  const [diamRaw, setDiam] = useURLState("diameter", 5); // mm, 1/e²

  const fRef = clamp(fRefRaw, 1e-3, 1e5, 10) * J_CM2;
  const tauRef = clamp(tauRefRaw, 1e-6, 1e9, 10) * NS;
  const tau = clamp(tauRaw, 1e-6, 1e9, 5) * NS;
  const exponent = clamp(expRaw, 0, 1, 0.5);
  const energy = clamp(energyRaw, 0, 1e6, 0.1);
  const w = (clamp(diamRaw, 1e-3, 1e4, 5) / 2) * 1e-3;

  const fTh = scaleDamageThreshold(fRef, tauRef, tau, exponent);
  const fPeak = gaussianPeakFluence(energy, w);
  const margin = fTh / fPeak;
  const eMax = energyAtFluence(fTh, w);
  const outsideScaling = tau < THERMAL_SCALING_MIN_TAU || tauRef < THERMAL_SCALING_MIN_TAU;

  const series = [
    { name: "Scaled LIDT", color: "#3b82f6", points: CHART_TAU.map((t) => ({ x: t / NS, y: Number((scaleDamageThreshold(fRef, tauRef, t, exponent) / J_CM2).toPrecision(6)) })) },
    { name: "Peak fluence", color: "#ef4444", dashed: true, points: [CHART_TAU[0], CHART_TAU[CHART_TAU.length - 1]].map((t) => ({ x: t / NS, y: fPeak > 0 ? Number((fPeak / J_CM2).toPrecision(6)) : null })) },
    { name: "This pulse", color: "#f59e0b", showPoints: true, points: [{ x: tau / NS, y: Number((fTh / J_CM2).toPrecision(6)) }] },
  ];

  return (
    <>
      <p className="text-sm text-gray-400 mb-4">
        Enter the optic&apos;s rated damage threshold and the pulse duration it was measured at, from its data sheet
        (same wavelength as your laser). The defaults are an example, not a material value.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Rated LIDT (J/cm²)" value={fRefRaw} onChange={setFRef} min={0.001} max={100000} step="any" />
        <ValidatedNumberInput label="Rated at Pulse Duration (ns)" value={tauRefRaw} onChange={setTauRef} min={0.000001} max={1e9} step="any" />
        <ValidatedNumberInput label="Scaling Exponent a" value={expRaw} onChange={setExp} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Your Pulse Duration (ns)" value={tauRaw} onChange={setTau} min={0.000001} max={1e9} step="any" />
        <ValidatedNumberInput label="Pulse Energy (J)" value={energyRaw} onChange={setEnergy} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Beam Diameter, 1/e² (mm)" value={diamRaw} onChange={setDiam} min={0.001} max={10000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card label="LIDT at Your Pulse" value={show(fTh, () => `${(fTh / J_CM2).toPrecision(4)} J/cm²`)}
          sub={`F_ref (τ/τ_ref)^${exponent}`} tone="text-blue-400" />
        <Card label="Peak Fluence" value={show(fPeak, () => `${(fPeak / J_CM2).toPrecision(4)} J/cm²`)}
          sub={show(fPeak, () => `2E/(πw²); mean over πw² ${(fPeak / 2 / J_CM2).toPrecision(4)} J/cm²`)} tone="text-yellow-400" />
        <Card label="Threshold / Peak" value={show(margin, () => (margin === Infinity ? "∞" : `${margin.toPrecision(3)}×`))}
          sub={margin >= 1 ? "below the rated threshold" : "at or above the rated threshold: damage likely"}
          tone={margin >= 1 ? "text-green-400" : "text-red-400"} />
        <Card label="Energy at Threshold" value={show(eMax, () => (eMax >= 1 ? `${eMax.toPrecision(4)} J` : `${(eMax * 1000).toPrecision(4)} mJ`))}
          sub="πw²F_th/2 for this beam" tone="text-gray-200" />
      </div>
      {outsideScaling && (
        <p role="alert" className="mb-8 rounded-lg border border-yellow-700 bg-yellow-950 p-3 text-sm text-yellow-200">
          A pulse duration is below 20 ps, where damage is driven by multiphoton and avalanche ionisation and the
          threshold depends on τ more weakly than √τ: the scaled value is not reliable there.
        </p>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 my-8">
        <SimpleLineChart title="Damage threshold against pulse duration" xLabel="Pulse Duration (ns)" yLabel="Fluence (J/cm²)"
          series={series} xScale="log" yScale="log" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>F_th(τ) = F_ref (τ/τ_ref)^a, a = ½ for τ ≳ 20 ps</p>
          <p>F_peak = 2E/(πw²), w the 1/e² radius</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          The √τ law comes from heat diffusion during the pulse and was measured for fused silica and CaF₂ above
          about 20 ps (Stuart et al. 1996). Real optics scatter around it, as defects set the threshold. A Gaussian
          beam&apos;s peak fluence is twice the mean over πw² (the ISO 21254 effective area πw²/2), so compare it, not
          E/(πw²), with the rated value. Wavelength, spot size and repetition rate also change the threshold and
          are not modelled; continuous-wave ratings (W/cm) are a different quantity.
        </p>
      </div>
    </>
  );
}
