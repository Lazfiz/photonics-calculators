import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/airy-disk' },
    title: 'Airy Disk Size Calculator',
  description: 'Calculate the Airy disk radius and Abbe diffraction limit from wavelength and numerical aperture.'
};

export default function Page() {
  return <PageClient />;
}
