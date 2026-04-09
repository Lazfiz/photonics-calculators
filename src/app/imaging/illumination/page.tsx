import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/illumination' },
    title: 'Köhler Illumination Calculator',
  description: 'Design parameters for Köhler illumination including conjugate planes, fill factor, and field of view.'
};

export default function Page() {
  return <PageClient />;
}
