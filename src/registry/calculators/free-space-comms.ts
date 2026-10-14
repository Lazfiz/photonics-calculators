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
    description: "Weak-fluctuation aperture-averaging factor for plane and spherical waves (exact integral and Andrews' fits), Rytov variance and the all-regime scintillation index versus receiver diameter.",
    tier: "textbook",
    modelNote: "Weak fluctuations: exact Gaussian-aperture integral of the Kolmogorov spectrum, with Andrews' 1992 fits for comparison; the all-regime σ_I²(D) interpolation under-averages for d² ≫ 1. Constant Cn².",
    references: [
      {
        citation: "Andrews L. C. (1992). Aperture-averaging factor for optical scintillations of plane and spherical waves in the atmosphere. J. Opt. Soc. Am. A 9(4), 597.",
        url: "https://doi.org/10.1364/josaa.9.000597",
      },
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Gaussian-aperture weak-fluctuation integrals and the all-regime aperture-averaged scintillation index.",
      },
    ],
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
    description: "Background power, photon rate and photoelectrons per bit from clear sky, clouds or the Sun for a given field of view, aperture, filter passband and wavelength (850–1550 nm).",
    tier: "textbook",
    modelNote: "P = L·A·Ω·Δλ·T·η with Ω = π sin²(FOV/2). Sky and cloud radiances are typical values (real skies vary ≈ ×10); the Sun is a 5772 K disc above the atmosphere (±20 %). Out-of-band light is fully blocked.",
    references: [
      {
        citation: "Giggenbach D. (2022). Free-space optical data receivers with avalanche detectors for satellite downlinks regarding background light. Sensors 22(18), 6773. Table 1: sky, cloud and sun radiances at 850, 1064 and 1550 nm; eq. (22).",
        url: "https://doi.org/10.3390/s22186773",
      },
      {
        citation: "Prša A. et al. (2016). Nominal values for selected solar and planetary quantities: IAU 2015 Resolution B3. Astron. J. 152(2), 41. T_eff = 5772 K, R = 6.957×10⁸ m.",
        url: "https://doi.org/10.3847/0004-6256/152/2/41",
      },
    ],
  },
  {
    slug: "beam-wander",
    title: "Beam Wander",
    description: "RMS turbulence-induced wander of a collimated Gaussian beam, its angular jitter and the mean on-axis loss versus Cn², path length and beam radius.",
    tier: "textbook",
    modelNote: "Collimated Gaussian beam, constant Cn², infinite outer scale: ⟨r_c²⟩ = 2.42 Cn²L³W₀^(−1/3), independent of λ. Mean on-axis loss 10 log(1 + 2⟨r_c²⟩/W²), W the diffracted beam radius.",
    references: [
      {
        citation: "Churnside J. H., Lataitis R. J. (1990). Wander of an optical beam in the turbulent atmosphere. Appl. Opt. 29(7), 926.",
        url: "https://doi.org/10.1364/ao.29.000926",
      },
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Beam wander of a Gaussian beam, ⟨r_c²⟩ = 2.42 C_n² L³ W₀^(−1/3) for a collimated beam.",
      },
    ],
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
    description: "Shannon capacity and the net rate of OOK, BPSK, QPSK, 8-PSK and 16-QAM after hard-decision FEC, gated on their exact AWGN bit error rates, with the required SNR and the gap to Shannon.",
    tier: "exact",
    modelNote: "Exact for coherent detection in complex AWGN: Gray mapping, Nyquist signalling (SNR = Es/N0). FEC is reduced to an input-BER limit. Direct-detection and photon-counting channels have other capacities.",
    references: [
      {
        citation: "Shannon C. E. (1948). A mathematical theory of communication. Bell Syst. Tech. J. 27(3), 379–423.",
        url: "https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
      },
      {
        citation: "Craig J. W. (1991). A new, simple and exact result for calculating the probability of error for two-dimensional signal constellations. MILCOM '91, 571–575. Exact M-PSK phase-error integral.",
        url: "https://doi.org/10.1109/MILCOM.1991.258319",
      },
      {
        citation: "Cho K., Yoon D. (2002). On the general BER expression of one- and two-dimensional amplitude modulations. IEEE Trans. Commun. 50(7), 1074–1080. Gray 16-QAM bit error rate.",
        url: "https://doi.org/10.1109/TCOMM.2002.800818",
      },
    ],
  },
  {
    slug: "diversity-reception",
    title: "Diversity Reception",
    description: "Required fade margin and diversity gain of selection, equal-gain and maximal-ratio combining with N receivers, from the irradiance correlation at their separation in weak turbulence.",
    tier: "textbook",
    modelNote: "Weak fluctuations: log-normal receivers correlated by the plane-wave irradiance covariance at one separation d. SC and N = 2 are exact; EGC and MRC for N ≥ 3 use a Fenton–Wilkinson fit, conservative by up to ≈ 1 dB.",
    references: [
      {
        citation: "Lee E. J., Chan V. W. S. (2004). Part 1: Optical communication over the clear turbulent atmospheric channel using diversity. IEEE J. Sel. Areas Commun. 22(9), 1896–1906.",
        url: "https://doi.org/10.1109/jsac.2004.835751",
      },
      {
        citation: "Navidpour S. M., Uysal M., Kavehrad M. (2007). BER performance of free-space optical transmission with spatial diversity. IEEE Trans. Wireless Commun. 6(8), 2813–2819.",
        url: "https://doi.org/10.1109/twc.2007.06109",
      },
      {
        citation: "Fenton L. F. (1960). The sum of log-normal probability distributions in scatter transmission systems. IRE Trans. Commun. Syst. 8(1), 57–67.",
        url: "https://doi.org/10.1109/tcom.1960.1097606",
      },
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Weak-fluctuation plane-wave irradiance covariance function.",
      },
    ],
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
    description: "Gamma-gamma and log-normal fade probability versus fade threshold for an FSO link in turbulence, with aperture averaging and N uncorrelated receivers.",
    tier: "textbook",
    modelNote: "Gamma-gamma irradiance with α, β from the aperture-averaged plane-wave log variances (weak to strong turbulence); log-normal for comparison. P^N assumes N uncorrelated receivers with selection combining.",
    references: [
      {
        citation: "Al-Habash M. A., Andrews L. C., Phillips R. L. (2001). Mathematical model for the irradiance probability density function of a laser beam propagating through turbulent media. Opt. Eng. 40(8), 1554–1562.",
        url: "https://doi.org/10.1117/1.1386641",
      },
      {
        citation: "Andrews L. C., Phillips R. L. (2005). Laser Beam Propagation through Random Media, 2nd ed. SPIE. Gamma-gamma model with aperture averaging.",
      },
    ],
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
    description: "Geometric spreading loss of a divergent FSO beam: top-hat footprint from exit aperture and divergence versus the exact Gaussian-beam capture by the receiver aperture.",
    tier: "textbook",
    modelNote: "Top-hat d_t + θR footprint (≥ 0 dB) beside the exact capture 1 − exp(−2a²/w²) of a Gaussian beam with half-angle θ/2, which is 3.01 dB better for a small receiver. Perfect pointing, no turbulence.",
    references: [
      {
        citation: "Kim I. I., Korevaar E. (2001). Availability of free-space optics (FSO) and hybrid FSO/RF systems. Proc. SPIE 4530, 84.",
        url: "https://doi.org/10.1117/12.449800",
      },
      {
        citation: "Degnan J. J., Klein B. J. (1974). Optical antenna gain. 2: Receiving antennas. Appl. Opt. 13(10), 2397.",
        url: "https://doi.org/10.1364/ao.13.002397",
      },
    ],
  },
  {
    slug: "lasercom-link",
    title: "Lasercom Link Budget",
    description: "Lasercom link budget with Gaussian-beam transmit and receive gains, free-space path loss, spot size at the receiver, and pointing and atmospheric losses.",
    tier: "textbook",
    modelNote: "Friis P_r = P_t G_t G_r (λ/4πR)² with G = (πD/λ)² η at each end; FSPL and gains count the spreading once. Capped at P_t η_t η_r; flags R < 2D_t²/λ. Pointing and atmosphere as fixed dB.",
    references: [
      {
        citation: "Friis H. T. (1946). A note on a simple transmission formula. Proc. IRE 34(5), 254–256.",
        url: "https://doi.org/10.1109/jrproc.1946.234568",
      },
      {
        citation: "Klein B. J., Degnan J. J. (1974). Optical antenna gain. 1: Transmitting antennas. Appl. Opt. 13(9), 2134.",
        url: "https://doi.org/10.1364/ao.13.002134",
      },
      {
        citation: "Kaushal H., Kaddoum G. (2017). Optical communication in space: challenges and mitigation techniques. IEEE Commun. Surv. Tutor. 19(1), 57–96.",
        url: "https://doi.org/10.1109/comst.2016.2603518",
      },
    ],
  },
  {
    slug: "link-budget",
    title: "FSO Link Budget",
    description: "Free-space optical link budget from transmitter divergence, receiver aperture, path loss and atmospheric attenuation per km, with the margin against receiver sensitivity versus range.",
    lede: "Free-space optical link budget from transmitter divergence, receiver aperture, path loss and atmospheric attenuation, with presets and the margin versus range.",
    related: [
      { href: "/free-space-comms/geometric-loss" },
      { href: "/free-space-comms/lasercom-link" },
      { href: "/free-space-comms/optical-antenna" },
      { href: "/free-space-comms/point-ahead" },
    ],
    tier: "textbook",
    modelNote: "Budget table from Friis (G_t = 8/θ², θ half-angle; G_r = (πD/λ)²); the received power is the exact Gaussian capture 1 − exp(−2a²/w²), which Friis matches far out. Atmosphere in dB/km; no turbulence.",
    references: [
      {
        citation: "Friis H. T. (1946). A note on a simple transmission formula. Proc. IRE 34(5), 254–256.",
        url: "https://doi.org/10.1109/jrproc.1946.234568",
      },
      {
        citation: "Degnan J. J., Klein B. J. (1974). Optical antenna gain. 2: Receiving antennas. Appl. Opt. 13(10), 2397.",
        url: "https://doi.org/10.1364/ao.13.002397",
      },
      {
        citation: "Kim I. I., Korevaar E. (2001). Availability of free-space optics (FSO) and hybrid FSO/RF systems. Proc. SPIE 4530, 84.",
        url: "https://doi.org/10.1117/12.449800",
      },
    ],
  },
  {
    slug: "optical-antenna",
    title: "Optical Antenna Gain",
    description: "Telescope transmit gain (Klein–Degnan, clipped and obscured Gaussian beam), receive gain, far-field divergence, beam waist and Rayleigh range with beam quality M².",
    tier: "textbook",
    modelNote: "Klein–Degnan gain of a clipped, obscured Gaussian; W₀ = a/α; 1/e² far-field half-angle from the Fraunhofer pattern; receive gain (πD/λ)²(1 − γ²)η. M² ≤ 2, approximate: θ × M², gain / M⁴.",
    references: [
      {
        citation: "Klein B. J., Degnan J. J. (1974). Optical antenna gain. 1: Transmitting antennas. Appl. Opt. 13(9), 2134.",
        url: "https://doi.org/10.1364/ao.13.002134",
      },
      {
        citation: "Degnan J. J., Klein B. J. (1974). Optical antenna gain. 2: Receiving antennas. Appl. Opt. 13(10), 2397.",
        url: "https://doi.org/10.1364/ao.13.002397",
      },
      {
        citation: "Siegman A. E. (1990). New developments in laser resonators. Proc. SPIE 1224, 2. Beam quality M².",
        url: "https://doi.org/10.1117/12.18425",
      },
    ],
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
    description: "Specific and path attenuation of a free-space optical link in rain with the ITU-R P.1814-1 model: γ = k·R^α for a gamma drop-size distribution, path reduction factor and multiple-scattering gain.",
    tier: "textbook",
    modelNote: "ITU-R P.1814-1: γ = k·R^α (Mie, gamma DSD, µ = −2…2), path reduction and multiple-scattering gain for L ≤ 5 km; flat over 780–850 and 1520–1600 nm. Gain fit tapered below 1 mm/h. No rain-rate statistics.",
    references: [
      {
        citation: "Recommendation ITU-R P.1814-1 (09/2025), Prediction methods required for the design of terrestrial free-space optical links. §4.1.2.2, Table 4 (k, α); §4.2.3, eqs. (14)–(19), Table 5.",
        url: "https://www.itu.int/rec/R-REC-P.1814-1-202509-I/en",
      },
    ],
  },
  {
    slug: "receiver-fov",
    title: "Receiver FOV vs Background Noise",
    description: "Electrical SNR of a PIN or APD receiver versus field of view, with background light from clear sky, clouds or the Sun, and the FOV at which background noise overtakes amplifier noise.",
    tier: "textbook",
    modelNote: "Shot noise 2qM²F(I_s + I_bg + I_d)B with McIntyre's F, plus amplifier noise i_n²B. Background L·A·Ω·Δλ·η with typical sky radiances. The signal is assumed to pass the field stop whole.",
    references: [
      {
        citation: "Giggenbach D. (2022). Free-space optical data receivers with avalanche detectors for satellite downlinks regarding background light. Sensors 22(18), 6773. Table 1: sky, cloud and sun radiances at 850, 1064 and 1550 nm; eq. (22).",
        url: "https://doi.org/10.3390/s22186773",
      },
      {
        citation: "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices 13(1), 164–168. Excess noise factor F = kM + (1 − k)(2 − 1/M).",
        url: "https://doi.org/10.1109/T-ED.1966.15651",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. §4.4, receiver noise and SNR of PIN and APD receivers.",
      },
    ],
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
    description: "Specific and total attenuation of a free-space optical link in dry or wet snow from the water-equivalent snowfall rate and wavelength, with the Koschmieder-equivalent visibility.",
    tier: "textbook",
    modelNote: "Empirical γ = a·S^b (dry/wet snow) from TU Graz FSO work; S read as liquid-water-equivalent rate (the source is not explicit). Flake type and density scatter real attenuation by a factor of several.",
    references: [
      {
        citation: "Awan M. S., Leitgeb E., Nebuloni R., Nadeem F., Khan M. S. (2009). Optical wireless ground-link attenuation statistics of fog and snow conditions. Proc. IFIP WOCN 2009, 1–5.",
        url: "https://doi.org/10.1109/WOCN.2009.5010571",
      },
      {
        citation: "Awan M. S. (2010). Statistical-dynamical channel modeling of outdoor optical wireless links. PhD thesis, Graz University of Technology, eq. (3.29): a and b with λ in nm.",
        url: "https://theses.eurasip.org/theses/496/statistical-dynamical-channel-modeling-of-outdoor/",
      },
    ],
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
