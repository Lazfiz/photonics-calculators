import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/thermal-conductivity-optics",
    title: 'Thermal Conductivity for Optics',
  description: 'Heat transport in optical substrates',
};

export default function Page() {
  return <PageClient />;
}
