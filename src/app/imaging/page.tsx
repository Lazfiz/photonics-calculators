"use client";

import Link from "next/link";

const calculators = [
  { name: "Resolution Calculator", href: "/imaging/resolution", desc: "Abbe and Rayleigh lateral resolution from NA, wavelength, and immersion medium" },
  { name: "Depth of Field", href: "/imaging/dof", desc: "Microscope depth of field including diffraction and detector contributions" },
  { name: "Modulation Transfer Function", href: "/imaging/mtf", desc: "Diffraction-limited MTF with defocus effects" },
  { name: "NA from f/#", href: "/imaging/na-from-fnumber", desc: "Convert between numerical aperture and f-number" },
  { name: "Telecentricity", href: "/imaging/telecentricity", desc: "Telecentric system design and object-space telecentricity check" },
  { name: "Tube Lens Pairing", href: "/imaging/tube-lens", desc: "Match tube lenses with infinity-corrected objectives" },
  { name: "Magnification Stack", href: "/imaging/magnification-stack", desc: "Total magnification through relay and tube lens systems" },
  { name: "Pupil Matching", href: "/imaging/pupil-matching", desc: "Match exit pupil of illumination to entrance pupil of objective" },
  { name: "SNR in Microscopy", href: "/imaging/snr", desc: "Shot noise, read noise, and SNR for fluorescence microscopy" },
  { name: "Confocal Pinhole Size", href: "/imaging/confocal-pinhole", desc: "Optimal pinhole diameter for confocal microscopy (Airy units)" },
];

export default function ImagingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:underline mb-6 inline-block">← Back to Calculators</Link>
      <h1 className="text-3xl font-bold mb-2">Imaging &amp; Microscopy</h1>
      <p className="text-gray-400 mb-8">Resolution, contrast, depth of field, and optical system design calculators for microscopy.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-blue-500 transition-colors"
          >
            <h2 className="text-lg font-semibold text-blue-400">{c.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
