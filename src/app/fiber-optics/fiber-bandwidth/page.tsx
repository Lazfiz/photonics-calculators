import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/fiber-bandwidth' },
    title: 'Fiber Bandwidth Calculation',
  description: 'Calculate bandwidth limitations from chromatic dispersion, modal dispersion (MMF), and PMD for various fiber types and link configurations.'
};

export default function Page() {
  return <PageClient />;
}
