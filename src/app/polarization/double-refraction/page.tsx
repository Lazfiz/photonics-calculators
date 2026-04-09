import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/double-refraction' },
    title: 'Double Refraction (Birefringence)',
  description: 'Calculate ordinary and extraordinary ray paths, walk-off angle, lateral separation, and retardation in uniaxial crystals.'
};

export default function Page() {
  return <PageClient />;
}
