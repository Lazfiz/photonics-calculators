import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/circular-dichroism' },
    title: 'Circular Dichroism',
  description: 'Calculate CD parameters: A, , molar ellipticity, and g-factor from absorbance of left and right circularly polarized light.'
};

export default function Page() {
  return <PageClient />;
}
