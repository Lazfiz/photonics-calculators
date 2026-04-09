import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/optical-power",
    title: 'Optical Power (Diopters)',
  description: 'Convert between focal length and optical power, with an eye model reference.'
};

export default function Page() {
  return <PageClient />;
}
