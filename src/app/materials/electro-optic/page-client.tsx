"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  POCKELS, crossedPolarizerTransmission, longitudinalHalfWaveVoltage, phaseHalfWaveVoltage, pockelsIndexChange,
  transverseHalfWaveVoltage, type PockelsGeometry, type PockelsId,
} from "../../../physics/materials/pockels";

const IDS = ["kdp", "kdp-d", "adp", "linbo3"] as const satisfies readonly PockelsId[];
type Choice = PockelsId | "custom";
const CHOICES: readonly Choice[] = [...IDS, "custom"];
const DEFAULT_ID: Choice = "kdp";
const WAVELENGTH_MIN_NM = 250;
const WAVELENGTH_MAX_NM = 5000;
const VOLTAGE_MAX_V = 50000;
const LENGTH_MIN_MM = 0.1;
const LENGTH_MAX_MM = 100;
const GAP_MIN_UM = 1;
const GAP_MAX_UM = 20000;
const CHART_POINTS = 120;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const sig = (x: number, digits: number) => (Number.isFinite(x) ? String(+x.toPrecision(digits)) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 300,
});
const kV = (V: number) => (Number.isFinite(V) ? (Math.abs(V) >= 1000 ? `${sig(V / 1000, 4)} kV` : `${sig(V, 4)} V`) : "—");
const rangeNm = (id: PockelsId) => POCKELS[id].range.map((x) => Math.round(x * 1e9)).join("–");

interface Modulator {
  geometry: PockelsGeometry;
  /** Index (n_o for longitudinal, n_e for transverse) and coefficient the single-polarization phase uses. */
  n: number;
  r: number;
  /** Retardation half-wave voltage, or NaN when it needs a second coefficient. */
  VpiRet: number;
  VpiPhase: number;
}

function modulator(choice: Choice, lambda: number, d: number, L: number, custom: { n: number; r: number; geometry: PockelsGeometry }): Modulator {
  if (choice === "custom") {
    const { n, r, geometry } = custom;
    const dd = geometry === "longitudinal" ? L : d;
    const VpiRet = geometry === "longitudinal" ? longitudinalHalfWaveVoltage(lambda, n, r) : NaN;
    return { geometry, n, r, VpiRet, VpiPhase: phaseHalfWaveVoltage(lambda, n, r, dd, L) };
  }
  const c = POCKELS[choice];
  const [lo, hi] = c.range;
  const inRange = lambda >= lo * (1 - 1e-9) && lambda <= hi * (1 + 1e-9);
  const { no, ne } = c.indices(lambda);
  if (c.geometry === "longitudinal") {
    const n = inRange ? no : NaN;
    return { geometry: "longitudinal", n, r: c.r.r63!, VpiRet: longitudinalHalfWaveVoltage(lambda, n, c.r.r63!), VpiPhase: phaseHalfWaveVoltage(lambda, n, c.r.r63!, L, L) };
  }
  const n = inRange ? ne : NaN;
  return {
    geometry: "transverse", n, r: c.r.r33!,
    VpiRet: transverseHalfWaveVoltage(lambda, inRange ? no : NaN, n, c.r.r33!, c.r.r13!, d, L),
    VpiPhase: phaseHalfWaveVoltage(lambda, n, c.r.r33!, d, L),
  };
}

function transmissionChart(Vpi: number, V: number) {
  if (!Number.isFinite(Vpi)) return [];
  const xs = Array.from({ length: CHART_POINTS + 1 }, (_, k) => (2 * Vpi * k) / CHART_POINTS);
  const scale = Vpi >= 1000 ? 1000 : 1;
  const traces: Record<string, unknown>[] = [{
    x: xs.map((x) => round6(x / scale)), y: xs.map((x) => round6(crossedPolarizerTransmission((Math.PI * x) / Vpi))),
    type: "scatter", mode: "lines", name: "T = sin²(πV/2V_π)", line: { color: "#60a5fa", width: 2 },
  }];
  if (V <= 2 * Vpi) {
    traces.push({ x: [round6(V / scale)], y: [round6(crossedPolarizerTransmission((Math.PI * V) / Vpi))], type: "scatter", mode: "markers", name: "selected", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } });
  }
  return traces;
}

export default function ElectroOpticPage() {
  const [materialParam, setMaterial] = useURLState("material", DEFAULT_ID as string);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 633); // nm
  const [voltageRaw, setVoltage] = useURLState("voltage", 1000); // V
  const [lengthRaw, setLength] = useURLState("length", 20); // mm
  const [gapRaw, setGap] = useURLState("gap", 1000); // µm, transverse electrode gap
  const [nRaw, setN] = useURLState("n", 2.2);
  const [rRaw, setR] = useURLState("r", 30.8); // pm/V
  const [geometryParam, setGeometry] = useURLState("geometry", "transverse");
  const choice = (CHOICES as readonly string[]).includes(materialParam) ? (materialParam as Choice) : DEFAULT_ID;
  const wavelength_nm = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 633);
  const voltage = clamp(voltageRaw, 0, VOLTAGE_MAX_V, 1000);
  const length_mm = clamp(lengthRaw, LENGTH_MIN_MM, LENGTH_MAX_MM, 20);
  const gap_um = clamp(gapRaw, GAP_MIN_UM, GAP_MAX_UM, 1000);
  const nCustom = clamp(nRaw, 1, 5, 2.2);
  const rCustom_pmV = clamp(rRaw, 0.01, 5000, 30.8);
  const customGeometry: PockelsGeometry = geometryParam === "longitudinal" ? "longitudinal" : "transverse";
  const lambda = wavelength_nm * 1e-9;
  const L = length_mm * 1e-3;
  const d = gap_um * 1e-6;
  const custom = choice === "custom";
  const crystal = custom ? null : POCKELS[choice];

  const m = modulator(choice, lambda, d, L, { n: nCustom, r: rCustom_pmV * 1e-12, geometry: customGeometry });
  const longitudinal = m.geometry === "longitudinal";
  const E = voltage / (longitudinal ? L : d);
  const dn = pockelsIndexChange(m.n, m.r, E);
  const phase = (Math.PI * voltage) / m.VpiPhase;
  const retardation = (Math.PI * voltage) / m.VpiRet;
  const VpiL_Vcm = m.VpiPhase * L * 100;
  const outside = "outside the index model's range";
  const chart = transmissionChart(m.VpiRet, voltage);
  const fixedIndex = choice === "kdp-d" || choice === "adp";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6" role="group" aria-label="Material">
        {CHOICES.map((id) => (
          <button key={id} onClick={() => setMaterial(id)} aria-pressed={choice === id}
            className={`px-3 py-2 rounded text-sm ${choice === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {id === "custom" ? "Custom" : POCKELS[id].name}
          </button>
        ))}
      </div>

      {custom && (
        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <ValidatedNumberInput label="Refractive index n" value={nRaw} onChange={setN} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Coefficient r (pm/V)" value={rRaw} onChange={setR} min={0.01} max={5000} step="0.1" />
          <div>
            <span className="block text-sm text-gray-400 mb-1">Geometry</span>
            <div role="group" aria-label="Geometry" className="flex gap-2">
              {(["longitudinal", "transverse"] as const).map((g) => (
                <button key={g} onClick={() => setGeometry(g)} aria-pressed={customGeometry === g}
                  className={`px-3 py-2 rounded text-sm ${customGeometry === g ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Voltage V (V)" value={voltageRaw} onChange={setVoltage} min={0} max={VOLTAGE_MAX_V} step="10" />
        <ValidatedNumberInput label="Crystal length L (mm)" value={lengthRaw} onChange={setLength} min={LENGTH_MIN_MM} max={LENGTH_MAX_MM} step="0.5" />
        {!longitudinal && (
          <ValidatedNumberInput label="Electrode gap d (µm)" value={gapRaw} onChange={setGap} min={GAP_MIN_UM} max={GAP_MAX_UM} step="1" />
        )}
      </div>
      <p className="text-xs mb-6 text-gray-500">
        {crystal ? `${crystal.pointGroup}, ${crystal.geometry}; ${crystal.source}; index model ${rangeNm(choice as PockelsId)} nm.` : `Custom ${customGeometry} modulator.`}{" "}
        {longitudinal ? "Field and light along z: E = V/L, and V_π does not depend on the crystal size." : "Field along z across the gap d, light across it: E = V/d."}{" "}
        {fixedIndex && <span className="text-yellow-400">n_o is a single published value, without dispersion.</span>}
        {!Number.isFinite(m.n) && <span className="text-yellow-400">The wavelength is {outside}.</span>}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <ResultCard label={longitudinal ? "Half-wave voltage V_π (retardation)" : "Half-wave voltage V_π (z–o retardation)"} value={kV(m.VpiRet)} tone="blue"
          subtext={Number.isFinite(m.VpiRet)
            ? (longitudinal ? "λ/(2n_o³r₆₃): amplitude modulator between crossed polarizers" : "λd/((n_e³r₃₃ − n_o³r₁₃)L), on top of the natural birefringence")
            : (custom ? "needs r₃₃ and r₁₃: use a table crystal" : outside)} />
        <ResultCard label="Phase half-wave voltage (one polarization)" value={kV(m.VpiPhase)} tone="green"
          subtext={Number.isFinite(m.VpiPhase)
            ? (longitudinal ? "λ/(n_o³r₆₃): twice the retardation value" : `λd/(n_e³r₃₃L); V_π·L = ${sig(VpiL_Vcm, 4)} V·cm`)
            : outside} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Field E" value={`${sig(E / 1e6, 4)} MV/m`} tone="gray" subtext={longitudinal ? "V/L" : "V/d"} />
        <ResultCard label="Index change Δn = −½n³rE" value={Number.isFinite(dn) ? dn.toExponential(3) : "—"} tone="orange"
          subtext={Number.isFinite(dn) ? (longitudinal ? "x′ axis; y′ changes by +½n_o³r₆₃E" : "z polarization") : outside} />
        <ResultCard label={Number.isFinite(retardation) ? "Retardation Γ / phase φ" : "Phase shift φ"}
          value={Number.isFinite(retardation) ? `${sig(retardation / Math.PI, 4)}π / ${sig(phase / Math.PI, 4)}π` : (Number.isFinite(phase) ? `${sig(phase / Math.PI, 4)}π` : "—")}
          tone="purple" subtext={Number.isFinite(retardation) ? `crossed polarizers pass ${sig(100 * crossedPolarizerTransmission(retardation), 4)} %` : undefined} />
      </div>

      {chart.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">Amplitude modulator between crossed polarizers</h3>
          <ChartPanel data={chart} layout={layout(m.VpiRet >= 1000 ? "Voltage (kV)" : "Voltage (V)", "Transmission")} />
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">Crystals at {wavelength_nm} nm</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th className="pr-4 py-1">Crystal</th><th className="pr-4 py-1">Geometry</th><th className="pr-4 py-1">r (pm/V)</th>
              <th className="pr-4 py-1">n</th><th className="pr-4 py-1">V_π retardation</th><th className="py-1">Source</th>
            </tr>
          </thead>
          <tbody>
            {IDS.map((id) => {
              const row = modulator(id, lambda, d, L, { n: nCustom, r: rCustom_pmV * 1e-12, geometry: customGeometry });
              const c = POCKELS[id];
              const rText = c.geometry === "longitudinal" ? `r₆₃ ${sig(c.r.r63! * 1e12, 3)}` : `r₃₃ ${sig(c.r.r33! * 1e12, 3)}, r₁₃ ${sig(c.r.r13! * 1e12, 3)}`;
              return (
                <tr key={id} onClick={() => setMaterial(id)} className={`cursor-pointer hover:bg-gray-800 ${id === choice ? "bg-gray-800" : ""}`}>
                  <td className="pr-4 py-1">{c.name}</td>
                  <td className="pr-4 py-1 text-gray-300">{c.geometry}</td>
                  <td className="pr-4 py-1">{rText}</td>
                  <td className="pr-4 py-1">{sig(row.n, 5)}</td>
                  <td className="pr-4 py-1">{kV(row.VpiRet)}</td>
                  <td className="py-1 text-gray-400">{c.source}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Click a row to select the crystal. Transverse rows use the gap and length above.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Δn = −½ n³ r E</p>
          <p>
            Longitudinal KDP-type cell: the field along the optic axis makes the x′ and y′ axes (at 45° to x, y) differ by
            n_o³r₆₃E, so the retardation is Γ = 2πn_o³r₆₃V/λ and V_π = λ/(2n_o³r₆₃). A beam polarized along x′ alone sees
            half that change, so a phase modulator needs twice the voltage.
          </p>
          <p>
            Transverse LiNbO₃ modulator: the field along z across a gap d acts over the length L, so V_π scales as d/L. The
            z-polarized beam uses r₃₃; the z–o retardation uses n_e³r₃₃ − n_o³r₁₃ and adds to the crystal&apos;s natural
            birefringence, which a real modulator compensates.
          </p>
          <p>
            r is taken at its reference wavelength (633 nm for LiNbO₃) and only n follows the Sellmeier fit, so V_π far from
            it is approximate. LiNbO₃&apos;s r₃₃ and r₁₃ are the clamped (high-frequency) values; below the acoustic resonances
            the unclamped ones are a few per cent larger.
          </p>
        </div>
      </div>
    </>
  );
}
