import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/polarization/glans-prism",
    title: 'Glan Prism Polarizer Design',
  description: 'Compare Glan-Taylor (air gap) and Glan-Thompson (cemented) polarizer designs based on calcite or other birefringent crystals.'
};

export default function Page() {
  return <PageClient />;
}
