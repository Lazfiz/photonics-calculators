"use client";

import { useState } from "react";
import ChartPanel from "../../../components/chart-panel";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import {
  HENKE_E_MAX,
  HENKE_E_MIN,
  XRAY_MATERIALS,
  xrayIndex,
  xrayTransmission,
  xrayWavelength,
  type XRayMaterialId,
} from "../../../physics/materials/x-ray-optics";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const show = (x: number, text: () => string) => (Number.isFinite(x) ? text() : "—");
const IDS = Object.keys(XRAY_MATERIALS) as XRayMaterialId[];
const COLORS = ["#60a5fa", "#f87171", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#a3e635", "#e5e7eb"];
// 300 log-spaced energies, 1–30 keV (the range of the Henke tables)
const CHART_E = Array.from({ length: 300 }, (_, i) => HENKE_E_MIN * (HENKE_E_MAX / HENKE_E_MIN) ** (i / 299));
const round = (x: number) => Number(x.toPrecision(5));

// Module level so the React Compiler keeps the page component: 10 materials × 300 energies, computed once.
let curveCache: Record<XRayMaterialId, { delta: number[]; beta: number[]; L_um: number[] }> | null = null;
function presetCurves() {
  curveCache ??= Object.fromEntries(IDS.map((k) => {
    const m = XRAY_MATERIALS[k];
    const r = CHART_E.map((E) => xrayIndex(m.formula, m.rho_gcc * 1000, E));
    return [k, { delta: r.map((x) => round(x.delta)), beta: r.map((x) => round(x.beta)), L_um: r.map((x) => round(x.attenuationLength * 1e6)) }];
  })) as Record<XRayMaterialId, { delta: number[]; beta: number[]; L_um: number[] }>;
  return curveCache;
}

function Card({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function lengthText(L: number) {
  if (L >= 1e-2) return `${(L * 1e3).toPrecision(4)} mm`;
  if (L >= 1e-6) return `${(L * 1e6).toPrecision(4)} µm`;
  return `${(L * 1e9).toPrecision(4)} nm`;
}

export default function XRayOpticsPage() {
  const [materialRaw, setMaterial] = useURLState("material", "Be");
  const [rhoRaw, setRho] = useURLState("density", 0); // g/cm³; 0 = the preset
  const [energyRaw, setEnergy] = useURLState("energy", 10); // keV
  const [thickRaw, setThick] = useURLState("thickness", 100); // µm
  const [selected, setSelected] = useState<XRayMaterialId[]>(["Be", "diamond", "Si", "Au"]);
  const toggle = (k: XRayMaterialId) => setSelected((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  const id = IDS.find((k) => k === materialRaw) ?? "Be";
  const mat = XRAY_MATERIALS[id];
  const rhoInput = rhoRaw > 0 ? rhoRaw : mat.rho_gcc;
  const rho = clamp(rhoInput, 0.01, 25, mat.rho_gcc) * 1000;
  const E = clamp(energyRaw, HENKE_E_MIN / 1000, HENKE_E_MAX / 1000, 10) * 1000;
  const t = clamp(thickRaw, 0, 1e5, 100) * 1e-6;

  const r = xrayIndex(mat.formula, rho, E);
  const lambda = xrayWavelength(E);
  const T = xrayTransmission(t, r.attenuationLength);
  const choose = (k: string) => { setMaterial(k); setRho(0); };

  const curves = presetCurves();
  const xKeV = CHART_E.map((e) => round(e / 1000));
  const chart = (key: "delta" | "beta" | "L_um", yTitle: string, title: string) => ({
    data: IDS.filter((k) => selected.includes(k)).map((k) => ({
      x: xKeV, y: curves[k][key], type: "scatter", mode: "lines", name: XRAY_MATERIALS[k].label,
      line: { color: COLORS[IDS.indexOf(k)] },
    })),
    layout: {
      ...baseLayout,
      xaxis: { ...baseLayout.xaxis, type: "log", title: { text: "Energy (keV)", font: { color: "#9ca3af" } } },
      yaxis: { ...baseLayout.yaxis, type: "log", title: { text: yTitle, font: { color: "#9ca3af" } } },
      title: { text: title, font: { color: "#e5e7eb" } },
    },
  });

  return (
    <>
      <div className="mb-6">
        <label htmlFor="material" className="block text-sm font-medium mb-2">Material</label>
        <select id="material" value={id} onChange={(e) => choose(e.target.value)}
          className="w-full sm:w-80 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none">
          {IDS.map((k) => <option key={k} value={k}>{XRAY_MATERIALS[k].label}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          Choosing a material fills its density. Thin films and membranes are often less dense than the bulk: enter
          a measured value.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <ValidatedNumberInput label="Density (g/cm³)" value={rhoInput} onChange={setRho} min={0.01} max={25} step="any" />
        <ValidatedNumberInput label="Photon Energy (keV)" value={energyRaw} onChange={setEnergy} min={1} max={30} step="any" />
        <ValidatedNumberInput label="Thickness (µm)" value={thickRaw} onChange={setThick} min={0} max={100000} step="any" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card label="Decrement δ" value={show(r.delta, () => r.delta.toExponential(4))}
          sub={`n = 1 − δ − iβ at λ = ${(lambda * 1e9).toFixed(5)} nm`} tone="text-blue-400" />
        <Card label="Absorption index β" value={show(r.beta, () => r.beta.toExponential(4))}
          sub={show(r.beta, () => `β/δ = ${(r.beta / r.delta).toExponential(3)}`)} tone="text-red-400" />
        <Card label="Critical angle θ_c" value={show(r.thetaC, () => `${(r.thetaC * 1e3).toFixed(4)} mrad`)}
          sub={show(r.thetaC, () => `${((r.thetaC * 180) / Math.PI).toFixed(4)}° grazing, √(2δ)`)} tone="text-green-400" />
        <Card label="Attenuation length" value={show(r.attenuationLength, () => lengthText(r.attenuationLength))}
          sub="intensity 1/e, λ/(4πβ)" tone="text-yellow-400" />
        <Card label="Mass attenuation μ/ρ" value={show(r.massAttenuation, () => `${(r.massAttenuation * 10).toPrecision(4)} cm²/g`)}
          sub="photoabsorption" tone="text-purple-400" />
        <Card label="Transmission" value={show(T, () => (T < 1e-4 ? T.toExponential(3) : `${(T * 100).toFixed(2)} %`))}
          sub={`through ${(t * 1e6).toPrecision(4)} µm`} tone="text-orange-400" />
      </div>

      <div role="group" aria-label="Materials on the charts" className="flex flex-wrap gap-2 mb-6">
        {IDS.map((k) => (
          <button key={k} onClick={() => toggle(k)} aria-pressed={selected.includes(k)}
            className={`px-3 py-1 rounded text-xs ${selected.includes(k) ? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700"}`}>
            {XRAY_MATERIALS[k].label.split(" (")[0]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        <ChartPanel {...chart("delta", "δ", "δ vs energy (preset densities)")} config={plotConfig} />
        <ChartPanel {...chart("beta", "β", "β vs energy: absorption edges")} config={plotConfig} />
        <ChartPanel {...chart("L_um", "Attenuation length (µm)", "1/e attenuation length λ/(4πβ)")} config={plotConfig} />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Model</h3>
        <div className="text-sm text-gray-300 space-y-2 font-mono">
          <p>δ = (r_e λ²/2π) Σ n_q f₁,q,   β = (r_e λ²/2π) Σ n_q f₂,q</p>
          <p>θ_c = √(2δ),   μ = 4πβ/λ,   T = exp(−μt)</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          f₁ and f₂ are the Henke scattering factors (CXRO tables, 1–30 keV) of independent atoms, so values within
          about 50 eV of an absorption edge depend on the chemical state and are only approximate. β counts
          photoabsorption only: Compton (incoherent) scattering adds about 28 % to the attenuation of beryllium and 6 % for carbon
          at 10 keV, and under 1 % for silicon and heavier elements at 10 keV. Scattering grows with energy: at 30 keV Compton
          and Rayleigh together are about a fifth of silicon&apos;s total attenuation (NIST XCOM), so T here is an upper bound
          at high energy.
        </p>
      </div>
    </>
  );
}

const baseLayout = { paper_bgcolor: "#030712", plot_bgcolor: "#111827", font: { color: "#d1d5db" }, xaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, yaxis: { gridcolor: "#1f2937", zerolinecolor: "#374151" }, margin: { t: 50, r: 20, b: 50, l: 70 }, legend: { font: { color: "#9ca3af" }, bgcolor: "rgba(0,0,0,0)" } };
const plotConfig = { responsive: true, displayModeBar: false };
