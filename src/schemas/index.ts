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
import aelLimits from "./laser-safety/ael-limits";
import ansiIecComparison from "./laser-safety/ansi-iec-comparison";
import atmosphericAttenuation from "./laser-safety/atmospheric-attenuation";
import aversionResponse from "./laser-safety/aversion-response";
import beamDiameterConversion from "./laser-safety/beam-diameter-conversion";
import beamExpander from "./laser-safety/beam-expander";
import eyeSafeWavelength from "./laser-safety/eye-safe-wavelength";
import interlockDesign from "./laser-safety/interlock-design";
import multipleWavelength from "./laser-safety/multiple-wavelength";
import peakPower from "./laser-safety/peak-power";
import powerDensity from "./laser-safety/power-density";
import thermalLensHazard from "./laser-safety/thermal-lens-hazard";
import blueLightHazard from "./laser-safety/blue-light-hazard";
import cornealVsRetinal from "./laser-safety/corneal-vs-retinal";
import exposureDuration from "./laser-safety/exposure-duration";
import extendedSource from "./laser-safety/extended-source";
import infraredHazard from "./laser-safety/infrared-hazard";
import mpe from "./laser-safety/mpe";
import nohd from "./laser-safety/nohd";
import odRequirements from "./laser-safety/od-requirements";
import laserOpticalDensity from "./laser-safety/optical-density";
import pulsedMpe from "./laser-safety/pulsed-mpe";
import retinalHazard from "./laser-safety/retinal-hazard";
import retinalImageSize from "./laser-safety/retinal-image-size";
import skinMpe from "./laser-safety/skin-mpe";
import thermalVsPhotochemical from "./laser-safety/thermal-vs-photochemical";
import uvExposure from "./laser-safety/uv-exposure";
import uvHazard from "./laser-safety/uv-hazard";
import classification from "./laser-safety/classification";
import diffuseReflection from "./laser-safety/diffuse-reflection";
import diodeLaserSafety from "./laser-safety/diode-laser-safety";
import enclosureClass from "./laser-safety/enclosure-class";
import fiberLaserSafety from "./laser-safety/fiber-laser-safety";
import greenLaserPointer from "./laser-safety/green-laser-pointer";
import industrialLaserSafety from "./laser-safety/industrial-laser-safety";
import lidarSafety from "./laser-safety/lidar-safety";
import medicalLaserSafety from "./laser-safety/medical-laser-safety";
import researchLabSafety from "./laser-safety/research-lab-safety";
import scanningMpe from "./laser-safety/scanning-mpe";
import ultrafastLaserSafety from "./laser-safety/ultrafast-laser-safety";
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
import glansPrism from "./polarization/glans-prism";
import jonesCalculus from "./polarization/jones-calculus";
import jonesChain from "./polarization/jones-chain";
import liquidCrystalPolarizer from "./polarization/liquid-crystal-polarizer";
import microscopePolarizer from "./polarization/microscope-polarizer";
import muellerMatrix from "./polarization/mueller-matrix";
import muellerPolarimetry from "./polarization/mueller-polarimetry";
import opticalActivity from "./polarization/optical-activity";
import orthoconoscopic from "./polarization/orthoconoscopic";
import poincareSphere from "./polarization/poincare-sphere";
import polarimetry from "./polarization/polarimetry";
import polarizationScrambling from "./polarization/polarization-scrambling";
import polarizerExtinction from "./polarization/polarizer-extinction";
import polarizerTypes from "./polarization/polarizer-types";
import polarizingBeamsplitter from "./polarization/polarizing-beamsplitter";
import polymerPolarizer from "./polarization/polymer-polarizer";
import retarder from "./polarization/retarder";
import retarderTypes from "./polarization/retarder-types";
import stokes from "./polarization/stokes";
import waveplateOrder from "./polarization/waveplate-order";
import waveplateThickness from "./polarization/waveplate-thickness";
import wireGrid from "./polarization/wire-grid";
import absorptionCrossSection from "./spectroscopy/absorption-cross-section";
import absorptionDepth from "./spectroscopy/absorption-depth";
import apodizationComparison from "./spectroscopy/apodization-comparison";
import blackbody from "./spectroscopy/blackbody";
import cavityRingDown from "./spectroscopy/cavity-ring-down";
import concMirror from "./spectroscopy/conc-mirror";
import dispersiveElement from "./spectroscopy/dispersive-element";
import dualCombSpectroscopy from "./spectroscopy/dual-comb-spectroscopy";
import electronSpectroscopy from "./spectroscopy/electron-spectroscopy";
import etalonFsr from "./spectroscopy/etalon-fsr";
import fluorescenceLifetime from "./spectroscopy/fluorescence-lifetime";
import fluorescenceQuantumYield from "./spectroscopy/fluorescence-quantum-yield";
import fourierTransform from "./spectroscopy/fourier-transform";
import ftirResolution from "./spectroscopy/ftir-resolution";
import gratingEfficiency from "./spectroscopy/grating-efficiency";
import infraredSpectroscopy from "./spectroscopy/infrared-spectroscopy";
import jacquinot from "./spectroscopy/jacquinot";
import lambertBeerLaw from "./spectroscopy/lambert-beer-law";
import libsAnalysis from "./spectroscopy/libs-analysis";
import michelsonInterferometer from "./spectroscopy/michelson-interferometer";
import microwaveSpectroscopy from "./spectroscopy/microwave-spectroscopy";
import nearInfrared from "./spectroscopy/near-infrared";
import opticalDensity from "./spectroscopy/optical-density";
import opticalPathLength from "./spectroscopy/optical-path-length";
import penetrationDepth from "./spectroscopy/penetration-depth";
import phaseCorrection from "./spectroscopy/phase-correction";
import pumpProbe from "./spectroscopy/pump-probe";
import ramanShift from "./spectroscopy/raman-shift";
import spectralCalibration from "./spectroscopy/spectral-calibration";
import spectralDeconvolution from "./spectroscopy/spectral-deconvolution";
import spectralLineBroadening from "./spectroscopy/spectral-line-broadening";
import spectralRange from "./spectroscopy/spectral-range";
import spectralResolution from "./spectroscopy/spectral-resolution";
import stokesShift from "./spectroscopy/stokes-shift";
import strayLight from "./spectroscopy/stray-light";
import sumFrequencyGen from "./spectroscopy/sum-frequency-gen";
import surfaceEnhancedRaman from "./spectroscopy/surface-enhanced-raman";
import terahertzSpectroscopy from "./spectroscopy/terahertz-spectroscopy";
import timeResolved from "./spectroscopy/time-resolved";
import twoDimensional from "./spectroscopy/two-dimensional";
import wavenumberConverter from "./spectroscopy/wavenumber-converter";
import adhesionTesting from "./thin-film/adhesion-testing";
import amplitudeSplitting from "./thin-film/amplitude-splitting";
import angleShift from "./thin-film/angle-shift";
import angleTuning from "./thin-film/angle-tuning";
import antiFog from "./thin-film/anti-fog";
import bandpassFilter from "./thin-film/bandpass-filter";
import beamsplitter from "./thin-film/beamsplitter";
import braggReflector from "./thin-film/bragg-reflector";
import coatingStress from "./thin-film/coating-stress";
import coldMirror from "./thin-film/cold-mirror";
import dichroic from "./thin-film/dichroic";
import dielectricHighReflector from "./thin-film/dielectric-high-reflector";
import dielectricStack from "./thin-film/dielectric-stack";
import doubleLayerAr from "./thin-film/double-layer-ar";
import dualBandAr from "./thin-film/dual-band-ar";
import edgeFilter from "./thin-film/edge-filter";
import ellipsometryMeasurement from "./thin-film/ellipsometry-measurement";
import emissivityControl from "./thin-film/emissivity-control";
import enhancedAluminum from "./thin-film/enhanced-aluminum";
import environmentalStability from "./thin-film/environmental-stability";
import fabryPerotFilter from "./thin-film/fabry-perot-filter";
import gradientIndex from "./thin-film/gradient-index";
import hardCoating from "./thin-film/hard-coating";
import heatMirror from "./thin-film/heat-mirror";
import interferenceConditions from "./thin-film/interference-conditions";
import ionAssistedDeposition from "./thin-film/ion-assisted-deposition";
import irBlocking from "./thin-film/ir-blocking";
import metalDielectric from "./thin-film/metal-dielectric";
import narrowBandpass from "./thin-film/narrow-bandpass";
import notchFilter from "./thin-film/notch-filter";
import partialReflector from "./thin-film/partial-reflector";
import phaseShiftCoating from "./thin-film/phase-shift-coating";
import plasmaDeposition from "./thin-film/plasma-deposition";
import protectedSilver from "./thin-film/protected-silver";
import quarterWave from "./thin-film/quarter-wave";
import singleAr from "./thin-film/single-ar";
import solarProtection from "./thin-film/solar-protection";
import spectrophotometry from "./thin-film/spectrophotometry";
import sputteringDeposition from "./thin-film/sputtering-deposition";
import stressMeasurement from "./thin-film/stress-measurement";
import thermalEvaporation from "./thin-film/thermal-evaporation";
import uvBlocking from "./thin-film/uv-blocking";
import wavelengthSeparation from "./thin-film/wavelength-separation";
import wedgeFilm from "./thin-film/wedge-film";
import wideBandpass from "./thin-film/wide-bandpass";
import type { CalculatorSchema } from "./types";
import abcdMatrix from "./wave-optics/abcd-matrix";
import attosecondPulse from "./wave-optics/attosecond-pulse";
import besselBeam from "./wave-optics/bessel-beam";
import cavityDumped from "./wave-optics/cavity-dumped";
import cavityModeSpacing from "./wave-optics/cavity-mode-spacing";
import chirpedPulse from "./wave-optics/chirped-pulse";
import differenceFrequency from "./wave-optics/difference-frequency";
import diffractionIntegral from "./wave-optics/diffraction-integral";
import diodeLaserResonator from "./wave-optics/diode-laser-resonator";
import dyeLaserResonator from "./wave-optics/dye-laser-resonator";
import filamentation from "./wave-optics/filamentation";
import fourWaveMixing from "./wave-optics/four-wave-mixing";
import gaussianBeam from "./wave-optics/gaussian-beam";
import freeElectronLaser from "./wave-optics/free-electron-laser";
import gasLaserResonator from "./wave-optics/gas-laser-resonator";
import giresTournois from "./wave-optics/gires-tournois";
import hermiteGaussian from "./wave-optics/hermite-gaussian";
import injectionLocking from "./wave-optics/injection-locking";
import kerrLens from "./wave-optics/kerr-lens";
import m2Factor from "./wave-optics/m2-factor";
import modeLockedLaser from "./wave-optics/mode-locked-laser";
import modeMatching from "./wave-optics/mode-matching";
import opticalFrequencyComb from "./wave-optics/optical-frequency-comb";
import opticalParametricAmplifier from "./wave-optics/optical-parametric-amplifier";
import opticalParametricOscillator from "./wave-optics/optical-parametric-oscillator";
import opticalWaveguide from "./wave-optics/optical-waveguide";
import qSwitchedLaser from "./wave-optics/q-switched-laser";
import ringCavity from "./wave-optics/ring-cavity";
import selfPhaseModulation from "./wave-optics/self-phase-modulation";
import slabLaser from "./wave-optics/slab-laser";
import slowLight from "./wave-optics/slow-light";
import solidStateLaserResonator from "./wave-optics/solid-state-laser-resonator";
import soliton from "./wave-optics/soliton";
import spatialFilter from "./wave-optics/spatial-filter";
import sumFrequency from "./wave-optics/sum-frequency";
import supercontinuum from "./wave-optics/supercontinuum";
import thinDiskLaser from "./wave-optics/thin-disk-laser";

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
  glansPrism, jonesCalculus, jonesChain, liquidCrystalPolarizer, microscopePolarizer, muellerMatrix, muellerPolarimetry,
  opticalActivity, orthoconoscopic, poincareSphere, polarimetry, polarizationScrambling, polarizerExtinction, polarizerTypes,
  polarizingBeamsplitter, polymerPolarizer, retarder, retarderTypes, waveplateOrder, waveplateThickness, wireGrid,
  abcdMatrix, attosecondPulse, besselBeam, cavityDumped, cavityModeSpacing, chirpedPulse,
  differenceFrequency, diffractionIntegral, diodeLaserResonator, dyeLaserResonator, filamentation, fourWaveMixing,
  freeElectronLaser, gasLaserResonator, giresTournois, hermiteGaussian, injectionLocking, kerrLens,
  m2Factor, modeLockedLaser, modeMatching, opticalFrequencyComb, opticalParametricAmplifier, opticalParametricOscillator,
  opticalWaveguide, qSwitchedLaser, ringCavity, selfPhaseModulation, slabLaser, slowLight, solidStateLaserResonator,
  soliton, spatialFilter, sumFrequency, supercontinuum, thinDiskLaser,
  blueLightHazard, cornealVsRetinal, exposureDuration, extendedSource, infraredHazard, pulsedMpe, retinalHazard,
  retinalImageSize, skinMpe, thermalVsPhotochemical, uvExposure, uvHazard,
  aelLimits, ansiIecComparison, atmosphericAttenuation, aversionResponse, beamDiameterConversion, beamExpander,
  eyeSafeWavelength, interlockDesign, multipleWavelength, peakPower, powerDensity, thermalLensHazard,
  classification, diffuseReflection, diodeLaserSafety, enclosureClass, fiberLaserSafety, greenLaserPointer,
  industrialLaserSafety, lidarSafety, medicalLaserSafety, researchLabSafety, scanningMpe, ultrafastLaserSafety,
  absorptionCrossSection, absorptionDepth, apodizationComparison, concMirror, dispersiveElement, dualCombSpectroscopy,
  electronSpectroscopy, etalonFsr, fluorescenceQuantumYield, fourierTransform, gratingEfficiency, jacquinot,
  libsAnalysis, michelsonInterferometer, microwaveSpectroscopy, nearInfrared, opticalDensity, opticalPathLength,
  penetrationDepth, phaseCorrection, pumpProbe, ramanShift, spectralCalibration,
  spectralDeconvolution, spectralRange, spectralResolution, stokesShift, strayLight, surfaceEnhancedRaman,
  terahertzSpectroscopy, timeResolved, twoDimensional, wavenumberConverter,
  adhesionTesting, amplitudeSplitting, angleShift, angleTuning, antiFog, bandpassFilter, beamsplitter, braggReflector,
  coatingStress, coldMirror, dichroic, dielectricHighReflector, dielectricStack, doubleLayerAr, dualBandAr, edgeFilter,
  ellipsometryMeasurement, emissivityControl, enhancedAluminum, environmentalStability, fabryPerotFilter, gradientIndex,
  hardCoating, heatMirror, interferenceConditions, ionAssistedDeposition, irBlocking, metalDielectric, narrowBandpass,
  notchFilter, partialReflector, phaseShiftCoating, plasmaDeposition, protectedSilver, quarterWave, solarProtection,
  spectrophotometry, sputteringDeposition, stressMeasurement, thermalEvaporation, uvBlocking, wavelengthSeparation,
  wedgeFilm, wideBandpass,
];

const byHref = new Map(schemas.map((schema) => [schema.href, schema]));

export function findSchema(href: string): CalculatorSchema | undefined {
  return byHref.get(href);
}
