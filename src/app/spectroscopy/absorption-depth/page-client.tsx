"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { SILICON_LAMBDA_MAX, SILICON_LAMBDA_MIN, siliconAbsorption } from "../../../physics/materials/silicon-absorption";
import { WATER_LAMBDA_MAX, WATER_LAMBDA_MIN, waterAbsorption, waterSource } from "../../../physics/materials/water-absorption";
import { absorbedFraction, absorptionDepth, depthForAbsorbedFraction } from "../../../physics/spectroscopy/depth";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const r6 = (x: number) => (Number.isFinite(x) ? Number(x.toPrecision(6)) : NaN);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const fmtLen = (m: number) =>
  m === Infinity ? "∞" : !Number.isFinite(m) ? "—"
    : m >= 1 ? `${fmt(m)} m` : m >= 1e-3 ? `${fmt(m * 1e3)} mm` : m >= 1e-6 ? `${fmt(m * 1e6)} µm` : `${fmt(m * 1e9)} nm`;

type Material = "silicon" | "water" | "custom";
const MATERIALS: Record<Exclude<Material, "custom">, { label: string; alpha: (lambda: number) => number; min: number; max: number; note: string }> = {
  silicon: { label: "Silicon (crystalline, 300 K)", alpha: siliconAbsorption, min: SILICON_LAMBDA_MIN, max: SILICON_LAMBDA_MAX, note: "Green 2008, band-to-band" },
  water: { label: "Water (pure liquid)", alpha: waterAbsorption, min: WATER_LAMBDA_MIN, max: WATER_LAMBDA_MAX, note: "Pope & Fry 1997 / Segelstein 1981" },
};

export default function AbsorptionDepthPage() {
  const [materialRaw, setMaterial] = useURLState("material", "silicon");
  const [wlRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [alphaRaw, setAbsorptionCoeff] = useURLState("absorptionCoeff", 1000); // cm⁻¹
  const [thickRaw, setThickness] = useURLState("thickness", 10); // µm
  const [wlMinRaw, setWlMin] = useURLState("wlMin", 300);
  const [wlMaxRaw, setWlMax] = useURLState("wlMax", 1200);

  const material: Material = materialRaw === "water" || materialRaw === "custom" ? materialRaw : "silicon";
  const model = material === "custom" ? null : MATERIALS[material];
  const minNm = model ? model.min * 1e9 : 100;
  const maxNm = model ? model.max * 1e9 : 20000;
  const wlNm = clamp(wlRaw, minNm, maxNm, Math.min(Math.max(550, minNm), maxNm));
  const thickness = clamp(thickRaw, 0, 1e9, 10) * 1e-6;
  const wlMin = clamp(wlMinRaw, minNm, maxNm - 10, minNm);
  const wlMax = clamp(wlMaxRaw, wlMin + 10, maxNm, maxNm);

  const alpha = model ? model.alpha(wlNm * 1e-9) : clamp(alphaRaw, 0, 1e8, 1000) * 100; // 1/m
  const delta = absorptionDepth(alpha);
  const d90 = depthForAbsorbedFraction(alpha, 0.9);
  const absorbed = absorbedFraction(alpha, thickness);
  const source = material === "water" ? waterSource(wlNm * 1e-9) : model?.note;

  const spectrum = (() => {
    if (!model) return [];
    const nms = Array.from({ length: 401 }, (_, i) => wlMin + (i / 400) * (wlMax - wlMin));
    const pts = nms.map((nm) => ({ nm, a: model.alpha(nm * 1e-9), src: material === "water" ? waterSource(nm * 1e-9) : "" }));
    // one trace per data source, so the 375–380 nm step between the water tables is not drawn as data
    const runs: (typeof pts)[] = [];
    for (const p of pts) {
      const run = runs[runs.length - 1];
      if (run && run[0].src === p.src) run.push(p);
      else runs.push([p]);
    }
    return runs.flatMap((run, i) => [
      { x: run.map((p) => r6(p.nm)), y: run.map((p) => r6(p.a / 100)), type: "scatter", mode: "lines", name: i === 0 ? "α (cm⁻¹)" : `α (cm⁻¹), ${run[0].src}`, line: { color: "#f87171", width: 2 } },
      { x: run.map((p) => r6(p.nm)), y: run.map((p) => r6(1e6 / p.a)), type: "scatter", mode: "lines", name: i === 0 ? "δ = 1/α (µm)" : `δ (µm), ${run[0].src}`, line: { color: "#34d399", width: 2 }, yaxis: "y2" },
    ]);
  })();

  const [zScale, zUnit] = delta >= 1 ? [1, "m"] : delta >= 1e-3 ? [1e3, "mm"] : [1e6, "µm"];
  const profile = (() => {
    if (!(delta > 0 && Number.isFinite(delta))) return [];
    const zs = Array.from({ length: 201 }, (_, i) => (i / 200) * 5 * delta);
    return [
      { x: zs.map((z) => r6(z * zScale)), y: zs.map((z) => r6(Math.exp(-alpha * z))), type: "scatter", mode: "lines", name: "I(z)/I₀", line: { color: "#818cf8", width: 2 } },
      { x: [r6(delta * zScale)], y: [r6(Math.exp(-1))], type: "scatter", mode: "markers", name: "z = δ, 1/e", line: { color: "#fbbf24" }, marker: { color: "#fbbf24", size: 10 } },
    ];
  })();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <label className="block rounded-lg border border-gray-800 bg-gray-900 p-4">
          <span className="text-sm text-gray-300">Material</span>
          <select value={material} onChange={(e) => setMaterial(e.target.value)}
            className="mt-3 w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white">
            <option value="silicon">{MATERIALS.silicon.label}</option>
            <option value="water">{MATERIALS.water.label}</option>
            <option value="custom">Custom α</option>
          </select>
        </label>
        {model
          ? <ValidatedNumberInput label={`Wavelength (nm, ${Math.round(minNm)}–${Math.round(maxNm)})`} value={wlRaw} onChange={setWavelength} min={minNm} max={maxNm} step="10" />
          : <ValidatedNumberInput label="Absorption Coefficient α (cm⁻¹)" value={alphaRaw} onChange={setAbsorptionCoeff} min={0} max={1e8} step="10" />}
        <ValidatedNumberInput label="Layer Thickness d (µm)" value={thickRaw} onChange={setThickness} min={0} max={1e9} />
        {model && <>
          <ValidatedNumberInput label="Plot λ Min (nm)" value={wlMinRaw} onChange={setWlMin} min={minNm} max={maxNm - 10} step="10" />
          <ValidatedNumberInput label="Plot λ Max (nm)" value={wlMaxRaw} onChange={setWlMax} min={minNm + 10} max={maxNm} step="10" />
        </>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Absorption Coefficient α" value={`${fmt(alpha / 100)} cm⁻¹`} tone="red" subtext={model ? `at ${fmt(wlNm, 4)} nm; ${source}` : "entered"} />
        <ResultCard label="Absorption Depth δ = 1/α" value={fmtLen(delta)} tone="green" subtext={alpha === 0 ? "no absorption" : "intensity falls to 1/e (36.8 %)"} />
        <ResultCard label="Depth for 90 % Absorbed" value={fmtLen(d90)} tone="blue" subtext="ln 10 · δ = 2.303 δ" />
        <ResultCard label="Absorbed within d" value={Number.isFinite(absorbed) ? `${fmt(absorbed * 100)} %` : "—"} tone="yellow" subtext="1 − e^(−αd), of the light that enters" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>I(z) = I₀ · exp(−αz),  δ = 1/α,  α = 4πk/λ₀</p>
        <p>Decadic absorbance of a layer: A = αd / ln 10. Surface reflection is not included: the percentages refer to the light that enters.</p>
        {material === "water" && <p className="text-gray-400">Pure water. Below 380 nm the Segelstein compilation uses older data that later measurements find several times too high, so the curve steps between 375 and 380 nm.</p>}
        {material === "silicon" && <p className="text-gray-400">Intrinsic silicon at 300 K, band-to-band absorption only. Free-carrier absorption in doped silicon adds to α beyond about 1.1 µm.</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {model && (
          <ChartPanel data={spectrum} layout={{
            paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
            title: { text: `${model.label}: α and δ`, font: { size: 13 } },
            xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "α (cm⁻¹)", gridcolor: "#374151", type: "log" },
            yaxis2: { title: "δ (µm)", gridcolor: "#374151", type: "log", overlaying: "y", side: "right" },
            margin: { t: 40, r: 70, b: 50, l: 70 }, legend: { bgcolor: "transparent" },
          }} />
        )}
        <ChartPanel data={profile} layout={{
          paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#9ca3af" },
          title: { text: "Intensity vs Depth", font: { size: 13 } },
          xaxis: { title: `Depth z (${zUnit})`, gridcolor: "#374151" },
          yaxis: { title: "I/I₀", gridcolor: "#374151", range: [0, 1.05] },
          margin: { t: 40, r: 20, b: 50, l: 60 }, legend: { bgcolor: "transparent" },
        }} />
      </div>
    </>
  );
}
