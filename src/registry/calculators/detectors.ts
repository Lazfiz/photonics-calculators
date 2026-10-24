import type { CalculatorEntry } from "../types";

export const detectors: CalculatorEntry[] = [
  {
    slug: "afterpulsing",
    title: "Afterpulsing in APDs",
    description: "Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.",
    tier: "textbook",
    modelNote: "Each trap level empties exponentially, so the afterpulse probability is Σ η·e^(−t_d/τ) over up to two levels, with the recorded rate from a non-paralyzable dead time. η and τ are device fits (the defaults give 0.41 %, the order of a Si SPCM at 50 ns), and the afterpulse rate is first order: afterpulses of afterpulses are left out.",
    references: [
      {
        citation: "Cova S., Lacaita A., Ripamonti G. (1991). Trapping phenomena in avalanche photodiodes on nanosecond scale. IEEE Electron Device Lett. 12, 685–687. Afterpulsing from trap release, η·e^(−t/τ).",
        url: "https://doi.org/10.1109/55.116955",
      },
      {
        citation: "Ziarkash A. W., Joshi S. K., Stipčević M., Ursin R. (2018). Comparative study of afterpulsing behavior and models in single photon counting avalanche photo diode detectors. Sci. Rep. 8, 5076. Multiple-exponential model; measured P_ap 0.01–8.5 % at 22–53 ns dead time (SPCM-AQ4C 0.16–0.29 % at 50 ns).",
        url: "https://doi.org/10.1038/s41598-018-23398-z",
      },
    ],
  },
  {
    slug: "amplifier-noise",
    title: "Amplifier Noise",
    description: "Input-referred noise sets the detection floor. σ_amp = e_n.",
    tier: "textbook",
    modelNote: "Poisson shot noise √S added in quadrature to a signal-independent input noise; minimum detectable signal at SNR = 3. Dark charge, fixed-pattern noise and excess noise are left out.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Read-noise, shot-noise and dark-noise regimes; total noise as the quadrature sum.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "antiblooming",
    title: "Anti-Blooming Design",
    description: "Anti-blooming shunts excess charge to drain when well exceeds threshold. Trade-off: charge dump efficiency vs full well capacity and linearity.",
    tier: "illustrative",
    modelNote: "A hard barrier at a fraction of the full well: above it a fixed fraction η of the extra charge goes to the drain, the rest fills the well and then spills (blooming onset N_b = T + (W − T)/(1 − η)). Real overflow drains turn on gradually through sub-threshold barrier current; η here is a lumped parameter, not a device spec.",
    references: [
      {
        citation: "Janesick J. R. (2001). Scientific Charge-Coupled Devices. SPIE Press. Blooming, lateral and vertical overflow drains, clocked anti-blooming and their cost in full well and fill factor.",
        url: "https://doi.org/10.1117/3.374903",
      },
    ],
  },
  {
    slug: "avalanche-gain",
    title: "Avalanche Photodiode Gain",
    description: "APD multiplication gain, excess noise factor (McIntyre), and material comparison.",
    tier: "textbook",
    modelNote: "Miller's empirical law with an entered exponent n (a device fit, not a material constant) and McIntyre's excess noise for a uniform field and injection of the more ionising carrier. The k presets are Si 0.02 (Excelitas C30902EH), InGaAs/InP 0.5 and Ge 0.85 from Agrawal's ranges; dead-space effects in thin layers and mixed injection are not modelled.",
    references: [
      {
        citation: "Miller S. L. (1955). Avalanche breakdown in germanium. Phys. Rev. 99, 1234–1241. Empirical gain M = 1/[1 − (V/V_br)^n].",
        url: "https://doi.org/10.1103/PhysRev.99.1234",
      },
      {
        citation: "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices ED-13, 164–168. F = kM + (1 − k)(2 − 1/M).",
        url: "https://doi.org/10.1109/T-ED.1966.15651",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. §4.4 (APD receiver noise, optimum gain) and Table 4.2 (k: Si 0.02–0.05, InGaAs 0.5–0.7, Ge 0.7–1.0).",
      },
      {
        citation: "Excelitas Technologies. C30902EH and C30921EH avalanche photodiodes, datasheet Rev. 2022.02. k_eff = 0.02; V_br = 225 V at 22 °C, 0.7 V/°C; M = 150; dark current 7 nA.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/24781.pdf",
      },
    ],
  },
  {
    slug: "back-illumination",
    title: "Back-Illuminated vs Front-Illuminated",
    description: "Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response: QE ratio and SNR gain in the shot- and read-noise limits.",
    tier: "illustrative",
    modelNote: "The peak QEs are inputs; effective QE is min(1, QE·microlens gain)·CFA transmission. The SNR gain is √(QE ratio) when photon shot noise dominates and the QE ratio when read noise dominates, an amplitude ratio quoted as 20·log₁₀. The spectra are a schematic Gaussian about 550 nm with a 70 % front-side loss below 400 nm, not a modelled or measured response.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Read-noise, shot-noise and dark-noise regimes; total noise as the quadrature sum.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "bandwidth",
    title: "Bandwidth vs Noise Trade-off",
    description: "Photodiode on a load resistor: noise grows as √Δf until the R_L·C_j roll-off, then levels off at √(kT/C).",
    tier: "textbook",
    modelNote: "A photodiode on a load resistor R_L: Johnson noise of R_L and photocurrent shot noise pass the single pole 1/(2π·R_L·C_j) and are integrated to the measurement bandwidth. Amplifier noise, dark current and transit time are left out.",
    references: [
      {
        citation: "Nyquist H. (1928). Thermal agitation of electric charge in conductors. Phys. Rev. 32, 110. Derivation of 4k_B·T·R per unit bandwidth.",
        url: "https://doi.org/10.1103/PhysRev.32.110",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.5 Noise in photodetectors: shot noise 2qīB and circuit noise.",
        url: "https://doi.org/10.1002/0471213748",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. p–n junction depletion capacitance (abrupt m = 1/2, linearly graded m = 1/3), n_i(T), generation and diffusion currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "boxcar-integrator",
    title: "Boxcar Integrator",
    description: "Gated signal averaging of a repetitive pulse: gate-averaged signal, gate noise e_n·√NEB, SNR after N averages and the optimum gate width.",
    tier: "textbook",
    modelNote: "Gaussian pulse averaged over a rectangular gate; white input noise behind a single-pole input bandwidth, so the gate noise tends to e_n/√(2T) for wide gates. Shots average independently (√N). Baseline drift, gate jitter, exponential (moving) averaging and 1/f noise are left out.",
    references: [
      {
        citation: "Papoulis A., Pillai S. U. (2002). Probability, Random Variables and Stochastic Processes, 4th ed. McGraw-Hill. Variance of a time average of a stationary process, (2/T)∫(1 − u/T)R(u)du.",
      },
      {
        citation: "Stanford Research Systems. SR250 Gated Integrator and Boxcar Averager, operating manual. Gated integration and shot averaging.",
        url: "https://www.thinksrs.com/products/sr250.html",
      },
    ],
  },
  {
    slug: "capacitance",
    title: "Junction Capacitance",
    description: "Photodiode junction capacitance vs reverse bias, doping profile, and RC bandwidth impact.",
    tier: "textbook",
    modelNote: "Depletion approximation C_j0/(1 + V_R/V_bi)^m with a single RC pole through load plus series resistance. Package and stray capacitance, the transit-time limit and forward bias are left out.",
    references: [
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. p–n junction depletion capacitance (abrupt m = 1/2, linearly graded m = 1/3), n_i(T), generation and diffusion currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "ccd-vs-cmos",
    title: "CCD vs CMOS Sensor Comparison",
    description: "Compare CCD, sCMOS, phone CMOS and EMCCD pixels: SNR from photons × QE, saturation and dynamic range.",
    keywords: ["CCD vs CMOS Comparison"],
    tier: "textbook",
    modelNote: "Poisson signal (photons × QE) and dark charge plus Gaussian read noise; the EMCCD adds the Robbins–Hadwen excess noise of a 604-stage register and divides the read noise by the gain. Its dynamic range uses the gain-register well, so it stays near 20·log₁₀(800 000/89) = 79 dB at any gain. The sensor values are representative; the EMCCD follows the iXon Ultra 897 sheet. Clock-induced charge, fixed-pattern noise, sCMOS read-noise tails and dual-gain readout are left out.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press. Shot, dark and read noise of a sensor pixel; full well and dynamic range.",
        url: "https://doi.org/10.1117/3.725073",
      },
      {
        citation: "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices 50, 1227–1232. F² = 2(G − 1)·G^(−(N+1)/N) + 1/G.",
        url: "https://doi.org/10.1109/TED.2003.813462",
      },
      {
        citation: "Andor (Oxford Instruments). iXon Ultra EMCCD specifications. iXon Ultra 897: 180 000 e⁻ pixel well, 800 000 e⁻ gain-register well, 89 e⁻ read noise at 17 MHz without EM gain.",
        url: "https://andor.oxinst.com/downloads/uploads/andor-ixon-ultra-emccd-specifications.pdf",
      },
    ],
  },
  {
    slug: "channel-photomultiplier",
    title: "Channel Photomultiplier (CPM)",
    description: "Single-channel CPM: anode sensitivity, photon-counting and analog SNR, and pulse resolution with the channel's excess noise.",
    keywords: ["Channel Photomultiplier (Multi-Channel PMT)", "CPM"],
    tier: "textbook",
    modelNote: "One channel behind a photocathode. Counting takes every photoelectron as counted, with no dead time and a known dark rate; the analog SNR in B = 1/(2T) differs from it by √F. The pulse resolution holds only below the linear limit; saturated output is not modelled.",
    references: [
      {
        citation: "PerkinElmer Optoelectronics (2001). Channel Photomultipliers C900, C1300 and C1900 series, data sheet DS-291 Rev A. Gain above 10⁸ at 3000 V, bialkali dark count rate about 10 cps, saturated single-photoelectron peak above a gain of 10⁷.",
      },
      {
        citation: "Wiza J. L. (1979). Microchannel plate detectors. Nucl. Instrum. Methods 162, 587–601, eq. (1)–(4) and §2.2. Schagen's channel-gain model (eq. 1) with A ≈ 0.2 and V₀ ≈ 1 eV, exponential pulse heights below saturation, saturated gain proportional to the channel diameter (10⁸ for 1 mm).",
        url: "https://doi.org/10.1016/0029-554X(79)90734-1",
      },
      {
        citation: "Hamamatsu Photonics (2017). Photomultiplier Tubes: Basics and Applications, 4th ed., §4.3.7, Eq. 4-25 to 4-32. Noise figure of a dynode chain, F = 1 + 1/δ₁ + 1/(δ₁δ₂) + … → δ/(δ − 1), and the shot-noise SNR.",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/etd/PMT_handbook_v4E.pdf",
      },
    ],
  },
  {
    slug: "cooling-benefit",
    title: "Cooling Benefit Calculator",
    description: "Dark current reduction and SNR improvement from thermoelectric (TEC) or cryogenic cooling.",
    tier: "textbook",
    modelNote: "Si dark current scales as depletion generation (∝ n_i), InGaAs as diffusion (∝ n_i²), with a fixed band gap or E_g(T): Varshni for Si, Vurgaftman's In₀.₅₃Ga₀.₄₇As gap for InGaAs. The temperature-dependent gap raises the 25 → −40 °C reduction from ×630 to ×950 for Si and from ×7158 (fixed 0.75 eV) to ×1.90e4 for InGaAs. Surface leakage and tunnelling are left out.",
    references: [
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. n_i(T), generation (∝ n_i) and diffusion (∝ n_i²) currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
      {
        citation: "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149–154. Si coefficients E_g(0) = 1.17 eV, α = 4.73e-4 eV/K, β = 636 K as in Sze, 2nd ed. (1981).",
        url: "https://doi.org/10.1016/0031-8914(67)90062-6",
      },
      {
        citation: "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815–5875. Varshni sets (Tables I–X) and the Ga₁₋ₓInₓAs bowing C = 0.477 eV (Table XIII).",
        url: "https://doi.org/10.1063/1.1368156",
      },
    ],
  },
  {
    slug: "cosmic-rays",
    title: "Cosmic Ray Detection",
    description: "Cosmic-ray muon hits on a silicon image sensor: hits per frame, path through the sensitive layer, mean and most probable charge per track, and pixels hit.",
    tier: "textbook",
    modelNote: "Sea-level muons only (about 1 cm⁻² min⁻¹ on a horizontal sensor), Poisson arrivals and one straight track at the chosen zenith angle through a fully sensitive layer, path t/cos θ. Mean charge 106 e⁻/µm (minimum ionizing, 3.65 eV per pair); the most probable charge uses the Landau–Vavilov–Bichsel Fermi-plateau formula and is rough below about 10 µm. Pixels per track is the Buffon average 1 + 4ℓ/(πp). Charge diffusion, δ-ray branches, altitude, shielding and radioactivity are left out.",
    references: [
      {
        citation: "Workman R. L. et al. (Particle Data Group) (2022). Review of Particle Physics. Prog. Theor. Exp. Phys. 2022, 083C01. Review \"Cosmic rays\" §30.3.1: vertical muons above 1 GeV/c ≈ 70 m⁻² s⁻¹ sr⁻¹, about 1 cm⁻² min⁻¹ on a horizontal detector, cos²θ zenith distribution, mean energy ≈ 4 GeV.",
        url: "https://doi.org/10.1093/ptep/ptac097",
      },
      {
        citation: "Navas S. et al. (Particle Data Group) (2024). Review of Particle Physics. Phys. Rev. D 110, 030001. §34.2.9 Eq. 34.13 (most probable energy loss) and §35.8 Table 35.10 (3.65 eV per e–h pair in Si; about 23 000 e⁻ most probable in 300 µm).",
        url: "https://doi.org/10.1103/PhysRevD.110.030001",
      },
      {
        citation: "Particle Data Group (2024). Atomic and nuclear properties of silicon: minimum ionization 1.664 MeV g⁻¹ cm² (3.876 MeV/cm), density 2.329 g/cm³, plasma energy 31.05 eV.",
        url: "https://pdg.lbl.gov/2024/AtomicNuclearProperties/HTML/silicon_Si.html",
      },
    ],
  },
  {
    slug: "dark-current",
    title: "Dark Current vs Temperature",
    description: "Silicon detector dark current — exponential doubling model. I_dark(T) = I₀ · 2^((T−T₀)/T_d).",
    tier: "textbook",
    modelNote: "Empirical doubling law about 25 °C with dark shot noise √(D·t) against a fixed read noise. It is the local form of the n_i scaling: for Si at 25 °C that gives T_d ≈ 8.3 K (generation) or 4.2 K (diffusion), and a single T_d drifts away from it over a wide range.",
    references: [
      {
        citation: "Janesick J. R. (2001). Scientific Charge-Coupled Devices. SPIE Press. Dark current temperature dependence and dark shot noise.",
        url: "https://doi.org/10.1117/3.374903",
      },
      {
        citation: "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149–154. Si E_g(T) used for the equivalent doubling temperature.",
        url: "https://doi.org/10.1016/0031-8914(67)90062-6",
      },
    ],
  },
  {
    slug: "dark-noise-temperature",
    title: "Dark Noise vs Temperature",
    description: "Temperature dependence of dark current and dark noise in photodiodes/CCDs.",
    tier: "textbook",
    modelNote: "Dark current ∝ n_i (generation) or n_i² (diffusion) with a fixed band gap or Varshni E_g(T) for Si and Ge, and shot noise √(2q·I·Δf). Surface leakage, tunnelling and 1/f noise are left out.",
    references: [
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. n_i(T), generation (∝ n_i) and diffusion (∝ n_i²) currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
      {
        citation: "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149–154. Coefficients (Si 1.17 eV, 4.73e-4 eV/K, 636 K; Ge 0.7437 eV, 4.774e-4 eV/K, 235 K) as in Sze, 2nd ed. (1981).",
        url: "https://doi.org/10.1016/0031-8914(67)90062-6",
      },
    ],
  },
  {
    slug: "detectivity",
    title: "Detectivity (D*)",
    description: "Specific detectivity from NEP, area, and bandwidth. D* = √(A·Δf) / NEP",
    tier: "textbook",
    modelNote: "Constant quantum efficiency up to the cutoff λ_c = hc/E_g; multiplied dark-current shot noise 2q·I_d·M²·F and load Johnson noise. The temperature chart scales dark current as n_i or n_i² with a fixed band gap and constant responsivity.",
    references: [
      {
        citation: "Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley. Ch. 5: responsivity, noise-equivalent power and specific detectivity D* = √(A·Δf)/NEP.",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.5 Noise in photodetectors: shot noise 2qīB and circuit noise.",
        url: "https://doi.org/10.1002/0471213748",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. p–n junction depletion capacitance (abrupt m = 1/2, linearly graded m = 1/3), n_i(T), generation and diffusion currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "electron-multiplying",
    title: "EMCCD vs sCMOS",
    description: "Compare electron-multiplying CCD with sCMOS for low-light imaging.",
    tier: "textbook",
    modelNote: "Both pixels see Poisson signal and dark charge. The EMCCD multiplies them with the Robbins–Hadwen excess noise of an N-stage register and divides its read noise by the gain; the sCMOS adds its read noise as a Gaussian. Equal QE is assumed (enter signal in electrons), and clock-induced charge, the sCMOS read-noise tail and photon-counting readout are left out. EM gain wins only while σ_sCMOS² exceeds about (F² − 1)·S.",
    references: [
      {
        citation: "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices 50, 1227–1232. F² = 2(G − 1)·G^(−(N+1)/N) + 1/G.",
        url: "https://doi.org/10.1109/TED.2003.813462",
      },
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press. Shot, dark and read noise of a sensor pixel.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "em-gain",
    title: "EMCCD Gain Calculator",
    description: "EMCCD gain: Robbins–Hadwen excess noise of an N-stage register, effective read noise and SNR with and without EM gain.",
    tier: "textbook",
    modelNote: "Robbins–Hadwen F² for N stages that each multiply an electron with probability p, G = (1 + p)^N; it equals the Galton–Watson result for a binomial stage. Clock-induced charge is counted at the input although charge made inside the register sees less gain. Photon-counting (threshold) readout, which removes the factor F² ≈ 2 at low flux, and register saturation are not modelled. The often-quoted F² = 2 − 1/G is the N → ∞ limit; it puts a false SNR optimum at G = 2σ²/(S + CIC), 500× at the defaults.",
    references: [
      {
        citation: "Robbins M. S., Hadwen B. J. (2003). The noise performance of electron multiplying charge-coupled devices. IEEE Trans. Electron Devices 50, 1227–1232. F² = 2(G − 1)·G^(−(N+1)/N) + 1/G.",
        url: "https://doi.org/10.1109/TED.2003.813462",
      },
      {
        citation: "Basden A. G., Haniff C. A., Mackay C. D. (2003). Photon counting strategies with low-light-level CCDs. Mon. Not. R. Astron. Soc. 345, 985–991. Thresholding removes the multiplication noise at low flux.",
        url: "https://doi.org/10.1046/j.1365-8711.2003.07020.x",
      },
    ],
  },
  {
    slug: "excess-noise",
    title: "Excess Noise Factor",
    description: "APD excess noise vs gain — McIntyre model for different semiconductor materials.",
    tier: "textbook",
    modelNote: "McIntyre's F for a uniform field and pure injection of the more ionising carrier, with the k presets of the avalanche-gain page. The SNR chart is shot-noise limited (no amplifier noise), and x = ln F/ln M matches the datasheet form F = M^x only at the entered gain.",
    references: [
      {
        citation: "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices ED-13, 164–168. F = kM + (1 − k)(2 − 1/M).",
        url: "https://doi.org/10.1109/T-ED.1966.15651",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. §4.4 (APD receiver noise, optimum gain) and Table 4.2 (k: Si 0.02–0.05, InGaAs 0.5–0.7, Ge 0.7–1.0).",
      },
      {
        citation: "Excelitas Technologies. C30902EH and C30921EH avalanche photodiodes, datasheet Rev. 2022.02. k_eff = 0.02; V_br = 225 V at 22 °C, 0.7 V/°C; M = 150; dark current 7 nA.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/24781.pdf",
      },
    ],
  },
  {
    slug: "flicker-noise",
    title: "1/f Flicker Noise",
    description: "Flicker noise: S_I(f) = K_f · I^α / f. Noise spectral density falls as 1/f.",
    lede: "Flicker noise: S_i(f) = K_f · I^α / f. Noise spectral density falls as 1/f.",
    tier: "textbook",
    modelNote: "Empirical K_f·I^α/f density (the SPICE KF/AF form) between sharp band edges, with the corner against the shot noise 2q·I. K_f and α are device fits, not predictions.",
    references: [
      {
        citation: "Hooge F. N. (1969). 1/f noise is no surface effect. Phys. Lett. A 29, 139. Empirical 1/f current noise S_I/I² = α_H/(N·f).",
        url: "https://doi.org/10.1016/0375-9601(69)90076-0",
      },
      {
        citation: "Schottky W. (1918). Über spontane Stromschwankungen in verschiedenen Elektrizitätsleitern. Ann. Phys. 362, 541. Shot noise of a current carried by discrete charges.",
        url: "https://doi.org/10.1002/andp.19183622304",
      },
    ],
  },
  {
    slug: "gain-bandwidth",
    title: "Gain-Bandwidth Product",
    description: "GBW = A₀ · f₋₃dB. The product of DC gain and bandwidth is constant for a single-pole system.",
    tier: "textbook",
    modelNote: "Single-pole op amp with frequency-independent feedback fraction β. Higher-order poles, phase margin, slew rate and output limits are left out.",
    references: [
      {
        citation: "Franco S. (2015). Design with Operational Amplifiers and Analog Integrated Circuits, 4th ed. McGraw-Hill. Ch. 6: single-pole open-loop response, constant gain-bandwidth product.",
      },
    ],
  },
  {
    slug: "gain-temperature",
    title: "Gain vs Temperature",
    description: "APD gain drift at fixed bias from the breakdown-voltage temperature coefficient, and PMT gain drift.",
    tier: "textbook",
    modelNote: "APD at fixed bias: Miller's law with n fitted through the entered operating point and a breakdown voltage linear in temperature. The defaults are the Excelitas C30662 InGaAs APD (M = 10 at 4 V below a 50 V breakdown, 0.14 V/°C), which reaches breakdown below −6.6 °C; the PMT branch applies an entered constant coefficient.",
    references: [
      {
        citation: "Miller S. L. (1955). Avalanche breakdown in germanium. Phys. Rev. 99, 1234–1241. Empirical gain M = 1/[1 − (V/V_br)^n].",
        url: "https://doi.org/10.1103/PhysRev.99.1234",
      },
      {
        citation: "Crowell C. R., Sze S. M. (1966). Temperature dependence of avalanche multiplication in semiconductors. Appl. Phys. Lett. 9, 242–244. The breakdown voltage rises with temperature.",
        url: "https://doi.org/10.1063/1.1754731",
      },
      {
        citation: "Excelitas Technologies. C30645 and C30662 InGaAs avalanche photodiodes, datasheet Rev. 2025.11. V_br = 50 V (45–70 V), 0.14 V/°C; M = 10 at 4 V below breakdown.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/27873.pdf",
      },
      {
        citation: "Excelitas Technologies. C30902EH and C30921EH avalanche photodiodes, datasheet Rev. 2022.02. k_eff = 0.02; V_br = 225 V at 22 °C, 0.7 V/°C; M = 150; dark current 7 nA.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/24781.pdf",
      },
      {
        citation: "Hamamatsu Photonics (2006). Photomultiplier Tubes: Basics and Applications, 3rd ed., §13.1.1. The gain's temperature characteristic hardly depends on wavelength or supply voltage; Fig. 13-1 plots photocathode anode-sensitivity coefficients on a −1 to +1.5 %/°C scale.",
      },
    ],
  },
  {
    slug: "geiger-mode-avalanche",
    title: "Geiger-Mode APD",
    description: "SPAD: breakdown voltage, overbias, temperature effects, PDE, and dark count rate.",
    tier: "textbook",
    modelNote: "The trigger probability P_t = 1 − e^(−ΔV/V_c) is Otte's empirical fit. The dark rate is Arrhenius in T at a fixed excess bias, times Otte's e^(bΔV)·P_t bias dependence, with b held at its 20 °C value (Otte fits 10.1 at −40 °C down to 6.83 at 40 °C). The trapped charge scales with ΔV·P_t, and the trap lifetime is held fixed, though it lengthens on cooling. Defaults: one microcell of a Hamamatsu S13360-3050CS, 40.0 % PDE at 3 V. The trap and the 50 ns dead time are illustrative, since a SiPM microcell recharges through its quench resistor instead of a fixed dead time.",
    references: [
      {
        citation: "Otte A. N., Garcia D., Nguyen T., Purushotham D. (2017). Characterization of three high efficiency and blue sensitive silicon photomultipliers. Nucl. Instrum. Methods A 846, 106–125. PDE = PDE_max·(1 − e^(−ΔV/a)), eq. 3, with a = α·U_BD and α = 0.0395 at 452 nm (Hamamatsu); dark-rate fit e^(a + b·U_rel)·P_t, eq. 13, b = 8.43 at 20 °C; dark rate doubles every 5.3 °C at fixed overvoltage, −40 to 40 °C.",
        url: "https://doi.org/10.1016/j.nima.2016.09.053",
      },
      {
        citation: "Webster E. A. G., Henderson R. K. (2013). A TCAD and spectroscopy study of dark count mechanisms in single-photon avalanche diodes. IEEE Trans. Electron Devices 60, 4014–4019. Arrhenius activation energies of CMOS SPADs, 293–343 K: 0.85 eV for low-DCR devices, 0.45 eV for field-enhanced E-centre traps.",
        url: "https://doi.org/10.1109/TED.2013.2285163",
      },
      {
        citation: "Cova S., Lacaita A., Ripamonti G. (1991). Trapping phenomena in avalanche photodiodes on nanosecond scale. IEEE Electron Device Lett. 12, 685–687. Afterpulsing from trap release, η·e^(−t/τ), growing with the avalanche charge.",
        url: "https://doi.org/10.1109/55.116955",
      },
      {
        citation: "Hamamatsu Photonics. MPPC S13360 series, datasheet KAPD1052E. S13360-3050CS: V_BR = 53 V, 3 V overvoltage, PDE 40 % at 450 nm, dark count 500 kcps over 3600 pixels, 54 mV/°C.",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/ssd/s13360_series_kapd1052e.pdf",
      },
    ],
  },
  {
    slug: "ingaas-parameters",
    title: "InGaAs Detector Parameters",
    description: "InₓGa₁₋ₓAs band gap, cutoff wavelength, QE, responsivity, generation dark current, NEP and D* for SWIR p-i-n photodiodes.",
    tier: "textbook",
    modelNote: "Band gap from Vurgaftman's Varshni sets with bowing 0.477 eV (0.7373 eV, cutoff 1682 nm at x = 0.53, 300 K). Absorption α = A·√(E − E_g), A fitted to Adachi's model within ±12 % from 0.95 to 1.62 µm. The absorber is a fully depleted slab; dark current is space-charge generation q·n_i·d·A/τ_g with n_i scaled from 6.3e11 cm⁻³ through the gap only. Diffusion current from the neutral layers, which dominates many devices above room temperature, surface leakage and tunnelling are left out. The noise √(2q·I_gen) is the shot noise in reverse bias and the Johnson noise at zero bias.",
    references: [
      {
        citation: "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815–5875. Varshni sets (Tables I–X) and the Ga₁₋ₓInₓAs bowing C = 0.477 eV (Table XIII).",
        url: "https://doi.org/10.1063/1.1368156",
      },
      {
        citation: "Paul S., Roy J. B., Basu P. K. (1991). Empirical expressions for the alloy composition and temperature dependence of the band gap and intrinsic carrier density in GaₓIn₁₋ₓAs. J. Appl. Phys. 69, 827–829. n_i = 6.3e11 cm⁻³ for Ga₀.₄₇In₀.₅₃As at 300 K (as tabulated in the Ioffe NSM archive).",
        url: "https://doi.org/10.1063/1.348919",
      },
      {
        citation: "Adachi S. (1989). Optical dispersion relations for GaP, GaAs, GaSb, InP, InAs, InSb, AlₓGa₁₋ₓAs, and In₁₋ₓGaₓAsᵧP₁₋ᵧ. J. Appl. Phys. 66, 6030–6040. In₀.₅₂Ga₀.₄₈As n, k as tabulated at refractiveindex.info; basis of the absorption fit.",
        url: "https://doi.org/10.1063/1.343580",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, ch. 2. Space-charge generation current q·n_i·W/τ_g and its e^(qV/2k_BT) bias dependence.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "intensified-ccd",
    title: "Intensified CCD (ICCD)",
    description: "Photocathode → MCP → phosphor → CCD gain chain with gating and noise analysis.",
    keywords: ["Intensified Camera (ICCD)"],
    tier: "textbook",
    modelNote: "Cascade: Poisson photoelectrons, tube noise factor K_f squared, Poisson phosphor (Photek gains at 5 kV, scaled ∝ V), binomial coupling. Gaussian spot read through its matched filter. No ion feedback or dark counts.",
    references: [
      {
        citation: "Shockley W., Pierce J. R. (1938). A theory of noise for electron multipliers. Proc. IRE 26, 321–332. Noise factor of cascaded gain stages, F = F₁ + (F₂ − 1)/G₁ + ….",
        url: "https://doi.org/10.1109/JRPROC.1938.228127",
      },
      {
        citation: "Wiza J. L. (1979). Microchannel plate detectors. Nucl. Instrum. Methods 162, 587–601. Exponential single-electron pulse heights of an unsaturated MCP (variance factor 2).",
        url: "https://doi.org/10.1016/0029-554X(79)90734-1",
      },
      {
        citation: "Dussault D., Hoess P. (2004). ICCDs edge out electron-multiplying CCDs in low light. Laser Focus World 40(9). Noise factor 1.3 < F < 2.2 for ICCD and EMCCD; 1.6 for the ICCD, 1.4 (≈ √2) for the EMCCD. Full analysis: Proc. SPIE 5563, 195 (2004), doi:10.1117/12.561839.",
        url: "https://www.laserfocusworld.com/detectors-imaging/article/16549710/iccds-edge-out-electron-multiplying-ccds-in-low-light",
      },
      {
        citation: "Photek. Image Diode data sheet PH-DS039 Rev 02 (2021), Phosphor options: P43 240 and P46 55 photons per electron at 5 kV, peaks 548 and 530 nm.",
        url: "https://www.photek.com/wp-content/uploads/2021/08/PH-DS039-ImageDiode-Rev02-Aug21.pdf",
      },
      {
        citation: "Stanford Computer Optics. Image intensifier: phosphor screen. P43 and P46 decay to 10 % in 1.5 ms and 0.2 µs.",
        url: "https://stanfordcomputeroptics.com/technology/image-intensifier/phosphor-screen.php",
      },
      {
        citation: "Andor (Oxford Instruments). iStar CCD imaging specifications, DH334T: 13 µm pixels, 5 e⁻ read noise at 50 kHz, 100 000 e⁻ well; the smallest resolvable FWHM feature is about 2 CCD pixels (note 6).",
        url: "https://andor.oxinst.com/downloads/uploads/andor-istar-ccd-imaging-specifications.pdf",
      },
      {
        citation: "King I. R. (1983). Accuracy of measurement of star images on a pixel array. PASP 95, 163. Noise-equivalent area 1/Σh² of a spread image.",
        url: "https://doi.org/10.1086/131139",
      },
    ],
  },
  {
    slug: "linear-mode-avalanche",
    title: "Linear-Mode Avalanche Photodiode",
    description: "SNR of a linear-mode APD receiver versus gain: McIntyre excess noise, shot and thermal noise, and the optimum gain for a given load resistance.",
    tier: "textbook",
    modelNote: "Shot noise of the multiplied photocurrent and bulk dark current with McIntyre's F, plus Johnson noise of the load; surface dark current, amplifier voltage noise and background light are left out. The default 50 pA bulk dark current is about the Excelitas C30902EH's 7 nA at M = 150 divided by the gain.",
    references: [
      {
        citation: "McIntyre R. J. (1966). Multiplication noise in uniform avalanche diodes. IEEE Trans. Electron Devices ED-13, 164–168. F = kM + (1 − k)(2 − 1/M).",
        url: "https://doi.org/10.1109/T-ED.1966.15651",
      },
      {
        citation: "Personick S. D. (1977). Receiver design for optical fiber systems. Proc. IEEE 65, 1670–1678. Shot and thermal noise of a p-i-n or APD receiver and the optimum gain.",
        url: "https://doi.org/10.1109/PROC.1977.10808",
      },
      {
        citation: "Agrawal G. P. (2010). Fiber-Optic Communication Systems, 4th ed. Wiley. §4.4 (APD receiver noise, optimum gain) and Table 4.2 (k: Si 0.02–0.05, InGaAs 0.5–0.7, Ge 0.7–1.0).",
      },
      {
        citation: "Excelitas Technologies. C30902EH and C30921EH avalanche photodiodes, datasheet Rev. 2022.02. k_eff = 0.02; V_br = 225 V at 22 °C, 0.7 V/°C; M = 150; dark current 7 nA.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/24781.pdf",
      },
    ],
  },
  {
    slug: "lockin-amplifier",
    title: "Lock-in Amplifier",
    description: "Lock-in amplifier: demodulation gain, ENBW, noise rejection, and SNR improvement.",
    tier: "textbook",
    modelNote: "Ideal multiplier with a unit-power sine or square reference, white input noise and an order-N output filter (cascaded RC or Butterworth). A square reference also detects odd harmonics k·f_r with gain 2√2/(kπ); the strongest harmonic is shown. A detuned signal is shown by its beat envelope. Reference phase noise, dynamic reserve, harmonic pickup and 1/f noise are left out.",
    references: [
      {
        citation: "Scofield J. H. (1994). Frequency-domain description of a lock-in amplifier. American Journal of Physics 62(2), 129–133. Demodulation, output filter and noise bandwidth.",
        url: "https://doi.org/10.1119/1.17629",
      },
      {
        citation: "Stanford Research Systems (1993). SR830 DSP Lock-In Amplifier manual. ENBW 1/4T, 1/8T, 3/32T and 5/64T for 6–24 dB/oct output filters.",
        url: "https://www.thinksrs.com/downloads/pdfs/manuals/SR830m.pdf",
      },
    ],
  },
  {
    slug: "microchannel-plate",
    title: "Microchannel Plate",
    description: "MCP gain, spatial resolution, and effective QE for photon detectors.",
    tier: "textbook",
    modelNote: "Schagen's model: secondaries leave the wall normally at V₀ and yield A·√V_c per strike. With A = 0.2 a 1 kV plate of L/d 50 gives 10³ where real plates give about 10⁴, so fit A to a measured curve. Stacks multiply unsaturated against the one-channel space-charge limit; chevrons saturate near 10⁷. No ion feedback.",
    references: [
      {
        citation: "Wiza J. L. (1979). Microchannel plate detectors. Nucl. Instrum. Methods 162, 587–601, eq. (1)–(4) and §2.2. Schagen's channel-gain model (eq. 1) with A ≈ 0.2 and V₀ ≈ 1 eV, exponential pulse heights below saturation, saturated gain proportional to the channel diameter (10⁸ for 1 mm).",
        url: "https://doi.org/10.1016/0029-554X(79)90734-1",
      },
    ],
  },
  {
    slug: "modulation-transfer",
    title: "Modulation Transfer Function (MTF)",
    description: "Image sensor MTF: pixel aperture, charge spread, and optical blur contributions.",
    tier: "textbook",
    modelNote: "Product of three terms along one axis: a square pixel aperture of side p·√FF (|sinc|, 2/π at Nyquist for 100 % fill), an exponential charge-spread line spread of 1/e length ℓ (Lorentzian MTF) and a Gaussian optical blur. ℓ is a fitted spread, not a diffusion length. Aliasing, wavelength dependence and the 2D pixel shape are left out.",
    references: [
      {
        citation: "Holst G. C., Lomheim T. S. (2011). CMOS/CCD Sensors and Camera Systems, 2nd ed. SPIE Press. Ch. 10 \"MTF\": the system MTF as a product of the detector aperture, diffusion and optics terms.",
        url: "https://doi.org/10.1117/3.2524677.ch10",
      },
    ],
  },
  {
    slug: "nep",
    title: "Noise Equivalent Power (NEP) & Detectivity (D*)",
    description: "Calculate NEP and specific detectivity D* from detector noise sources: shot noise, thermal (Johnson) noise, and dark current.",
    tier: "textbook",
    modelNote: "Dark-current shot noise and load-resistor Johnson noise in quadrature, divided by the responsivity. Signal shot noise, amplifier noise and 1/f noise are left out.",
    references: [
      {
        citation: "Dereniak E. L., Boreman G. D. (1996). Infrared Detectors and Systems. Wiley. Ch. 5: responsivity, noise-equivalent power and specific detectivity D* = √(A·Δf)/NEP.",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.5 Noise in photodetectors: shot noise 2qīB and circuit noise.",
        url: "https://doi.org/10.1002/0471213748",
      },
      {
        citation: "Nyquist H. (1928). Thermal agitation of electric charge in conductors. Phys. Rev. 32, 110. Derivation of 4k_B·T·R per unit bandwidth.",
        url: "https://doi.org/10.1103/PhysRev.32.110",
      },
    ],
  },
  {
    slug: "photodiode-speed",
    title: "Photodiode Speed & Bandwidth",
    description: "RC and transit-time bandwidth, junction capacitance and thermal NEP vs photodiode area.",
    tier: "textbook",
    modelNote: "RC limit with C ∝ area and the transit limit 0.443·v/W of one carrier crossing the full depletion width, combined as 1/f² = 1/f_RC² + 1/f_tr² (within 4 % of the exact response). Uniform generation with equal carrier speeds gives 0.553·v/W.",
    references: [
      {
        citation: "Bowers J. E., Burrus C. A. (1987). Ultrawide-band long-wavelength p-i-n photodetectors. J. Lightwave Technol. 5, 1339. Transit-time and RC limits of p-i-n bandwidth.",
        url: "https://doi.org/10.1109/JLT.1987.1075419",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. p–n junction depletion capacitance (abrupt m = 1/2, linearly graded m = 1/3), n_i(T), generation and diffusion currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "photodiode-tia-noise",
    title: "Photodiode TIA Noise",
    description: "Photodiode + transimpedance amplifier: Butterworth bandwidth, input-referred noise including the e_n·C term, and NEP.",
    keywords: ["Hybrid Detector Design"],
    tier: "textbook",
    modelNote: "Single-pole op amp with a Butterworth-compensated feedback R_f ∥ C_f; noise is integrated over a brick-wall band min(B, f_TIA). Photocurrent and dark-current shot noise, 1/f noise and the noise-gain peaking near f_TIA are left out.",
    references: [
      {
        citation: "Ramus X. (2009). Transimpedance Considerations for High-Speed Amplifiers. Texas Instruments application report SBOA122. Butterworth TIA bandwidth √(GBP/2πR_F·C_S) (eq. 12) and input-referred noise (eq. 13).",
        url: "https://www.ti.com/lit/an/sboa122/sboa122.pdf",
      },
      {
        citation: "Graeme J. G. (1996). Photodiode Amplifiers: Op Amp Solutions. McGraw-Hill. Transimpedance stability, feedback-capacitor compensation and the e_n·C noise gain.",
      },
      {
        citation: "Nyquist H. (1928). Thermal agitation of electric charge in conductors. Phys. Rev. 32, 110. Derivation of 4k_B·T·R per unit bandwidth.",
        url: "https://doi.org/10.1103/PhysRev.32.110",
      },
    ],
  },
  {
    slug: "photon-counting",
    title: "Photon Counting Statistics",
    description: "Poisson statistics, SNR, dead time corrections, and count distributions.",
    tier: "exact",
    modelNote: "Exact Poisson counting statistics for an ideal detector, with a non-paralyzable dead time. The corrected-rate SNR √N of the recorded counts holds for long gates, where the recorded counts have the renewal-process variance N/(1 + Rτ)².",
    references: [
      {
        citation: "Knoll G. F. (2010). Radiation Detection and Measurement, 4th ed. Wiley. Ch. 4, section VII: non-paralyzable m = n/(1 + nτ) and paralyzable m = n·e^(−nτ) dead-time models.",
      },
      {
        citation: "Müller J. W. (1973). Dead-time problems. Nucl. Instrum. Methods 112, 47–57. Dead-time models and the statistics of the recorded counts.",
        url: "https://doi.org/10.1016/0029-554X(73)90773-8",
      },
    ],
  },
  {
    slug: "photon-transfer",
    title: "Photon Transfer Curve (PTC)",
    description: "Photon transfer curve: read, shot and PRNU noise regimes vs signal, their crossovers, conversion gain and dynamic range.",
    tier: "textbook",
    modelNote: "σ_total² = σ_read² + σ_q² + S + (PRNU·S)² in e⁻, with σ_q = K/√12 and DN = e⁻/K. A linear sensor with a constant conversion gain, no dark charge and no DSNU. The temporal curve is what a frame-differenced or flat-fielded measurement sees.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press, ch. 5. σ_total² = σ_read² + σ_shot² + σ_FPN² with σ_FPN = P_N·S; PTC slopes 0, ½ and 1.",
        url: "https://doi.org/10.1117/3.725073",
      },
      {
        citation: "EMVA Standard 1288, Release 3.1 (2016). Standard for Characterization of Image Sensors and Cameras, Eq. (11) and (48). Quantization noise σ_q² = 1/12 DN² and the total SNR with PRNU.",
        url: "https://www.emva.org/wp-content/uploads/EMVA1288-3.1a.pdf",
      },
    ],
  },
  {
    slug: "pixel-crosstalk",
    title: "Pixel Crosstalk & MTF",
    description: "Charge diffusion and electrical crosstalk in a silicon image sensor: absorption depth, charge reaching the neighbouring pixels vs wavelength, and MTF at Nyquist.",
    tier: "textbook",
    modelNote: "Seib's field-free diffusion for front illumination: light absorbed in the depletion depth W is collected in place, and below it carriers diffuse with length L₀ in a semi-infinite field-free region, so it overstates near-infrared crosstalk for thin-epitaxy sensors. No reflection or surface recombination. Diffusion crosstalk is the charge reaching the two adjacent columns when one column is lit uniformly (100 % fill), integrated from the line-spread MTF. The extra crosstalk X is a nearest-neighbour kernel [X/2, 1 − X, X/2].",
    references: [
      {
        citation: "Seib D. H. (1974). Carrier diffusion degradation of modulation transfer function in charge coupled imagers. IEEE Trans. Electron Devices 21, 210–217. Field-free diffusion MTF; the semi-infinite case η(f) = 1 − e^(−αW)/(1 + α L_f), 1/L_f² = 1/L₀² + (2π f)².",
        url: "https://doi.org/10.1109/T-ED.1974.17898",
      },
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Absorption coefficient α(λ), Table 1.",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
    ],
  },
  {
    slug: "pmt",
    title: "Photomultiplier Tube (PMT)",
    description: "PMT gain, signal current, excess noise factor, and SNR from dynode parameters.",
    keywords: ["PMT Gain & SNR"],
    tier: "textbook",
    modelNote: "Equal dynodes, Poisson secondary emission, full interstage collection and shot noise only. All anode dark current is taken as cathode emission (no leakage) and the dark level as known, with no subtraction term.",
    references: [
      {
        citation: "Hamamatsu Photonics (2017). Photomultiplier Tubes: Basics and Applications, 4th ed., §4.3.7, Eq. 4-25 to 4-32. Noise figure of a dynode chain, F = 1 + 1/δ₁ + 1/(δ₁δ₂) + … → δ/(δ − 1), and the shot-noise SNR.",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/etd/PMT_handbook_v4E.pdf",
      },
    ],
  },
  {
    slug: "quantum-efficiency",
    title: "Quantum Efficiency",
    description: "Silicon and InGaAs detector quantum efficiency vs wavelength from absorption data: collecting thickness, diffusion length, dead layer, surface reflection, fill factor and microlens gain.",
    lede: "Detector QE from the absorption coefficient: silicon photodiode, back-illuminated and deep-depletion CCD and front-illuminated CMOS structures, and an InGaAs p-i-n, with reflection, dead-layer and fill-factor losses.",
    keywords: ["CCD quantum efficiency", "CMOS quantum efficiency", "fill factor"],
    tier: "textbook",
    modelNote: "Silicon or In₀.₅₃Ga₀.₄₇As at 300 K. A dead layer, a fully collecting layer W and diffusion from a semi-infinite substrate (Gärtner); L = 0 is a slab. Silicon α is Green's table; InGaAs α = A·√(E − E_g) with the Vurgaftman gap, fitted to Adachi within ±12 %, behind an InP cap taken as opaque short of 916 nm. Reflection is a fixed R, or bare-silicon Fresnel for silicon; no AR-coating spectrum, etaloning, gate or colour-filter absorption. The presets are illustrative structures, not products.",
    references: [
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Table 1, n and k at 250–1450 nm (α = 4πk/λ).",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
      {
        citation: "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87. Collection efficiency 1 − e^(−αW)/(1 + αL).",
        url: "https://doi.org/10.1103/PhysRev.116.84",
      },
      {
        citation: "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815–5875. Ga₁₋ₓInₓAs gap with bowing 0.477 eV (Table XIII) and the InP Varshni set (Table VI).",
        url: "https://doi.org/10.1063/1.1368156",
      },
      {
        citation: "Adachi S. (1989). Optical dispersion relations for GaP, GaAs, GaSb, InP, InAs, InSb, AlₓGa₁₋ₓAs, and In₁₋ₓGaₓAsᵧP₁₋ᵧ. J. Appl. Phys. 66, 6030–6040. In₀.₅₂Ga₀.₄₈As n, k as tabulated at refractiveindex.info; basis of the absorption fit.",
        url: "https://doi.org/10.1063/1.343580",
      },
    ],
    related: [
      { href: "/detectors/pmt" },
      { href: "/detectors/readout-noise" },
      { href: "/detectors/reset-noise" },
    ],
  },
  {
    slug: "readout-noise",
    title: "Readout Noise",
    description: "Readout noise, dark current, shot noise, and SNR analysis for image sensors.",
    tier: "textbook",
    modelNote: "Quadrature sum of Poisson signal and dark shot noise and a constant read noise. Fixed-pattern noise and gain are left out.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Read-noise, shot-noise and dark-noise regimes; total noise as the quadrature sum.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "reset-noise",
    title: "KTC Reset Noise",
    description: "KTC reset noise voltage, noise charge, and conversion gain for image sensors.",
    tier: "textbook",
    modelNote: "Thermal-equilibrium charge on a capacitor after a reset, √(k_B·T·C), for a hard reset of a linear capacitor. Soft reset and correlated double sampling lower it.",
    references: [
      {
        citation: "Janesick J. R. (2001). Scientific Charge-Coupled Devices. SPIE Press. Reset (kTC) noise √(k_B·T·C)/q and its removal by correlated double sampling.",
        url: "https://doi.org/10.1117/3.374903",
      },
    ],
  },
  {
    slug: "responsivity",
    title: "Detector Responsivity",
    description: "Detector responsivity from quantum efficiency and wavelength with wavelength sweep.",
    lede: "Interactive responsivity calculator from quantum efficiency and wavelength, with presets and wavelength sweeps.",
    tier: "exact",
    modelNote: "ℛ = η·q·λ/(h·c) with exact SI constants, for a wavelength-independent η and no internal gain.",
    references: [
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.1 Quantum efficiency and responsivity, ℛ = η·λ₀/1.24 (λ₀ in µm).",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
    related: [
      { href: "/detectors/readout-noise" },
      { href: "/detectors/reset-noise" },
      { href: "/detectors/saturation" },
      { href: "/detectors/shot-noise" },
    ],
  },
  {
    slug: "saturation",
    title: "Detector Saturation",
    description: "Full well capacity, dynamic range with ADC quantization noise, SNR at saturation, and a nonlinearity roll-off.",
    tier: "textbook",
    modelNote: "Dynamic range and SNR at full well from shot, read and quantization noise Δ/√12, with the ADC's full scale set to the full well. The response curve is illustrative: one parameter n bends it as S·(1 − n·S/FWC), so the error grows as S² and reaches −n of full scale at full well, then the output stays flat. Real roll-off depends on the pixel and its readout chain.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press. Full well, linearity, quantization noise and dynamic range.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "shot-noise",
    title: "Shot Noise",
    description: "Shot noise current, SNR, and noise vs signal analysis for photodetectors.",
    tier: "textbook",
    modelNote: "Poisson arrivals with a flat spectrum, √(2q·I·B), valid below the inverse transit time. Thermal and amplifier noise are left out.",
    references: [
      {
        citation: "Schottky W. (1918). Über spontane Stromschwankungen in verschiedenen Elektrizitätsleitern. Ann. Phys. 362, 541. Shot noise of a current carried by discrete charges.",
        url: "https://doi.org/10.1002/andp.19183622304",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.5 Noise in photodetectors: shot noise 2qīB and circuit noise.",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
  },
  {
    slug: "si-vs-ingaas",
    title: "Si vs InGaAs Detectors",
    description: "Compare silicon and InGaAs p-i-n photodiodes: QE spectra from absorption data, responsivity, generation dark current and SNR vs wavelength.",
    keywords: ["silicon vs InGaAs photodiode", "InGaAs InP window"],
    tier: "textbook",
    modelNote: "Two reference p-i-n devices, not products. Si: Green's 300 K absorption with Gärtner collection (W = 20 µm, L = 100 µm, R = 5 %); its edge does not move with temperature. InGaAs: x = 0.53, Vurgaftman gap, α = A·√(E − E_g) fitted to Adachi within ±12 %, a 3 µm fully depleted absorber, R = 2 %, behind an InP cap taken as opaque above its 1.353 eV gap (916 nm at 300 K). Collection is ideal. Dark current is depletion generation q·n_i·W·A/τ_g only (τ_g 1 ms Si, 100 µs InGaAs); diffusion and surface leakage are left out. SNR adds signal and dark shot noise to a white amplifier noise.",
    references: [
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Table 1, n and k at 250–1450 nm (α = 4πk/λ).",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
      {
        citation: "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87. Collection efficiency 1 − e^(−αW)/(1 + αL).",
        url: "https://doi.org/10.1103/PhysRev.116.84",
      },
      {
        citation: "Vurgaftman I., Meyer J. R., Ram-Mohan L. R. (2001). Band parameters for III–V compound semiconductors and their alloys. J. Appl. Phys. 89, 5815–5875. Ga₁₋ₓInₓAs gap with bowing 0.477 eV (Table XIII) and the InP Varshni set (Table VI).",
        url: "https://doi.org/10.1063/1.1368156",
      },
      {
        citation: "Adachi S. (1989). Optical dispersion relations for GaP, GaAs, GaSb, InP, InAs, InSb, AlₓGa₁₋ₓAs, and In₁₋ₓGaₓAsᵧP₁₋ᵧ. J. Appl. Phys. 66, 6030–6040. In₀.₅₂Ga₀.₄₈As n, k as tabulated at refractiveindex.info; basis of the absorption fit.",
        url: "https://doi.org/10.1063/1.343580",
      },
      {
        citation: "Paul S., Roy J. B., Basu P. K. (1991). Empirical expressions for the alloy composition and temperature dependence of the band gap and intrinsic carrier density in GaₓIn₁₋ₓAs. J. Appl. Phys. 69, 827–829. n_i = 6.3e11 cm⁻³ for Ga₀.₄₇In₀.₅₃As at 300 K (as tabulated in the Ioffe NSM archive).",
        url: "https://doi.org/10.1063/1.348919",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley, ch. 2. Space-charge generation current q·n_i·W/τ_g.",
        url: "https://doi.org/10.1002/0470068329",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.5 Noise in photodetectors: shot noise 2qīB and circuit noise.",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
  },
  {
    slug: "silicon-photodiode",
    title: "Silicon Photodiode",
    description: "Si photodiode parameters: bandgap, QE, responsivity, dark current, and spectral response.",
    tier: "textbook",
    modelNote: "QE from Green's 300 K silicon absorption with Gärtner's depletion-plus-diffusion collection; the absorption edge does not shift with temperature. Dark current is depletion generation q·n_i·W·A/τ_g only (no diffusion or surface leakage); n_i = 9.65e9 cm⁻³ at 300 K scaled with T^(3/2) and the Varshni gap. Capacitance is a parallel plate with ε_r = 11.9.",
    references: [
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Table 1, n and k at 250–1450 nm (α = 4πk/λ).",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
      {
        citation: "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87. Collection efficiency 1 − e^(−αW)/(1 + αL).",
        url: "https://doi.org/10.1103/PhysRev.116.84",
      },
      {
        citation: "Altermatt P. P., Schenk A., Geelhaar F., Heiser G. (2003). Reassessment of the intrinsic carrier density in crystalline silicon in view of band-gap narrowing. J. Appl. Phys. 93, 1598–1604. n_i = 9.65e9 cm⁻³ at 300 K.",
        url: "https://doi.org/10.1063/1.1529297",
      },
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. Generation current q·n_i·W/τ_g, n_i(T), Varshni E_g(T) coefficients for Si, ε_r = 11.9.",
        url: "https://doi.org/10.1002/0470068329",
      },
    ],
  },
  {
    slug: "single-photon-counting-module",
    title: "Single-Photon Counting Module",
    description: "SPCM dead time correction, SNR, dark count effects, and afterpulsing analysis.",
    tier: "textbook",
    modelNote: "A fixed non-paralyzable dead time acts on photon and dark avalanches, and afterpulses are first order. The SNR is that of the dead-time corrected photon rate over the gate, with the dark and afterpulse rates known. That SNR is statistical only: a dead-time error δτ biases R by Rτ·δτ/τ (0.43 % for the datasheet's 24 against 22 ns), and an afterpulse error δP by δP/(1 + P). Defaults: an Excelitas SPCM-AQRH-14 at 650 nm. Above about 5 Mc/s real modules need more correction than a fixed 22 ns gives: 1.16 against 1.12 at 5 Mc/s.",
    references: [
      {
        citation: "Excelitas Technologies. SPCM-AQRH single-photon counting module, datasheet Rev 2023-1. PDE 65 % at 650 nm, 22 ns dead time (-1X), dark count ≤ 100 cps (-X4), afterpulsing 0.5 %, linearity correction factor 1.02 at 1 Mc/s and 1.16 at 5 Mc/s.",
        url: "https://www.excelitas.com/sites/default/files/assets/product/document/27464.pdf",
      },
      {
        citation: "Knoll G. F. (2010). Radiation Detection and Measurement, 4th ed. Wiley. Ch. 4, section VII: non-paralyzable m = n/(1 + nτ) and paralyzable m = n·e^(−nτ) dead-time models.",
      },
      {
        citation: "Müller J. W. (1973). Dead-time problems. Nucl. Instrum. Methods 112, 47–57. Dead-time models and the statistics of the recorded counts.",
        url: "https://doi.org/10.1016/0029-554X(73)90773-8",
      },
    ],
  },
  {
    slug: "sndr",
    title: "SNDR Calculator",
    description: "SINAD (SNDR), SNR, THD, signal-to-distortion ratio and ENOB, with the ideal quantisation SNR of an N-bit ADC.",
    lede: "Signal-to-Noise-and-Distortion Ratio. SNDR = Psignal/(Pnoise + Pdistortion).",
    tier: "textbook",
    modelNote: "Power ratios as defined by IEEE 1241; the ideal SQNR assumes a full-scale sine and quantisation error uniform over one LSB. THD is the entered distortion power, not a sum of measured harmonics.",
    references: [
      {
        citation: "IEEE Std 1241-2010. IEEE Standard for Terminology and Test Methods for Analog-to-Digital Converters. SINAD, ENOB and THD definitions.",
        url: "https://doi.org/10.1109/IEEESTD.2011.5692956",
      },
      {
        citation: "Kester W. (2009). MT-001: Taking the mystery out of the infamous formula SNR = 6.02N + 1.76 dB, and MT-003: Understand SINAD, ENOB, SNR, THD, THD + N, and SFDR. Analog Devices tutorials.",
      },
    ],
  },
  {
    slug: "spad",
    title: "SPAD Detector Calculator",
    description: "Single-photon avalanche diode — PDE, DCR, dead time, afterpulsing, and SNR analysis.",
    tier: "textbook",
    modelNote: "A fixed non-paralyzable dead time acts on photon and dark avalanches, afterpulses are first order, and the SNR is that of the dead-time corrected photon rate over the stated gate. DCR(T) is Arrhenius at a fixed excess bias. 0.25 eV is an effective value that matches the lower bound of the drop of more than 100× that Korzh et al. saw from −50 to −110 °C; they report the step is not constant, and tunnelling flattens it at lower T. Afterpulses are counted but start no dead time of their own. Defaults: their InGaAs/InP NFAD at −110 °C with a 20 µs hold-off: the counts saturate at 1/τ = 50 kcps, and 10 % are already lost at about −112 dBm.",
    references: [
      {
        citation: "Korzh B., Walenta N., Lunghi T., Gisin N., Zbinden H. (2014). Free-running InGaAs single photon detector with 1 dark count per second at 10% efficiency. Appl. Phys. Lett. 104, 081108. At −110 °C: 11.5 % efficiency, 1.19 cps, 2.2 % afterpulsing with 20 µs dead time; DCR falls over two orders of magnitude from −50 to −110 °C.",
        url: "https://doi.org/10.1063/1.4866582",
      },
      {
        citation: "Webster E. A. G., Henderson R. K. (2013). A TCAD and spectroscopy study of dark count mechanisms in single-photon avalanche diodes. IEEE Trans. Electron Devices 60, 4014–4019. Arrhenius activation energies of dark counts.",
        url: "https://doi.org/10.1109/TED.2013.2285163",
      },
      {
        citation: "Müller J. W. (1973). Dead-time problems. Nucl. Instrum. Methods 112, 47–57. Dead-time models and the statistics of the recorded counts.",
        url: "https://doi.org/10.1016/0029-554X(73)90773-8",
      },
    ],
  },
  {
    slug: "spad-dead-time",
    title: "SPAD Dead Time Calculator",
    description: "Non-paralyzable and paralyzable dead time models for SPAD detectors.",
    heading: "SPAD Dead Time",
    lede: "Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.",
    tier: "textbook",
    modelNote: "The two limiting dead-time models for Poisson arrivals. Real SPADs with active quenching sit near the non-paralyzable case, passively quenched ones between the two, and the dead time itself may vary.",
    references: [
      {
        citation: "Knoll G. F. (2010). Radiation Detection and Measurement, 4th ed. Wiley. Ch. 4, section VII: non-paralyzable m = n/(1 + nτ) and paralyzable m = n·e^(−nτ) dead-time models.",
      },
      {
        citation: "Müller J. W. (1973). Dead-time problems. Nucl. Instrum. Methods 112, 47–57. Dead-time models and the statistics of the recorded counts.",
        url: "https://doi.org/10.1016/0029-554X(73)90773-8",
      },
    ],
  },
  {
    slug: "spectral-response",
    title: "Spectral Response Calculator",
    description: "Silicon photodiode responsivity and quantum efficiency vs wavelength, plus a check of a datasheet responsivity against the η = 1 limit.",
    heading: "Spectral Response",
    lede: "R(λ) = η(λ) · q · λ / (h·c). Responsivity and quantum efficiency of a silicon photodiode as a function of wavelength, and the quantum efficiency a datasheet value implies.",
    tier: "textbook",
    modelNote: "Silicon at 300 K: Green's absorption with Gärtner's depletion-plus-diffusion collection and a fixed surface reflectance. No dead layer or AR-coating spectrum, so the blue response is an upper bound. The datasheet check is exact: η = ℛ·h·c/(q·λ), and η > 1 needs internal gain.",
    references: [
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Table 1, n and k at 250–1450 nm (α = 4πk/λ).",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
      {
        citation: "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87. Collection efficiency 1 − e^(−αW)/(1 + αL).",
        url: "https://doi.org/10.1103/PhysRev.116.84",
      },
      {
        citation: "Saleh B. E. A., Teich M. C. (1991). Fundamentals of Photonics. Wiley. §17.1 Quantum efficiency and responsivity, ℛ = η·λ₀/1.24 (λ₀ in µm).",
        url: "https://doi.org/10.1002/0471213748",
      },
    ],
  },
  {
    slug: "streak-camera",
    title: "Streak Camera Calculator",
    description: "Temporal resolution and time window of a streak camera from sweep speed, slit image, pixel size, tube limit and trigger jitter.",
    heading: "Streak Camera",
    lede: "Temporal resolution of a streak camera: the slit image, one pixel and screen blur (lengths converted to time by the sweep speed), the tube's own spread and trigger jitter, convolved; and the time window on the screen.",
    tier: "textbook",
    modelNote: "Slit image and pixel are rectangles, tube, blur and jitter Gaussians; exact FWHM of their convolution. Blur: 5 % Gaussian MTF at the cathode limit, × M. Defaults: C16910, 60 ps sweep.",
    references: [
      {
        citation: "Hamamatsu Photonics (2008). Guide to Streak Cameras, cat. no. SHSS0006E. Temporal resolution as the FWHM of the streak image of a delta pulse; trigger jitter in summed sweeps.",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/sys/SHSS0006E_STREAK.pdf",
      },
      {
        citation: "Hamamatsu Photonics. Streak camera C16910 data sheet, cat. no. SHSS0026E06: temporal resolution < 800 fs, Ø18 mm P-43 phosphor screen, 35 lp/mm at the photocathode centre, effective photocathode 0.15 × 4.5 mm and working area 12.48 × 9.44 mm (1280 × 968 pixels) with an ORCA-Flash4.0 V3 behind 3:2 output optics, 1:1 input optics, fastest sweep ≈ 60 ps per full screen.",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/sys/SHSS0026E_C16910s.pdf",
      },
      {
        citation: "Zavoisky E. K., Fanchenko S. D. (1965). Image converter high-speed photography with 10⁻⁹–10⁻¹⁴ sec time resolution. Appl. Opt. 4, 1155–1167. Technical (slit image/sweep speed) and physical (energy spread) limits of the time resolution.",
        url: "https://doi.org/10.1364/AO.4.001155",
      },
      {
        citation: "Shakya M. M., Chang Z. (2005). Achieving 280 fs resolution with a streak camera by reducing the deflection dispersion. Appl. Phys. Lett. 87, 041103. Transit-time dispersion 2.63·√Δε/E ps (Δε in eV, E in kV/mm) and deflection dispersion as tube terms.",
        url: "https://doi.org/10.1063/1.2001732",
      },
    ],
  },
  {
    slug: "temporal-noise",
    title: "Temporal Noise Calculator",
    description: "1/f noise, white noise, and read noise as functions of frequency and integration time.",
    heading: "Temporal Noise",
    lede: "1/f noise from a corner frequency, white read noise and dark shot noise, versus frequency and integration time.",
    tier: "illustrative",
    modelNote: "A white read noise with a 1/f corner, integrated between sharp band edges f_L and B, plus Poisson dark noise. The real correlated-double-sampling filter and the choice of f_L change the 1/f term.",
    references: [
      {
        citation: "Motchenbacher C. D., Connelly J. A. (1993). Low-Noise Electronic System Design. Wiley. Noise of a white floor with a 1/f corner: f_c·ln(f_H/f_L) + (f_H − f_L).",
      },
      {
        citation: "Janesick J. R. (2007). Photon Transfer. SPIE Press. Read-noise, shot-noise and dark-noise regimes; total noise as the quadrature sum.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "thermal-noise",
    title: "Johnson (Thermal) Noise Calculator",
    description: "Thermal noise voltage, current, and power across a resistor.",
    heading: "Johnson (Thermal) Noise",
    lede: "vn = √(4kBTRΔf). Thermal noise voltage across a resistor.",
    tier: "textbook",
    modelNote: "Classical Johnson–Nyquist noise of a resistor in thermal equilibrium, valid for h·f ≪ k_B·T (6.25 THz at 300 K). Excess (1/f) noise of real resistors is left out.",
    references: [
      {
        citation: "Johnson J. B. (1928). Thermal agitation of electricity in conductors. Phys. Rev. 32, 97. Measured noise power ∝ R·T.",
        url: "https://doi.org/10.1103/PhysRev.32.97",
      },
      {
        citation: "Nyquist H. (1928). Thermal agitation of electric charge in conductors. Phys. Rev. 32, 110. Derivation of 4k_B·T·R per unit bandwidth.",
        url: "https://doi.org/10.1103/PhysRev.32.110",
      },
    ],
  },
  {
    slug: "uniformity",
    title: "Photoresponse Non-Uniformity Calculator",
    description: "PRNU, DSNU, and spatial uniformity analysis for image sensors.",
    heading: "Photoresponse Non-Uniformity",
    lede: "PRNU measures the spatial variation in pixel sensitivity across the sensor array. σPRNU = PRNU% × mean signal; DSNU is the spatial rms of the dark image.",
    tier: "textbook",
    modelNote: "EMVA 1288 definitions: PRNU as a fraction of the mean photo signal, DSNU in e⁻ rms, and independent Gaussian terms σ_total² = S + D + σ_read² + DSNU² + (PRNU·S)². Quantization noise is left out. The map is an illustrative pattern (white noise plus a shading gradient) scaled to the PRNU you enter; real PRNU also has column and row structure.",
    references: [
      {
        citation: "EMVA Standard 1288, Release 3.1 (2016). Standard for Characterization of Image Sensors and Cameras, Eq. (23)–(25) and (45)–(48). DSNU₁₂₈₈, PRNU₁₂₈₈ and the total SNR including spatial non-uniformity.",
        url: "https://www.emva.org/wp-content/uploads/EMVA1288-3.1a.pdf",
      },
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press, ch. 5. Fixed-pattern noise σ_FPN = P_N·S, shot = FPN at S = 1/P_N², and its removal by flat-fielding.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
  {
    slug: "vacuum-photodiode",
    title: "Vacuum Photodiode Calculator",
    description: "Photoemission, responsivity, dark current, and frequency response for vacuum photodiodes.",
    heading: "Vacuum Photodiode",
    lede: "Responsivity, thermionic dark current, transit-time and RC bandwidth, space-charge limit and the shot- plus Johnson-noise SNR of a planar vacuum photodiode.",
    tier: "textbook",
    modelNote: "Planar diode, flat QE up to hc/φ, electrons leaving at rest, a brick-wall filter at the −3 dB bandwidth and load Johnson noise at 25 °C. Dark emission is a measured 25 °C value (Burle Table I presets), carried to other temperatures over an effective Richardson barrier (order of magnitude away from 25 °C). Stray capacitance is an input; a coax-matched tube is a transmission line, not a lumped RC.",
    references: [
      {
        citation: "Dushman S. (1923). Electron emission from metals as a function of temperature. Phys. Rev. 21, 623–636. J = A₀·T²·exp(−φ/k_B·T).",
        url: "https://doi.org/10.1103/PhysRev.21.623",
      },
      {
        citation: "Ramo S. (1939). Currents induced by electron motion. Proc. IRE 27, 584–585. The ramp current of an accelerating electron; f_tr = 0.553/τ.",
        url: "https://doi.org/10.1109/JRPROC.1939.228757",
      },
      {
        citation: "Child C. D. (1911). Discharge from hot CaO. Phys. Rev. (Series I) 32, 492–511. Space-charge-limited current ∝ V^(3/2)/d².",
        url: "https://doi.org/10.1103/PhysRevSeriesI.32.492",
      },
      {
        citation: "Burle Industries (1980). Photomultiplier Handbook (TP-136), Table I: dark emission at 25 °C of Cs₃Sb, Na₂KSb, K₂CsSb, multialkali and GaAs photocathodes; p. 20: thermionic and photoemission barriers differ in semiconductor cathodes.",
        url: "https://psec.uchicago.edu/links/Photomultiplier_Handbook.pdf",
      },
      {
        citation: "Hamamatsu Photonics (2017). Photomultiplier Tubes: Basics and Applications, 4th ed., §4.3.6 Eq. 4-19 (thermionic dark emission over the work function) and Eq. 5-7 (f_c = 1/(2π C_s R_L), C_s including stray and wiring capacitance).",
        url: "https://www.hamamatsu.com/content/dam/hamamatsu-photonics/sites/documents/99_SALES_LIBRARY/etd/PMT_handbook_v4E.pdf",
      },
      {
        citation: "Bowers J. E., Burrus C. A. (1987). Ultrawide-band long-wavelength p-i-n photodetectors. J. Lightwave Technol. 5, 1339–1350. Combined RC and transit bandwidth 1/f² = 1/f_RC² + 1/f_tr².",
        url: "https://doi.org/10.1109/JLT.1987.1075419",
      },
    ],
  },
  {
    slug: "well-capacity",
    title: "Well Capacity & Dynamic Range Calculator",
    description: "Well capacity, dynamic range, pixel capacitance, and usable bit depth for image sensors.",
    heading: "Well Capacity & Dynamic Range",
    lede: "DR = 20·log₁₀(Nwell/σread). C = Nwell·q/Vswing. Larger wells → more DR but slower charge transfer.",
    tier: "textbook",
    modelNote: "Definitions: DR = 20·log₁₀(N_well/σ_read), usable bits log₂(N_well/σ_read), and a linear sense node C = N_well·q/V_swing with conversion gain q/C. Real sense-node capacitance grows with charge, so the conversion gain falls near full well. The minimum detectable signal solves S/√(S + σ²) = 3, with the signal's own shot noise.",
    references: [
      {
        citation: "Janesick J. R. (2007). Photon Transfer: DN → λ. SPIE Press. Full well, sense-node conversion gain and dynamic range.",
        url: "https://doi.org/10.1117/3.725073",
      },
    ],
  },
];
