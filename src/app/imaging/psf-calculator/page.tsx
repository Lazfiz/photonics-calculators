import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/psf-calculator' },
    title: 'Point Spread Function Calculator',
  description: 'Visualize the 2D and 1D point spread function (PSF) for a diffraction-limited system.'
};

export default function Page() {
  return <PageClient />;
}
