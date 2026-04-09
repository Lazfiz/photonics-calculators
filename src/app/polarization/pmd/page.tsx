import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/pmd' },
    title: 'Polarization Mode Dispersion',
  description: 'Calculate PMD-induced DGD, Maxwellian statistics, and system penalties.'
};

export default function Page() {
  return <PageClient />;
}
