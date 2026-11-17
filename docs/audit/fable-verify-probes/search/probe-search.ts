/**
 * Search-quality probe (verification part C, 2026-11-17). Read-only: imports the registry index and the site search,
 * runs a table of [query, expected slug(s)] and prints, per query, the 1-based rank of the first expected slug in the
 * top 10 (MISS if absent), the top-3 slugs and the `closest` flag, then top-1 / top-3 / miss counts per group.
 *
 * Run from the repo root:
 *   npx tsx docs/audit/fable-verify-probes/search/probe-search.ts                 # table + summary
 *   npx tsx docs/audit/fable-verify-probes/search/probe-search.ts --fails         # only rows not at rank 1
 *   npx tsx docs/audit/fable-verify-probes/search/probe-search.ts --json out.json # also write rows as JSON
 *   npx tsx docs/audit/fable-verify-probes/search/probe-search.ts --mcp           # MCP findCalculators vs site search
 *   npx tsx docs/audit/fable-verify-probes/search/probe-search.ts --edge          # empty / stop-word / odd input
 *
 * Expected pages were chosen from the registry (titles, descriptions, keywords) before the search output was looked
 * at. An expected entry ending in "/*" accepts any page of that category (and the category page itself).
 * `null` expected = the site has no page for this; the row records what the search returns instead.
 */
import { writeFileSync } from "node:fs";
import { buildSearchIndex } from "../../../../src/registry/search";
import { search } from "../../../../src/lib/site-search";

type Case = [query: string, expected: string[] | null, note?: string];

const AR = ["thin-film/single-ar", "thin-film/double-layer-ar", "thin-film/dual-band-ar", "thin-film/quarter-wave"];
const WP = ["polarization/retarder", "polarization/waveplate-order", "polarization/waveplate-thickness", "polarization/retarder-types"];
const BEND = ["fiber-optics/macro-bending-loss", "fiber-optics/micro-bend", "fiber-optics/bend-insensitive"];
const ETALON = ["spectroscopy/etalon-fsr", "thin-film/fabry-perot-filter"];
const SNR = ["imaging/signal-to-noise", "detectors/shot-noise", "detectors/photodiode-tia-noise", "detectors/sndr"];
const BREWSTER = ["polarization/brewster-polarizer", "polarization/fresnel-polarization"];
const GRATING = ["spectroscopy/dispersive-element", "spectroscopy/grating-efficiency"];
const M2 = ["wave-optics/m2-factor"];
const FNUM = ["imaging/na-fnumber"];
const QSW = ["wave-optics/q-switched-laser"];
const BS = ["thin-film/beamsplitter", "thin-film/dichroic", "polarization/polarizing-beamsplitter", "thin-film/amplitude-splitting"];
const SELL = ["materials/chromatic-dispersion", "materials/optical-glass-catalog"];
const APD = ["detectors/avalanche-gain", "detectors/linear-mode-avalanche", "detectors/geiger-mode-avalanche", "detectors/afterpulsing"];
const OCT = ["imaging/low-coherence", "imaging/optical-coherence"];
const MTF = ["imaging/mtf", "detectors/modulation-transfer", "detectors/pixel-crosstalk"];
const OD = ["laser-safety/optical-density", "laser-safety/od-requirements", "spectroscopy/optical-density"];

const GROUPS: Record<string, Case[]> = {
  // tests/search-golden.test.ts CASES, verbatim.
  golden: [
    ["beam waist after a lens", ["wave-optics/mode-matching"]],
    ["fibre link budget 80 km", ["fiber-optics/link-budget"]],
    ["focused spot size", ["imaging/airy-disk"]],
    ["sellmeier BK7", SELL],
    ["laser goggles OD", ["laser-safety/optical-density"]],
    ["focus gaussian", ["wave-optics/gaussian-beam"]],
    ["gauss", ["wave-optics/gaussian-beam"]],
    ["brewster angle", ["polarization/brewster-polarizer"]],
    ["polarisation mode dispersion", ["fiber-optics/polarization-mode-dispersion"]],
    ["MPE", ["laser-safety/mpe"]],
    ["nohd", ["laser-safety/nohd"]],
    ["how far can my fibre link go", ["fiber-optics/link-budget"]],
    ["signal to noise photodiode", ["detectors/photodiode-tia-noise"]],
    ["airy disk", ["imaging/airy-disk"]],
    ["depth of field", ["imaging/dof"]],
    ["rayleigh range", ["wave-optics/gaussian-beam"]],
    ["anti-reflection coating", ["thin-film/single-ar"]],
    ["quarter wave plate", ["polarization/retarder"]],
    ["fabry perot etalon finesse", ["spectroscopy/etalon-fsr"]],
    ["dispersion compensation", ["fiber-optics/dispersion-comp"]],
    ["M2 beam quality", ["wave-optics/m2-factor"]],
    ["blackbody", ["spectroscopy/blackbody"]],
    ["laser classification", ["laser-safety/classification"]],
    ["splice loss", ["fiber-optics/splice-loss"]],
    ["bend loss", ["fiber-optics/macro-bending-loss"]],
    ["otdr", ["fiber-optics/otdr-analysis"]],
    ["transimpedance amplifier noise", ["detectors/photodiode-tia-noise"]],
    ["dark current", ["detectors/dark-current"]],
    ["free space optical link budget", ["free-space-comms/link-budget"]],
    ["michelson interferometer", ["spectroscopy/michelson-interferometer"]],
    ["abbe number", ["materials/optical-glass-catalog"]],
    ["mode field diameter", ["fiber-optics/mode-field-diameter"]],
    ["fresnel reflection", ["polarization/fresnel-polarization"]],
    ["accessible emission limit", ["laser-safety/ael-limits"]],
    ["beer lambert absorbance", ["spectroscopy/lambert-beer-law"]],
    ["colour centres", ["materials/color-centers"]],
    ["V number", ["fiber-optics/v-number"]],
    ["f number", ["imaging/na-fnumber"]],
    ["stokes parameters", ["polarization/stokes"]],
    ["faraday rotation", ["materials/magneto-optic"]],
    ["bandgap", ["materials/semiconductor-bandgap"]],
    ["q switched laser", ["wave-optics/q-switched-laser"]],
    ["thin lens", ["imaging/image-distance"]],
    ["optical isolator", ["materials/magneto-optic"]],
    ["rytov variance", ["free-space-comms/scintillation"]],
  ],
  plurals: [
    ["airy disks", ["imaging/airy-disk"]],
    ["wave plates", WP],
    ["waveplates", WP],
    ["quarter wave plates", ["polarization/retarder"]],
    ["half wave plates", ["polarization/retarder"]],
    ["retarders", WP],
    ["lenses", ["imaging/image-distance", "imaging/telecentricity", "imaging/optical-power", "imaging/*"]],
    ["thin lenses", ["imaging/image-distance"]],
    ["bend losses", BEND],
    ["splice losses", ["fiber-optics/splice-loss"]],
    ["fiber splices", ["fiber-optics/splice-loss"]],
    ["optical isolators", ["materials/magneto-optic"]],
    ["stokes parameter", ["polarization/stokes"]],
    ["etalons", ETALON],
    ["q-switched lasers", QSW],
    ["anti reflection coatings", AR],
    ["AR coatings", AR],
    ["bandgaps", ["materials/semiconductor-bandgap"]],
    ["gaussian beams", ["wave-optics/gaussian-beam"]],
    ["beam waists", ["wave-optics/gaussian-beam", "wave-optics/mode-matching"]],
    ["photodiodes", ["detectors/silicon-photodiode", "detectors/photodiode-tia-noise", "detectors/photodiode-speed"]],
    ["interferometers", ["spectroscopy/michelson-interferometer", "wave-optics/gires-tournois", "imaging/low-coherence"]],
    ["dark currents", ["detectors/dark-current"]],
    ["link budgets", ["fiber-optics/link-budget", "free-space-comms/link-budget", "free-space-comms/lasercom-link"]],
    ["polarizers", ["polarization/polarizer-types", "polarization/polarizer-extinction", "polarization/*"]],
    ["laser classes", ["laser-safety/classification"]],
    ["fiber bragg gratings", ["fiber-optics/fiber-bragg-grating", "fiber-optics/fiber-bragg-grating-sensor"]],
    ["diffraction gratings", GRATING],
    ["beamsplitters", BS],
    ["dielectric mirrors", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector"]],
    ["blackbodies", ["spectroscopy/blackbody"]],
    ["color center", ["materials/color-centers"]],
    ["nonlinear crystal", ["materials/nonlinear-crystals"]],
    ["mode locked lasers", ["wave-optics/mode-locked-laser"]],
    ["bandpass filters", ["thin-film/bandpass-filter", "thin-film/narrow-bandpass", "thin-film/wide-bandpass"]],
    ["fiber amplifiers", ["fiber-optics/fiber-amplifier", "fiber-optics/rare-earth-doped"]],
    ["zernike mode", ["imaging/adaptive-optics"]],
    ["detectors noise", ["detectors/*"]],
  ],
  spelling: [
    ["fibre attenuation", ["fiber-optics/attenuation"]],
    ["optical fibre splice loss", ["fiber-optics/splice-loss"]],
    ["colour centre", ["materials/color-centers"]],
    ["polarisation", ["polarization/*"]],
    ["polarisation controller", ["fiber-optics/polarization-controller"]],
    ["polariser extinction ratio", ["polarization/polarizer-extinction"]],
    ["dioptres", ["imaging/optical-power"]],
    ["diopter", ["imaging/optical-power"]],
    ["apodisation", ["spectroscopy/apodization-comparison", "spectroscopy/ftir-resolution"]],
    ["aluminium mirror", ["thin-film/enhanced-aluminum"]],
    ["fibre bragg grating", ["fiber-optics/fiber-bragg-grating", "fiber-optics/fiber-bragg-grating-sensor"]],
    ["airy disc", ["imaging/airy-disk"]],
    ["metre", null, "bare unit word; no page"],
    ["centre wavelength bandpass", ["thin-film/bandpass-filter", "thin-film/narrow-bandpass", "thin-film/wide-bandpass", "thin-film/angle-shift"]],
    ["antireflection", AR],
    ["antireflection coating", AR],
    ["anti-reflective coating", AR],
    ["antireflective coating", AR],
    ["AR-coating", AR],
    ["q-switch", QSW],
    ["qswitch", QSW],
    ["q switch", QSW],
    ["Q-switching", QSW],
    ["q-switched", QSW],
    ["fabry-perot", ETALON],
    ["fabry-pérot", ETALON],
    ["fabryperot", ETALON],
    ["fabry perot", ETALON],
    ["Fabry–Perot interferometer", ETALON, "en dash"],
    ["f-number", FNUM],
    ["f/#", FNUM],
    ["fnumber", FNUM],
    ["f/2.8", FNUM],
    ["f-stop", FNUM],
    ["M²", M2],
    ["m squared", M2],
    ["M^2", M2],
    ["m2", M2],
    ["1/e2", ["laser-safety/beam-diameter-conversion"]],
    ["1/e² diameter", ["laser-safety/beam-diameter-conversion"]],
    ["1/e^2 beam diameter", ["laser-safety/beam-diameter-conversion"]],
    ["signal-to-noise", SNR],
    ["signal to noise ratio", SNR],
    ["wave-plate", WP],
    ["waveplate", WP],
    ["half-wave plate", ["polarization/retarder"]],
    ["halfwave plate", ["polarization/retarder"]],
    ["quarterwave plate", ["polarization/retarder"]],
    ["λ/4 plate", ["polarization/retarder"]],
    ["lambda/4 plate", ["polarization/retarder"]],
    ["beam splitter", BS],
    ["beamsplitter", BS],
    ["black body", ["spectroscopy/blackbody"]],
    ["black-body radiation", ["spectroscopy/blackbody"]],
    ["band gap", ["materials/semiconductor-bandgap"]],
    ["mode-field diameter", ["fiber-optics/mode-field-diameter"]],
    ["v-number", ["fiber-optics/v-number"]],
    ["V parameter", ["fiber-optics/v-number"]],
    ["normalized frequency", ["fiber-optics/v-number"]],
    ["free-space optics", ["free-space-comms/*"]],
    ["freespace optical link", ["free-space-comms/link-budget", "free-space-comms/lasercom-link"]],
    ["photo diode", ["detectors/silicon-photodiode", "detectors/photodiode-tia-noise", "detectors/photodiode-speed"]],
    ["wave guide", ["wave-optics/optical-waveguide"]],
    ["macrobend loss", BEND],
    ["macro bend", BEND],
    ["microbending", ["fiber-optics/micro-bend"]],
    ["non-linear effects fiber", ["fiber-optics/nonlinear-effects"]],
    ["self focusing", ["wave-optics/kerr-lens", "materials/nonlinear-index"]],
    ["pin hole", ["imaging/confocal-pin-hole", "wave-optics/spatial-filter"]],
    ["lock in amplifier", ["detectors/lockin-amplifier"]],
    ["lockin", ["detectors/lockin-amplifier"]],
    ["two photon", ["imaging/two-photon-microscopy", "materials/two-photon-absorption"]],
    ["beers law", ["spectroscopy/lambert-beer-law"]],
    ["beer's law", ["spectroscopy/lambert-beer-law"]],
    ["poincare sphere", ["polarization/poincare-sphere", "polarization/stokes"]],
    ["kohler illumination", ["imaging/illumination"]],
    ["marechal criterion", ["imaging/strehl-ratio"]],
    ["brewster's angle", BREWSTER],
    ["brewsters angle", BREWSTER],
    ["link-budget", ["fiber-optics/link-budget", "free-space-comms/link-budget", "free-space-comms/lasercom-link"]],
    ["wavefront error", ["imaging/strehl-ratio"]],
    ["wave front sensor", ["imaging/shack-hartmann"]],
    ["µm to wavenumber", ["spectroscopy/wavenumber-converter"]],
    ["C_n^2", ["free-space-comms/scintillation", "free-space-comms/beam-wander"]],
    ["(n-1)", null, "no page; regex metacharacters"],
  ],
  abbreviations: [
    ["AR coating", AR],
    ["QWP", ["polarization/retarder"]],
    ["HWP", ["polarization/retarder"]],
    ["PMD", ["fiber-optics/polarization-mode-dispersion"]],
    ["DGD", ["fiber-optics/polarization-mode-dispersion"]],
    ["GVD", ["materials/chromatic-dispersion", "fiber-optics/chromatic-dispersion"]],
    ["GDD", ["wave-optics/chirped-pulse", "wave-optics/gires-tournois", "materials/chromatic-dispersion"]],
    ["FSR", ["spectroscopy/etalon-fsr", "wave-optics/cavity-mode-spacing", "wave-optics/ring-cavity"]],
    ["NA", FNUM],
    ["MFD", ["fiber-optics/mode-field-diameter"]],
    ["DOF", ["imaging/dof"]],
    ["FWHM", ["laser-safety/beam-diameter-conversion", "spectroscopy/spectral-line-broadening"]],
    ["OPL", ["spectroscopy/optical-path-length"]],
    ["OPD", ["spectroscopy/optical-path-length", "spectroscopy/ftir-resolution", "spectroscopy/michelson-interferometer"]],
    ["OD", OD],
    ["NEP", ["detectors/nep"]],
    ["D*", ["detectors/detectivity", "detectors/nep"]],
    ["TIA", ["detectors/photodiode-tia-noise"]],
    ["APD", APD],
    ["SPAD", ["detectors/spad", "detectors/spad-dead-time", "detectors/geiger-mode-avalanche"]],
    ["EDFA", ["fiber-optics/fiber-amplifier", "fiber-optics/rare-earth-doped"]],
    ["FBG", ["fiber-optics/fiber-bragg-grating", "fiber-optics/fiber-bragg-grating-sensor"]],
    ["OPO", ["wave-optics/optical-parametric-oscillator"]],
    ["OPA", ["wave-optics/optical-parametric-amplifier"]],
    ["SHG", ["materials/nonlinear-crystals", "imaging/second-harmonic-generation"]],
    ["OCT", OCT],
    ["MTF", MTF],
    ["PSF", ["imaging/psf-calculator"]],
    ["LIDT", ["materials/damage-threshold"]],
    ["BER", ["free-space-comms/ber", "free-space-comms/bpsk-qpsk"]],
    ["SNR", SNR],
    ["Cn2", ["free-space-comms/scintillation", "free-space-comms/beam-wander"]],
    ["Cn²", ["free-space-comms/scintillation", "free-space-comms/beam-wander"]],
    ["FSO", ["free-space-comms/*"]],
    ["QKD", ["free-space-comms/quantum-key-distribution"]],
    ["DWDM", ["fiber-optics/wdm-coupler"]],
    ["CWDM", ["fiber-optics/wdm-coupler"]],
    ["SBS", ["fiber-optics/sbs-threshold", "materials/brillouin-scattering"]],
    ["SRS", ["fiber-optics/srs-threshold", "materials/raman-scattering", "imaging/stimulated-raman-microscopy"]],
    ["SPM", ["wave-optics/self-phase-modulation"]],
    ["FWM", ["wave-optics/four-wave-mixing"]],
    ["CPA", ["wave-optics/chirped-pulse"]],
    ["PBS", ["polarization/polarizing-beamsplitter"]],
    ["DBR", ["thin-film/bragg-reflector", "thin-film/dielectric-high-reflector"]],
    ["AOM", ["materials/acousto-optic"]],
    ["EOM", ["materials/electro-optic"]],
    ["PCF", ["fiber-optics/photonic-crystal"]],
    ["PM fiber", ["fiber-optics/polarization-maintaining"]],
    ["QE", ["detectors/quantum-efficiency"]],
    ["PMT", ["detectors/pmt"]],
    ["EMCCD", ["detectors/em-gain", "detectors/electron-multiplying"]],
    ["DOP", ["polarization/degree-polarization"]],
    ["PER", ["polarization/polarizer-extinction"], "polarization extinction ratio"],
    ["TIR", ["polarization/fresnel-polarization", "imaging/tirf"]],
    ["HR mirror", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector"]],
    ["ND filter", ["spectroscopy/optical-density"]],
    ["BPP", M2, "beam parameter product"],
    ["GRIN", ["thin-film/gradient-index"]],
    ["SMF", ["fiber-optics/*"]],
    ["FTIR", ["spectroscopy/ftir-resolution"]],
    ["NIR", ["spectroscopy/near-infrared"]],
    ["THz", ["spectroscopy/terahertz-spectroscopy"]],
    // synonyms
    ["beam radius", ["wave-optics/gaussian-beam"]],
    ["retardation plate", WP],
    ["laser safety glasses", ["laser-safety/optical-density"]],
    ["laser eyewear", ["laser-safety/optical-density"]],
    ["fiber loss", ["fiber-optics/attenuation"]],
    ["insertion loss", ["fiber-optics/connector-insertion-loss"]],
    ["return loss", ["fiber-optics/connector-return-loss"]],
    ["numerical aperture", FNUM],
    ["refractive index of glass", SELL],
    ["index of refraction", SELL],
    ["johnson noise", ["detectors/thermal-noise"]],
    ["planck law", ["spectroscopy/blackbody"]],
    ["wien displacement", ["spectroscopy/blackbody"]],
    ["malus law", ["polarization/polarizer-extinction"]],
    ["kerr effect", ["materials/nonlinear-index", "wave-optics/kerr-lens"]],
    ["pockels cell", ["materials/electro-optic"]],
    ["verdet constant", ["materials/magneto-optic"]],
    ["telescope", ["imaging/afocal", "free-space-comms/optical-antenna"]],
    ["beam expander", ["imaging/afocal", "laser-safety/beam-expander"]],
    ["diffraction limit", ["imaging/airy-disk", "imaging/resolution"]],
    ["extinction ratio", ["polarization/polarizer-extinction"]],
    ["coherence length", ["imaging/optical-coherence"]],
    ["ray transfer matrix", ["wave-optics/abcd-matrix"]],
    ["resonator stability", ["wave-optics/cavity-mode-spacing"]],
    ["irradiance", ["laser-safety/power-density"]],
    ["wavelength to frequency", ["spectroscopy/wavenumber-converter"]],
    ["eV to nm", ["spectroscopy/wavenumber-converter"]],
    ["transform limited pulse", ["wave-optics/chirped-pulse"]],
    ["atmospheric turbulence", ["free-space-comms/scintillation", "free-space-comms/beam-wander", "imaging/adaptive-optics", "free-space-comms/adaptive-optics", "free-space-comms/aperture-averaging"]],
    ["focal length", ["imaging/image-distance", "imaging/optical-power"]],
    ["lens equation", ["imaging/image-distance"]],
    ["mirror reflectivity", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector", "thin-film/enhanced-aluminum", "thin-film/protected-silver"]],
    ["half wave voltage", ["materials/electro-optic"]],
    ["fringe visibility", ["spectroscopy/michelson-interferometer", "imaging/low-coherence"]],
    ["fibre nonlinearity", ["fiber-optics/nonlinear-effects"]],
    ["photon counting", ["detectors/photon-counting"]],
    ["responsivity A/W", ["detectors/responsivity"]],
  ],
  typos: [
    ["gausian beam", ["wave-optics/gaussian-beam"]],
    ["guassian beam", ["wave-optics/gaussian-beam"]],
    ["gaussain beam", ["wave-optics/gaussian-beam"]],
    ["brewstr angle", BREWSTER],
    ["fiber atenuation", ["fiber-optics/attenuation"]],
    ["fiber attentuation", ["fiber-optics/attenuation"]],
    ["depht of field", ["imaging/dof"]],
    ["rayliegh range", ["wave-optics/gaussian-beam"]],
    ["raleigh range", ["wave-optics/gaussian-beam"]],
    ["michelsen interferometer", ["spectroscopy/michelson-interferometer"]],
    ["michaelson interferometer", ["spectroscopy/michelson-interferometer"]],
    ["fresnell", ["polarization/fresnel-polarization", "wave-optics/diffraction-integral"]],
    ["fresnel refelction", ["polarization/fresnel-polarization"]],
    ["blakbody", ["spectroscopy/blackbody"]],
    ["blackbdoy", ["spectroscopy/blackbody"]],
    ["sellmeir", SELL],
    ["sellmeyer", SELL],
    ["polarizaton", ["polarization/*", "fiber-optics/polarization-mode-dispersion", "fiber-optics/polarization-controller", "fiber-optics/polarization-maintaining"]],
    ["numercal aperture", FNUM],
    ["numerical apperture", FNUM],
    ["numerical apeture", FNUM],
    ["ethalon", ETALON],
    ["etalon finess", ETALON],
    ["difraction grating", GRATING],
    ["diffraction gratting", GRATING],
    ["abberation", ["imaging/strehl-ratio", "imaging/adaptive-optics", "imaging/shack-hartmann"]],
    ["fabry perrot", ETALON],
    ["airy dsik", ["imaging/airy-disk"]],
    ["tranimpedance amplifier", ["detectors/photodiode-tia-noise"]],
    ["photodiod noise", ["detectors/photodiode-tia-noise", "detectors/shot-noise", "detectors/silicon-photodiode"]],
    ["disperson compensation", ["fiber-optics/dispersion-comp"]],
    ["splce loss", ["fiber-optics/splice-loss"]],
    ["waveplat", WP],
    ["quater wave plate", ["polarization/retarder"]],
    ["wavelenght to wavenumber", ["spectroscopy/wavenumber-converter"]],
    ["flourescence lifetime", ["spectroscopy/fluorescence-lifetime"]],
    ["lambert beers law", ["spectroscopy/lambert-beer-law"]],
    ["scintilation index", ["free-space-comms/scintillation"]],
    ["strehl ration", ["imaging/strehl-ratio"]],
    ["birefringance", ["polarization/birefringence", "polarization/double-refraction", "materials/birefringent-crystals"]],
    ["elipsometry", ["thin-film/ellipsometry-measurement"]],
    ["link buget", ["fiber-optics/link-budget", "free-space-comms/link-budget", "free-space-comms/lasercom-link"]],
    ["q-swtiched laser", QSW],
    ["stoke parameters", ["polarization/stokes"]],
    ["dielectic mirror", ["thin-film/dielectric-high-reflector", "thin-film/bragg-reflector"]],
    ["laser saftey", ["laser-safety/*"]],
    ["optical densty", OD],
    ["focal lenght", ["imaging/image-distance", "imaging/optical-power"]],
    ["mode feild diameter", ["fiber-optics/mode-field-diameter"]],
    ["thin lense", ["imaging/image-distance"]],
    ["photomultiplyer", ["detectors/pmt"]],
    ["farady rotation", ["materials/magneto-optic"]],
    ["nohd calcualtor", ["laser-safety/nohd"]],
    ["beam qualtiy", M2],
    ["dark curent", ["detectors/dark-current"]],
    ["anti reflecton coating", AR],
    ["bandgap semicondutor", ["materials/semiconductor-bandgap"]],
    ["rytov varience", ["free-space-comms/scintillation"]],
    ["otrd", ["fiber-optics/otdr-analysis"]],
    ["isolater", ["materials/magneto-optic"]],
  ],
  // 20 queries of my own, as an engineer, a student or an LLM agent would type them.
  own: [
    ["how much power can I put into a single mode fiber before SBS", ["fiber-optics/sbs-threshold", "fiber-optics/nonlinear-effects"]],
    ["laser spot size at 100 m", ["wave-optics/gaussian-beam", "free-space-comms/geometric-loss"]],
    ["what lens do I need to couple into fiber", ["wave-optics/mode-matching", "fiber-optics/coupling-efficiency"]],
    ["eye safe power 1550 nm", ["laser-safety/mpe", "laser-safety/eye-safe-wavelength", "laser-safety/ael-limits", "laser-safety/classification"]],
    ["pulse broadening in 10 km of smf", ["fiber-optics/chromatic-dispersion", "fiber-optics/fiber-bandwidth"]],
    ["thickness of quarter wave AR coating at 1064", ["thin-film/quarter-wave", "thin-film/single-ar"]],
    ["convert dBm to mW", null, "no dBm/mW converter on the site"],
    ["photon energy 532 nm", ["spectroscopy/wavenumber-converter"]],
    ["coherence length from linewidth", ["imaging/optical-coherence"]],
    ["beam expander magnification", ["imaging/afocal"]],
    ["diffraction limited resolution microscope", ["imaging/resolution", "imaging/airy-disk"]],
    ["shot noise limited SNR", ["detectors/shot-noise"]],
    ["brewster window loss", BREWSTER],
    ["critical angle total internal reflection", ["polarization/fresnel-polarization", "imaging/tirf"]],
    ["group delay dispersion of fused silica 800 nm", ["materials/chromatic-dispersion"]],
    ["numerical aperture to f-number", FNUM],
    ["laser damage threshold scaling pulse width", ["materials/damage-threshold"]],
    ["grating equation diffraction angle", ["spectroscopy/dispersive-element"]],
    ["what OD goggles for 5 W 1064 nm", ["laser-safety/optical-density"]],
    ["LIDAR range equation", null, "no lidar range-equation page (only laser-safety/lidar-safety)"],
  ],
};

const index = buildSearchIndex();
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);

function hit(slug: string, expected: string[]): boolean {
  return expected.some((e) => (e.endsWith("/*") ? slug === e.slice(0, -2) || slug.startsWith(e.slice(0, -1)) : slug === e));
}

function run(query: string) {
  const r = search(index, query, 10) as { results: { href: string }[]; closest?: boolean };
  return { slugs: r.results.map((item) => item.href.slice(1)), closest: Boolean(r.closest) };
}

interface Row { group: string; query: string; expected: string[] | null; rank: number | null; top3: string[]; closest: boolean; n: number; note?: string }

async function main() {
  if (flag("--mcp")) return mcp();
  if (flag("--edge")) return edge();
  const rows: Row[] = [];
  for (const [group, cases] of Object.entries(GROUPS)) {
    for (const [query, expected, note] of cases) {
      const { slugs, closest } = run(query);
      const at = expected ? slugs.findIndex((slug) => hit(slug, expected)) : -1;
      rows.push({ group, query, expected, rank: at < 0 ? null : at + 1, top3: slugs.slice(0, 3), closest, n: slugs.length, note });
    }
  }
  for (const row of rows) {
    if (flag("--fails") && row.rank === 1) continue;
    const rank = row.expected === null ? "n/a " : row.rank === null ? "MISS" : String(row.rank).padEnd(4);
    console.log(`${row.group.padEnd(13)} ${rank} ${row.closest ? "closest" : "       "} ${JSON.stringify(row.query).padEnd(48)} → ${row.top3.join(", ") || "(nothing)"}${row.expected ? `   [want ${row.expected.slice(0, 2).join(" | ")}${row.expected.length > 2 ? " | …" : ""}]` : "   [no page]"}`);
  }
  console.log("\ngroup          n  top1  top3  4-10  MISS  (closest-flagged)  no-page");
  for (const group of [...Object.keys(GROUPS), "ALL-but-golden", "ALL"]) {
    const of = rows.filter((r) => (group === "ALL" ? true : group === "ALL-but-golden" ? r.group !== "golden" : r.group === group));
    const scored = of.filter((r) => r.expected !== null);
    const top1 = scored.filter((r) => r.rank === 1).length;
    const top3 = scored.filter((r) => r.rank !== null && r.rank <= 3).length;
    const low = scored.filter((r) => r.rank !== null && r.rank > 3).length;
    const miss = scored.filter((r) => r.rank === null).length;
    const closest = of.filter((r) => r.closest).length;
    console.log(`${group.padEnd(14)} ${String(scored.length).padStart(3)} ${String(top1).padStart(5)} ${String(top3).padStart(5)} ${String(low).padStart(5)} ${String(miss).padStart(5)} ${String(closest).padStart(10)} ${String(of.length - scored.length).padStart(15)}`);
  }
  const out = args[args.indexOf("--json") + 1];
  if (flag("--json") && out) writeFileSync(out, JSON.stringify(rows, null, 1));
}

/** MCP `findCalculators` against the site search (pages only, /about left out, as the MCP index is). */
async function mcp() {
  const { findCalculators, tools } = await import("../../../../src/mcp/tools");
  const queries = [
    "beam waist after a lens", "fibre link budget 80 km", "quarter wave plates", "AR coating", "f/#", "gausian beam",
    "how much power can I put into a single mode fiber before SBS", "what OD goggles for 5 W 1064 nm", "LIDAR range equation",
    "convert dBm to mW", "laser xyzzy", "fiber", "polarisation", "M²",
  ];
  const pages = index.filter((item) => item.kind === "page" && item.href !== "/about");
  for (const query of queries) {
    const site = search(index, query, 25).results.filter((i) => i.kind === "page" && i.href !== "/about").slice(0, 5).map((i) => i.href.slice(1));
    const sitePages = search(pages, query, 5);
    const viaMcp = findCalculators(query, 5).map((i) => i.href.slice(1));
    const same = JSON.stringify(viaMcp) === JSON.stringify(sitePages.results.map((i) => i.href.slice(1)));
    const sameFull = JSON.stringify(viaMcp) === JSON.stringify(site);
    console.log(`${same ? "same" : "DIFF"} ${sameFull ? "same-vs-full-index" : "DIFF-vs-full-index"} closest=${sitePages.closest} ${JSON.stringify(query)}\n   mcp : ${viaMcp.join(", ") || "(nothing)"}\n   site: ${site.join(", ") || "(nothing)"}`);
  }
  // The tool call itself: what an agent sees (is a partial match labelled?).
  const tool = tools.find((t) => t.name === "find_calculator")!;
  for (const query of ["laser xyzzy", "xyzzy", "the of a", "", "   ", "LIDAR range equation", "convert dBm to mW"]) {
    let shown: string;
    try {
      const result = (await (tool as any).call({ query, limit: 3 }, {})) as any;
      shown = result.ok
        ? `ok results=${result.data.results.map((r: any) => r.slug).join(", ") || "(none)"} extra-keys=${Object.keys(result.data).filter((k) => k !== "results").map((k) => `${k}=${JSON.stringify(result.data[k])}`).join(" ") || "-"}`
        : `error: ${result.error}`;
    } catch (error) { shown = `THROWS ${(error as Error).message}`; }
    console.log(`tool ${JSON.stringify(query)} → ${shown}`);
  }
}

function edge() {
  const cases = [
    "", " ", "the", "the of a", "how do I calculate", "calculator", "what is it", "f/#", "(n-1)", "C_n^2", "λ/4", "µm", "μm",
    "1550 nm", "80 km", "5 W", "100%", ".*", "[a-z]+", "\\", "a".repeat(5000), "gaussian beam ".repeat(400), "laser ".repeat(2000),
    "fiber\tlink\nbudget", "FIBER LINK BUDGET", "ﬁber", "fiber‑optic", "naïve", "<script>alert(1)</script>", "in", "in ", "a", "na ", "5", "m", "nm",
  ];
  for (const query of cases) {
    const started = performance.now();
    let shown: string;
    try {
      const { slugs, closest } = run(query);
      shown = `${slugs.length} results${closest ? " (closest)" : ""}: ${slugs.slice(0, 3).join(", ")}`;
    } catch (error) { shown = `THROWS ${(error as Error).message}`; }
    const label = query.length > 40 ? `${JSON.stringify(query.slice(0, 20))}… (${query.length} chars)` : JSON.stringify(query);
    console.log(`${label.padEnd(44)} ${(performance.now() - started).toFixed(0).padStart(5)} ms  ${shown}`);
  }
}

main();
