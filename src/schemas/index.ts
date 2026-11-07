// Every calculator the API can run, by registry href. tests/api-schemas.test.ts checks each against its page.
import couplingEfficiency from "./fiber-optics/coupling-efficiency";
import dispersionMap from "./fiber-optics/dispersion-map";
import acquisitionTracking from "./free-space-comms/acquisition-tracking";
import adaptiveOptics from "./free-space-comms/adaptive-optics";
import apertureAveraging from "./free-space-comms/aperture-averaging";
import atmosphericLoss from "./free-space-comms/atmospheric-loss";
import backgroundNoise from "./free-space-comms/background-noise";
import beamWander from "./free-space-comms/beam-wander";
import ber from "./free-space-comms/ber";
import bpskQpsk from "./free-space-comms/bpsk-qpsk";
import channelCapacity from "./free-space-comms/channel-capacity";
import diversityReception from "./free-space-comms/diversity-reception";
import eyeSafetyFso from "./free-space-comms/eye-safety-fso";
import fadeProbability from "./free-space-comms/fade-probability";
import fogAttenuation from "./free-space-comms/fog-attenuation";
import geometricLoss from "./free-space-comms/geometric-loss";
import lasercomLink from "./free-space-comms/lasercom-link";
import linkBudget from "./free-space-comms/link-budget";
import opticalAntenna from "./free-space-comms/optical-antenna";
import pointAhead from "./free-space-comms/point-ahead";
import pointingLoss from "./free-space-comms/pointing-loss";
import quantumKeyDistribution from "./free-space-comms/quantum-key-distribution";
import rainAttenuation from "./free-space-comms/rain-attenuation";
import receiverFov from "./free-space-comms/receiver-fov";
import scintillation from "./free-space-comms/scintillation";
import security from "./free-space-comms/security";
import snowAttenuation from "./free-space-comms/snow-attenuation";
import wavelengthSelection from "./free-space-comms/wavelength-selection";
import airyDisk from "./imaging/airy-disk";
import lowCoherence from "./imaging/low-coherence";
import tirf from "./imaging/tirf";
import mpe from "./laser-safety/mpe";
import nohd from "./laser-safety/nohd";
import odRequirements from "./laser-safety/od-requirements";
import laserOpticalDensity from "./laser-safety/optical-density";
import acoustoOptic from "./materials/acousto-optic";
import birefringentCrystals from "./materials/birefringent-crystals";
import brillouinScattering from "./materials/brillouin-scattering";
import chromaticDispersion from "./materials/chromatic-dispersion";
import colorCenters from "./materials/color-centers";
import crystalProperties from "./materials/crystal-properties";
import damageThreshold from "./materials/damage-threshold";
import diamondOptics from "./materials/diamond-optics";
import electroOptic from "./materials/electro-optic";
import heatCapacity from "./materials/heat-capacity";
import infraredGlass from "./materials/infrared-glass";
import magnetoOptic from "./materials/magneto-optic";
import nonlinearCrystals from "./materials/nonlinear-crystals";
import nonlinearIndex from "./materials/nonlinear-index";
import opticalGlassCatalog from "./materials/optical-glass-catalog";
import photoelastic from "./materials/photoelastic";
import photorefractive from "./materials/photorefractive";
import polymerOptics from "./materials/polymer-optics";
import radiationDamage from "./materials/radiation-damage";
import ramanScattering from "./materials/raman-scattering";
import rareEarthAbsorption from "./materials/rare-earth-absorption";
import semiconductorBandgap from "./materials/semiconductor-bandgap";
import thermalConductivityOptics from "./materials/thermal-conductivity-optics";
import thermalExpansion from "./materials/thermal-expansion";
import transparencyRange from "./materials/transparency-range";
import twoPhotonAbsorption from "./materials/two-photon-absorption";
import xRayOptics from "./materials/x-ray-optics";
import birefringence from "./polarization/birefringence";
import birefringenceImaging from "./polarization/birefringence-imaging";
import birefringentPolarizer from "./polarization/birefringent-polarizer";
import brewsterPolarizer from "./polarization/brewster-polarizer";
import circularDichroism from "./polarization/circular-dichroism";
import conoscopic from "./polarization/conoscopic";
import degreePolarization from "./polarization/degree-polarization";
import depolarization from "./polarization/depolarization";
import dichroicPolarizer from "./polarization/dichroic-polarizer";
import doubleRefraction from "./polarization/double-refraction";
import fresnelPolarization from "./polarization/fresnel-polarization";
import stokes from "./polarization/stokes";
import blackbody from "./spectroscopy/blackbody";
import cavityRingDown from "./spectroscopy/cavity-ring-down";
import fluorescenceLifetime from "./spectroscopy/fluorescence-lifetime";
import ftirResolution from "./spectroscopy/ftir-resolution";
import infraredSpectroscopy from "./spectroscopy/infrared-spectroscopy";
import lambertBeerLaw from "./spectroscopy/lambert-beer-law";
import spectralLineBroadening from "./spectroscopy/spectral-line-broadening";
import sumFrequencyGen from "./spectroscopy/sum-frequency-gen";
import singleAr from "./thin-film/single-ar";
import type { CalculatorSchema } from "./types";
import gaussianBeam from "./wave-optics/gaussian-beam";

export const schemas: readonly CalculatorSchema[] = [
  couplingEfficiency, airyDisk, mpe, nohd, odRequirements, laserOpticalDensity, stokes, blackbody, ftirResolution,
  lambertBeerLaw, singleAr, gaussianBeam, cavityRingDown, spectralLineBroadening, fluorescenceLifetime, tirf,
  dispersionMap, lowCoherence, infraredSpectroscopy, sumFrequencyGen,
  acquisitionTracking, adaptiveOptics, apertureAveraging, atmosphericLoss, backgroundNoise, beamWander, ber, bpskQpsk,
  channelCapacity, diversityReception, eyeSafetyFso, fadeProbability, fogAttenuation,
  geometricLoss, lasercomLink, linkBudget, opticalAntenna, pointAhead, pointingLoss, quantumKeyDistribution,
  rainAttenuation, receiverFov, scintillation, security, snowAttenuation, wavelengthSelection,
  acoustoOptic, birefringentCrystals, brillouinScattering, chromaticDispersion, colorCenters, crystalProperties, damageThreshold,
  diamondOptics, electroOptic, heatCapacity, infraredGlass, magnetoOptic, nonlinearCrystals, nonlinearIndex,
  opticalGlassCatalog, photoelastic, photorefractive, polymerOptics, radiationDamage, ramanScattering, rareEarthAbsorption,
  semiconductorBandgap, thermalConductivityOptics, thermalExpansion, transparencyRange, twoPhotonAbsorption, xRayOptics,
  birefringence, birefringenceImaging, birefringentPolarizer, brewsterPolarizer, circularDichroism, conoscopic,
  degreePolarization, depolarization, dichroicPolarizer, doubleRefraction, fresnelPolarization,
];

const byHref = new Map(schemas.map((schema) => [schema.href, schema]));

export function findSchema(href: string): CalculatorSchema | undefined {
  return byHref.get(href);
}
