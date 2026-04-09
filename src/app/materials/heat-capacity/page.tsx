import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/heat-capacity' },
    title: 'Heat Capacity of Optical Materials',
  description: 'Specific heat and thermal energy storage',
};

export default function Page() {
  return <PageClient />;
}
