"use client";

import { useMemo } from "react";
import ChartPanel from "../../../components/chart-panel";
import { crystalNote } from "../../../components/crystal-select";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { CRYSTAL_IDS, UNIAXIAL_CRYSTALS, crystalIndices, crystalRange, type CrystalId } from "../../../physics/materials/uniaxial-data";

const DEFAULT_CRYSTAL: CrystalId = "quartz";
const WAVELENGTH_MIN_NM = 150;
const WAVELENGTH_MAX_NM = 7000;
const THICKNESS_MIN_MM = 0.001;
const THICKNESS_MAX_MM = 100;
const CHART_MIN_NM = 200;
const CHART_MAX_NM = 2500;
const CHART_POINTS = 160;
const CHART_COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#a3e635"];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const fmt = (x: number, digits: number) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const shortName = (id: CrystalId) => UNIAXIAL_CRYSTALS[id].name.replace(/ \(.*\)$/, "");

/** Wavelength grid (nm) over the crystal's fit range, inside the chart window. */
function grid(id: CrystalId, minNm = CHART_MIN_NM, maxNm = CHART_MAX_NM) {
  const [lo, hi] = crystalRange(id).map((x) => x * 1e9);
  const a = Math.max(lo, minNm);
  const b = Math.min(hi, maxNm);
  return Array.from({ length: CHART_POINTS + 1 }, (_, k) => a + (k * (b - a)) / CHART_POINTS);
}

function indexChart(id: CrystalId, lambdaNm: number, no: number, ne: number) {
  const nm = grid(id, 0, Infinity);
  const v = nm.map((x) => crystalIndices(id, x * 1e-9));
  const traces = [
    { x: nm.map(round6), y: v.map((p) => round6(p.no)), type: "scatter", mode: "lines", name: "nₒ", line: { color: "#60a5fa", width: 2 } },
    { x: nm.map(round6), y: v.map((p) => round6(p.ne)), type: "scatter", mode: "lines", name: "nₑ", line: { color: "#f87171", width: 2 } },
  ];
  if (!Number.isFinite(no)) return traces;
  return [
    ...traces,
    { x: [round6(lambdaNm), round6(lambdaNm)], y: [round6(no), round6(ne)], type: "scatter", mode: "markers", name: "at λ",
      line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 8 } },
  ];
}

function birefringenceChart(selected: CrystalId) {
  return CRYSTAL_IDS.map((id, i) => {
    const nm = grid(id);
    return {
      x: nm.map(round6),
      y: nm.map((x) => { const v = crystalIndices(id, x * 1e-9); return round6(v.ne - v.no); }),
      type: "scatter", mode: "lines", name: shortName(id),
      line: { color: CHART_COLORS[i % CHART_COLORS.length], width: id === selected ? 3.5 : 1.5 },
    };
  });
}

export default function BirefringentCrystalsPage() {
  const [crystalParam, setCrystal] = useURLState("crystal", DEFAULT_CRYSTAL);
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 589); // nm
  const [thicknessRaw, setThickness] = useURLState("thickness", 1); // mm
  const crystal = (CRYSTAL_IDS as string[]).includes(crystalParam) ? (crystalParam as CrystalId) : DEFAULT_CRYSTAL;
  const wavelength = clamp(wavelengthRaw, WAVELENGTH_MIN_NM, WAVELENGTH_MAX_NM, 589);
  const thickness = clamp(thicknessRaw, THICKNESS_MIN_MM, THICKNESS_MAX_MM, 1);
  const lambda = wavelength * 1e-9;

  const [lo, hi] = crystalRange(crystal);
  const inRange = lambda >= lo && lambda <= hi;
  const { no, ne } = inRange ? crystalIndices(crystal, lambda) : { no: NaN, ne: NaN };
  const dn = ne - no;
  const waves = (Math.abs(dn) * thickness * 1e-3) / lambda;
  const halfWave_um = (lambda / (2 * Math.abs(dn))) * 1e6;
  const note = crystalNote(crystal, lambda);

  const nChart = useMemo(() => indexChart(crystal, wavelength, no, ne), [crystal, wavelength, no, ne]);
  const dnChart = useMemo(() => birefringenceChart(crystal), [crystal]);
  const rows = CRYSTAL_IDS.map((id) => {
    const [a, b] = crystalRange(id);
    const v = lambda >= a && lambda <= b ? crystalIndices(id, lambda) : { no: NaN, ne: NaN };
    return { id, range: `${Math.round(a * 1e9)}–${Math.round(b * 1e9)}`, ...v };
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <label className="block">
          <span className="block text-sm text-gray-400 mb-1">Crystal</span>
          <select value={crystal} onChange={(e) => setCrystal(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white">
            {CRYSTAL_IDS.map((id) => <option key={id} value={id}>{UNIAXIAL_CRYSTALS[id].name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Wavelength (nm)" value={wavelengthRaw} onChange={setWavelength} min={WAVELENGTH_MIN_NM} max={WAVELENGTH_MAX_NM} step="1" />
        <ValidatedNumberInput label="Plate thickness (mm)" value={thicknessRaw} onChange={setThickness} min={THICKNESS_MIN_MM} max={THICKNESS_MAX_MM} step="0.1" />
      </div>
      <p className={`text-xs mb-6 ${note.warn ? "text-yellow-400" : "text-gray-500"}`}>{note.text}</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="nₒ (ordinary)" value={fmt(no, 5)} tone="blue" />
        <ResultCard label="nₑ (extraordinary)" value={fmt(ne, 5)} tone="red" />
        <ResultCard label="Δn = nₑ − nₒ" value={fmt(dn, 5)} tone="green"
          subtext={Number.isFinite(dn) ? (dn > 0 ? "positive uniaxial" : "negative uniaxial") : "outside the fit range"} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label={`Retardance of ${thickness} mm`} value={Number.isFinite(waves) ? `${waves.toFixed(3)} waves` : "—"} tone="orange"
          subtext={Number.isFinite(waves) ? `${(360 * (waves % 1)).toFixed(1)}° modulo one wave; optic axis in the plate face, normal incidence` : undefined} />
        <ResultCard label="Zero-order half-wave thickness" value={Number.isFinite(halfWave_um) ? `${halfWave_um.toFixed(2)} µm` : "—"} tone="purple"
          subtext="λ/(2|Δn|); a quarter-wave plate is half as thick" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">{shortName(crystal)}: nₒ and nₑ</h3>
          <ChartPanel data={nChart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Refractive index", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 60 }, height: 340,
          }} />
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Birefringence Δn, all crystals</h3>
          <ChartPanel data={dnChart} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Δn = nₑ − nₒ", gridcolor: "#374151" },
            margin: { t: 20, r: 20, b: 50, l: 60 }, height: 340,
          }} />
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3">All crystals at {wavelength} nm</h3>
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr><th className="text-left pr-4">Crystal</th><th className="text-right pr-4">nₒ</th><th className="text-right pr-4">nₑ</th><th className="text-right pr-4">Δn</th><th className="text-right">Fit range (nm)</th></tr>
          </thead>
          <tbody className="font-mono">
            {rows.map((r) => (
              <tr key={r.id} className={r.id === crystal ? "text-white" : "text-gray-300"}>
                <td className="pr-4 font-sans">{UNIAXIAL_CRYSTALS[r.id].name}</td>
                <td className="text-right pr-4">{fmt(r.no, 4)}</td>
                <td className="text-right pr-4">{fmt(r.ne, 4)}</td>
                <td className="text-right pr-4">{fmt(r.ne - r.no, 4)}</td>
                <td className="text-right">{r.range}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">&ldquo;—&rdquo;: the wavelength is outside that crystal&apos;s fit range.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Model</h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p className="font-mono">Δn = nₑ − nₒ,  retardance = |Δn|·d/λ waves,  d(λ/2) = λ/(2|Δn|)</p>
          <p>
            nₒ(λ) and nₑ(λ) come from each crystal&apos;s published Sellmeier formula (the same data sets as the polarization
            calculators), only inside the wavelength range it was fitted over and at the temperature of its measurements.
            Δn &gt; 0 marks a positive uniaxial crystal (quartz, MgF₂, YVO₄, rutile), Δn &lt; 0 a negative one. The retardance is
            for light at normal incidence on a plate whose optic axis lies in its face; off-axis cuts and tilted beams are on
            the Waveplate and Birefringent Polarizer calculators.
          </p>
        </div>
      </div>
    </>
  );
}
