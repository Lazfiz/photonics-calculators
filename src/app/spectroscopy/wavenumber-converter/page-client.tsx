"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { eV } from "../../../physics/constants";
import { photonFromWavelength, photonFromWavenumber } from "../../../physics/spectroscopy/wavenumber";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const sig = (x: number, digits: number) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");
const WL_MIN = 100;
const WL_MAX = 50000;

const rangePresets = [
  { label: "UV", min: 200, max: 400 },
  { label: "Visible", min: 400, max: 700 },
  { label: "NIR", min: 700, max: 2500 },
  { label: "Mid-IR", min: 2500, max: 25000 },
];
const singlePresets = [532, 632.8, 1064, 1550, 3400, 10600];

export default function WavenumberConverterPage() {
  const [minRaw, setWavelengthMin] = useURLState("wavelengthMin", 400);
  const [maxRaw, setWavelengthMax] = useURLState("wavelengthMax", 4000);
  const [modeRaw, setMode] = useURLState("mode", "wl-to-wn");
  const [singleRaw, setSingleValue] = useURLState("singleValue", 1000);

  const wavelengthMin = clamp(minRaw, WL_MIN, WL_MAX - 1, 400);
  const maxIn = clamp(maxRaw, WL_MIN + 1, WL_MAX, 4000);
  const wavelengthMax = maxIn > wavelengthMin ? maxIn : Math.min(WL_MAX, wavelengthMin + 100);
  const wlMode = modeRaw !== "wn-to-wl";
  const singleValue = clamp(singleRaw, 1e-3, 1e9, 1000);

  // Input in nm (wl-to-wn) or cm⁻¹ (wn-to-wl).
  const photon = wlMode ? photonFromWavelength(singleValue * 1e-9) : photonFromWavenumber(singleValue * 100);
  const converted = wlMode ? photon.wavenumber / 100 : photon.wavelength * 1e9;
  const atNm = (nm: number) => photonFromWavelength(nm * 1e-9);
  const lo = atNm(wavelengthMax);
  const hi = atNm(wavelengthMin);

  const wl = Array.from({ length: 300 }, (_, i) => wavelengthMin + (i / 299) * (wavelengthMax - wavelengthMin));
  const series = [
    { name: "Wavenumber (cm⁻¹)", color: "#60a5fa", points: wl.map((x) => ({ x, y: atNm(x).wavenumber / 100 })) },
    { name: "Energy (eV)", color: "#34d399", dashed: true, points: wl.map((x) => ({ x, y: atNm(x).energy / eV })) },
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {rangePresets.map((preset) => (
          <button key={preset.label} onClick={() => { setWavelengthMin(preset.min); setWavelengthMax(preset.max); }} className={`rounded-full border px-3 py-1 text-sm transition ${wavelengthMin === preset.min && wavelengthMax === preset.max ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="λ min" value={wavelengthMin} onChange={setWavelengthMin} min={WL_MIN} max={WL_MAX - 1} step={1} unit="nm" />
        <InputSlider label="λ max" value={wavelengthMax} onChange={setWavelengthMax} min={Math.max(WL_MIN + 1, wavelengthMin + 1)} max={WL_MAX} step={1} unit="nm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <ResultCard label="Range (cm⁻¹)" value={`${(lo.wavenumber / 100).toFixed(1)} — ${(hi.wavenumber / 100).toFixed(1)}`} tone="blue" />
        <ResultCard label="Energy Range (eV)" value={`${(lo.energy / eV).toFixed(4)} — ${(hi.energy / eV).toFixed(4)}`} tone="green" />
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {singlePresets.map((preset) => (
            <button key={preset} onClick={() => { setSingleValue(preset); setMode("wl-to-wn"); }} className={`rounded-full border px-3 py-1 text-sm transition ${wlMode && singleValue === preset ? "border-yellow-400 bg-yellow-500/15 text-yellow-200" : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-500"}`}>
              {preset} nm
            </button>
          ))}
        </div>
        <div className="flex gap-4 items-end mb-4 flex-wrap">
          <div className="min-w-[220px] flex-1">
            <ValidatedNumberInput label={wlMode ? "Wavelength (nm, vacuum)" : "Wavenumber (cm⁻¹)"} value={singleRaw} onChange={setSingleValue} min={1e-3} max={1e9} />
          </div>
          <button onClick={() => setMode(wlMode ? "wn-to-wl" : "wl-to-wn")} aria-label="Swap conversion direction" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white">⇄</button>
          <div className="min-w-[220px] flex-1 bg-gray-800 rounded px-3 py-2">
            <p className="text-sm text-gray-400">{wlMode ? "Wavenumber" : "Wavelength (vacuum)"}</p>
            <p className="text-lg font-bold text-yellow-400">{sig(converted, 7)} {wlMode ? "cm⁻¹" : "nm"}</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">
          Freq: <span className="text-purple-400">{sig(photon.frequency / 1e12, 6)} THz</span> | Energy: <span className="text-green-400">{sig(photon.energy / eV, 6)} eV</span>
        </p>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-1">
        <p><span className="text-blue-400 font-mono">ν̃ (cm⁻¹) = 10⁷ / λ (nm)</span></p>
        <p><span className="text-green-400 font-mono">E (eV) = hc/(eλ) = 1239.842 / λ (nm)</span></p>
        <p><span className="text-purple-400 font-mono">f (Hz) = c/λ = 2.99792458 × 10¹⁷ / λ (nm)</span></p>
        <p>
          Wavelengths are vacuum values; c, h and e are exact in the SI, so the conversions are exact. A wavelength
          read in air is shorter by n_air ≈ 1.00027 (visible), so its wavenumber is about 0.03 % higher than the vacuum one.
        </p>
      </div>

      <SimpleLineChart title="Wavelength relationships" xLabel="Wavelength (nm)" yLabel="Value" yScale="log" series={series} />
    </>
  );
}
