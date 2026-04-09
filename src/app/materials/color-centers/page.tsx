import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/color-centers",
    title: 'Color Centers in Crystals',
  description: 'Point defects and impurity centers: absorption/emission spectra, cross-sections, and ZPL characteristics. Key for quantum emitters and tunable lasers.'
};

export default function Page() {
  return <PageClient />;
}
