import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/sellmeier' },
    title: 'Sellmeier Equation',
  description: 'Calculate refractive index from Sellmeier coefficients across wavelength.'
};

export default function Page() {
  return <PageClient />;
}
