import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/materials/sapphire-properties' },
    title: 'Sapphire (AlO₃) Properties',
  description: 'Uniaxial crystal. Sellmeier equations for ordinary and extraordinary rays.'
};

export default function Page() {
  return <PageClient />;
}
