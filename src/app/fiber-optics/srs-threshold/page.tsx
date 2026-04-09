import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/srs-threshold' },
    title: 'SRS Threshold Power',
  description: 'Calculate Stimulated Raman Scattering threshold for optical fibers.'
};

export default function Page() {
  return <PageClient />;
}
