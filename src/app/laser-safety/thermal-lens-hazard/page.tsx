import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/laser-safety/thermal-lens-hazard' },
    title: 'Thermal Lens Hazard',
  description: 'Evaluate thermal lensing risk to protective eyewear and optical components from absorbed laser power.'
};

export default function Page() {
  return <PageClient />;
}
