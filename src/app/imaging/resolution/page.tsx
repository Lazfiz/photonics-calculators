import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/resolution' },
    title: 'Resolution Calculator',
  description: 'Abbe and Rayleigh lateral resolution limits for diffraction-limited imaging.'
};

export default function Page() {
  return <PageClient />;
}
