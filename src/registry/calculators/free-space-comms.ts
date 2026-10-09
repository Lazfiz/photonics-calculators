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
    tier: "textbook",
    modelNote: "One uniform turbulent layer with one wind speed; the corrected Zernike modes are taken as about the actuator count. Not modelled: wavefront-sensor noise, anisoplanatism and scintillation.",
    references: [
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Plane-wave Fried parameter and isoplanatic angle for constant Cn².",
      },
      {
        citation: "Noll R. J. (1976). Zernike polynomials and atmospheric turbulence. J. Opt. Soc. Am. 66, 207. Uncorrected phase variance and the residual after correcting J Zernike modes.",
        url: "https://doi.org/10.1364/josa.66.000207",
      },
      {
        citation: "Greenwood D. P. (1977). Bandwidth specification for adaptive optics systems. J. Opt. Soc. Am. 67, 390. Greenwood frequency and servo-lag variance of a first-order loop.",
        url: "https://doi.org/10.1364/josa.67.000390",
      },
      {
        citation: "Parenti R. R., Sasiela R. J. (1994). Laser-guide-star systems for astronomical applications. J. Opt. Soc. Am. A 11, 288. Semi-empirical Strehl ratio with the seeing halo.",
        url: "https://doi.org/10.1364/josaa.11.000288",
      },
    ],
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
    tier: "textbook",
    modelNote: "Rayleigh scattering of standard sea-level air plus an empirical aerosol law scaled from the visibility, fitted up to 1.55 µm. Not modelled: molecular absorption bands, rain and snow, turbulence, geometric loss.",
    references: [
      {
        citation: "Bucholtz A. (1995). Rayleigh-scattering calculations for the terrestrial atmosphere. Appl. Opt. 34, 2765. Rayleigh scattering of standard sea-level air, eqs. (2)–(4).",
        url: "https://doi.org/10.1364/ao.34.002765",
      },
      {
        citation: "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog and haze for optical wireless communications. Proc. SPIE 4214, 26–37. Visibility-based aerosol exponent q.",
        url: "https://doi.org/10.1117/12.417512",
      },
      {
        citation: "Peck E. R., Reeder K. (1972). Dispersion of Air. J. Opt. Soc. Am. 62, 958. Refractive index of standard air, fitted 0.23–1.69 µm.",
        url: "https://doi.org/10.1364/josa.62.000958",
      },
      {
        citation: "Hansen J. E., Travis L. D. (1974). Light scattering in planetary atmospheres. Space Sci. Rev. 16, 527–610. Cross-check of the Rayleigh coefficient (0.46 % difference).",
        url: "https://doi.org/10.1007/bf00168069",
      },
    ],
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
    tier: "exact",
    modelNote: "Exact for an ideal photon-counting receiver: equiprobable bits, Poisson signal and noise counts. Not modelled: dead time, intersymbol interference, timing jitter or interferometer phase error.",
    references: [
      {
        citation: "Caplan D. O. (2008). Laser communication transmitter and receiver design. In Majumdar A. K., Ricklin J. C. (eds.), Free-Space Laser Communications, pp. 109–246. Springer. Photon-counting quantum limits of OOK and DPSK.",
        url: "https://doi.org/10.1007/978-0-387-28677-8_4",
      },
    ],
  },
  {
    slug: "bpsk-qpsk",
    title: "BPSK and QPSK Error Rates",
    description: "Bit and symbol error rates of BPSK, Gray-coded QPSK and OQPSK versus Eb/N0, with spectral efficiency, bandwidth, required receive power and margin.",
    tier: "textbook",
    modelNote: "Error rates are exact for ideal coherent detection in AWGN (perfect carrier and timing recovery). The required-power line uses a fixed kT = −174 dBm/Hz and a 3 dB noise figure, which the cited text does not cover.",
    references: [
      {
        citation: "Proakis J. G., Salehi M. (2008). Digital Communications, 5th ed. McGraw-Hill. Binary antipodal signalling and Gray-coded QPSK.",
      },
    ],
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
    tier: "exact",
    modelNote: "Exact for a Gaussian beam in vacuum with a static offset and isotropic Gaussian jitter, averaged over the jitter. Not modelled: atmospheric loss, turbulence (beam wander, spreading, scintillation), TX truncation.",
    references: [
      {
        citation: "Farid A. A., Hranilovic S. (2007). Outage Capacity Optimization for Free-Space Optical Links With Pointing Errors. J. Lightwave Technol. 25, 1702–1710. The small-aperture jitter result, which the exact mean capture reduces to for an aperture much smaller than the beam.",
        url: "https://doi.org/10.1109/jlt.2007.899174",
      },
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
    tier: "textbook",
    modelNote: "Plane wave on a horizontal path with constant Cn² and a Kolmogorov spectrum without inner scale. Fade probabilities assume log-normal irradiance, which is optimistic in moderate to strong turbulence.",
    references: [
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Plane-wave Rytov variance, Fried parameter and aperture-averaged scintillation index.",
      },
    ],
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
