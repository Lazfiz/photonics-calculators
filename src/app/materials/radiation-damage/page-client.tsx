"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { doseForLoss, inducedAttenuation, internalTransmission } from "../../../physics/materials/radiation-induced-loss";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const CHART_DOSE = Array.from({ length: 81 }, (_, i) => 10 ** (-1 + i * 0.1)); // 0.1 Gy to 10 MGy
const gy = (d: number) => (d >= 1e6 ? `${(d / 1e6).toPrecision(3)} MGy` : d >= 1e3 ? `${(d / 1e3).toPrecision(3)} kGy` : `${d.toPrecision(3)} Gy`);

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function RadiationDamagePage() {
  const [a1Raw, setA1] = useURLState("a1", 0.1); // dB/m at 1 Gy
  const [fRaw, setF] = useURLState("exponent", 0.5);
  const [doseRaw, setDose] = useURLState("dose", 1000); // Gy
  const [lengthRaw, setLength] = useURLState("length", 10); // mm
  const [budgetRaw, setBudget] = useURLState("lossBudget", 1); // dB

  const a1 = clamp(a1Raw, 0, 1e6, 0.1);
  const f = clamp(fRaw, 0.01, 1, 0.5);
  const dose = clamp(doseRaw, 0, 1e8, 1000);
  const length = clamp(lengthRaw, 1e-3, 1e7, 10) * 1e-3;
  const budget = clamp(budgetRaw, 0, 1000, 1);

  const A = inducedAttenuation(a1, f, dose);
  const lossDb = A * length;
  const T = internalTransmission(A, length);
  const doseAtBudget = doseForLoss(a1, f, length, budget);

  const series = [
    { name: "Internal transmission", color: "#3b82f6", points: CHART_DOSE.map((d) => ({ x: d, y: Number((internalTransmission(inducedAttenuation(a1, f, d), length) * 100).toFixed(6)) })) },
    ...(dose > 0 ? [{ name: "Your dose", color: "#f59e0b", showPoints: true, points: [{ x: dose, y: Number((T * 100).toFixed(6)) }] }] : []),
  ];

  return (
    <>
      <p className="text-sm text-gray-400 mb-4">
        Enter A₁ and f fitted to measured induced loss for your glass or fibre at your wavelength, dose rate and
        temperature. The defaults are an example, not a material value.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Induced Loss at 1 Gy, A₁ (dB/m)" value={a1Raw} onChange={setA1} min={0} max={1e6} step="any" />
        <ValidatedNumberInput label="Dose Exponent f" value={fRaw} onChange={setF} min={0.01} max={1} step="any" />
        <ValidatedNumberInput label="Total Dose (Gy)" value={doseRaw} onChange={setDose} min={0} max={1e8} step="any" />
        <ValidatedNumberInput label="Path Length (mm)" value={lengthRaw} onChange={setLength} min={0.001} max={1e7} step="any" />
        <ValidatedNumberInput label="Loss Budget (dB)" value={budgetRaw} onChange={setBudget} min={0} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card label="Induced Attenuation" value={show(A, () => `${A.toPrecision(4)} dB/m`)}
          sub={show(A, () => `A₁D^f; ${(A * Math.LN10 / 10).toPrecision(4)} m⁻¹ (natural log)`)} tone="text-blue-400" />
        <Card label="Induced Loss over the Path" value={show(lossDb, () => `${lossDb.toPrecision(4)} dB`)}
          sub={`${gy(dose)} = ${(dose * 100).toPrecision(3)} rad`} tone="text-red-400" />
        <Card label="Internal Transmission" value={show(T, () => `${(T * 100).toPrecision(4)} %`)}
          sub="10^(−loss/10), induced loss only" tone="text-green-400" />
        <Card label="Dose at the Loss Budget" value={show(doseAtBudget, () => gy(doseAtBudget))}
          sub={`(budget/(A₁L))^(1/f) for ${budget} dB`} tone="text-yellow-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <SimpleLineChart title="Internal transmission against dose" xLabel="Dose (Gy)" yLabel="Transmission (%)" series={series} xScale="log" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>A(D) = A₁ D^f, 0 &lt; f ≤ 1</p>
          <p>loss = A L; T_int = 10^(−A L/10)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Illustrative: a power law describes many measured growth curves of radiation-induced loss at one dose
          rate, temperature and wavelength, with f below 1 as the colour centres saturate (Griscom, Gingerich and
          Friebele 1994). A₁ varies by orders of magnitude between glasses and fibres, so no material presets
          are given. Recovery after the exposure, dose-rate and temperature effects, and refractive-index changes
          are not modelled.
        </p>
      </div>
    </>
  );
}
