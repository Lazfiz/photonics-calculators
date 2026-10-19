"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import ResultCard from "../../../components/result-card";
import ValidatedNumberInput from "../../../components/validated-number-input";
import { useURLState } from "../../../hooks/use-url-state";
import { c } from "../../../physics/constants";
import { peakShape } from "../../../physics/spectroscopy/peak-model";
import { stokesShift } from "../../../physics/spectroscopy/stokes-shift";

const WL_MIN = 150, WL_MAX = 3000, W_MIN = 0.1, W_MAX = 1000;
const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);
const fmt = (x: number, digits = 4) => (Number.isFinite(x) ? x.toPrecision(digits) : "—");

export default function StokesShiftPage() {
  const [absPeakRaw, setAbsPeak] = useURLState("absPeak", 480);
  const [emPeakRaw, setEmPeak] = useURLState("emPeak", 520);
  const [absFWHMRaw, setAbsFWHM] = useURLState("absFWHM", 30);
  const [emFWHMRaw, setEmFWHM] = useURLState("emFWHM", 40);
  const absPeak = clamp(absPeakRaw, WL_MIN, WL_MAX, 480);
  const emPeak = clamp(emPeakRaw, WL_MIN, WL_MAX, 520);
  const absFWHM = clamp(absFWHMRaw, W_MIN, W_MAX, 30);
  const emFWHM = clamp(emFWHMRaw, W_MIN, W_MAX, 40);

  const { dNm, dCm, dEv } = stokesShift(absPeak, emPeak);
  const antiStokes = dCm < 0;

  // Window: both bands out to ±2.5 FWHM.
  const lo = Math.max(1, Math.min(absPeak - 2.5 * absFWHM, emPeak - 2.5 * emFWHM));
  const hi = Math.max(absPeak + 2.5 * absFWHM, emPeak + 2.5 * emFWHM);
  const n = Math.min(4000, Math.max(500, Math.ceil((8 * (hi - lo)) / Math.min(absFWHM, emFWHM))));
  const wl = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
  const band = (center: number, fwhm: number) => wl.map((x) => ({ x, y: Math.round(peakShape(x - center, fwhm, "gaussian") * 1e6) / 1e6 }));
  const series = [
    { name: "Absorption", color: "#60a5fa", points: band(absPeak, absFWHM) },
    { name: "Emission", color: "#f87171", points: band(emPeak, emFWHM) },
    { name: "Shift between the maxima", color: "#fbbf24", dashed: true, showPoints: true, points: [{ x: absPeak, y: 1 }, { x: emPeak, y: 1 }] },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ValidatedNumberInput label="Absorption maximum λ_abs (nm)" value={absPeakRaw} onChange={setAbsPeak} min={WL_MIN} max={WL_MAX} />
        <ValidatedNumberInput label="Emission maximum λ_em (nm)" value={emPeakRaw} onChange={setEmPeak} min={WL_MIN} max={WL_MAX} />
        <ValidatedNumberInput label="Absorption FWHM (nm, chart only)" value={absFWHMRaw} onChange={setAbsFWHM} min={W_MIN} max={W_MAX} />
        <ValidatedNumberInput label="Emission FWHM (nm, chart only)" value={emFWHMRaw} onChange={setEmFWHM} min={W_MIN} max={W_MAX} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-4">
        <ResultCard label="Stokes shift Δλ" value={`${fmt(dNm)} nm`} tone="blue" />
        <ResultCard label="Stokes shift Δν̃" value={`${fmt(dCm, 5)} cm⁻¹`} tone="green" subtext={`= ${fmt((dCm * 100 * c) / 1e9, 4)} GHz`} />
        <ResultCard label="Energy difference ΔE" value={`${fmt(dEv)} eV`} tone="orange" subtext={`= ${fmt(dEv * 1e3, 4)} meV`} />
      </div>
      {antiStokes && (
        <p className="mb-4 text-sm text-amber-300">
          The emission maximum lies at a shorter wavelength than the absorption maximum: an anti-Stokes shift, which a
          one-photon fluorophore shows only from thermally populated levels or by up-conversion.
        </p>
      )}
      <p className="mb-8 text-sm text-gray-400">
        Quote the shift in cm⁻¹ or eV: the same Δλ means a larger energy gap in the blue than in the red. The widths only
        shape the chart; the bands are drawn as Gaussians in wavelength for illustration.
      </p>

      <SimpleLineChart title="Absorption and emission bands" xLabel="Wavelength (nm)" yLabel="Normalised intensity" series={series} />

      <div className="bg-gray-900 rounded-lg p-4 mt-6 text-sm text-gray-300 space-y-1">
        <p className="font-mono text-blue-400">Δλ = λ_em − λ_abs</p>
        <p className="font-mono text-green-400">Δν̃ = 10⁷ (1/λ_abs − 1/λ_em) cm⁻¹ (λ in nm)</p>
        <p className="font-mono text-orange-400">ΔE = hc (1/λ_abs − 1/λ_em), hc = 1239.84 eV·nm</p>
        <p>
          The Stokes shift is the gap between the absorption and emission maxima. After excitation the molecule relaxes
          vibrationally, and its surroundings reorganise, before it emits, so emission comes from a lower energy. Solvent
          polarity adds to the shift (Lippert–Mataga). Compare maxima taken on the same axis: a band&apos;s maximum moves
          when a spectrum per nm is converted to one per cm⁻¹. The vibronic model on the band-model page shows how the
          shift follows from the Huang–Rhys factor.
        </p>
      </div>
    </>
  );
}
