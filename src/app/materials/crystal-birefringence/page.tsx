import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/crystal-birefringence",
    title: 'Crystal Birefringence Data',
  description: 'n = |nₒ − nₑ| for uniaxial and birefringent crystals at selected wavelength',
};

export default function Page() {
  return <PageClient />;
}
