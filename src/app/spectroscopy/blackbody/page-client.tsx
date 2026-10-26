"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { b_Wien } from "../../../physics/constants";
import { blackbodyBandFraction, planckExitance, totalExitance } from "../../../physics/blackbody";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const T_MIN = 100;
const T_MAX = 40000;
const temperaturePresets = [300, 1200, 3000, 5778];

export default function BlackbodyPage() {
  const [tRaw, setTemperature] = useURLState("temperature", 5778);
  const [band1Raw, setBand1] = useURLState("bandFromNm", 380);
  const [band2Raw, setBand2] = useURLState("bandToNm", 780);

  const T = clamp(tRaw, T_MIN, T_MAX, 5778);
  const b1 = clamp(band1Raw, 1, 1e6, 380);
  const b2In = clamp(band2Raw, 1, 1e6, 780);
  const b2 = b2In > b1 ? b2In : b1 * 2;

  const peakNm = (b_Wien / T) * 1e9;
  // Radiance of a Lambertian emitter: L = M/π.
  const radianceNm = (nm: number) => (planckExitance(nm * 1e-9, T) / Math.PI) * 1e-9;
  const exitance = totalExitance(T);
  const bandFraction = blackbodyBandFraction(b1 * 1e-9, b2 * 1e-9, T);

  const n = 400;
  const wl = Array.from({ length: n + 1 }, (_, i) => 0.2 * peakNm * 100 ** (i / n));
  const curve = (xs: number[]) => xs.map((x) => ({ x, y: radianceNm(x) })).filter((p) => p.y > 0);
  const bandPts = curve(wl.filter((x) => x >= b1 && x <= b2));
  const series = [
    { name: `${T} K`, color: "#f87171", points: curve(wl) },
    ...(bandPts.length >= 2 ? [{ name: `Band ${b1}–${b2} nm`, color: "#fbbf24", points: bandPts }] : []),
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {temperaturePresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setTemperature(preset)}
            className={`rounded-full border px-3 py-1 text-sm transition ${T === preset ? "border-orange-400 bg-orange-500/15 text-orange-200" : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"}`}
          >
            {preset} K
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <InputSlider label="Temperature" value={T} onChange={setTemperature} min={T_MIN} max={T_MAX} step={1} unit="K" />
        <ValidatedNumberInput label="Band from (nm)" value={band1Raw} onChange={setBand1} min={1} max={1e6} />
        <ValidatedNumberInput label="Band to (nm)" value={band2Raw} onChange={setBand2} min={1} max={1e6} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ResultCard label="Peak wavelength (Wien)" value={`${peakNm.toFixed(1)} nm`} tone="yellow" subtext={`λ_peak T = ${(b_Wien * 1e6).toFixed(1)} µm·K`} />
        <ResultCard label="Peak spectral radiance" value={`${radianceNm(peakNm).toExponential(3)} W/(m²·sr·nm)`} tone="red" />
        <ResultCard label="Radiant exitance M = σT⁴" value={`${exitance.toExponential(3)} W/m²`} tone="blue" subtext="Power per unit area into the hemisphere" />
        <ResultCard label="Radiance L = σT⁴/π" value={`${(exitance / Math.PI).toExponential(3)} W/(m²·sr)`} tone="purple" subtext="Same in every direction (Lambertian)" />
        <ResultCard label={`Fraction in ${b1}–${b2} nm`} value={Number.isFinite(bandFraction) ? `${(bandFraction * 100).toFixed(2)} %` : "—"} tone="green" subtext={Number.isFinite(bandFraction) ? `${(bandFraction * exitance).toExponential(3)} W/m² in the band` : undefined} />
      </div>

      <SimpleLineChart
        title="Spectral radiance vs wavelength"
        xLabel="Wavelength (nm)"
        yLabel="Spectral radiance (W/m²/sr/nm)"
        xScale="log"
        yScale="log"
        series={series}
      />

      <div className="rounded-xl border border-gray-800 bg-gray-900/80 p-4 mt-6 text-sm text-gray-300 leading-6 space-y-1">
        <p className="font-mono text-red-400">L_λ = 2hc² / (λ⁵ (e^(hc/λk_BT) − 1)),  M_λ = π L_λ</p>
        <p className="font-mono text-yellow-400">λ_peak = b / T, b = 2.897772 × 10⁶ nm·K</p>
        <p className="font-mono text-blue-400">M = σT⁴, σ = 5.670374 × 10⁻⁸ W m⁻² K⁻⁴</p>
        <p>
          These are the values for an ideal blackbody in vacuum; a real surface emits ε(λ) times as much. The peak of
          the spectrum per unit frequency or per wavenumber lies at a longer wavelength than λ_peak (about 1.76 λ_peak),
          because the curve&apos;s shape depends on the spectral variable. The band fraction uses the series form of
          the blackbody function (Siegel &amp; Howell).
        </p>
      </div>
    </>
  );
}
