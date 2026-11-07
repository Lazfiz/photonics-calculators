// Every calculator the API can run, by registry href. tests/api-schemas.test.ts checks each against its page.
import couplingEfficiency from "./fiber-optics/coupling-efficiency";
import dispersionMap from "./fiber-optics/dispersion-map";
import airyDisk from "./imaging/airy-disk";
import lowCoherence from "./imaging/low-coherence";
import tirf from "./imaging/tirf";
import mpe from "./laser-safety/mpe";
import nohd from "./laser-safety/nohd";
import odRequirements from "./laser-safety/od-requirements";
import laserOpticalDensity from "./laser-safety/optical-density";
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
];

const byHref = new Map(schemas.map((schema) => [schema.href, schema]));

export function findSchema(href: string): CalculatorSchema | undefined {
  return byHref.get(href);
}
