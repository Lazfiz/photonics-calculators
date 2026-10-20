"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { groupIndex, inRange, refractiveIndex, type SellmeierModel } from "../../../physics/materials/sellmeier";
import { MATERIALS, SCHOTT_GLASSES } from "../../../physics/materials/sellmeier-data";
import { slabPath } from "../../../physics/spectroscopy/optical-path-length";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtTime = (t: number) =>
  !Number.isFinite(t) ? "—" : t >= 1e-6 ? `${fmt(t * 1e6)} µs` : t >= 1e-9 ? `${fmt(t * 1e9)} ns` : `${fmt(t * 1e12)} ps`;
const DEG = Math.PI / 180;

const GLASSES: Record<string, { name: string; model: SellmeierModel }> = {
  fusedSilica: MATERIALS.fusedSilica,
  "N-BK7": SCHOTT_GLASSES["N-BK7"],
  "N-SF11": SCHOTT_GLASSES["N-SF11"],
  caf2: MATERIALS.caf2,
};

export default function OpticalPathLengthPage() {
  const [materialRaw, setMaterial] = useURLState("material", "custom");
  const [lengthRaw, setPhysicalLength] = useURLState("physicalLength", 1); // cm
  const [nRaw, setRefractiveIndex] = useURLState("refractiveIndex", 1.5);
  const [ngRaw, setGroupIndex] = useURLState("groupIndex", 1.5);
  const [wlRaw, setWavelength] = useURLState("wavelength", 800); // nm
  const [passesRaw, setNumPasses] = useURLState("numPasses", 1);
  const [angleRaw, setAngleDeg] = useURLState("angleDeg", 0);

  const glass = GLASSES[materialRaw] ?? null;
  const material = glass ? materialRaw : "custom";
  const dCm = clamp(lengthRaw, 0, 1e5, 1);
  const lambda = clamp(wlRaw, 100, 20000, 800) * 1e-9;
  const passes = Math.round(clamp(passesRaw, 1, 1000, 1));
  const thetaDeg = clamp(angleRaw, 0, 89, 0);
  const theta = thetaDeg * DEG;
  const glassOk = glass ? inRange(glass.model, lambda) : true;
  const n = glass ? (glassOk ? refractiveIndex(glass.model, lambda) : NaN) : clamp(nRaw, 1, 5, 1.5);
  const ng = glass ? (glassOk ? groupIndex(glass.model, lambda) : NaN) : clamp(ngRaw, 1, 5, 1.5);

  const p = slabPath(dCm / 100, n, ng, passes, theta);
  const waves = p.opl / lambda;

  const vsAngle = (() => {
    const as = Array.from({ length: 90 }, (_, i) => i);
    const ps = as.map((a) => slabPath(dCm / 100, n, ng, passes, a * DEG));
    return [
      { x: as, y: ps.map((q) => r6(q.opl * 100)), type: "scatter", mode: "lines", name: "OPL (cm)", line: { color: "#60a5fa", width: 2 } },
      { x: as, y: ps.map((q) => r6(q.groupDelay * 1e9)), type: "scatter", mode: "lines", name: "Group delay (ns)", line: { color: "#f472b6", width: 2 }, yaxis: "y2" },
    ];
  })();

  const dispersion = (() => {
    if (!glass) return [];
    const [lo, hi] = glass.model.range;
    const ls = Array.from({ length: 201 }, (_, i) => lo + (i / 200) * (hi - lo));
    return [
      { x: ls.map((l) => r6(l * 1e9)), y: ls.map((l) => r6(refractiveIndex(glass.model, l))), type: "scatter", mode: "lines", name: "Phase index n", line: { color: "#34d399", width: 2 } },
      { x: ls.map((l) => r6(l * 1e9)), y: ls.map((l) => r6(groupIndex(glass.model, l))), type: "scatter", mode: "lines", name: "Group index n_g", line: { color: "#fbbf24", width: 2 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Medium</span>
          <select value={material} onChange={(e) => setMaterial(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="custom">Custom n and n_g</option>
            {Object.entries(GLASSES).map(([id, g]) => <option key={id} value={id}>{g.name}</option>)}
          </select>
        </label>
        <ValidatedNumberInput label="Vacuum Wavelength λ (nm)" value={wlRaw} onChange={setWavelength} min={100} max={20000} step="10" />
        {!glass && <>
          <ValidatedNumberInput label="Phase Index n" value={nRaw} onChange={setRefractiveIndex} min={1} max={5} step="0.01" />
          <ValidatedNumberInput label="Group Index n_g" value={ngRaw} onChange={setGroupIndex} min={1} max={5} step="0.01" />
        </>}
        <ValidatedNumberInput label="Slab Thickness d (cm)" value={lengthRaw} onChange={setPhysicalLength} min={0} max={1e5} />
        <ValidatedNumberInput label="Number of Passes N" value={passesRaw} onChange={setNumPasses} min={1} max={1000} step="1" />
        <ValidatedNumberInput label="Angle of Incidence in Air (°)" value={angleRaw} onChange={setAngleDeg} min={0} max={89} />
      </div>

      {glass && !glassOk && (
        <p className="mb-6 text-sm text-yellow-400">
          {fmt(lambda * 1e9)} nm is outside the {glass.name} formula range ({fmt(glass.model.range[0] * 1e9)}–{fmt(glass.model.range[1] * 1e9)} nm).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Optical Path Length nL" value={`${fmt(p.opl * 100)} cm`} tone="blue" subtext={`${fmt(waves, 6)} waves at λ; geometric path L = ${fmt(p.geometric * 100)} cm`} />
        <ResultCard label="Phase Delay OPL/c" value={fmtTime(p.phaseDelay)} tone="green" subtext={`n = ${fmt(n, 6)}; internal angle θ_t = ${fmt(p.thetaT / DEG)}°`} />
        <ResultCard label="Group Delay n_g L/c" value={fmtTime(p.groupDelay)} tone="purple" subtext={`n_g = ${fmt(ng, 6)}: the transit time of a pulse`} />
        <ResultCard label="Extra Delay vs Vacuum" value={fmtTime(p.extraGroupDelay)} tone="yellow" subtext={`(n_g − 1)L/c; OPD vs vacuum (n − 1)L = ${fmt(p.opdVacuum * 100)} cm`} />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>sin θ = n sin θ_t,  L = N d / cos θ_t,  OPL = nL,  τ_φ = OPL/c,  τ_g = n_g L/c,  n_g = n − λ dn/dλ</p>
        <p className="text-gray-400">The ray path inside a plane-parallel slab entered from air; reflections between the faces are ignored. The phase index sets fringe counts and interference; the group index sets when a pulse arrives.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartPanel data={vsAngle} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "OPL and Group Delay vs Angle", font: { size: 13 } },
          xaxis: { title: "Angle of incidence (°)", gridcolor: "#374151" },
          yaxis: { title: "OPL (cm)", gridcolor: "#374151" },
          yaxis2: { title: "Group delay (ns)", gridcolor: "#374151", overlaying: "y", side: "right" },
          margin: { t: 40, r: 70, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
        {glass && (
          <ChartPanel data={dispersion} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            title: { text: `${glass.name}: Phase and Group Index`, font: { size: 13 } },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "Index", gridcolor: "#374151" },
            margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
          }} />
        )}
      </div>
    </>
  );
}
