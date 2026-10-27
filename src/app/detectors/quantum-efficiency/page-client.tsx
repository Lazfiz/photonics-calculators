"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import InputSlider from "../../../components/input-slider";
import { useURLState } from "../../../hooks/use-url-state";
import { siliconAbsorption, siliconIndex } from "../../../physics/materials/silicon-absorption";
import { ingaasBandGap } from "../../../physics/materials/bandgap";
import { ingaasAbsorption, inpWindowEdge } from "../../../physics/detectors/ingaas";
import { normalReflectance, photodiodeQe } from "../../../physics/detectors/photodiode-qe";
import { responsivity } from "../../../physics/detectors/responsivity";

const MATERIALS = ["si", "ingaas"] as const;
type Material = (typeof MATERIALS)[number];
// Wavelength range per material: Green's silicon table; In₀.₅₃Ga₀.₄₇As from below the InP edge to past its cutoff.
const RANGE: Record<Material, { lo: number; hi: number; probe: number }> = {
  si: { lo: 250, hi: 1450, probe: 850 },
  ingaas: { lo: 800, hi: 1800, probe: 1550 },
};
// In₀.₅₃Ga₀.₄₇As at 300 K (Vurgaftman gap 0.7373 eV) read through an InP cap, opaque short of 916 nm.
const INGAAS_GAP = ingaasBandGap(0.53, 300);
const INP_EDGE = inpWindowEdge(300);

// Illustrative structures: collecting thickness W, substrate diffusion length L, dead layer d (µm).
const PRESETS = [
  { id: "pin", label: "Si PIN photodiode", material: "si", W: 20, L: 100, d: 0, fill: 1, gain: 1 },
  { id: "bsi-ccd", label: "Back-illuminated CCD", material: "si", W: 15, L: 0, d: 0, fill: 1, gain: 1 },
  { id: "deep-ccd", label: "Deep-depletion CCD", material: "si", W: 40, L: 0, d: 0, fill: 1, gain: 1 },
  { id: "fsi-cmos", label: "Front-illuminated CMOS", material: "si", W: 3, L: 0, d: 0.1, fill: 0.5, gain: 1.6 },
  { id: "ingaas-pin", label: "InGaAs p-i-n", material: "ingaas", W: 3, L: 0, d: 0, fill: 1, gain: 1 },
] as const;
const SURFACES = ["ar", "bare"] as const;
type Surface = (typeof SURFACES)[number];

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const pct = (x: number) => (Number.isFinite(x) ? `${(x * 100).toFixed(1)}%` : "—");

export default function QuantumEfficiencyPage() {
  const [materialRaw, setMaterial] = useURLState("material", "si");
  const [WRaw, setW] = useURLState("thickness", 20);
  const [LRaw, setL] = useURLState("diffusionLength", 100);
  const [dRaw, setD] = useURLState("deadLayer", 0);
  const [surfaceRaw, setSurface] = useURLState("surface", "ar");
  const [RRaw, setR] = useURLState("reflectance", 0.05);
  const [fillRaw, setFillFactor] = useURLState("fillFactor", 1);
  const [gainRaw, setMicrolensGain] = useURLState("microlensGain", 1);
  const [probeRaw, setProbeWavelength] = useURLState("probeWavelength", 850);
  const material: Material = MATERIALS.find((m) => m === materialRaw) ?? "si";
  const range = RANGE[material];
  const W = clamp(WRaw, 0.5, 500, 20);
  const L = material === "ingaas" ? 0 : clamp(LRaw, 0, 1000, 100); // the InP substrate is transparent: no substrate collection
  const d = clamp(dRaw, 0, 2, 0);
  // Bare-surface Fresnel needs n + ik, tabulated here for silicon only.
  const surface: Surface = material === "si" ? SURFACES.find((s) => s === surfaceRaw) ?? "ar" : "ar";
  const R = clamp(RRaw, 0, 0.5, 0.05);
  const fillFactor = clamp(fillRaw, 0.1, 1, 1);
  const microlensGain = clamp(gainRaw, 1, 3, 1);
  const probe = clamp(probeRaw, range.lo, range.hi, range.probe);
  const opticalFill = Math.min(1, fillFactor * microlensGain);
  const surfaceOptions: readonly Surface[] = material === "si" ? SURFACES : ["ar"];

  const reflectanceAt = (nm: number) => {
    if (surface === "ar") return R;
    const { n, k } = siliconIndex(nm * 1e-9);
    return normalReflectance(n, k);
  };
  const alphaAt = (nm: number) => (material === "si" ? siliconAbsorption(nm * 1e-9) : ingaasAbsorption(nm * 1e-9, INGAAS_GAP));
  const windowAt = (nm: number) => (material === "ingaas" && nm * 1e-9 <= INP_EDGE ? 0 : 1);
  const internalQe = (nm: number) =>
    windowAt(nm) * photodiodeQe({ alpha: alphaAt(nm), reflectance: 0, depletionWidth: W * 1e-6, diffusionLength: L * 1e-6, deadLayer: d * 1e-6 });
  const externalQe = (nm: number) => (1 - reflectanceAt(nm)) * internalQe(nm) * opticalFill;

  const wl = Array.from({ length: 241 }, (_, i) => range.lo + (i * (range.hi - range.lo)) / 240);
  const qe = wl.map(externalQe);
  const peakIndex = qe.reduce((best, v, i) => (v > qe[best] ? i : best), 0);
  // Contiguous run of samples within 0.1 percentage points of the maximum (a flat top).
  let tieLo = peakIndex, tieHi = peakIndex;
  while (tieLo > 0 && qe[peakIndex] - qe[tieLo - 1] <= 1e-3) tieLo--;
  while (tieHi < qe.length - 1 && qe[peakIndex] - qe[tieHi + 1] <= 1e-3) tieHi++;
  const peakWavelength = tieHi > tieLo ? `${wl[tieLo].toFixed(0)}–${wl[tieHi].toFixed(0)} nm (flat)` : `${wl[peakIndex].toFixed(0)} nm`;
  const probeQe = externalQe(probe);

  const chartSeries = [
    { name: "Effective QE", color: "#60a5fa", points: wl.map((x, i) => ({ x, y: qe[i] * 100 })) },
    { name: "Internal QE (no reflection or fill loss)", color: "#9ca3af", points: wl.map((x) => ({ x, y: internalQe(x) * 100 })) },
    { name: "Probe", color: "#22c55e", showPoints: true, points: [{ x: probe, y: probeQe * 100 }] },
  ];

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setMaterial(p.material);
    setW(p.W);
    setL(p.L);
    setD(p.d);
    setFillFactor(p.fill);
    setMicrolensGain(p.gain);
    if (p.material !== material) setProbeWavelength(RANGE[p.material].probe);
  };
  // Switching material loads its default structure: the silicon W, L and d mean nothing on an InP substrate.
  const selectMaterial = (m: Material) => {
    if (m !== material) applyPreset(PRESETS.find((p) => p.id === (m === "ingaas" ? "ingaas-pin" : "pin"))!);
  };
  const active = PRESETS.find((p) => p.material === material && p.W === W && p.L === L && p.d === d && p.fill === fillFactor && p.gain === microlensGain);
  const chip = (on: boolean) => `rounded-full border px-3 py-1 transition ${on ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span>Absorber:</span>
        {MATERIALS.map((m) => (
          <button key={m} onClick={() => selectMaterial(m)} className={chip(material === m)}>
            {m === "si" ? "Silicon" : "In₀.₅₃Ga₀.₄₇As (InP cap)"}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => applyPreset(p)} className={`${chip(active?.id === p.id)} text-sm`}>{p.label}</button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <InputSlider label="Collecting thickness W" value={WRaw} onChange={setW} min={0.5} max={500} step={0.5} unit="µm" />
        {material === "ingaas" ? (
          <div className="text-sm text-gray-400">Substrate diffusion length L: 0 (the InP substrate is transparent)</div>
        ) : (
          <InputSlider label="Substrate diffusion length L (0 = slab)" value={LRaw} onChange={setL} min={0} max={1000} step={5} unit="µm" />
        )}
        <InputSlider label="Dead layer d" value={dRaw} onChange={setD} min={0} max={2} step={0.01} unit="µm" />
        <InputSlider label="Fill factor" value={fillRaw} onChange={setFillFactor} min={0.1} max={1} step={0.01} />
        <InputSlider label="Microlens gain" value={gainRaw} onChange={setMicrolensGain} min={1} max={3} step={0.05} />
        <InputSlider label="Probe wavelength" value={probeRaw} onChange={setProbeWavelength} min={range.lo} max={range.hi} step={1} unit="nm" />
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-gray-300">
        <span>Front surface:</span>
        {surfaceOptions.map((s) => (
          <button key={s} onClick={() => setSurface(s)} className={chip(surface === s)}>
            {s === "ar" ? "AR coated (fixed R)" : "Bare silicon (Fresnel)"}
          </button>
        ))}
        {surface === "ar" && (
          <div className="min-w-56 flex-1">
            <InputSlider label="Reflectance R" value={RRaw} onChange={setR} min={0} max={0.5} step={0.01} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ResultCard label="QE at probe λ" value={pct(probeQe)} tone="blue" subtext={`ℛ = ${Number.isFinite(probeQe) ? responsivity(probeQe, probe * 1e-9).toFixed(3) : "—"} A/W; R = ${pct(reflectanceAt(probe))}`} />
        <ResultCard label="Peak QE" value={pct(qe[peakIndex])} tone="green" subtext={`Optical fill ${pct(opticalFill)}`} />
        <ResultCard label="Peak wavelength" value={peakWavelength} tone="yellow" />
      </div>

      <div className="bg-gray-900 rounded p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p>QE = (1 − R)·e^(−α·d)·[1 − e^(−α·W)/(1 + α·L)] × min(1, fill factor × microlens gain)</p>
        {material === "si" ? (
          <p>
            α(λ) is crystalline silicon at 300 K (Green 2008). Blue light is lost in the dead layer (α ≈ 10⁵ cm⁻¹
            at 400 nm), near-infrared light passes through a thin collecting layer (α(900 nm) = 303 cm⁻¹, a 33 µm
            absorption length). The presets are illustrative structures, not a specific product; real sensors add
            AR-coating ripple, gate and colour-filter absorption, and etaloning in thin back-illuminated layers.
          </p>
        ) : (
          <p>
            α = 2.4×10⁴ cm⁻¹·√(E − E_g/eV) for In₀.₅₃Ga₀.₄₇As at 300 K (E_g = 0.7373 eV, cutoff 1682 nm), fitted to
            Adachi&apos;s model within ±12 % from 0.95 to 1.62 µm. The InP cap is taken as opaque above its 1.353 eV
            gap, so QE is 0 short of 916 nm. A 3 µm absorber reaches α·W = 1.8 at 1550 nm; collection is ideal, with no
            loss in the contact layers.
          </p>
        )}
      </div>

      <SimpleLineChart title={material === "si" ? "Silicon detector quantum efficiency" : "InGaAs detector quantum efficiency"} xLabel="Wavelength (nm)" yLabel="QE (%)" series={chartSeries} />
    </>
  );
}
