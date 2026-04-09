import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/image-distance' },
    title: 'Thin Lens Image Distance',
  description: 'Calculate image distance, magnification, and conjugate ratio for a thin lens.'
};

export default function Page() {
  return <PageClient />;
}
