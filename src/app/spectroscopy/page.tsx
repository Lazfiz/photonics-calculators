import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy' },  title: "Spectroscopy Calculators",
  description: "Spectroscopy calculators for FTIR, Raman, spectral resolution, calibration, line broadening, and signal analysis.",
};


const calculators = [
  { name: "Spectral Resolution", href: "/spectroscopy/resolution", desc: "Grating spectrometer resolving power and resolution" },
  { name: "Blackbody Radiation", href: "/spectroscopy/blackbody", desc: "Planck's law — spectral radiance and total power" },
  { name: "Beer-Lambert Absorption", href: "/spectroscopy/absorption", desc: "A = εcl — absorbance, transmission vs concentration" },
  { name: "Extinction Coefficient", href: "/spectroscopy/extinction-coefficient", desc: "Molar and specific ε from absorbance measurements" },
  { name: "Optical Density", href: "/spectroscopy/optical-density", desc: "OD ↔ transmission ↔ attenuation (dB)" },
  { name: "Wavenumber Converter", href: "/spectroscopy/wavenumber-converter", desc: "λ ↔ cm⁻¹ ↔ Hz ↔ eV unit conversions" },
  { name: "Raman Spectroscopy", href: "/spectroscopy/raman-spectroscopy", desc: "Stokes/anti-Stokes shift, common Raman peaks" },
  { name: "Fluorescence Lifetime", href: "/spectroscopy/fluorescence", desc: "Single and bi-exponential decay models" },
  { name: "Signal-to-Noise Ratio", href: "/spectroscopy/signal-to-noise", desc: "Shot noise, dark current, read noise breakdown" },
  { name: "Stray Light Rejection", href: "/spectroscopy/stray-light", desc: "Ghost orders and stray light estimation" },
  { name: "Apodization Functions", href: "/spectroscopy/apodization", desc: "Window functions and instrument line shapes" },
  { name: "Doppler Broadening", href: "/spectroscopy/doppler-broadening", desc: "Thermal line broadening of spectral lines" },
  { name: "Etalon FSR", href: "/spectroscopy/etalon-fsr", desc: "Free spectral range and finesse" },
  { name: "FTIR Resolution", href: "/spectroscopy/ftir-resolution", desc: "Interferogram → spectrum resolution limits" },
  { name: "Grating Efficiency", href: "/spectroscopy/grating-efficiency", desc: "Diffraction grating blaze and efficiency" },
  { name: "Jacquinot Advantage", href: "/spectroscopy/jacquinot", desc: "FTIR throughput advantage over dispersive" },
  { name: "Phase Correction", href: "/spectroscopy/phase-correction", desc: "Mertz and Forman phase correction" },
  { name: "Lineshape Fitting", href: "/spectroscopy/lineshape-fit", desc: "Gaussian, Lorentzian, Voigt profile fitting" },
  { name: "Concave Mirror Throughput", href: "/spectroscopy/conc-mirror", desc: "Connes advantage and mirror throughput" },
  { name: "Raman Shift Calculator", href: "/spectroscopy/raman-shift", desc: "Excitation-independent Raman shift conversion" },
  { name: "SNR Averaging", href: "/spectroscopy/snr-averaging", desc: "Co-add scans to improve signal-to-noise" },
  { name: "Fourier Transform Basics", href: "/spectroscopy/fourier-transform", desc: "DFT decomposition of composite signals" },
  { name: "Apodization Comparison", href: "/spectroscopy/apodization-comparison", desc: "Compare 9 window functions and their ILS" },
  { name: "Michelson Interferometer", href: "/spectroscopy/michelson-interferometer", desc: "Interferogram → spectrum via FT" },
  { name: "Spectral Line Broadening", href: "/spectroscopy/spectral-line-broadening", desc: "Doppler, collisional, Voigt broadening" },
  { name: "Spectral Calibration", href: "/spectroscopy/spectral-calibration", desc: "Wavelength calibration with emission lines" },
  { name: "Stray Light Rejection", href: "/spectroscopy/stray-light-rejection", desc: "Stray light impact on photometric accuracy" },
  { name: "Dispersive Element Design", href: "/spectroscopy/dispersive-element", desc: "Grating equation, dispersion, blaze profile" },
  { name: "Spectral Range Calculator", href: "/spectroscopy/spectral-range", desc: "Coverage, resolution, dispersion for spectrometers" },
];

export default function SpectroscopyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Spectroscopy</h1>
      <p className="text-gray-400 mb-8">Calculators for spectrometer design, spectroscopy fundamentals, and signal analysis.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((calc) => (
          <Link key={calc.href} href={calc.href} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 hover:bg-gray-900/80 transition">
            <h2 className="text-lg font-semibold text-white">{calc.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
