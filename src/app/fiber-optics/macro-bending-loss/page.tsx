import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/macro-bending-loss' },
    title: 'Macrobending Loss',
  description: 'Detailed macrobending loss calculation using the curvature radiation model for single-mode fiber.'
};

export default function Page() {
  return <PageClient />;
}
