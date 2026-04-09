import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/light-field' },
    title: 'Light Field Microscopy',
  description: 'Angular resolution, spatial-angular tradeoff, and synthetic aperture parameters.'
};

export default function Page() {
  return <PageClient />;
}
