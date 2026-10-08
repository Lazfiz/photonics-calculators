import type { CalculatorEntry } from "../types";

export const freeSpaceComms: CalculatorEntry[] = [
  {
    slug: "acquisition-tracking",
    title: "FSO Acquisition and Tracking",
    description: "Acquisition probability, scan lines and scan time over the uncertainty cone, beacon SNR and margin, and tracking jitter for a free-space optical terminal.",
  },
  {
    slug: "adaptive-optics",
    title: "Adaptive Optics for FSO",
    description: "Fried parameter r₀, Greenwood frequency, isoplanatic angle and Strehl ratio with and without adaptive optics for a free-space optical link.",
    keywords: ["Adaptive Optics Strehl Gain"],
  },
  {
    slug: "aperture-averaging",
    title: "Aperture Averaging",
    description: "Aperture-averaging factor for plane and spherical waves, Rytov variance and the reduced scintillation index versus receiver diameter over √(λL).",
  },
  {
    slug: "atmosphere",
    title: "Atmospheric Transmission",
    description: "Molecular and aerosol extinction for free-space optical links.",
  },
  {
    slug: "atmospheric-loss",
    title: "FSO Atmospheric Loss",
    description: "Visibility-based aerosol (Kim) and Rayleigh scattering: attenuation in dB/km, total path loss and transmittance of a free-space optical link.",
  },
  {
    slug: "background-noise",
    title: "FSO Background Noise",
    description: "Background power, photon rate and electrons per bit from day sky, night sky, direct sun or urban glow for a given receiver FOV, aperture and filter.",
  },
  {
    slug: "beam-wander",
    title: "Beam Wander",
    description: "RMS turbulence-induced beam wander and the resulting pointing loss of a Gaussian beam versus Cn², path length, beam radius and wavelength.",
  },
  {
    slug: "ber",
    title: "Photon-Counting BER (OOK and DPSK)",
    description: "Exact Poisson bit error rate of photon-counting OOK and DPSK receivers versus detected photons per bit and dark plus background counts.",
  },
  {
    slug: "bpsk-qpsk",
    title: "BPSK and QPSK Error Rates",
    description: "Bit and symbol error rates of BPSK, Gray-coded QPSK and OQPSK versus Eb/N0, with spectral efficiency, bandwidth, required receive power and margin.",
  },
  {
    slug: "channel-capacity",
    title: "FSO Channel Capacity",
    description: "Shannon capacity, achievable rate of OOK, PSK and 16-QAM after FEC overhead, gap to Shannon and required SNR for a given bandwidth and SNR.",
  },
  {
    slug: "diversity-reception",
    title: "Diversity Reception",
    description: "Diversity gain, combined scintillation and outage probability for selection, equal-gain and maximal-ratio combining with N receivers in turbulence.",
  },
  {
    slug: "eye-safety-fso",
    title: "FSO Eye Safety",
    description: "Simplified educational estimate of MPE, NOHD, laser class and safety factor for an FSO transmitter. Not for safety decisions; use IEC 60825-1.",
  },
  {
    slug: "fade-probability",
    title: "FSO Fade Probability",
    description: "Gamma-gamma fade probability, mean fade time and diversity gain versus fade threshold, with aperture averaging, for an FSO link in turbulence.",
  },
  {
    slug: "fog-attenuation",
    title: "Fog Attenuation",
    description: "Optical attenuation in fog from visibility with the Kim or Kruse model: exponent q, attenuation coefficient, total path loss and transmitted fraction.",
  },
  {
    slug: "geometric-loss",
    title: "FSO Geometric Loss",
    description: "Beam diameter at the receiver, geometric spreading loss and coupling efficiency from transmitter divergence, apertures, range and wavelength.",
  },
  {
    slug: "lasercom-link",
    title: "Lasercom Link Budget",
    description: "Lasercom link budget with Gaussian-beam transmit and receive gains, free-space path loss, spot size at the receiver, and pointing and atmospheric losses.",
  },
  {
    slug: "link-budget",
    title: "FSO Link Budget",
    description: "Interactive free-space optical link budget with sliders, presets, and received-power versus range view.",
    lede: "Interactive free-space optical link budget with presets, sliders, and received-power versus range view.",
    related: [
      { href: "/free-space-comms/geometric-loss" },
      { href: "/free-space-comms/lasercom-link" },
      { href: "/free-space-comms/optical-antenna" },
      { href: "/free-space-comms/point-ahead" },
    ],
  },
  {
    slug: "optical-antenna",
    title: "Optical Antenna Gain",
    description: "Telescope gain, directivity, divergence, beam waist and Rayleigh range with central obscuration, aperture efficiency and beam quality M².",
  },
  {
    slug: "point-ahead",
    title: "Point-Ahead Angle",
    description: "Point-ahead angle from relative velocity, transmit beamwidth, time of flight and required pointing accuracy for LEO, GEO and deep-space laser links.",
  },
  {
    slug: "pointing-loss",
    title: "Pointing Loss",
    description: "Interactive free-space optical pointing-loss calculator with jitter, misalignment, and aperture coupling.",
    lede: "Interactive FSO pointing-loss calculator with jitter, misalignment, beam waist, and aperture coupling.",
    keywords: ["Pointing Error Loss"],
    related: [
      { href: "/free-space-comms/point-ahead" },
      { href: "/free-space-comms/quantum-key-distribution" },
      { href: "/free-space-comms/rain-attenuation" },
    ],
  },
  {
    slug: "quantum-key-distribution",
    title: "QKD Secure Key Rate",
    description: "Decoy-state BB84 secure key rate, QBER, single-photon yield and maximum range versus channel loss, detector efficiency, dark counts and pulse rate.",
  },
  {
    slug: "rain-attenuation",
    title: "Rain Attenuation",
    description: "Specific and total attenuation of a free-space optical link in rain from the rain rate with the power law α = k·Rᵃ, for a given range.",
  },
  {
    slug: "receiver-fov",
    title: "Receiver FOV vs Background Noise",
    description: "Analyze receiver field of view trade-offs against background radiation noise.",
  },
  {
    slug: "scintillation",
    title: "Scintillation Index",
    description: "Rytov variance, aperture averaging, and fade probability for atmospheric turbulence.",
    keywords: ["Scintillation and Coherence Length"],
  },
  {
    slug: "security",
    title: "FSO Physical-Layer Security",
    description: "Power at the receiver and an off-axis eavesdropper, Bob/Eve ratio, secrecy capacity and a BB84 key-rate estimate for a free-space optical link.",
  },
  {
    slug: "snow-attenuation",
    title: "Snow Attenuation",
    description: "Specific and total attenuation of a free-space optical link in dry or wet snow from the snowfall rate (water equivalent), with equivalent visibility.",
  },
  {
    slug: "wavelength-selection",
    title: "FSO Wavelength Selection",
    description: "Compare 850, 1064, 1310 and 1550 nm for an FSO link by eye safety, atmospheric loss, range and data rate, and get a recommended wavelength.",
  },
];
