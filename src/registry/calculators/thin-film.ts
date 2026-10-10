import type { CalculatorEntry, Reference } from "../types";

// Chapters of the 4th edition, titles checked on Crossref: 2 Basic Theory, 4 Antireflection Coatings,
// 5 Neutral Mirrors and Beam Splitters, 6 Multilayer High-Reflectance Coatings, 7 Edge Filters,
// 8 Band-Pass Filters, 9 Tilted Coatings, 12 Factors Affecting Layer and Coating Properties.
const macleod = (where: string): Reference => ({
  citation: `Macleod H. A. (2010). Thin-Film Optical Filters, 4th ed., ${where}. CRC Press.`,
  url: "https://doi.org/10.1201/9781420073034",
});
const bornWolf = (where: string): Reference => ({
  citation: `Born M., Wolf E. (1999). Principles of Optics, 7th ed., ${where}. Cambridge University Press.`,
});
const hecht = (where: string): Reference => ({ citation: `Hecht E. (2016). Optics, 5th ed., ${where}.` });
// DOIs matched on Crossref (volume, first page, year) and resolving.
const epstein: Reference = {
  citation: "Epstein L. I. (1952). The design of optical filters. J. Opt. Soc. Am. 42, 806.",
  url: "https://doi.org/10.1364/JOSA.42.000806",
};
const babicCorzine: Reference = {
  citation: "Babic D. I., Corzine S. W. (1992). Analytic expressions for the reflection delay, penetration depth, and absorptance of quarter-wave dielectric mirrors. IEEE J. Quantum Electron. 28, 514.",
  url: "https://doi.org/10.1109/3.123281",
};
const astmG173: Reference = {
  citation: "ASTM G173-03 (reapproved 2020). Standard Tables for Reference Solar Spectral Irradiances: Direct Normal and Hemispherical on 37° Tilted Surface. ASTM International.",
  url: "https://doi.org/10.1520/G0173-03R20",
};

const rakic: Reference = {
  citation: "Rakić A. D., Djurišić A. B., Elazar J. M., Majewski M. L. (1998). Optical properties of metallic films for vertical-cavity optoelectronic devices. Appl. Opt. 37, 5271–5283.",
  url: "https://doi.org/10.1364/AO.37.005271",
};
const yangAg: Reference = {
  citation: "Yang H. U., D'Archangel J., Sundheimer M. L., Tucker E., Boreman G. D., Raschke M. B. (2015). Optical dielectric function of silver. Phys. Rev. B 91, 235137.",
  url: "https://doi.org/10.1103/PhysRevB.91.235137",
};
const fanBachner: Reference = {
  citation: "Fan J. C. C., Bachner F. J. (1976). Transparent heat mirrors for solar-energy applications. Appl. Opt. 15, 1012.",
  url: "https://doi.org/10.1364/AO.15.001012",
};
const cieV: Reference = {
  citation: "CIE (2019). CIE spectral luminous efficiency for photopic vision (dataset).",
  url: "https://doi.org/10.25039/CIE.DS.dktna2s3",
};
const cieD65: Reference = {
  citation: "CIE (2022). CIE standard illuminant D65 (dataset).",
  url: "https://doi.org/10.25039/CIE.DS.hjfjmt59",
};
const stoney1909: Reference = {
  citation: "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175.",
  url: "https://doi.org/10.1098/rspa.1909.0021",
};
const hutchinsonSuo: Reference = {
  citation: "Hutchinson J. W., Suo Z. (1991). Mixed mode cracking in layered materials. Adv. Appl. Mech., 63–191.",
  url: "https://doi.org/10.1016/S0065-2156(08)70164-9",
};
const iapwsSurface: Reference = {
  citation: "IAPWS R1-76(2014). Revised Release on Surface Tension of Ordinary Water Substance.",
  url: "https://iapws.org/technical-guidance/release/Surf-H2O",
};
const vargaftik: Reference = {
  citation: "Vargaftik N. B., Volkov B. N., Voljak L. D. (1983). International tables of the surface tension of water. J. Phys. Chem. Ref. Data 12, 817–820.",
  url: "https://doi.org/10.1063/1.555688",
};
const nelderMead: Reference = {
  citation: "Nelder J. A., Mead R. (1965). A simplex method for function minimization. Comput. J. 7, 308–313.",
  url: "https://doi.org/10.1093/comjnl/7.4.308",
};

export const thinFilm: CalculatorEntry[] = [
  {
    slug: "adhesion-testing",
    title: "Adhesion Testing",
    description: "Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.",
  },
  {
    slug: "amplitude-splitting",
    title: "Amplitude Splitting",
    description: "Multiple-beam interference from amplitude splitting at a thin film. Shows how partial reflections from each interface combine to form interference fringes.",
    tier: "exact",
    modelNote: "A lossless film between semi-infinite media at normal incidence, coherent multiple beams, constant indices. R and T come from the exact characteristic matrix; the Airy finesse needs F ≥ 1.",
    references: [macleod("ch. 2 (characteristic matrix)"), bornWolf("§7.6.1 (Airy formulae, finesse)"), hecht("§9.4")],
  },
  {
    slug: "angle-shift",
    title: "Angle-Dependent Blue Shift",
    description: "How the effective design wavelength shifts with angle of incidence (blue shift).",
  },
  {
    slug: "angle-tuning",
    title: "Angle Tuning of Coatings",
    description: "Changing the angle of incidence shifts the spectral response of thin-film coatings toward shorter wavelengths: s and p spectra of a quarter-wave stack versus angle.",
    lede: "Changing the angle of incidence shifts the spectral response of thin-film coatings toward shorter wavelengths (blue shift). TE (s) and TM (p) respond differently: the p stop band narrows as the angle grows. The centre follows λ(θ) ≈ λ₀(cos θ_H + cos θ_L)/2, where θ_H and θ_L are the angles inside the layers.",
    tier: "textbook",
    modelNote: "Exact s and p transfer-matrix spectra of a lossless (HL)^N quarter-wave stack with constant indices. The centre-wavelength curve is the first-order rule λ₀(cos θ_H + cos θ_L)/2, not a fit to the spectra.",
    references: [macleod("ch. 2 (phase thickness, tilted admittances) and ch. 9 (tilted coatings)")],
  },
  {
    slug: "anti-fog",
    title: "Anti-Fog Coating Design",
    description: "Hydrophilic anti-fog coating: transmittance dry and under a water film, the share of a droplet's footprint lost to total internal reflection, and the wetting tension from the contact angle.",
    lede: "Fog scatters because condensed water forms droplets. A hydrophilic coating lowers the contact angle so the water spreads into a film, which costs only a weak, flat reflection.",
    tier: "textbook",
    modelNote: "Coating and a thick water film added incoherently (transfer matrix, normal incidence, lossless layers, constant indices). Droplets: spherical caps in geometric optics, TIR share of the footprint for θ ≤ 90°.",
    references: [macleod("ch. 2 (thick incoherent layers)"), hecht("ch. 4 (total internal reflection)"), iapwsSurface, vargaftik],
  },
  {
    slug: "bandpass-filter",
    title: "Bandpass Filter",
    description: "Fabry-Perot bandpass — multi-cavity design with quarter-wave mirrors and half-wave spacers.",
    tier: "exact",
    modelNote: "Transfer matrix of (HL)^p S (LH)^p cavities with half-wave spacers and quarter-wave couplers, normal incidence, constant lossless indices, back surface ignored. No matching layers, so peak T is below 100 %.",
    references: [macleod("ch. 2 and ch. 8 (multiple-cavity band-pass filters)")],
  },
  {
    slug: "beamsplitter",
    title: "Beamsplitter Design",
    description: "Design a dielectric beamsplitter for a target reflectance: the single-layer index it needs, quarter-wave stack reflectances, a thinned-layer design and an all-quarter-wave H M H design.",
    lede: "Dielectric beamsplitters split light into reflected and transmitted beams. A single quarter-wave layer of ZnS reflects only 32 % from air on glass; 50 % would need n ≈ 2.98. Quarter-wave stacks H, HLH, HLHLH step up to 32, 66 and 85 %. For 50 %, thin one layer of HLH (exact at λ₀ only) or use H M H with n_M ≈ 1.86 (flat at λ₀).",
    tier: "exact",
    modelNote: "Transfer matrix at normal incidence, constant lossless indices, back surface ignored. A plate splitter at 45° splits s and p differently; not modelled.",
    references: [macleod("ch. 2 and ch. 5 (beam splitters)")],
  },
  {
    slug: "bragg-reflector",
    title: "Bragg Reflector",
    description: "Dielectric distributed Bragg reflector — reflectance spectrum and stopband design.",
    tier: "exact",
    modelNote: "Transfer matrix of an (HL)^N quarter-wave stack at normal incidence with constant, lossless indices; back surface ignored. Peak R and the stop-band edges (of an infinite stack) are closed forms.",
    references: [
      macleod("ch. 2 and ch. 6 (quarter-wave stack, high-reflectance zone)"),
      bornWolf("§1.6.5 (periodically stratified media)"),
    ],
  },
  {
    slug: "coating-stress",
    title: "Coating Stress & Curvature",
    description: "Substrate curvature and radius from thin-film stress with the Stoney equation.",
    lede: "Stoney equation: relates thin-film stress to substrate curvature. Valid for thin films (film thickness ≪ substrate thickness).",
    tier: "textbook",
    modelNote: "Stoney's equation with the substrate's biaxial modulus, for a coating much thinner than the substrate, small deflections, uniform stress and an isotropic substrate. The forces of identical layers add.",
    references: [
      {
        citation: "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175.",
        url: "https://doi.org/10.1098/rspa.1909.0021",
      },
      {
        citation: "Janssen G. C. A. M. et al. (2009). Celebrating the 100th anniversary of the Stoney equation for film stress: Developments from polycrystalline steel strips to single crystal silicon wafers. Thin Solid Films 517, 1858–1867.",
        url: "https://doi.org/10.1016/j.tsf.2008.07.014",
      },
    ],
  },
  {
    slug: "cold-mirror",
    title: "Cold Mirror Design",
    description: "Cold mirror design: long-pass quarter-wave stacks in series reflect the visible and transmit the infrared. Mean R, IR transmittance and the edge.",
    lede: "Cold mirrors reflect visible light and transmit the infrared, keeping heat out of projector and illumination optics. One quarter-wave stack reflects too narrow a band, so long-pass edge-filter stacks in series cover the visible.",
    tier: "exact",
    modelNote: "Transfer matrix of long-pass edge-filter stacks in series covering the reflected band; lossless constant indices, normal incidence, semi-infinite substrate. A starting design: no matching layers or optimization.",
    references: [macleod("ch. 6 and ch. 7 (edge filters, extending the reflection zone)"), epstein],
  },
  {
    slug: "dichroic",
    title: "Dichroic Beam Splitter",
    description: "Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°.",
    lede: "Dichroic beam splitter at oblique incidence. Shows s- and p-polarisation splitting characteristic of dichroic filters used at 45°. Effective optical thickness shifts with cos(θ).",
    tier: "exact",
    modelNote: "Transfer matrix for s and p with constant, lossless indices; layers are quarter waves at normal incidence; back surface ignored. Unpolarized R is the mean of R_s and R_p. The centre shift shown is first order.",
    references: [macleod("ch. 2 (tilted admittances) and ch. 9 (tilted coatings)")],
  },
  {
    slug: "dielectric-high-reflector",
    title: "Dielectric High Reflector",
    description: "Quarter-wave dielectric stack HR mirror — stopband width, peak reflectance, and dispersion.",
    tier: "exact",
    modelNote: "Transfer matrix of (HL)^N H or (LH)^N quarter-wave stacks, normal incidence, constant lossless indices, back surface ignored. Group delay and GDD are central differences of arg r.",
    references: [macleod("ch. 2 and ch. 6 (multilayer high-reflectance coatings)"), bornWolf("§1.6.5 (periodically stratified media)"), babicCorzine],
  },
  {
    slug: "dielectric-stack",
    title: "Dielectric Stack Theory",
    description: "Quarter-wave dielectric stack reflectance. Alternating high/low index layers create high-reflectance mirrors — the basis of dielectric mirrors and VCSELs.",
    tier: "exact",
    modelNote: "Transfer matrix of an (HL)^N quarter-wave stack at normal incidence with constant, lossless indices; back surface ignored. Peak R at λ₀ and the stop-band edges (of an infinite stack) are closed forms.",
    references: [
      macleod("ch. 2 and ch. 6 (quarter-wave stack, high-reflectance zone)"),
      bornWolf("§1.6.5 (periodically stratified media)"),
    ],
  },
  {
    slug: "double-layer-ar",
    title: "Two-Layer AR Coating",
    description: "Transfer-matrix method for two-layer quarter-quarter (V-coat) AR designs. Both layers at quarter-wave optical thickness.",
    lede: "Transfer-matrix method for two-layer quarter-quarter (V-coat) AR designs. Both layers at quarter-wave optical thickness. Zero reflectance at λ₀ when n₂ = n₁·√(nsub/ninc), for example n₁ = (ninc³ · nsub)¼ and n₂ = (ninc · nsub³)¼.",
    tier: "exact",
    modelNote: "Two lossless quarter-wave layers with constant indices at normal incidence on a semi-infinite substrate. R(λ₀) and the zero-reflection n₂ are closed forms. Not modelled: dispersion, absorption, the back surface.",
    references: [macleod("ch. 2 and ch. 4 (quarter-quarter double-layer coatings)")],
  },
  {
    slug: "dual-band-ar",
    title: "Dual-Band AR Coating",
    description: "Three-layer anti-reflection coating fitted for two wavelengths: thicknesses, residual reflectance and the band below 1 % around each.",
    tier: "exact",
    modelNote: "Exact transfer matrix of three lossless layers with constant indices at normal incidence. Thicknesses fitted (grid + Nelder–Mead, each ≤ a half wave at the longer λ) to minimise R(λ₁) + R(λ₂).",
    references: [macleod("ch. 4 (multilayer antireflection coatings)"), nelderMead],
  },
  {
    slug: "edge-filter",
    title: "Edge Filter Design",
    description: "Long-pass and short-pass quarter-wave edge filters, (H/2 L H/2)^N and (L/2 H L/2)^N: design wavelength for an edge, 50 % point and R/T spectrum.",
    keywords: ["Long Pass Filter", "Short Pass Filter"],
    tier: "exact",
    modelNote: "Transfer matrix of (H/2 L H/2)^N or (L/2 H L/2)^N, lossless constant indices, normal incidence, semi-infinite substrate. λ₀ puts the infinite stack's zone edge at the edge wavelength.",
    references: [macleod("ch. 6 (zone width) and ch. 7 (edge filters, symmetric periods)"), epstein],
  },
  {
    slug: "ellipsometry-measurement",
    title: "Ellipsometry Measurement",
    description: "Invert ellipsometry data (Psi, Delta) to the pseudo-dielectric function and pseudo-refractive index of a substrate.",
    lede: "Invert ellipsometry data (Ψ, Δ) to the pseudo-dielectric function and pseudo-refractive index (two-phase ambient/substrate model).",
    tier: "exact",
    modelNote: "Two-phase (ambient/substrate) inversion of Ψ and Δ, exact for a bare, isotropic, semi-infinite substrate. With films, roughness or anisotropy, ⟨n⟩ and ⟨k⟩ are pseudo-values, not material constants.",
    references: [
      { citation: "Azzam R. M. A., Bashara N. M. (1977). Ellipsometry and Polarized Light, ch. 4 (ambient-substrate system). North-Holland." },
      {
        citation: "Aspnes D. E. (1985). The accurate determination of optical properties by ellipsometry. In Palik E. D. (ed.), Handbook of Optical Constants of Solids, 89–112. Academic Press.",
        url: "https://doi.org/10.1016/b978-0-08-054721-3.50010-1",
      },
    ],
  },
  {
    slug: "emissivity-control",
    title: "Emissivity Control",
    description: "Thermal emittance of a coated opaque surface from Kirchhoff's law: low-e metal films and overcoats, Planck-weighted over a band at any temperature.",
    lede: "Kirchhoff's law: a surface emits as well as it absorbs. On an opaque substrate the absorptance is 1 − R, so a coating that reflects the thermal infrared, such as a thin metal film, lowers the emittance.",
    tier: "textbook",
    modelNote: "Normal emittance 1 − R of a coated opaque substrate (transfer matrix), Planck-weighted over the band. Ag: Yang et al. 2015 data; Al, Cr: Rakić LD; lossless overcoat. Hemispherical ε differs.",
    references: [yangAg, rakic, macleod("ch. 2 (absorbing layers)")],
  },
  {
    slug: "enhanced-aluminum",
    title: "Enhanced Aluminum Mirror",
    description: "Aluminium mirror with quarter-wave enhancing pairs: reflectance at the design wavelength and over 400–700 nm, against bare Al.",
    tier: "exact",
    modelNote: "Transfer matrix at normal incidence: quarter-wave (H L)ᴺ pairs on Al over an optional Cr layer. Al and Cr from the Rakić et al. 1998 Lorentz–Drude model; dielectrics lossless with constant n.",
    references: [macleod("ch. 5 (metal mirrors and reflection-enhancing layers)"), rakic],
  },
  {
    slug: "environmental-stability",
    title: "Environmental Stability",
    description: "How temperature and humidity shift a quarter-wave stack's spectrum through the layers' thermo-optic coefficient, thermal expansion and water uptake.",
    lede: "Environmental factors shift thin-film spectral performance. Temperature changes the refractive index (thermo-optic effect, dn/dT) and the layer thickness (thermal expansion, CTE). Water adsorbed in porous layers (especially evaporated SiO₂) raises their index; this page models that index change only. Dense films (TiO₂, Ta₂O₅) are more stable.",
    tier: "illustrative",
    modelNote: "Coherent (HL)^N stack by transfer matrix. Temperature acts through assumed dn/dT and free-film expansion, humidity through an assumed linear Δn. Uncalibrated; no stress, hysteresis or dispersion.",
    references: [
      macleod("ch. 2 and ch. 12 (factors affecting layer and coating properties)"),
      {
        citation: "Macleod H. A., Richmond D. (1976). Moisture penetration patterns in thin films. Thin Solid Films 37, 163–169.",
        url: "https://doi.org/10.1016/0040-6090(76)90179-6",
      },
    ],
  },
  {
    slug: "fabry-perot-filter",
    title: "Fabry-Pérot Filter",
    description: "Fabry-Pérot etalon/filter transmission based on the Airy function. Explore how mirror reflectance and cavity spacing control spectral selectivity.",
    tier: "textbook",
    modelNote: "Ideal Airy etalon: two identical lossless mirrors of constant R, normal incidence, no mirror phase, absorption or dispersion. Dielectric-mirror cavities add a wavelength-dependent R and penetration depth.",
    references: [bornWolf("§7.6.1 (Airy formulae, half-intensity width)"), hecht("§9.6 (Fabry-Perot interferometer)")],
  },
  {
    slug: "gradient-index",
    title: "Gradient Index Coating",
    description: "Graded-index coating from the substrate index to a low surface index: broadband AR from a smooth profile (linear, cosine or exponential).",
    tier: "textbook",
    modelNote: "The profile is a staircase of at least 50 lossless sublayers (10 or more per λ/n), each by exact matrix. Constant indices, normal incidence, an abrupt step at the surface. Not modelled: dispersion, porosity, scatter.",
    references: [
      {
        citation: "Southwell W. H. (1983). Gradient-index antireflection coatings. Opt. Lett. 8, 584–586.",
        url: "https://doi.org/10.1364/ol.8.000584",
      },
      macleod("ch. 2 (characteristic matrix)"),
    ],
  },
  {
    slug: "hard-coating",
    title: "Hard Coating Design",
    description: "Single hard coating on a lens or window: reflectance and the absentee (half-wave) thickness, substrate bow from film stress (Stoney), and the thickness below which the film cannot delaminate.",
    tier: "textbook",
    modelNote: "Optics: exact one-layer transfer matrix, lossless. Stress: Stoney (film ≪ substrate, small bow) and the energy bound (1 − ν)σ²t/E < Γ against delamination. Hardness and scratch resistance not modelled.",
    references: [macleod("ch. 4 (single-layer coatings)"), stoney1909, hutchinsonSuo],
  },
  {
    slug: "heat-mirror",
    title: "Heat Mirror Design",
    description: "Transparent heat mirror (low-e glass): a thin silver film between two high-index layers. Light and solar transmittance of the pane and the thermal emittance of the coated face.",
    lede: "A heat mirror passes visible light and reflects thermal infrared. A silver film about 10–15 nm thick between two high-index layers (TiO₂/Ag/TiO₂) does both: it transmits most of the light and keeps the emittance low.",
    tier: "textbook",
    modelNote: "Transfer matrix at normal incidence; Ag from Yang et al. 2015, dielectric with constant n. Lossless glass, back face added incoherently. ε is the Planck-weighted normal 1 − R, not hemispherical.",
    references: [fanBachner, yangAg, cieV, cieD65, astmG173, macleod("ch. 2 (absorbing layers, incoherent substrate)")],
  },
  {
    slug: "interference-conditions",
    title: "Thin Film Interference Conditions",
    description: "Constructive and destructive interference patterns from a single thin film, accounting for phase shifts at boundaries.",
    tier: "exact",
    modelNote: "A lossless single film between semi-infinite media at normal incidence, constant indices. The extrema of the exact R(λ) lie at 2nd = mλ or (m + ½)λ, depending on the index order.",
    references: [hecht("§9.4 (thin-film fringes, phase change on reflection)"), bornWolf("§7.6.1"), macleod("ch. 2")],
  },
  {
    slug: "ion-assisted-deposition",
    title: "Ion-Assisted Deposition (IAD)",
    description: "Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.",
  },
  {
    slug: "ir-blocking",
    title: "IR Blocking Filter",
    description: "IR-blocking filter (hot mirror): short-pass quarter-wave stacks in series reflect the near IR and transmit the visible.",
    tier: "exact",
    modelNote: "Transfer matrix of short-pass edge-filter stacks in series covering the blocked band; lossless constant indices, normal incidence, semi-infinite substrate. A starting design: no matching layers or optimization.",
    references: [macleod("ch. 6 and ch. 7 (edge filters, extending the reflection zone)"), epstein],
  },
  {
    slug: "metal-dielectric",
    title: "Metal-Dielectric Coatings",
    description: "Metal-dielectric coating design. Explore how a dielectric overcoat modifies the reflectance, transmittance, and absorptance of a thin metal layer.",
    tier: "exact",
    modelNote: "Transfer matrix for the entered constant n, k of the metal and constant indices elsewhere, normal incidence, back surface ignored. Real metals are dispersive: the spectrum holds near the wavelength of the n, k.",
    references: [macleod("ch. 2 (absorbing layers)")],
  },
  {
    slug: "narrow-bandpass",
    title: "Narrow Bandpass Filter",
    description: "Multiple-cavity Fabry-Perot filter with long quarter-wave mirrors: a narrow, flat-topped pass band, its FWHM, peak transmittance and ripple.",
    tier: "exact",
    modelNote: "Transfer matrix of (HL)^p S (LH)^p cavities with half-wave spacers and quarter-wave couplers, normal incidence, constant lossless indices, back surface ignored. FWHM by bisection, not from the plot grid.",
    references: [macleod("ch. 2 and ch. 8 (multiple-cavity band-pass filters)")],
  },
  {
    slug: "notch-filter",
    title: "Notch Filter",
    description: "Rejection notch filter — high reflectance at target wavelength, transmits elsewhere.",
    lede: "A notch filter reflects a narrow band and transmits elsewhere. A quarter-wave stack of two close indices does this: the index contrast sets the notch width, the number of pairs its depth (optical density).",
    tier: "exact",
    modelNote: "Transfer matrix of a lossless quarter-wave stack (HL)^N at normal incidence, back surface ignored. No apodization or AR layers, so the side lobes and the outer-face ripple remain.",
    references: [macleod("ch. 2 and ch. 6 (quarter-wave stacks)")],
  },
  {
    slug: "partial-reflector",
    title: "Partial Reflector Design",
    description: "Reflectance of a single dielectric layer for partial reflectors (output couplers, etalon mirrors), from the bare substrate up to the quarter-wave maximum.",
    lede: "Partial reflectors (output couplers, etalon mirrors) provide controlled reflectance between bare substrate and full HR. A single dielectric layer at QWL gives R determined by nfilm. Adjusting the thickness ratio tunes R via thin-film interference.",
    tier: "exact",
    modelNote: "Exact reflectance of one lossless film with constant indices at normal incidence (transfer matrix, equal to the two-surface Airy sum); back surface ignored. No multilayer or target-R design.",
    references: [macleod("ch. 2 and ch. 5 (neutral mirrors and beam splitters)"), hecht("§9.4")],
  },
  {
    slug: "phase-shift-coating",
    title: "Phase Shift Coatings",
    description: "Phase shift accumulated in thin film coatings. Explore how film thickness and refractive index affect the optical phase of reflected and transmitted light.",
    tier: "exact",
    modelNote: "One lossless film between semi-infinite media at normal incidence, coherent. r and t come from the exact characteristic matrix; phases use e^(−iωt), as Born & Wolf do (Macleod's signs are opposite).",
    references: [bornWolf("§1.6.4 (a homogeneous dielectric film)"), macleod("ch. 2 (characteristic matrix)")],
  },
  {
    slug: "plasma-deposition",
    title: "Plasma Deposition",
    description: "Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.",
  },
  {
    slug: "protected-silver",
    title: "Protected Silver Mirror",
    description: "Protected silver coating — high reflectance from the visible to the IR with dielectric overcoat and adhesion layer.",
    tier: "exact",
    modelNote: "Transfer matrix at normal incidence: overcoat, Ag and adhesion layer on the substrate. Ag from Yang et al. 2015 (template-stripped, the best case); dielectrics lossless with constant n.",
    references: [yangAg, macleod("ch. 5 (protected metal mirrors)")],
  },
  {
    slug: "quarter-wave",
    title: "Quarter-Wave Thickness",
    description: "Quarter-wave optical thickness (QWOT): nd = λ/4, and the single-layer reflectance at the design wavelength. Zero reflectance when nfilm = √(ninc·nsub).",
    lede: "Quarter-wave optical thickness (QWOT): nd = λ/4. Optimal AR when nfilm = √(ninc·nsub).",
    tier: "exact",
    modelNote: "One lossless quarter-wave layer with constant indices at normal incidence on a semi-infinite substrate. R(λ₀) is a closed form and the spectrum a transfer matrix. Not modelled: dispersion, absorption, back surface.",
    references: [macleod("ch. 2 and ch. 4 (single-layer antireflection coatings)")],
  },
  {
    slug: "single-ar",
    title: "Single Layer AR Coating",
    description: "Quarter-wave antireflection coating design with Snell's law and explicit s/p polarization handling at oblique incidence.",
    lede: "Quarter-wave antireflection coating design with Snell’s law and explicit s/p polarization handling at oblique incidence.",
    tier: "exact",
    modelNote: "One lossless layer with constant indices, a quarter wave at the chosen angle; s and p by tilted admittances. Not modelled: dispersion, absorption, the substrate's back surface, thickness errors.",
    references: [macleod("ch. 2 (tilted admittances) and ch. 4 (single-layer antireflection coatings)"), bornWolf("§1.6")],
    keywords: ["anti reflection", "quarter wave", "fresnel"],
    priority: 98,
    related: [
      {
        href: "/thin-film/double-layer-ar",
        note: "Extend the AR concept to a higher-performance stack.",
      },
      {
        href: "/polarization/fresnel-polarization",
        note: "Interface reflection/transmission fundamentals.",
      },
      { href: "/materials/brewster-tir", note: "Angle-dependent reflection behavior." },
    ],
  },
  {
    slug: "solar-protection",
    title: "Solar Protection Coating",
    description: "All-dielectric solar-control coating on glass: UV and near-IR reflectors, with transmittances weighted by the ASTM G173 AM1.5 solar spectrum.",
    tier: "exact",
    modelNote: "Edge-filter stacks in series on the two faces of lossless glass, normal incidence, faces added incoherently; weighted by the ASTM G173 global spectrum. Real glass absorbs in the IR.",
    references: [macleod("ch. 2 (incoherent reflection) and ch. 7 (edge filters)"), astmG173],
  },
  {
    slug: "spectrophotometry",
    title: "Spectrophotometry",
    description: "Model spectrophotometric R, T, A spectra for a single absorbing thin film using transfer matrix method with complex refractive index.",
    tier: "exact",
    modelNote: "A coherent single film with a constant complex index on a semi-infinite substrate, s and p by transfer matrix. T is the light entering the substrate; a real slab's back surface is not included.",
    references: [macleod("ch. 2 (absorbing films)"), bornWolf("§1.6")],
  },
  {
    slug: "sputtering-deposition",
    title: "Sputtering Deposition",
    description: "Calculate sputter yield, deposition rate, thermalization, and film stress for magnetron sputtering processes.",
  },
  {
    slug: "stress-measurement",
    title: "Thin Film Stress Measurement",
    description: "Calculate film stress from substrate curvature using the Stoney equation. Includes thermal stress decomposition and stored elastic energy.",
    tier: "textbook",
    modelNote: "Stoney's equation with the substrate's biaxial modulus, for a thin film, small deflections, uniform equibiaxial stress and an isotropic substrate. The thermal-mismatch stress assumes a much thicker substrate.",
    references: [
      {
        citation: "Stoney G. G. (1909). The tension of metallic films deposited by electrolysis. Proc. R. Soc. Lond. A 82, 172–175.",
        url: "https://doi.org/10.1098/rspa.1909.0021",
      },
      {
        citation: "Janssen G. C. A. M. et al. (2009). Celebrating the 100th anniversary of the Stoney equation for film stress: Developments from polycrystalline steel strips to single crystal silicon wafers. Thin Solid Films 517, 1858–1867.",
        url: "https://doi.org/10.1016/j.tsf.2008.07.014",
      },
      { citation: "Freund L. B., Suresh S. (2003). Thin Film Materials, ch. 2. Thermal mismatch strain." },
    ],
  },
  {
    slug: "thermal-evaporation",
    title: "Thermal Evaporation",
    description: "Model thermal evaporation: vapor pressure, deposition rate, mean free path, and film uniformity using Hertz-Knudsen and Clausius-Clapeyron equations.",
  },
  {
    slug: "uv-blocking",
    title: "UV Blocking Filter",
    description: "UV-blocking filter: long-pass quarter-wave stacks in series reflect the UV and transmit the visible.",
    tier: "exact",
    modelNote: "Transfer matrix of long-pass edge-filter stacks in series covering the blocked band; lossless constant indices (real oxides absorb in the UV), normal incidence, semi-infinite substrate. No optimization.",
    references: [macleod("ch. 6 and ch. 7 (edge filters, extending the reflection zone)"), epstein],
  },
  {
    slug: "wavelength-separation",
    title: "Wavelength Separation",
    description: "Wavelength separation coatings combine quarter-wave stacks at different design wavelengths to reflect some bands and transmit others.",
    lede: "Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths to reflect specific bands while transmitting others. Two stacks centered at λ₁ and λ₂ demonstrate dichroic behavior; their stop bands stay apart only above a minimum ratio λ₂/λ₁. The combined stack shows how reflectance bands add when cascaded.",
    tier: "exact",
    modelNote: "Transfer matrix of two (HL)^N quarter-wave stacks at λ₁ and λ₂, alone and cascaded, normal incidence, constant lossless indices. No matching layers between the stacks; a demonstration, not a dichroic design.",
    references: [macleod("ch. 2 and ch. 6 (high-reflectance zone width)")],
  },
  {
    slug: "wedge-film",
    title: "Wedge Thin Film",
    description: "Wedged thin films have a linearly varying thickness across the surface, creating fringes of equal thickness with spacing λ/(2n·tan α).",
    lede: "Wedged thin films have a linearly varying thickness across the surface, creating spatially varying interference. Used in optical testing (Newton's rings, Fizeau interferometry), anti-reflection edge filters, and precision thickness measurement. The fringe spacing Δx = λ / (2n·tan α) determines the spatial period of constructive interference.",
    tier: "textbook",
    modelNote: "Thin-wedge approximation at normal incidence: each point is a plane-parallel film of the local thickness, with exact matrix R. Small angles only; beam tilt, fringe localization and coherence length are ignored.",
    references: [hecht("§9.4 (fringes of equal thickness)"), bornWolf("§7.5"), macleod("ch. 2")],
  },
  {
    slug: "wide-bandpass",
    title: "Wide Bandpass Filter",
    description: "Wide band-pass filter from a long-pass edge filter on one face and a short-pass on the other: 50 % points, width and peak transmittance.",
    tier: "exact",
    modelNote: "Long-pass and short-pass edge filters on the two faces, transfer matrix, lossless constant indices, normal incidence; faces added incoherently. No blockers outside the two reflection zones.",
    references: [macleod("ch. 2 (incoherent reflection), ch. 7 (edge filters) and ch. 8 (band-pass filters)"), epstein],
  },
];
