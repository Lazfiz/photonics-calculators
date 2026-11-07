// Every calculator the API can run, by registry href. tests/api-schemas.test.ts checks each against its page.
import airyDisk from "./imaging/airy-disk";
import blackbody from "./spectroscopy/blackbody";
import singleAr from "./thin-film/single-ar";
import type { CalculatorSchema } from "./types";
import gaussianBeam from "./wave-optics/gaussian-beam";

export const schemas: readonly CalculatorSchema[] = [airyDisk, blackbody, singleAr, gaussianBeam];

const byHref = new Map(schemas.map((schema) => [schema.href, schema]));

export function findSchema(href: string): CalculatorSchema | undefined {
  return byHref.get(href);
}
