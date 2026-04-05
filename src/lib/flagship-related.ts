import type { RelatedCalculatorItem } from "../components/related-calculator-links";

export const flagshipRelated: Record<string, RelatedCalculatorItem[]> = {
  "/wave-optics/gaussian-beam": [
    { href: "/wave-optics/beam-quality", label: "Beam Quality", desc: "M² and non-ideal beam propagation context." },
    { href: "/wave-optics/m2-factor", label: "M² Factor", desc: "Compare ideal Gaussian behavior with real beams." },
    { href: "/wave-optics/gouy-phase", label: "Gouy Phase", desc: "Phase evolution through focus." },
    { href: "/wave-optics/mode-matching", label: "Mode Matching", desc: "Connect Gaussian beams to cavity/fiber coupling." },
  ],
  "/fiber-optics/coupling-efficiency": [
    { href: "/fiber-optics/mode-field-diameter", label: "Mode Field Diameter", desc: "Fiber mode size and coupling sensitivity." },
    { href: "/fiber-optics/v-number", label: "V-Number", desc: "Single-mode / multimode guidance." },
    { href: "/wave-optics/gaussian-beam", label: "Gaussian Beam", desc: "Beam waist and divergence feeding coupling performance." },
    { href: "/fiber-optics/splice-loss", label: "Splice Loss", desc: "Another alignment-sensitive fiber insertion problem." },
  ],
  "/thin-film/single-ar": [
    { href: "/thin-film/double-layer-ar", label: "Double-Layer AR", desc: "Extend the AR concept to a higher-performance stack." },
    { href: "/thin-film/multilayer-ar", label: "Multilayer AR", desc: "Broader-band AR design direction." },
    { href: "/thin-film/fresnel-equations", label: "Fresnel Equations", desc: "Interface reflection/transmission fundamentals." },
    { href: "/materials/brewster-tir", label: "Brewster / TIR", desc: "Angle-dependent reflection behavior." },
  ],
  "/spectroscopy/blackbody": [
    { href: "/spectroscopy/ftir-resolution", label: "FTIR Resolution", desc: "Connect source spectrum intuition to FTIR workflows." },
    { href: "/spectroscopy/wavenumber-converter", label: "Wavenumber Converter", desc: "Switch between wavelength and wavenumber views." },
    { href: "/spectroscopy/spectral-range", label: "Spectral Range", desc: "Instrument window and coverage context." },
    { href: "/spectroscopy/infrared-spectroscopy", label: "Infrared Spectroscopy", desc: "Bridge blackbody intuition to IR instrumentation." },
  ],
  "/spectroscopy/ftir-resolution": [
    { href: "/spectroscopy/apodization", label: "Apodization", desc: "Windowing behavior and line-shape tradeoffs." },
    { href: "/spectroscopy/phase-correction", label: "Phase Correction", desc: "Follow-on FTIR signal-processing step." },
    { href: "/spectroscopy/michelson-interferometer", label: "Michelson Interferometer", desc: "Physical interferometer foundation." },
    { href: "/spectroscopy/blackbody", label: "Blackbody Radiation", desc: "Source spectrum intuition for FTIR systems." },
  ],
};
