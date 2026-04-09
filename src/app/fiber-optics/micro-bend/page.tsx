import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/fiber-optics/micro-bend' },
    title: 'Micro Bend Loss',
  description: 'Calculate microbending loss from periodic perturbations in fiber geometry.'
};

export default function Page() {
  return <PageClient />;
}
