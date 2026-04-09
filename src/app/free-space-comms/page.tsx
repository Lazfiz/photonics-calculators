import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/free-space-comms' },  title: "Free-Space Optical Communications Calculators",
  description: "Free-space optics calculators for link budgets, pointing loss, scintillation, BER, weather attenuation, and optical comms.",
};


const calculators = [
  { name: "Link Budget", href: "/free-space-comms/link-budget", desc: "Free-space optical link power budget analysis" },
  { name: "Beam Wander", href: "/free-space-comms/beam-wander", desc: "Beam pointing error and turbulence-induced wander" },
  { name: "BER Analysis", href: "/free-space-comms/ber", desc: "Bit error rate for OOK and DPSK modulation" },
  { name: "Atmosphere", href: "/free-space-comms/atmosphere", desc: "Atmospheric transmission and absorption" },
  { name: "Scintillation", href: "/free-space-comms/scintillation", desc: "Scintillation index and fade statistics" },
  { name: "Pointing Error", href: "/free-space-comms/pointing-error", desc: "Pointing error loss and misalignment" },
  { name: "Receiver FOV", href: "/free-space-comms/receiver-fov", desc: "Receiver field of view and background noise" },
  { name: "Geometric Loss", href: "/free-space-comms/geometric-loss", desc: "Geometric spreading and beam divergence loss" },
  { name: "Fog Attenuation", href: "/free-space-comms/fog-attenuation", desc: "Fog attenuation (Kim/Kruse models)" },
  { name: "Rain Attenuation", href: "/free-space-comms/rain-attenuation", desc: "Rain scattering attenuation at optical wavelengths" },
  { name: "Snow Attenuation", href: "/free-space-comms/snow-attenuation", desc: "Snow attenuation for dry and wet snow" },
  { name: "Adaptive Optics", href: "/free-space-comms/adaptive-optics", desc: "AO correction for atmospheric turbulence" },
  { name: "Wavelength Selection", href: "/free-space-comms/wavelength-selection", desc: "Best wavelength comparison for FSO links" },
  { name: "Diversity Reception", href: "/free-space-comms/diversity-reception", desc: "Spatial diversity and combining techniques" },
  { name: "Security", href: "/free-space-comms/security", desc: "FSO security, secrecy capacity, and QKD" },
  { name: "Lasercom Link Budget", href: "/free-space-comms/lasercom-link", desc: "Full lasercom link with Gaussian beam TX/RX gains and coupling" },
  { name: "Optical Antenna", href: "/free-space-comms/optical-antenna", desc: "Cassegrain antenna gain, divergence, and beam parameters" },
  { name: "Acquisition & Tracking", href: "/free-space-comms/acquisition-tracking", desc: "Acquisition probability, scan time, and tracking SNR" },
  { name: "Point-Ahead Angle", href: "/free-space-comms/point-ahead", desc: "Point-ahead compensation for satellite lasercom links" },
  { name: "BPSK/QPSK for FSO", href: "/free-space-comms/bpsk-qpsk", desc: "BER, spectral efficiency, and power for coherent FSO modulation" },
  { name: "Channel Capacity", href: "/free-space-comms/channel-capacity", desc: "Shannon capacity and achievable rates for FSO channels" },
  { name: "Background Noise", href: "/free-space-comms/background-noise", desc: "Optical background power, photon rate, and noise analysis" },
  { name: "Eye Safety for FSO", href: "/free-space-comms/eye-safety-fso", desc: "MPE, NOHD, and laser classification per IEC 60825-1" },
];

export default function FreeSpaceCommsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-4xl mx-auto">
      <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-6 inline-block">
        ← Back to Calculators
      </Link>
      <h1 className="text-3xl font-bold mb-2">Free-Space Communications</h1>
      <p className="text-gray-400 mb-8">Calculators for free-space optical communication links.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {calculators.map((calc) => (
          <Link
            key={calc.href}
            href={calc.href}
            className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-blue-500 hover:bg-gray-900/80 transition"
          >
            <h2 className="text-lg font-semibold text-white">{calc.name}</h2>
            <p className="text-sm text-gray-400 mt-1">{calc.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
