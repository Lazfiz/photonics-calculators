import type { CalculatorEntry } from "../types";

export const detectors: CalculatorEntry[] = [
  {
    slug: "afterpulsing",
    title: "Afterpulsing in APDs",
    description: "Afterpulse probability, trap dynamics, and dead time trade-offs in avalanche photodiodes.",
    knownIssue: "The multi-trap curve uses an invented trap ladder (τᵢ = 20·3ⁱ ns, ηᵢ = 0.05/2ⁱ) and gives 2.4 % afterpulsing at the defaults against 0.41 % for the single sourced trap.",
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
    description: "Compare sensor architectures — SNR, dynamic range, and performance metrics.",
    knownIssue: "The EMCCD row shows a 120 dB dynamic range because it divides the 100 ke⁻ pixel well by the gain-divided 0.1 e⁻ read noise. Under EM gain the gain-register well limits it to about 80 dB. QE is listed but never applied.",
    keywords: ["CCD vs CMOS Comparison"],
  },
  {
    slug: "channel-photomultiplier",
    title: "Channel Photomultiplier (Multi-Channel PMT)",
    description: "Multi-channel PMT: gain staging, energy resolution, and timing.",
    knownIssue: "The energy resolution 2.355/√N_pe leaves out the multiplier excess noise: 7.9 % FWHM instead of 9.3 % (F = 1.4, as on the PMT page) at the defaults. The peak current divides the charge by the TTS, which is a jitter, not a pulse width.",
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
    description: "Cosmic ray flux and impact on imaging sensors — estimate hit rates and affected pixels.",
    knownIssue: "The track length ignores zenith angle and sensor thickness: the default 200 µm path deposits 2.0e4 e⁻ at any angle, whereas a 20 µm layer at 30° gives a 23 µm path and about 2.5e3 e⁻.",
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
  },
  {
    slug: "em-gain",
    title: "EMCCD Gain Calculator",
    description: "EM gain — noise analysis, optimal gain, and SNR comparison.",
    knownIssue: "Optimal Gain shows 501× at the defaults, an artifact of the F² = 2 − 1/G approximation. With the Robbins–Hadwen finite-stage noise factor the SNR keeps rising slowly with gain (2.248 at 500×, 2.252 at 10 000×).",
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
    knownIssue: "PDE = 0.15 per volt of overbias (30 % at 2 V, capped at 75 %) and an afterpulse rate of 2 % of the DCR are unsourced. Real PDE saturates with overbias and afterpulsing falls with dead time, which the page ignores.",
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
    knownIssue: "The phosphor's energy efficiency (0.15) is used as photons per electron. A P43 screen at about 5 kV gives about 330, so the electron gain reads 450 instead of about 10⁶ at the defaults (the SNR of 4.2 is unaffected).",
    keywords: ["Intensified Camera (ICCD)"],
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
    modelNote: "Ideal multiplier with a unit-power sine or square reference, white input noise and an order-N output filter (cascaded RC or Butterworth). A detuned signal is shown by its beat envelope. Reference phase noise, dynamic reserve, harmonic pickup and 1/f noise are left out.",
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
    knownIssue: "The gain law is invented: gain changes only 3× from 500 to 1500 V, and one plate at 1 kV with L/D 50 gives about 400 instead of about 10⁴. The 9 % 'collection efficiency' is a hard-coded 15 % QE times the open area.",
  },
  {
    slug: "modulation-transfer",
    title: "Modulation Transfer Function (MTF)",
    description: "Image sensor MTF: pixel aperture, charge diffusion, and optical blur contributions.",
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
    knownIssue: "A large 'Mean Counts per Interval' (e.g. 10⁶) freezes the page: the Poisson chart sums log-factorials term by term (about 8 × 10⁹ operations). The 'Total SNR' label also prints the variable name instead of the time.",
  },
  {
    slug: "photon-transfer",
    title: "Photon Transfer Curve (PTC)",
    description: "Photon transfer curve: noise vs signal, variance analysis, conversion gain, and dynamic range.",
  },
  {
    slug: "pixel-crosstalk",
    title: "Pixel Crosstalk & MTF",
    description: "Charge diffusion and electrical crosstalk: wavelength-dependent absorption depth, total crosstalk, and MTF degradation.",
    knownIssue: "Diffusion crosstalk uses an unsourced 0.1·√(d_abs/d_depl) rule: 4.1 % at the defaults, where only about 0.3 % of the charge is generated below the depletion layer. The MTF term is ad hoc too (42 % at Nyquist vs 57 % for a 3-tap kernel).",
  },
  {
    slug: "pmt",
    title: "Photomultiplier Tube (PMT)",
    description: "PMT gain, signal current, excess noise factor, and SNR from dynode parameters.",
    keywords: ["PMT Gain & SNR"],
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
    description: "Full well capacity, dynamic range, SNR at saturation, and nonlinearity rolloff model.",
    knownIssue: "The nonlinearity curve is wrong: with 0.5 % entered, the output starts at 5.3× the input and the error peaks at +50 % of full scale near 0.31·FWC instead of staying within 0.5 %. The curve also jumps at full well.",
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
    knownIssue: "Changing 'Afterpulse Probability' does not update the afterpulse rate: at the defaults it stays at 3.30e4 cps when set to 10 % instead of 1.65e5 cps.",
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
    knownIssue: "The default −60 dBm at 1550 nm gives 3.1e9 detections/s, 156× the 20 Mcps dead-time limit, and the SNR of 4414 treats those saturated counts as Poisson over an unstated 1 s. The 6 °C DCR doubling has no source.",
  },
  {
    slug: "spad-dead-time",
    title: "SPAD Dead Time Calculator",
    description: "Non-paralyzable and paralyzable dead time models for SPAD detectors.",
    heading: "SPAD Dead Time",
    lede: "Dead time effects on measured count rates, pile-up loss, and correction for SPAD detectors.",
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
    description: "Temporal resolution, sweep speed, time window, and spatial resolution for streak cameras.",
    knownIssue: "'Spatial resolution' shows the slit width (50 µm), which sets the time resolution, not the spatial one. The contributions are combined by max (7.5 ps) instead of in quadrature (7.9 ps), and the dynamic-range input is unused.",
    heading: "Streak Camera",
    lede: "Streak camera basics calculator. Models temporal resolution, sweep speed, time window, and spatial resolution trade-offs.",
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
    lede: "PRNU measures the spatial variation in pixel sensitivity across the sensor array. σPRNU = PRNU% × mean signal.",
  },
  {
    slug: "vacuum-photodiode",
    title: "Vacuum Photodiode Calculator",
    description: "Photoemission, responsivity, dark current, and frequency response for vacuum photodiodes.",
    knownIssue: "The SNR ignores Johnson noise in the 50 Ω load, about 130× the shot noise: 22.6 dB shown instead of about −20 dB at the defaults. The cathode–anode gap (0.1·√area) and the QE curve are invented.",
    heading: "Vacuum Photodiode",
    lede: "Vacuum photodiode calculator. Models photoemission, responsivity, dark current (thermionic emission), and frequency response.",
  },
  {
    slug: "well-capacity",
    title: "Well Capacity & Dynamic Range Calculator",
    description: "Well capacity, dynamic range, pixel capacitance, and usable bit depth for image sensors.",
    heading: "Well Capacity & Dynamic Range",
    lede: "DR = 20·log₁₀(Nwell/σread). C = Nwell·q/Vswing. Larger wells → more DR but slower charge transfer.",
  },
];
