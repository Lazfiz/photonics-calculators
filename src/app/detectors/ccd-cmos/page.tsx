import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/detectors/ccd-cmos",
    title: 'CCD vs CMOS Comparison',
  description: 'Compare SNR and dynamic range between CCD and CMOS detectors.'
};

export default function Page() {
  return <PageClient />;
}
