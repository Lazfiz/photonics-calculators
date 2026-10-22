"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { DOPANT_PRESETS, SILICA_DENSITY, ionDensityFromWtPpm } from "../../../physics/fiber-optics/doped-fiber-gain";
import { DOPANT_LINES, dopantAbsorption, type DopantLine } from "../../../physics/materials/dopant-absorption";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const SIGMA_UNIT = 1e-25; // m², the unit of the cross-section input
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const COLORS = ["#60a5fa", "#f87171", "#34d399"];
const lineLabel = (l: DopantLine) => `${l.ion} ${Math.round(l.lambda * 1e9)} nm (${l.role})`;

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

// Transmission against path length for every line of one ion, the selected line with the entered σ_a.
function transmissionSeries(line: DopantLine, sigmaA: number, N: number, overlap: number, length: number) {
  return DOPANT_LINES.filter((l) => l.ion === line.ion).map((l, i) => ({
    name: lineLabel(l) + (l.id === line.id ? ", entered σ_a" : ""),
    color: COLORS[i % COLORS.length],
    points: Array.from({ length: 101 }, (_, k) => {
      const z = (length * k) / 100;
      const t = dopantAbsorption(l.id === line.id ? sigmaA : l.sigmaA, N, z, overlap).transmission;
      return { x: Number(z.toPrecision(6)), y: Number.isFinite(t) ? Math.round(t * 1e8) / 1e6 : null };
    }),
  }));
}

export default function RareEarthAbsorptionPage() {
  const [lineId, setLineId] = useURLState("line", "Yb976");
  const [sigmaRaw, setSigma] = useURLState("sigmaA", 0); // 1e-25 m²; 0 = the line's preset
  const [ppmRaw, setPpm] = useURLState("dopantConcentration", 1000); // wt-ppm of the ion in silica
  const [overlapRaw, setOverlap] = useURLState("overlap", 1);
  const [lengthRaw, setLength] = useURLState("length", 0.1); // m

  const line = DOPANT_LINES.find((l) => l.id === lineId) ?? DOPANT_LINES[3];
  const ion = DOPANT_PRESETS.find((p) => p.id === line.ion) ?? DOPANT_PRESETS[0];
  const presetSigma = line.sigmaA / SIGMA_UNIT;
  const sigmaInput = sigmaRaw > 0 ? sigmaRaw : presetSigma;
  const sigmaA = clamp(sigmaInput, 1e-3, 1000, presetSigma) * SIGMA_UNIT;
  const ppm = clamp(ppmRaw, 0, 50000, 1000);
  const overlap = clamp(overlapRaw, 0, 1, 1);
  const length = clamp(lengthRaw, 1e-4, 1000, 0.1);

  const N = ionDensityFromWtPpm(ppm, ion.molarMass);
  const r = dopantAbsorption(sigmaA, N, length, overlap);
  const series = transmissionSeries(line, sigmaA, N, overlap, length);

  return (
    <>
      <div className="mb-6">
        <label htmlFor="line" className="block text-sm font-medium mb-2">Dopant and wavelength</label>
        <select id="line" value={line.id} onChange={(e) => { setLineId(e.target.value); setSigma(0); }}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          {DOPANT_LINES.map((l) => <option key={l.id} value={l.id}>{lineLabel(l)}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          {ion.name} in {ion.host} glass, M = {(ion.molarMass * 1e3).toFixed(2)} g/mol, silica density{" "}
          {SILICA_DENSITY} kg/m³. Choosing a line fills its typical cross-section; it varies with the host glass by
          tens of percent, so enter your sample&apos;s own value where you have it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Absorption Cross-Section σ_a (×10⁻²⁵ m²)" value={sigmaInput} onChange={setSigma} min={0.001} max={1000} step="any" />
        <ValidatedNumberInput label={`${ion.id} Concentration (wt-ppm)`} value={ppmRaw} onChange={setPpm} min={0} max={50000} step="any" />
        <ValidatedNumberInput label="Overlap Γ (1 = bulk sample)" value={overlapRaw} onChange={setOverlap} min={0} max={1} step="any" />
        <ValidatedNumberInput label="Path Length (m)" value={lengthRaw} onChange={setLength} min={0.0001} max={1000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card label="Ion Density N" value={show(N, () => `${N.toExponential(3)} m⁻³`)} sub={`${ppm} wt-ppm`} tone="text-gray-200" />
        <Card label="Absorption Coefficient α" value={show(r.alpha, () => `${r.alpha.toPrecision(4)} m⁻¹`)}
          sub={show(r.alpha, () => `${(r.alpha / 100).toPrecision(4)} cm⁻¹`)} tone="text-yellow-400" />
        <Card label="Absorption" value={show(r.dbPerM, () => `${r.dbPerM.toPrecision(4)} dB/m`)} sub="10·log₁₀(e)·α" tone="text-yellow-400" />
        <Card label="Absorption Length 1/α" value={show(r.absorptionLength, () => `${r.absorptionLength.toPrecision(4)} m`)}
          sub={r.alpha === 0 ? "no absorption at zero concentration or overlap" : "path for a 1/e (4.34 dB) drop"} tone="text-gray-200" />
        <Card label="Loss over the Path" value={show(r.lossDb, () => `${r.lossDb.toPrecision(4)} dB`)} sub={`${length} m`} tone="text-red-400" />
        <Card label="Transmitted" value={show(r.transmission, () => `${(r.transmission * 100).toPrecision(4)} %`)}
          sub="e^(−αL), unpumped; no surface reflections" tone="text-green-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
        <SimpleLineChart title={`${ion.name}: transmission against path length`} xLabel="Path Length (m)" yLabel="Transmitted (%)" series={series} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Preset Cross-Sections</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="text-left py-1">Line</th><th className="text-right py-1">σ_a (×10⁻²⁵ m²)</th>
              <th className="text-right py-1">σ_e (×10⁻²⁵ m²)</th><th className="text-left py-1 pl-4">Host</th>
            </tr>
          </thead>
          <tbody>
            {DOPANT_LINES.map((l) => (
              <tr key={l.id} className="border-b border-gray-800/50">
                <td className="py-1">{lineLabel(l)}</td>
                <td className="text-right py-1">{Number((l.sigmaA / SIGMA_UNIT).toPrecision(3))}</td>
                <td className="text-right py-1">{Number((l.sigmaE / SIGMA_UNIT).toPrecision(3))}</td>
                <td className="py-1 pl-4">{DOPANT_PRESETS.find((p) => p.id === l.ion)?.host}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>N = ppm·10⁻⁶·ρ·N_A/M</p>
          <p>α = Γσ_a N; α(dB/m) = 4.343·α</p>
          <p>T = e^(−αL)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Small-signal absorption of an unpumped sample: every ion in the ground state. A strong pump bleaches the
          absorption, and Er at 1550 nm turns into gain once inverted; the Rare-Earth-Doped Fiber Amplifier page models
          that. Nd, Tm and Ho are not offered: their cross-sections need their own sourced data.
        </p>
      </div>
    </>
  );
}
