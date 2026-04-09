import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarimetry' },
    title: 'Polarimetry Basics',
  description: 'Explore Stokes parameters, Poincaré sphere representation, and analyzer measurements for polarization state characterization.'
};

export default function Page() {
  return <PageClient />;
}
