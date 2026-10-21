"use client";

import ChartPanel from "../../../components/chart-panel";
import { crystalNote } from "../../../components/crystal-select";
import ResultCard from "../../../components/result-card";
import TransmissionBands from "../../../components/transmission-bands";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CRYSTAL_SHEETS, quartzRotatoryPower, type AxisPair } from "../../../physics/materials/crystal-properties";
import { crystalIndices, crystalRange } from "../../../physics/materials/uniaxial-data";
import { extraordinaryIndex, maxWalkoff, walkoffAngle } from "../../../physics/polarization/uniaxial";

const IDS = ["calcite", "quartz", "sapphire"] as const;
type Id = (typeof IDS)[number];
const LABELS: Record<Id, string> = { calcite: "Calcite (CaCO₃)", quartz: "Crystal quartz (SiO₂)", sapphire: "Sapphire (Al₂O₃)" };
const DEFAULT_CRYSTAL: Id = "calcite";
const WAVELENGTH_MIN_NM = 150;
const WAVELENGTH_MAX_NM = 5500;
const THICKNESS_MIN_MM = 0.01;
const THICKNESS_MAX_MM = 100;
const CHART_POINTS = 160;
const DEG = Math.PI / 180;

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const layout = (x: string, y: string) => ({
  paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
  xaxis: { title: x, gridcolor: "#374151" }, yaxis: { title: y, gridcolor: "#374151" },
  margin: { t: 20, r: 20, b: 50, l: 60 }, height: 320,
});

/** "a ∥, b ⊥" in the given scale, or one value when both are equal. */
function pair(p: AxisPair, scale: number, unit: string) {
  const v = (x: number) => String(+(x * scale).toPrecision(4));
  return p.para === p.perp ? `${v(p.para)} ${unit}` : `${v(p.para)} ∥ c, ${v(p.perp)} ⊥ c ${unit}`;
}

function nmGrid(lo_nm: number, hi_nm: number) {
  return Array.from({ length: CHART_POINTS + 1 }, (_, k) => lo_nm + (k * (hi_nm - lo_nm)) / CHART_POINTS);
}

function indexChart(id: Id) {
  const [lo, hi] = crystalRange(id).map((x) => x * 1e9);
  const nm = nmGrid(lo, hi);
  const v = nm.map((x) => crystalIndices(id, x * 1e-9));
  return [
    { x: nm.map(round6), y: v.map((p) => round6(p.no)), type: "scatter", mode: "lines", name: "nₒ", line: { color: "#60a5fa", width: 2 } },
    { x: nm.map(round6), y: v.map((p) => round6(p.ne)), type: "scatter", mode: "lines", name: "nₑ", line: { color: "#f87171", width: 2 } },
  ];
}

function walkoffChart(no: number, ne: number, angle: number, rho: number) {
  const deg = Array.from({ length: 91 }, (_, k) => k);
  return [
    { x: deg, y: deg.map((t) => round6(walkoffAngle(no, ne, t * DEG) / DEG)), type: "scatter", mode: "lines", name: "ρ(θ)", line: { color: "#fbbf24", width: 2 } },
    { x: [round6(angle)], y: [round6(rho / DEG)], type: "scatter", mode: "markers", name: "θ", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } },
  ];
}

function rotationChart(lambdaNm: number, rotation: number) {
  const [lo, hi] = crystalRange("quartz").map((x) => x * 1e9);
  const nm = nmGrid(Math.max(lo, 230), hi);
  const traces = [{ x: nm.map(round6), y: nm.map((x) => round6(quartzRotatoryPower(x * 1e-9) / DEG / 1e3)), type: "scatter", mode: "lines", name: "ρ(λ)", line: { color: "#a78bfa", width: 2 } }];
  if (!Number.isFinite(rotation)) return traces;
  return [...traces, { x: [round6(lambdaNm)], y: [round6(rotation)], type: "scatter", mode: "markers", name: "λ", line: { color: "#f87171" }, marker: { color: "#f87171", size: 9 } }];
}

export default function CrystalPropertiesPage() {
  const [crystalParam, setCrystal] = useURLState("crystal", DEFAULT_CRYSTAL);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 589); // nm
  const [angleRaw, setAngle] = useURLState("angle", 45); // degrees from the optic axis
  const [thicknessRaw, setThickness] = useURLState("thickness", 10); // mm
  const crystal = (IDS as readonly string[]).includes(crystalParam) ? (crystalParam as Id) : DEFAULT_CRYSTAL;
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 589);
  const angle = clamp(angleRaw, 0, 90, 45);
  const thickness = clamp(thicknessRaw, THICKNESS_MIN_MM, THICKNESS_MAX_MM, 10);
  const lambda = wavelength * 1e-9;
  const sheet = CRYSTAL_SHEETS[crystal];

  const [lo, hi] = crystalRange(crystal);
  const inRange = lambda >= lo && lambda <= hi;
  const { no, ne } = inRange ? crystalIndices(crystal, lambda) : { no: NaN, ne: NaN };
  const nTheta = extraordinaryIndex(no, ne, angle * DEG);
  const rho = walkoffAngle(no, ne, angle * DEG);
  const peak = maxWalkoff(no, ne);
  const displacement = thickness * Math.tan(Math.abs(rho));
  const rotation = crystal === "quartz" && inRange ? quartzRotatoryPower(lambda) / DEG / 1e3 : NaN; // °/mm
  const note = crystalNote(crystal, lambda);

  const nChart = indexChart(crystal);
  const wChart = Number.isFinite(no) ? walkoffChart(no, ne, angle, rho) : [];
  const rChart = crystal === "quartz" ? rotationChart(wavelength, rotation) : [];
  const bandRows = IDS.map((id) => ({
    key: id, name: LABELS[id].split(" (")[0], selected: id === crystal,
    bands: CRYSTAL_SHEETS[id].bands.map(([a, b]) => [a * 1e6, b * 1e6] as const),
  }));

  const properties: [string, string][] = [
    ["Transmission", sheet.bands.map(([a, b]) => `${+(a * 1e6).toPrecision(3)}–${+(b * 1e6).toPrecision(3)} µm`).join(", ")],
    ["dn/dT", `${pair(sheet.dnDT, 1e6, "×10⁻⁶/K")} at ${+(sheet.dnDTLambda * 1e9).toPrecision(3)} nm`],
    ["Thermal conductivity", pair(sheet.conductivity, 1, "W/(m·K)")],
    ["Thermal expansion", pair(sheet.expansion, 1e6, "×10⁻⁶/K")],
    ["Knoop hardness", `${sheet.knoop} kg/mm²`],
    ["Young's modulus", pair(sheet.youngs_GPa, 1, "GPa")],
    ["Density", `${sheet.density_g_cm3} g/cm³`],
    ["Specific heat", `${sheet.specificHeat_J_kgK} J/(kg·K)`],
    ["Melting point", `${sheet.meltingPoint_C} °C${"meltingNote" in sheet ? ` (${sheet.meltingNote})` : ""}`],
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-6" role="group" aria-label="Crystal">
        {IDS.map((id) => (
          <button key={id} onClick={() => setCrystal(id)} aria-pressed={crystal === id}
            className={`px-3 py-2 rounded text-sm ${crystal === id ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Wave normal from optic axis θ (°)" value={angleRaw} onChange={setAngle} min={0} max={90} step="0.5" />
        <ValidatedNumberInput label="Crystal length (mm)" value={thicknessRaw} onChange={setThickness} min={THICKNESS_MIN_MM} max={THICKNESS_MAX_MM} step="0.1" />
      </div>
      <p className={`text-xs mb-6 ${note.warn ? "text-yellow-400" : "text-gray-500"}`}>{note.text}</p>

      <div className="grid gap-4 sm:grid-cols-4 mb-4">
        <ResultCard label="nₒ" value={fmt(no, 5)} tone="blue" />
        <ResultCard label="nₑ" value={fmt(ne, 5)} tone="red" />
        <ResultCard label="Δn = nₑ − nₒ" value={fmt(ne - no, 5)} tone="green" />
        <ResultCard label="nₑ(θ)" value={fmt(nTheta, 5)} tone="cyan" subtext="index of the e wave at θ" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="Walk-off angle ρ" value={Number.isFinite(rho) ? `${(Math.abs(rho) / DEG).toFixed(3)}°` : "—"} tone="yellow"
          subtext={!Number.isFinite(rho) ? "outside the fit range" : Math.abs(rho) < 1e-12 ? "none along or across the axis"
            : rho > 0 ? "e ray tilted away from the optic axis" : "e ray tilted toward the optic axis"} />
        <ResultCard label={`o–e separation after ${thickness} mm`} value={Number.isFinite(displacement) ? `${displacement.toFixed(4)} mm` : "—"} tone="orange"
          subtext="L·tan ρ, normal incidence" />
        <ResultCard label="Largest walk-off" value={Number.isFinite(peak.rho) ? `${(Math.abs(peak.rho) / DEG).toFixed(3)}°` : "—"} tone="purple"
          subtext={Number.isFinite(peak.theta) ? `at θ = ${(peak.theta / DEG).toFixed(2)}° = atan(nₑ/nₒ)` : undefined} />
      </div>

      {crystal === "quartz" && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <ResultCard label="Optical rotation along the axis" value={Number.isFinite(rotation) ? `${rotation.toFixed(2)} °/mm` : "—"} tone="purple"
            subtext="Chandrasekhar's fit to Lowry & Coode-Adams' data, 20 °C" />
          <ResultCard label={`Rotation of ${thickness} mm along the axis`} value={Number.isFinite(rotation) ? `${(rotation * thickness).toFixed(1)}°` : "—"} tone="gray"
            subtext="right- or left-handed quartz turns the plane in opposite senses" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Dispersion</h3>
          <ChartPanel data={nChart} layout={layout("Wavelength (nm)", "Refractive index")} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Walk-off at {wavelength} nm</h3>
          {wChart.length ? <ChartPanel data={wChart} layout={layout("θ from the optic axis (°)", "ρ (°), + away from the axis")} />
            : <p className="text-sm text-gray-400">No indices at this wavelength.</p>}
        </div>
        {crystal === "quartz" && (
          <div className="bg-gray-900 rounded-lg p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3">Rotatory dispersion of quartz</h3>
            <ChartPanel data={rChart} layout={layout("Wavelength (nm)", "Rotation (°/mm)")} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">{LABELS[crystal]}: data sheet</h3>
          <table className="w-full text-sm">
            <tbody>
              {properties.map(([k, v]) => (
                <tr key={k}><td className="pr-4 py-1 text-gray-400">{k}</td><td className="py-1 text-gray-200">{v}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 mt-2">Crystran data sheets, room temperature; ∥ and ⊥ are relative to the c (optic) axis as Crystran labels them.</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Transmission bands</h3>
          <TransmissionBands rows={bandRows} markerUm={wavelength / 1000} />
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">1/nₑ(θ)² = cos²θ/nₒ² + sin²θ/nₑ²,  tan ρ = (nₒ² − nₑ²) sin 2θ / (2(nₑ² cos²θ + nₒ² sin²θ))</p>
          <p>
            nₒ and nₑ come from the published Sellmeier fits (Ghosh for calcite and quartz, Malitson &amp; Dodge for sapphire),
            inside their fitted ranges. θ is the angle between the wave normal and the optic axis; ρ is the angle between the
            extraordinary ray (energy flow) and its wave normal (Born &amp; Wolf, ch. 15). For a beam at normal incidence on a
            plate cut at θ the o and e beams leave parallel, separated by L·tan ρ: the principle of a calcite beam displacer.
          </p>
          <p>
            Quartz optical rotation ρ = kλ²/(λ² − λ₀²)², k = 7.186 °·µm²/mm, λ₀ = 0.0926 µm (Chandrasekhar 1952), applies to
            light along the optic axis. It gives 21.75 °/mm at 589.3 nm; Lowry &amp; Coode-Adams measured 21.72. Off the axis the
            linear birefringence soon dominates.
          </p>
        </div>
      </div>
    </>
  );
}
