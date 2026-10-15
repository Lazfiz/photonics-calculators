"use client";

import ChartPanel from "../../../components/chart-panel";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { hc_eV_nm } from "../../../physics/constants";
import { siliconAbsorption } from "../../../physics/materials/silicon-absorption";
import { photodiodeQe } from "../../../physics/detectors/photodiode-qe";
import { responsivity } from "../../../physics/detectors/responsivity";
import { VARSHNI, generationCurrent, siliconIntrinsicDensity, varshniBandGap } from "../../../physics/detectors/dark-current";
import { EPS_R_SILICON, depletionCapacitance } from "../../../physics/detectors/photodiode-rc";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 3) => (Number.isFinite(x) ? x.toFixed(digits) : "—");
const fmtCurrent = (i: number) =>
  !Number.isFinite(i) ? "—" : i >= 1e-6 ? `${(i * 1e6).toPrecision(3)} µA` : i >= 1e-9 ? `${(i * 1e9).toPrecision(3)} nA` : `${(i * 1e12).toPrecision(3)} pA`;

export default function SiliconPhotodiodePage() {
  const [temperatureRaw, setTemperature] = useURLState("temperature", 293); // K
  const [depletionWidthRaw, setDepletionWidth] = useURLState("depletionWidth", 10); // µm
  const [diffusionLengthRaw, setDiffusionLength] = useURLState("diffusionLength", 100); // µm
  const [areaRaw, setArea] = useURLState("area", 1); // mm²
  const [reflectivityRaw, setSurfaceReflectivity] = useURLState("surfaceReflectivity", 0.05);
  const [lifetimeRaw, setLifetime] = useURLState("lifetime", 1); // ms
  const temperature = clamp(temperatureRaw, 200, 400, 293);
  const depletionWidth = clamp(depletionWidthRaw, 1, 500, 10);
  const diffusionLength = clamp(diffusionLengthRaw, 0, 1000, 100);
  const area = clamp(areaRaw, 0.01, 1000, 1);
  const surfaceReflectivity = clamp(reflectivityRaw, 0, 0.5, 0.05);
  const lifetime = clamp(lifetimeRaw, 0.001, 100, 1);

  const W = depletionWidth * 1e-6;
  const L = diffusionLength * 1e-6;
  const A = area * 1e-6;
  const Eg = varshniBandGap(temperature, VARSHNI.si);
  const bandGapWavelength = hc_eV_nm / Eg;

  const qeAt = (nm: number, width = W, diffusion = L) =>
    photodiodeQe({ alpha: siliconAbsorption(nm * 1e-9), reflectance: surfaceReflectivity, depletionWidth: width, diffusionLength: diffusion });
  const responsivityAt = (nm: number) => responsivity(qeAt(nm), nm * 1e-9);

  const wl = Array.from({ length: 226 }, (_, i) => 300 + i * 4);
  const resp = wl.map(responsivityAt);
  const peakIndex = resp.reduce((best, r, i) => (r > resp[best] ? i : best), 0);

  const darkCurrent = generationCurrent(siliconIntrinsicDensity(temperature), W, A, lifetime * 1e-3);
  const capPF = depletionCapacitance(A, W, EPS_R_SILICON) * 1e12;

  const spectralChart = [
    { x: wl, y: wl.map((w) => qeAt(w) * 100), type: "scatter", mode: "lines", name: "QE (%)", line: { color: "#60a5fa", width: 2 }, yaxis: "y" },
    { x: wl, y: wl.map((w) => qeAt(w, W, 0) * 100), type: "scatter", mode: "lines", name: "QE, depletion only (%)", line: { color: "#60a5fa", width: 1, dash: "dot" }, yaxis: "y" },
    { x: wl, y: resp, type: "scatter", mode: "lines", name: "ℛ (A/W)", line: { color: "#34d399", width: 2 }, yaxis: "y2" },
  ];

  const widths = Array.from({ length: 100 }, (_, i) => 1 + i * 0.5);
  const qeVsWidth = [700, 900, 1000].map((nm, j) => ({
    x: widths,
    y: widths.map((w) => qeAt(nm, w * 1e-6) * 100),
    type: "scatter",
    mode: "lines",
    name: `${nm} nm`,
    line: { color: ["#60a5fa", "#34d399", "#fbbf24"][j], width: 2 },
  }));

  const temps = Array.from({ length: 101 }, (_, i) => 220 + i);
  const darkVsTemp = [{
    x: temps,
    y: temps.map((T) => generationCurrent(siliconIntrinsicDensity(T), W, A, lifetime * 1e-3) * 1e9),
    type: "scatter", mode: "lines", name: "I_dark", line: { color: "#f87171", width: 2 },
  }];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ValidatedNumberInput label="Temperature (K)" value={temperatureRaw} onChange={setTemperature} min={200} max={400} step="5" />
        <ValidatedNumberInput label="Depletion Width W (μm)" value={depletionWidthRaw} onChange={setDepletionWidth} min={1} max={500} step="1" />
        <ValidatedNumberInput label="Diffusion Length L (μm, 0 = none)" value={diffusionLengthRaw} onChange={setDiffusionLength} min={0} max={1000} step="10" />
        <ValidatedNumberInput label="Active Area (mm²)" value={areaRaw} onChange={setArea} min={0.01} max={1000} step="0.1" />
        <ValidatedNumberInput label="Surface Reflectivity" value={reflectivityRaw} onChange={setSurfaceReflectivity} min={0} max={0.5} step="0.01" />
        <ValidatedNumberInput label="Generation Lifetime τ_g (ms)" value={lifetimeRaw} onChange={setLifetime} min={0.001} max={100} step="0.1" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Results</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultCard label="Bandgap E_g" value={`${fmt(Eg, 4)} eV`} tone="blue" subtext={`h·c/E_g = ${fmt(bandGapWavelength, 0)} nm`} />
          <ResultCard label="Peak Responsivity" value={`${fmt(resp[peakIndex], 3)} A/W`} tone="blue" subtext={`at ${wl[peakIndex]} nm`} />
          <ResultCard label="QE @ 700 nm" value={`${fmt(qeAt(700) * 100, 1)}%`} tone="blue" />
          <ResultCard label="Responsivity @ 900 nm" value={`${fmt(responsivityAt(900), 3)} A/W`} tone="blue" subtext={`QE ${fmt(qeAt(900) * 100, 1)}%`} />
          <ResultCard label="Dark Current (generation)" value={fmtCurrent(darkCurrent)} tone="blue" />
          <ResultCard label="Junction Capacitance" value={`${fmt(capPF, 2)} pF`} tone="blue" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Spectral Response (absorption at 300 K)</h3>
          <ChartPanel data={spectralChart} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Wavelength (nm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151", side: "left" },
            yaxis2: { title: "ℛ (A/W)", overlaying: "y", side: "right", gridcolor: "#374151" },
            margin: { t: 20, b: 40, l: 60, r: 60 } }} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">QE vs Depletion Width</h3>
          <ChartPanel data={qeVsWidth} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Depletion Width (μm)", gridcolor: "#374151" },
            yaxis: { title: "QE (%)", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
        <div className="md:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Dark Current vs Temperature</h3>
          <ChartPanel data={darkVsTemp} layout={{ paper_bgcolor: "transparent", plot_bgcolor: "transparent",
            font: { color: "#9ca3af" }, xaxis: { title: "Temperature (K)", gridcolor: "#374151" },
            yaxis: { title: "I_dark (nA)", type: "log", gridcolor: "#374151" }, margin: { t: 20, b: 40, l: 60, r: 20 } }} />
        </div>
      </div>

      <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-sm text-gray-400 space-y-1">
        <h3 className="text-white font-semibold mb-2">Formulas</h3>
        <p>E_g(T) = 1.170 − 4.73×10⁻⁴·T²/(T + 636) eV (Varshni, Sze)</p>
        <p>η(λ) = (1 − R)·[1 − e^(−αW)/(1 + αL)] (Gärtner: depletion region plus diffusion from the substrate)</p>
        <p>ℛ(λ) = η·q·λ/(h·c)</p>
        <p>I_dark = q·n_i·W·A/τ_g, n_i(300 K) = 9.65×10⁹ cm⁻³ ∝ T^(3/2)·e^(−E_g/2kT)</p>
        <p>C_j = ε₀·11.9·A/W</p>
        <p>
          α(λ) is Green&apos;s 2008 table for silicon at 300 K at every temperature: the band-gap shift moves the
          long-wavelength edge by about 0.25 nm/K, which this page does not apply. Silicon is an indirect absorber, so
          some response remains beyond h·c/E_g.
        </p>
      </div>
    </>
  );
}
