import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/wave-optics/slow-light' },
    title: 'Slow Light Structures',
  description: 'Group velocity reduction in photonic crystals and EIT media.'
};

export default function Page() {
  return <PageClient />;
}
