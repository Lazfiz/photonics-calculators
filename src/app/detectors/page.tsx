"use client";

import Link from "next/link";

const calculators = [
  { name: "NEP Calculator", href: "/detectors/nep", desc: "Noise Equivalent Power from dark current, bandwidth, and responsivity" },
  { name: "Responsivity", href: "/detectors/responsivity", desc: "Photodetector responsivity from quantum efficiency and wavelength" },
  { name: "Quantum Efficiency", href: "/detectors/quantum-efficiency", desc: "QE vs wavelength curves for Si, InGaAs, CCD, CMOS" },
  { name: "Spectral Response", href: "/detectors/spectral-response", desc: "Spectral responsivity and QE modeling with temperature" },
  { name: "Gain-Bandwidth Product", href: "/detectors/gain-bandwidth", desc: "GBW trade-off: open-loop and closed-loop gain vs frequency" },
  { name: "Saturation & Linearity", href: "/detectors/saturation", desc: "Full well capacity, dynamic range, and nonlinearity" },
  { name: "Pixel Crosstalk", href: "/detectors/crosstalk", desc: "Charge diffusion and crosstalk between adjacent pixels" },
  { name: "Modulation Transfer Function", href: "/detectors/modulation-transfer", desc: "Detector MTF: pixel aperture, diffusion, and optical blur" },
  { name: "Photoresponse Non-Uniformity", href: "/detectors/uniformity", desc: "PRNU and DSNU: spatial sensitivity variations" },
  { name: "Temporal Noise", href: "/detectors/temporal-noise", desc: "1/f noise, white noise, read noise vs frequency and time" },
  { name: "Shot Noise", href: "/detectors/shot-noise", desc: "Shot noise from photocurrent and bandwidth" },
  { name: "Dark Current", href: "/detectors/dark-current", desc: "Dark current from temperature and semiconductor parameters" },
  { name: "Thermal Noise", href: "/detectors/thermal-noise", desc: "Johnson-Nyquist thermal noise in detector circuits" },
  { name: "EM Gain", href: "/detectors/em-gain", desc: "Electron multiplying gain and excess noise factor" },
  { name: "Full Well Capacity", href: "/detectors/full-well", desc: "Pixel full well capacity and charge handling" },
  { name: "SNDR", href: "/detectors/sndr", desc: "Signal-to-Noise and Distortion Ratio" },
  { name: "Bandwidth", href: "/detectors/bandwidth", desc: "Detector bandwidth and frequency response" },
  { name: "CCD vs CMOS", href: "/detectors/ccd-vs-cmos", desc: "Comparison of CCD and CMOS sensor technologies" },
  { name: "CCD/CMOS Characteristics", href: "/detectors/ccd-cmos", desc: "CCD and CMOS sensor parameter calculator" },
  { name: "Pixel Crosstalk (legacy)", href: "/detectors/pixel-crosstalk", desc: "Pixel crosstalk and charge spreading model" },
  { name: "SPAD Detector", href: "/detectors/spad", desc: "Single-photon avalanche diode: PDE, DCR, dead time, afterpulsing" },
  { name: "PMT Gain & SNR", href: "/detectors/pmt", desc: "Photomultiplier tube dynode gain and signal-to-noise analysis" },
  { name: "Photodiode Speed vs Area", href: "/detectors/photodiode-speed", desc: "RC-limited bandwidth and NEP trade-off with detector area" },
  { name: "Si vs InGaAs", href: "/detectors/si-vs-inge", desc: "Silicon vs InGaAs spectral coverage, QE, and SNR comparison" },
  { name: "Cooling Benefit", href: "/detectors/cooling-benefit", desc: "Dark current reduction and SNR improvement from TEC/cryogenic cooling" },
  { name: "Hybrid Detector", href: "/detectors/hybrid-detector", desc: "Photodiode + TIA hybrid noise analysis and NEP optimization" },
  { name: "EMCCD vs sCMOS", href: "/detectors/electron-multiplying", desc: "Low-light imaging comparison: EM gain vs low read noise" },
  { name: "ICCD Design", href: "/detectors/intensified-camera", desc: "Intensified CCD: MCP gain, gating, system QE, and SNR" },
];

export default function DetectorsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Photodetectors</h1>
      <p className="text-gray-400 mb-8">Calculators for photodetector performance metrics.</p>
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
