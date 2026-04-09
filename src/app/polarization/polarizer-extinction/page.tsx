import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizer-extinction' },
      title: 'Polarizer Extinction Ratio',
  description: 'Analyze extinction ratio, Malus\',s law with imperfect polarizers, and cascaded extinction performance.'
};

export default function Page() {
  return <PageClient />;
}
