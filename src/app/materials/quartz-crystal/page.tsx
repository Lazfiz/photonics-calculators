import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/quartz-crystal",
      title: 'Quartz Crystal (SiO) Properties',
  description: 'Uniaxial positive, optically active, piezoelectric. Sellmeier dispersion for o & e rays.',
};

export default function Page() {
  return <PageClient />;
}
