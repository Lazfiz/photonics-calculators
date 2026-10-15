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
  },
  {
    slug: "back-illumination",
    title: "Back-Illuminated vs Front-Illuminated",
    description: "Back-illuminated sensors bypass gate structures for higher QE and better blue/UV response.",
    knownIssue: "The SNR gain in dB applies 10·log10 to an amplitude ratio: 1.4 dB instead of 2.8 dB at the defaults. A front-side QE or CFA transmission of 0 gives Infinity or NaN.",
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
    modelNote: "Si dark current scales as depletion generation (∝ n_i), InGaAs as diffusion (∝ n_i²), with a fixed band gap or, for Si, Varshni E_g(T); the Varshni gap raises the 25 → −40 °C Si reduction from ×630 to ×950. Surface leakage, tunnelling and the InGaAs gap's temperature shift are left out.",
    references: [
      {
        citation: "Sze S. M., Ng K. K. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley. n_i(T), generation (∝ n_i) and diffusion (∝ n_i²) currents.",
        url: "https://doi.org/10.1002/0470068329",
      },
      {
        citation: "Varshni Y. P. (1967). Temperature dependence of the energy gap in semiconductors. Physica 34, 149–154. Si coefficients E_g(0) = 1.17 eV, α = 4.73e-4 eV/K, β = 636 K as in Sze, 2nd ed. (1981).",
        url: "https://doi.org/10.1016/0031-8914(67)90062-6",
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
    description: "Temperature dependence of detector gain for APDs and PMTs.",
    knownIssue: "The APD gain drift uses an unsourced M_ref/(1 + α·ΔT) with α independent of gain, while real drift at fixed bias comes from V_br(T) and grows with M. When 1 + α·ΔT nears 0 a clamp shows 100 × M_ref as the gain.",
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
    description: "InₓGa₁₋ₓAs bandgap, cutoff wavelength, QE, dark current, NEP for SWIR detectors.",
    knownIssue: "At the default +0.5 V bias the dark current, NEP and D* all read 0, because forward bias is treated as zero bias with no Johnson noise. The generation-recombination dark current is about 10¹³ times too small at any bias.",
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
    description: "McIntyre excess noise factor F(M), signal current and shot noise of a linear-mode APD versus gain, ionization ratio k and dark current.",
    knownIssue: "No amplifier or thermal noise term, so the SNR only falls with gain (0.89 at M = 1, 0.45 at M = 100 at the defaults) and the optimum APD gain never appears. The default 10 nA bulk dark current is high for silicon.",
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
    description: "Silicon detector quantum efficiency vs wavelength from Green's absorption data: collecting thickness, diffusion length, dead layer, surface reflection, fill factor and microlens gain.",
    lede: "Silicon detector QE from the absorption coefficient: photodiode, back-illuminated and deep-depletion CCD and front-illuminated CMOS structures, with reflection, dead-layer and fill-factor losses.",
    keywords: ["CCD quantum efficiency", "CMOS quantum efficiency", "fill factor"],
    tier: "textbook",
    modelNote: "Silicon only, at 300 K. A dead layer, a fully collecting layer W and diffusion from a semi-infinite substrate (Gärtner); L = 0 is a slab. Reflection is a fixed R or bare-silicon Fresnel; no AR-coating spectrum, etaloning, gate or colour-filter absorption. The presets are illustrative structures, not products.",
    references: [
      {
        citation: "Green M. A. (2008). Self-consistent optical parameters of intrinsic silicon at 300 K including temperature coefficients. Sol. Energy Mater. Sol. Cells 92, 1305–1310. Table 1, n and k at 250–1450 nm (α = 4πk/λ).",
        url: "https://doi.org/10.1016/j.solmat.2008.06.009",
      },
      {
        citation: "Gärtner W. W. (1959). Depletion-layer photoeffects in semiconductors. Phys. Rev. 116, 84–87. Collection efficiency 1 − e^(−αW)/(1 + αL).",
        url: "https://doi.org/10.1103/PhysRev.116.84",
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
    slug: "si-vs-inge",
    title: "Si vs InGaAs Detectors",
    description: "Compare silicon and InGaAs photodetectors: QE spectra, SNR, dark current, and wavelength performance.",
    knownIssue: "The QE spectra are invented: InGaAs gives 64 % at 1550 nm (typically about 80 %) and 10 % at 1000 nm (typically about 60 %), and the dark-current doubling rules have no source.",
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
