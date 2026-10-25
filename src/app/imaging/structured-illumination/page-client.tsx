"use client";

import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { diffractionMtf } from "../../../physics/imaging/diffraction-mtf";
import { abbeLateralFwhm, simCutoff, simLateralFwhm, simRawImageCount } from "../../../physics/imaging/super-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const nm = 1e-9;

const row = (label: string, value: string, color = "") => (
  <div className="flex justify-between border-b border-gray-800 pb-2">
    <span className="text-gray-400">{label}</span>
    <span className={`font-mono ${color}`}>{value}</span>
  </div>
);
const fmt = (x: number, digits: number, unit: string) => (Number.isFinite(x) ? `${x.toFixed(digits)}${unit}` : "—");

const COLORS = ["#f87171", "#60a5fa", "#4ade80", "#facc15"];

export default function StructuredIlluminationPage() {
  const [naRaw, setNa] = useURLState("na", 1.4);
  const [exRaw, setEx] = useURLState("wavelength", 488); // excitation, nm
  const [emRaw, setEm] = useURLState("emission", 520); // nm
  const [patternRaw, setPattern] = useURLState("pattern", 100); // % of the largest pattern frequency 2NA/λex
  const [ordersRaw, setOrders] = useURLState("orders", 1); // 1 = linear SIM, > 1 = saturated SIM harmonics
  const [anglesRaw, setAngles] = useURLState("angles", 3);

  const na = clamp(naRaw, 0.1, 1.7, 1.4);
  const ex = clamp(exRaw, 200, 2000, 488);
  const em = clamp(emRaw, 200, 2000, 520);
  const pattern = clamp(patternRaw, 10, 100, 100);
  const orders = Math.round(clamp(ordersRaw, 1, 3, 1));
  const angles = Math.round(clamp(anglesRaw, 1, 12, 3));
  const p = pattern / 100;

  const kc = (2 * na) / (em * nm); // widefield cut-off, cycles/m
  const k0 = p * (2 * na) / (ex * nm); // pattern frequency
  const kSim = simCutoff(ex * nm, em * nm, na, p, orders);
  const dWide = abbeLateralFwhm(em * nm, na);
  const dSim = simLateralFwhm(ex * nm, em * nm, na, p, orders);
  const images = simRawImageCount(orders, angles);
  const perUm = 1e-6;

  const notes: string[] = [];
  if (em < ex) notes.push(`The emission (${em} nm) is shorter than the excitation (${ex} nm); fluorescence is Stokes-shifted to longer wavelengths.`);
  if (k0 > kc) notes.push("The pattern frequency exceeds the detection cut-off, so the shifted passbands no longer overlap the central one and the support has gaps.");
  if (orders > 1) notes.push("Harmonics beyond the first need a nonlinear (saturated or photoswitched) fluorescence response; their strength depends on the saturation level, not modelled here.");
  if (angles < 3) notes.push(`${angles} pattern angle${angles > 1 ? "s" : ""} extend the support in that direction only; three or more are needed for near-isotropic resolution.`);

  // Frequency support along one pattern direction: the widefield OTF and the copies shifted by ±j k₀.
  const kMax = 1.05 * kSim;
  const ks = Array.from({ length: 601 }, (_, i) => -kMax + (2 * kMax * i) / 600);
  const supportChart = Array.from({ length: orders + 1 }, (_, j) => ({
    x: ks.map((k) => k * perUm),
    // Incoherent OTF of a circular pupil, shifted to ±j·k₀ (zero outside the support).
    y: ks.map((k) => Math.max(diffractionMtf(Math.abs(k - j * k0) / kc), diffractionMtf(Math.abs(k + j * k0) / kc))),
    type: "scatter" as const, mode: "lines" as const,
    name: j === 0 ? "Widefield OTF" : `Shifted by ±${j}·k₀`,
    line: { color: COLORS[j % COLORS.length] },
  }));

  const layout = {
    paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#ccc" },
    xaxis: { title: "Spatial frequency (cycles/µm)", gridcolor: "#333" },
    yaxis: { title: "OTF (each copy normalised)", gridcolor: "#333", range: [0, 1.05] },
    margin: { l: 60, r: 20, t: 20, b: 60 },
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
          <ValidatedNumberInput label="Numerical aperture (NA)" value={naRaw} onChange={setNa} min={0.1} max={1.7} step="0.01" />
          <ValidatedNumberInput label="Excitation wavelength (nm)" value={exRaw} onChange={setEx} min={200} max={2000} />
          <ValidatedNumberInput label="Emission wavelength (nm)" value={emRaw} onChange={setEm} min={200} max={2000} />
          <ValidatedNumberInput label="Pattern frequency (% of 2NA/λex)" value={patternRaw} onChange={setPattern} min={10} max={100} />
          <ValidatedNumberInput label="Harmonic orders m (1 = linear SIM)" value={ordersRaw} onChange={setOrders} min={1} max={3} step="1" />
          <ValidatedNumberInput label="Pattern angles" value={anglesRaw} onChange={setAngles} min={1} max={12} step="1" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="text-lg font-semibold">Results</h2>
          {row("Widefield cut-off 2NA/λem", fmt(kc * perUm, 2, " cycles/µm"))}
          {row("Widefield resolution λem/(2NA)", fmt(dWide / nm, 1, " nm"), "text-red-400")}
          {row("Pattern period 1/k₀", fmt(1 / k0 / nm, 1, " nm"))}
          {row("SIM cut-off 2NA/λem + m·k₀", fmt(kSim * perUm, 2, " cycles/µm"))}
          {row("SIM resolution 1/k_c", fmt(dSim / nm, 1, " nm"), "text-blue-400")}
          {row("Improvement over widefield", fmt(dWide / dSim, 2, "×"), "text-green-400")}
          {row(`Raw images (${angles} angles × ${2 * orders + 1} phases)`, fmt(images, 0, ""), "text-yellow-400")}
          {notes.map((n) => <p key={n} className="text-sm text-yellow-300">{n}</p>)}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>k₀ = p · 2NA/λex: two beams at the pupil edge give the finest pattern (p = 1). Linear SIM: k_c = 2NA/λem + k₀ (Gustafsson 2000).</p>
            <p>Saturated SIM adds harmonics m·k₀ (Gustafsson 2005). Separating orders −m … m needs 2m + 1 phases per angle.</p>
            <p>The resolution 1/k_c is the Abbe-type period, like λ/(2NA) for widefield. Reconstruction (Wiener filtering) and noise set how much of the support is usable.</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Frequency support along one pattern direction</h2>
        <ChartPanel data={supportChart} layout={layout} />
        <p className="text-xs text-gray-500 mt-2">Each copy is drawn at unit height; in the raw data the first orders carry half the modulation depth, and harmonics less.</p>
      </div>
    </>
  );
}
