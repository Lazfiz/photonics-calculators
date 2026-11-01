"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  accelerationFactor, cc1246Count, cc1246Obscuration, centreShift, environmentStack, wetIndex, solidIndex,
  type CoatingMaterial, type MixingLaw,
} from "../../../physics/thin-film/environmental-stability";
import { reflectanceSpectrum } from "../../../physics/thin-film/transfer-matrix";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;
const PPM = 1e-6; // the dn/dT and expansion input unit, 1/K
const T0_C = 25; // reference temperature of the entered indices, °C
const KELVIN = 273.15;
const LAWS: { id: MixingLaw; name: string }[] = [
  { id: "linear", name: "Linear (eq. 3)" },
  { id: "bragg-pippard", name: "Bragg–Pippard columns (eq. 4)" },
];
const SIZES_UM = [1, 2, 5, 15, 25, 50, 100, 250, 500, 750, 1000];
const TEMPS_C = Array.from({ length: 51 }, (_, i) => -50 + i * 5);
const HOURS_PER_YEAR = 8766;

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function LawSelect({ id, label, value, onChange }: { id: string; label: string; value: MixingLaw; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-2">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
        {LAWS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
  );
}

function spectrumTraces(h: CoatingMaterial, l: CoatingMaterial, pairs: number, nInc: number, nSub: number, lambda0: number, tempC: number, fillPct: number) {
  const dT = tempC - T0_C, fill = fillPct / 100;
  const conditions = [
    { name: `Dry pores, ${T0_C} °C`, dT: 0, fill: 0, color: "#60a5fa" },
    { name: `Pores ${fillPct} % water-filled`, dT: 0, fill, color: "#34d399" },
    { name: `${tempC} °C, dry`, dT, fill: 0, color: "#fbbf24" },
    { name: `${tempC} °C, ${fillPct} % filled`, dT, fill, color: "#f87171" },
  ];
  // Window 0.6–1.6 λ₀ (501 points), so it follows the design wavelength
  const WLS_NM = Array.from({ length: 501 }, (_, i) => (lambda0 * 1e9) * (0.6 + i * 0.002));
  const lambdas = WLS_NM.map((w) => w * 1e-9);
  return conditions.map((c) => {
    const layers = environmentStack(h, l, pairs, lambda0, c.dT, c.fill);
    const R = reflectanceSpectrum({ incident: nInc, layers, substrate: { n: nSub } }, lambdas);
    return { x: WLS_NM, y: R.map(round6), type: "scatter" as const, mode: "lines" as const, name: c.name, line: { color: c.color, width: 2 } };
  });
}

export default function EnvironmentalStabilityPage() {
  const [nHRaw, setNH] = useURLState("nH", 2.35);
  const [nLRaw, setNL] = useURLState("nL", 1.45);
  const [nSubRaw, setNSub] = useURLState("nSub", 1.52);
  const [nIncRaw, setNInc] = useURLState("nInc", 1.0);
  const [pairsRaw, setPairs] = useURLState("numPairs", 5);
  const [designRaw, setDesign] = useURLState("designWl", 550); // nm
  const [tempRaw, setTemp] = useURLState("tempC", 75);
  const [fillRaw, setFill] = useURLState("fill", 100); // % of pore volume
  const [pHRaw, setPH] = useURLState("pH", 0.85);
  const [pLRaw, setPL] = useURLState("pL", 0.85);
  const [lawHRaw, setLawH] = useURLState("lawH", "linear");
  const [lawLRaw, setLawL] = useURLState("lawL", "linear");
  const [dndtHRaw, setDndtH] = useURLState("dndtH", 20); // 1e-6/K
  const [dndtLRaw, setDndtL] = useURLState("dndtL", 12.9);
  const [cteHRaw, setCteH] = useURLState("cteH", 8); // 1e-6/K
  const [cteLRaw, setCteL] = useURLState("cteL", 0.55);
  const [levelRaw, setLevel] = useURLState("level", 300); // µm
  const [surfRaw, setSurf] = useURLState("surfaces", 2);
  const [tUseRaw, setTUse] = useURLState("tUse", 25); // °C
  const [tTestRaw, setTTest] = useURLState("tTest", 85);
  const [eaRaw, setEa] = useURLState("ea", 0.7); // eV
  const [rhUseRaw, setRhUse] = useURLState("rhUse", 50); // %
  const [rhTestRaw, setRhTest] = useURLState("rhTest", 85);
  const [rhExpRaw, setRhExp] = useURLState("rhExp", 0);
  const [hoursRaw, setHours] = useURLState("testHours", 1000);

  const lawOf = (x: string): MixingLaw => (x === "bragg-pippard" ? "bragg-pippard" : "linear");
  const H: CoatingMaterial = {
    n: clamp(nHRaw, 1, 5, 2.35), p: clamp(pHRaw, 0.5, 1, 0.85), law: lawOf(lawHRaw),
    dnDT: clamp(dndtHRaw, -1000, 1000, 20) * PPM, cte: clamp(cteHRaw, -100, 100, 8) * PPM,
  };
  const L: CoatingMaterial = {
    n: clamp(nLRaw, 1, 5, 1.45), p: clamp(pLRaw, 0.5, 1, 0.85), law: lawOf(lawLRaw),
    dnDT: clamp(dndtLRaw, -1000, 1000, 12.9) * PPM, cte: clamp(cteLRaw, -100, 100, 0.55) * PPM,
  };
  const nSub = clamp(nSubRaw, 1, 5, 1.52);
  const nInc = clamp(nIncRaw, 1, 5, 1);
  const pairs = Math.round(clamp(pairsRaw, 1, 50, 5));
  const design = clamp(designRaw, 200, 2000, 550);
  const lambda0 = design * 1e-9;
  const tempC = clamp(tempRaw, -50, 200, 75);
  const fillPct = clamp(fillRaw, 0, 100, 100);
  const dT = tempC - T0_C;

  const traces = spectrumTraces(H, L, pairs, nInc, nSub, lambda0, tempC, fillPct);
  const shiftWet = centreShift(H, L, lambda0, 0, fillPct / 100) * 1e9;
  const shiftHot = centreShift(H, L, lambda0, dT, 0) * 1e9;
  const shiftBoth = centreShift(H, L, lambda0, dT, fillPct / 100) * 1e9;
  const wetH = wetIndex(H.n, H.p, fillPct / 100, H.law);
  const wetL = wetIndex(L.n, L.p, fillPct / 100, L.law);
  const solH = solidIndex(H.n, H.p, H.law);
  const solL = solidIndex(L.n, L.p, L.law);
  const braggBad = [
    { name: "H", mat: H, sol: solH },
    { name: "L", mat: L, sol: solL },
  ].filter((x) => x.mat.law === "bragg-pippard" && !Number.isFinite(x.sol));
  const shiftVsT = [0, fillPct / 100].map((f, i) => ({
    x: TEMPS_C, y: TEMPS_C.map((t) => round6(centreShift(H, L, lambda0, t - T0_C, f) * 1e9)),
    type: "scatter" as const, mode: "lines" as const, name: i === 0 ? "Dry pores" : `Pores ${fillPct} % filled`,
    line: { color: i === 0 ? "#fb923c" : "#34d399", width: 2 },
  }));

  const level = clamp(levelRaw, 1, 2000, 300);
  const surfaces = Math.round(clamp(surfRaw, 1, 100, 2));
  const pac = cc1246Obscuration(level);
  const transmitted = (1 - pac) ** surfaces;

  const tUse = clamp(tUseRaw, -60, 300, 25);
  const tTest = clamp(tTestRaw, -60, 300, 85);
  const ea = clamp(eaRaw, 0, 3, 0.7);
  const rhUse = clamp(rhUseRaw, 1, 100, 50);
  const rhTest = clamp(rhTestRaw, 1, 100, 85);
  const rhExp = clamp(rhExpRaw, 0, 10, 0);
  const hours = clamp(hoursRaw, 0, 1e7, 1000);
  const af = accelerationFactor(ea, tUse + KELVIN, tTest + KELVIN, rhUse, rhTest, rhExp);

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Spectral shift: temperature and moisture</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label={<>n<sub>H</sub>, dry (e.g. TiO₂)</>} value={nHRaw} onChange={setNH} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>L</sub>, dry (e.g. SiO₂)</>} value={nLRaw} onChange={setNL} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>substrate</sub></>} value={nSubRaw} onChange={setNSub} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label={<>n<sub>incident</sub></>} value={nIncRaw} onChange={setNInc} min={1} max={5} step="0.01" />
        <ValidatedNumberInput label="Number of pairs (N)" value={pairsRaw} onChange={setPairs} min={1} max={50} />
        <ValidatedNumberInput label="Design λ₀ (nm)" value={designRaw} onChange={setDesign} min={200} max={2000} step="10" />
        <ValidatedNumberInput label={<>Packing density p<sub>H</sub></>} value={pHRaw} onChange={setPH} min={0.5} max={1} step="0.01" />
        <ValidatedNumberInput label={<>Packing density p<sub>L</sub></>} value={pLRaw} onChange={setPL} min={0.5} max={1} step="0.01" />
        <LawSelect id="lawH" label="H layer mixing law" value={H.law} onChange={setLawH} />
        <LawSelect id="lawL" label="L layer mixing law" value={L.law} onChange={setLawL} />
        <ValidatedNumberInput label="Pore volume filled with water (%)" value={fillRaw} onChange={setFill} min={0} max={100} step="5" />
        <ValidatedNumberInput label="Temperature (°C)" value={tempRaw} onChange={setTemp} min={-50} max={200} step="5" />
        <ValidatedNumberInput label={<>dn<sub>H</sub>/dT (10⁻⁶/K)</>} value={dndtHRaw} onChange={setDndtH} min={-1000} max={1000} step="0.1" />
        <ValidatedNumberInput label={<>dn<sub>L</sub>/dT (10⁻⁶/K)</>} value={dndtLRaw} onChange={setDndtL} min={-1000} max={1000} step="0.1" />
        <ValidatedNumberInput label={<>Expansion α<sub>H</sub> (10⁻⁶/K)</>} value={cteHRaw} onChange={setCteH} min={-100} max={100} step="0.1" />
        <ValidatedNumberInput label={<>Expansion α<sub>L</sub> (10⁻⁶/K)</>} value={cteLRaw} onChange={setCteL} min={-100} max={100} step="0.01" />
      </div>
      <p className="text-xs text-gray-400 mb-6">
        The indices are those of the dry film (empty pores, as in vacuum) at {T0_C} °C, where each layer is a quarter
        wave at λ₀. Packing densities are most often 0.8–0.9 for evaporated films and near 1 for ion-assisted and
        sputtered ones (Macleod 1988). The L defaults are bulk fused silica (Crystran: dn/dT 12.9 × 10⁻⁶/K, α 0.55 ×
        10⁻⁶/K); the H defaults are placeholders, so enter your film&apos;s values. How much of the pore volume fills
        depends on the humidity, the pore sizes and the time since venting.
      </p>

      <p className="text-xs text-gray-400 mb-2">
        Solid-column index: n<sub>s,H</sub> = {show(solH, () => solH.toFixed(4))}, n<sub>s,L</sub> = {show(solL, () => solL.toFixed(4))}
        {" "}(the index of the dense material the pores are mixed into; values far from the bulk material&apos;s index mean the packing density does not fit the film index).
      </p>
      {braggBad.map((x) => (
        <p key={x.name} className="text-sm text-amber-400 mb-2" role="status">
          {x.name} layer: the packing density p = {x.mat.p} is too low for a film index of {x.mat.n} under Bragg–Pippard (it needs n² &lt; (1 + p)/(1 − p)), so there is no solid-column index and the moisture and shift results are blank. Raise p or use the linear law.
        </p>
      ))}
      <div className="grid gap-4 sm:grid-cols-3 mb-6 mt-4">
        <Card label="Band-centre shift, moisture" value={show(shiftWet, () => `${shiftWet.toFixed(2)} nm`)}
          sub={show(wetH + wetL, () => `n_H ${wetH.toFixed(4)}, n_L ${wetL.toFixed(4)} with ${fillPct} % filled`)} tone="text-emerald-400" />
        <Card label={`Band-centre shift, ${tempC} °C`} value={show(shiftHot, () => `${shiftHot.toFixed(3)} nm`)}
          sub={`ΔT = ${dT} K from ${T0_C} °C, dry`} tone="text-amber-400" />
        <Card label="Combined shift" value={show(shiftBoth, () => `${shiftBoth.toFixed(2)} nm`)}
          sub={show(shiftBoth, () => `Δλ/λ₀ = ${(shiftBoth / design * 100).toFixed(3)} %`)} tone="text-red-400" />
      </div>

      <ChartPanel data={traces} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Reflectance of the (HL)ᴺ stack", font: { size: 13 } },
        xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
        yaxis: { title: "Reflectance", gridcolor: "#374151", range: [0, 1.05] },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />
      <div className="h-6" />
      <ChartPanel data={shiftVsT} layout={{
        paper_bgcolor: "#111827", plot_bgcolor: "#111827", font: { color: "#9ca3af" },
        title: { text: "Band-centre shift vs temperature", font: { size: 13 } },
        xaxis: { title: "Temperature (°C)", gridcolor: "#374151" },
        yaxis: { title: "Δλ (nm)", gridcolor: "#374151" },
        margin: { t: 40, b: 40, l: 50, r: 20 }, autosize: true,
        legend: { x: 0.01, y: 0.99, bgcolor: "rgba(0,0,0,0.3)", font: { size: 10 } },
      }} />

      <h2 className="text-xl font-semibold mt-10 mb-4">Particle contamination (IEST-STD-CC1246)</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Cleanliness level (µm)" value={levelRaw} onChange={setLevel} min={1} max={2000} step="25" />
        <ValidatedNumberInput label="Contaminated surfaces in the path" value={surfRaw} onChange={setSurf} min={1} max={100} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <Card label="Obscured area per surface" value={show(pac, () => `${(pac * 100).toPrecision(3)} %`)}
          sub="Particles 1 µm to the level, face-on spheres" tone="text-yellow-400" />
        <Card label={`Geometric transmission, ${surfaces} surface${surfaces === 1 ? "" : "s"}`}
          value={show(transmitted, () => `${(transmitted * 100).toFixed(4)} %`)}
          sub="(1 − obscuration)^surfaces at normal incidence" tone="text-sky-400" />
      </div>
      <div className="overflow-x-auto mb-4">
        <table className="text-sm w-full max-w-md">
          <thead><tr className="text-gray-400 text-left"><th className="py-1 pr-4">Size ≥ (µm)</th><th className="py-1">Particles per 0.1 m²</th></tr></thead>
          <tbody>
            {SIZES_UM.filter((x) => x <= level).map((x) => (
              <tr key={x} className="border-t border-gray-800">
                <td className="py-1 pr-4">{x}</td>
                <td className="py-1">{show(cc1246Count(x, level), () => Math.round(cc1246Count(x, level)).toLocaleString("en-US"))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        log₁₀ N = 0.926 (log₁₀² L − log₁₀² x): N particles of size ≥ x per 0.1 m², one at the level L. Particles much
        larger than the wavelength also diffract about as much light again into small angles, so the loss to a
        well-collimated, aperture-limited beam can approach twice the obscuration. Ma, Fong &amp; Lee&apos;s elongated
        particle shape (a cylinder with hemispherical ends) covers about a quarter less area than spheres.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-4">Accelerated ageing (Arrhenius–Peck)</h2>
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <ValidatedNumberInput label="Use temperature (°C)" value={tUseRaw} onChange={setTUse} min={-60} max={300} step="5" />
        <ValidatedNumberInput label="Test temperature (°C)" value={tTestRaw} onChange={setTTest} min={-60} max={300} step="5" />
        <ValidatedNumberInput label="Activation energy Eₐ (eV)" value={eaRaw} onChange={setEa} min={0} max={3} step="0.05" />
        <ValidatedNumberInput label="Test duration (h)" value={hoursRaw} onChange={setHours} min={0} max={1e7} step="100" />
        <ValidatedNumberInput label="Use humidity (% RH)" value={rhUseRaw} onChange={setRhUse} min={1} max={100} step="5" />
        <ValidatedNumberInput label="Test humidity (% RH)" value={rhTestRaw} onChange={setRhTest} min={1} max={100} step="5" />
        <ValidatedNumberInput label="Humidity exponent n (0 = Arrhenius only)" value={rhExpRaw} onChange={setRhExp} min={0} max={10} step="0.1" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 mb-4">
        <Card label="Acceleration factor" value={show(af, () => af.toPrecision(4))} sub="AF = (RH_test/RH_use)ⁿ · exp[(Eₐ/k_B)(1/T_use − 1/T_test)]" tone="text-violet-400" />
        <Card label="Equivalent time in use" value={show(af * hours, () => `${(af * hours).toPrecision(4)} h`)}
          sub={show(af * hours, () => `${(af * hours / HOURS_PER_YEAR).toPrecision(3)} years`)} tone="text-emerald-400" />
      </div>
      <p className="text-xs text-gray-400">
        One activation energy must govern the failure at both temperatures; Eₐ and n come from your own life tests.
        Peck fitted them to humidity failures of epoxy-packaged circuits, not to optical coatings.
      </p>
    </>
  );
}
