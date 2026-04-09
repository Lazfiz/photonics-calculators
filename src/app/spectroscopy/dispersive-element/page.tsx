import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/dispersive-element' },
    title: 'Dispersive Element Design',
  description: 'Diffraction grating parameters: grating equation, angular/linear dispersion, blaze profile.'
};

export default function Page() {
  return <PageClient />;
}
