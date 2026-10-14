import type { CalculatorEntry } from "../types";

export const freeSpaceComms: CalculatorEntry[] = [
  {
    slug: "acquisition-tracking",
    title: "FSO Acquisition and Tracking",
    description: "Acquisition probability, scan lines and scan time over the uncertainty cone, beacon SNR and margin, and tracking jitter for a free-space optical terminal.",
    knownIssue: "The scan-line count misses the mrad conversion (one line instead of ten at the defaults), the beamwidth ignores wavelength (fixed 30 dBi gain) and the jitter law has no source.",
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
    knownIssue: "The averaging factor uses (D/√(λL))^(7/6) instead of Andrews' [1 + 1.062·kD²/4L]^(−7/6): 0.24 instead of 0.056 at the defaults. The spherical-wave factor is also wrong.",
  },
  {
    slug: "atmospheric-loss",
    title: "FSO Atmospheric Loss",
    description: "Visibility-based aerosol (Kim) and Rayleigh scattering: attenuation in dB/km, total path loss and transmittance of a free-space optical link.",
    keywords: ["Atmospheric Transmission"],
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
    knownIssue: "The filter rejection is applied to light inside the passband (1000× too low), and the sky and solar radiances don't depend on wavelength (the solar value is the 850 nm one).",
  },
  {
    slug: "beam-wander",
    title: "Beam Wander",
    description: "RMS turbulence-induced beam wander and the resulting pointing loss of a Gaussian beam versus Cn², path length, beam radius and wavelength.",
    knownIssue: "The wander formula uses λ^(−1/3) instead of the beam radius W₀^(−1/3) (rms 1.26 cm instead of 0.30 cm at the defaults), and the loss uses the transmitter radius, not the beam at the receiver.",
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
    knownIssue: "The achievable rate ignores the SNR: at 0 dB QPSK shows 1.87 Gbps, above the 1.00 Gbps Shannon capacity. \"Required SNR\" is the Shannon minimum, not a BER requirement.",
  },
  {
    slug: "diversity-reception",
    title: "Diversity Reception",
    description: "Diversity gain, combined scintillation and outage probability for selection, equal-gain and maximal-ratio combining with N receivers in turbulence.",
    knownIssue: "Branch correlation uses field coherence at r₀ instead of irradiance correlation, all three combiners give the same gain, and the outage Q(3/σ) has no physical basis.",
  },
  {
    slug: "eye-safety-fso",
    title: "FSO Eye Safety",
    description: "NOHD, IEC 60825-1 laser class and exposure margin at a chosen distance for a free-space optical transmitter, on the ICNIRP 2013 eye limits with a diverging Gaussian beam.",
    lede: "How far from a free-space optical transmitter the beam is within every eye exposure limit, its laser class, and the margin at a distance you choose.",
    tier: "exact",
    modelNote: "ICNIRP 2013 eye limits for one CW exposure up to t; Gaussian beam averaged over each limit's aperture, growing as a + rφ; IEC 60825-1 class. Not modelled: atmosphere, optical aids, scintillation, pulsed modulation.",
    references: [
      {
        citation: "ICNIRP (2013). Guidelines on limits of exposure to laser radiation of wavelengths between 180 nm and 1,000 µm. Health Phys. 105(3), 271–295. Tables 2, 5 and 8.",
        url: "https://doi.org/10.1097/HP.0b013e3182983fd4",
      },
      {
        citation: "ANSI Z136.1-2014, American National Standard for Safe Use of Lasers. Appendix B: nominal hazard zone and NOHD.",
      },
      {
        citation: "IEC 60825-1:2014, Safety of laser products – Part 1: Equipment classification and requirements. Accessible emission limits and measurement conditions 1 and 3.",
      },
    ],
  },
  {
    slug: "fade-probability",
    title: "FSO Fade Probability",
    description: "Gamma-gamma fade probability, mean fade time and diversity gain versus fade threshold, with aperture averaging, for an FSO link in turbulence.",
    knownIssue: "The aperture-averaging factor and the gamma-gamma α, β are wrong (208 instead of 103 and 98.5 at the defaults), and the page computes a log-normal fade, not gamma-gamma.",
  },
  {
    slug: "fog-attenuation",
    title: "Fog Attenuation",
    description: "Optical attenuation in fog from visibility with the Kim, Kruse or Al Naboulsi (advection, radiation fog) model: specific attenuation in dB/km, path loss and transmittance.",
    tier: "textbook",
    modelNote: "Empirical visibility laws: Kim or Kruse aerosol exponents, or Al Naboulsi's advection and radiation fog fits (690–1550 nm, V = 50–1000 m). They give a mean loss; measured fog loss scatters widely around it.",
    references: [
      {
        citation: "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog and haze for optical wireless communications. Proc. SPIE 4214, 26–37. Visibility-based aerosol exponent q.",
        url: "https://doi.org/10.1117/12.417512",
      },
      {
        citation: "Al Naboulsi M., Sizun H., de Fornel F. (2004). Fog attenuation prediction for optical and infrared waves. Opt. Eng. 43(2), 319–329. Advection and radiation fog laws.",
        url: "https://doi.org/10.1117/1.1637611",
      },
      {
        citation: "Nadeem F., Leitgeb E. (2010). Dense maritime fog attenuation prediction from measured visibility data. Radioengineering 19(2), 223–227. Kruse, Kim and Al Naboulsi laws, eqs. (1)–(6).",
        url: "https://www.radioeng.cz/fulltexts/2010/10_02_223_227.pdf",
      },
      {
        citation: "Kruse P. W., McGlauchlin L. D., McQuistan R. B. (1962). Elements of Infrared Technology: Generation, Transmission and Detection. Wiley. Kruse visibility law.",
      },
    ],
  },
  {
    slug: "geometric-loss",
    title: "FSO Geometric Loss",
    description: "Beam diameter at the receiver, geometric spreading loss and coupling efficiency from transmitter divergence, apertures, range and wavelength.",
    knownIssue: "Coupling exceeds 100 % and the loss goes negative when the beam is smaller than the aperture, and the transmitter aperture input is never used.",
  },
  {
    slug: "lasercom-link",
    title: "Lasercom Link Budget",
    description: "Lasercom link budget with Gaussian-beam transmit and receive gains, free-space path loss, spot size at the receiver, and pointing and atmospheric losses.",
    knownIssue: "A cm/m mix-up adds 40 dB and the beam spreading is counted twice (Friis gains plus a capture loss): −119 dBm instead of about −33 dBm at the defaults. The chart disagrees with the card.",
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
    knownIssue: "The default and maximum antenna gains are radio-scale (30 dBi is a 16 µm aperture at 1550 nm), so the default link is about 100 dB too pessimistic, and the receiver sensitivity is fixed.",
  },
  {
    slug: "optical-antenna",
    title: "Optical Antenna Gain",
    description: "Telescope gain, directivity, divergence, beam waist and Rayleigh range with central obscuration, aperture efficiency and beam quality M².",
    knownIssue: "With M² > 1 the waist and Rayleigh range are wrong (44.9 mm and 4.09 km instead of 49.4 mm and 4.50 km at the defaults), and the obscuration loss is a uniform-illumination area factor.",
  },
  {
    slug: "point-ahead",
    title: "Point-Ahead Angle",
    description: "Point-ahead angle from relative velocity, transmit beamwidth, time of flight and required pointing accuracy for LEO, GEO and deep-space laser links.",
    knownIssue: "The point-ahead angle is v/c instead of 2v⊥/c (half the correct value), the GEO preset uses an Earth-fixed velocity, and the time of flight is plotted in seconds but labelled ms.",
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
    knownIssue: "The key rate leaves out the error-correction term, so the maximum range always hits the 500 km cap, and the default power gives 7.8×10⁵ photons per pulse (no key, yet \"Secure\").",
  },
  {
    slug: "rain-attenuation",
    title: "Rain Attenuation",
    description: "Specific and total attenuation of a free-space optical link in rain from the rain rate with the power law α = k·Rᵃ, for a given range.",
    knownIssue: "The coefficient 0.032 has no source and is about 34× below the ITU-R P.1814 optical law (0.28 instead of 9.3 dB/km at 25 mm/h), and the λ^(−0.2) dependence is unphysical for raindrops.",
  },
  {
    slug: "receiver-fov",
    title: "Receiver FOV vs Background Noise",
    description: "Analyze receiver field of view trade-offs against background radiation noise.",
    knownIssue: "The efficiency is applied twice to the background, and the shot- and thermal-noise SNR is computed but never shown, so the wavelength input changes nothing.",
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
    knownIssue: "Inside the Rayleigh range the far-field formula gives the eavesdropper more power than the transmitter emits, the secrecy capacity is shown in Gbps without a bandwidth, and the BB84 line has no basis.",
  },
  {
    slug: "snow-attenuation",
    title: "Snow Attenuation",
    description: "Specific and total attenuation of a free-space optical link in dry or wet snow from the snowfall rate (water equivalent), with equivalent visibility.",
    knownIssue: "The snow coefficients have no source and are 100–460× below the published FSO snow laws, and the page ranks wet snow above dry snow, the reverse of those laws.",
  },
  {
    slug: "wavelength-selection",
    title: "FSO Wavelength Selection",
    description: "Compare 850, 1064, 1310 and 1550 nm for an FSO link by Class 1 eye-safety limit, atmospheric loss over the range, component maturity and cost, and get a weighted recommendation.",
    tier: "illustrative",
    modelNote: "Qualitative ranking. Eye safety from the IEC Class 1 point-source limit and atmosphere from Kim's law are computed; component and cost ratings are editorial. Ignores link margin, background light, turbulence.",
    references: [
      {
        citation: "IEC 60825-1:2014, Safety of laser products – Part 1: Equipment classification and requirements. Class 1 accessible emission limits, correction factor C7.",
      },
      {
        citation: "Kim I. I., McArthur B., Korevaar E. (2001). Comparison of laser beam propagation at 785 nm and 1550 nm in fog and haze for optical wireless communications. Proc. SPIE 4214, 26–37. Visibility-based aerosol exponent q.",
        url: "https://doi.org/10.1117/12.417512",
      },
    ],
  },
];
