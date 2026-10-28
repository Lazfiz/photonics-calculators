"use client";

import SimpleLineChart from "../../../components/simple-line-chart";
import InputSlider from "../../../components/input-slider";
import ResultCard from "../../../components/result-card";
import { useURLState } from "../../../hooks/use-url-state";
import {
  BESSEL_J1_FIRST_ZERO, airyFirstZeroRadius, airyFwhm, airyIntensity, encircledEnergyAiry,
} from "../../../physics/imaging/diffraction-psf";
import { abbeLateralFwhm } from "../../../physics/imaging/super-resolution";

const clamp = (x: number, lo: number, hi: number, fallback: number) => (Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : fallback);

export default function AiryDiskPage() {
  const [wavelengthRaw, setWavelength] = useURLState("wavelength", 550); // nm
  const [naRaw, setNa] = useURLState("na", 0.95);
  const wavelength = clamp(wavelengthRaw, 300, 2000, 550);
  const na = clamp(naRaw, 0.1, 1.5, 0.95);
  const lambda = wavelength * 1e-9;

  const r0 = airyFirstZeroRadius(lambda, na);
  const fwhm = airyFwhm(lambda, na);
  const abbe = abbeLateralFwhm(lambda, na);

  // Spot size vs NA (µm).
  const nas = Array.from({ length: 100 }, (_, i) => 0.1 + i * 0.014);
  const sizeSeries = [
    { name: "Airy radius (first zero)", color: "#60a5fa", points: nas.map((x) => ({ x, y: airyFirstZeroRadius(lambda, x) * 1e6 })) },
    { name: "Airy FWHM", color: "#34d399", points: nas.map((x) => ({ x, y: airyFwhm(lambda, x) * 1e6 })) },
    { name: "Abbe λ/2NA", color: "#fbbf24", dashed: true, points: nas.map((x) => ({ x, y: abbeLateralFwhm(lambda, x) * 1e6 })) },
    { name: "Current", color: "#f87171", showPoints: true, points: [{ x: na, y: r0 * 1e6 }] },
  ];

  // Radial profile and encircled energy, r in units of the Airy radius (0 … 3).
  const rs = Array.from({ length: 151 }, (_, i) => i * 0.02);
  const profileSeries = [
    { name: "Intensity [2J₁(v)/v]²", color: "#60a5fa", points: rs.map((x) => ({ x, y: airyIntensity(x * BESSEL_J1_FIRST_ZERO) })) },
    { name: "Encircled energy", color: "#a78bfa", points: rs.map((x) => ({ x, y: encircledEnergyAiry(x * BESSEL_J1_FIRST_ZERO) })) },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <InputSlider label="Wavelength" value={wavelengthRaw} onChange={setWavelength} min={300} max={2000} step={1} unit="nm" />
        <InputSlider label="Numerical Aperture" value={naRaw} onChange={setNa} min={0.1} max={1.5} step={0.01} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <ResultCard label="Airy radius (first dark ring)" value={`${(r0 * 1e6).toFixed(3)} µm`} subtext="0.610 λ/NA" tone="blue" />
        <ResultCard label="Airy disk diameter (1 AU)" value={`${(2 * r0 * 1e6).toFixed(3)} µm`} subtext="1.22 λ/NA" tone="green" />
        <ResultCard label="Intensity FWHM" value={`${(fwhm * 1e9).toFixed(1)} nm`} subtext="0.514 λ/NA" tone="yellow" />
        <ResultCard label="Abbe limit λ/2NA" value={`${(abbe * 1e9).toFixed(1)} nm`} subtext={`${(1e-3 / abbe).toFixed(0)} line pairs/mm`} tone="purple" />
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Uniformly filled circular pupil, no aberrations, scalar theory. {(encircledEnergyAiry(BESSEL_J1_FIRST_ZERO) * 100).toFixed(1)} % of
        the light falls inside the first dark ring. Above NA ≈ 0.9 the vector focus differs: with linear polarization it is ≈ 30 % wider
        along the polarization and slightly narrower across it at NA 1.4; unpolarized or circular light widens it ≈ 10–20 %. An NA above 1 needs an immersion medium.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <SimpleLineChart title="Diffraction-limited spot size vs NA" xLabel="Numerical aperture" yLabel="Size (µm)" series={sizeSeries} />
        <SimpleLineChart title="Airy pattern and encircled energy" xLabel="Radius / Airy radius" yLabel="Relative intensity, energy fraction" series={profileSeries} />
      </div>
    </>
  );
}
