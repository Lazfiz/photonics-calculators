import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/mueller-matrix' },
    title: 'Mueller Matrix Calculator',
  description: 'Chain optical elements using Mueller matrices and compute output Stokes vector.'
};

export default function Page() {
  return <PageClient />;
}
