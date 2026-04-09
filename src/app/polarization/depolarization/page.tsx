import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/depolarization' },
    title: 'Depolarization',
  description: 'Calculate depolarization effects via Mueller matrix model or spectral averaging.'
};

export default function Page() {
  return <PageClient />;
}
