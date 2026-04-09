import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/polarizing-beamsplitter' },
    title: 'Polarizing Beamsplitter (PBS) Design',
  description: 'Design polarizing beamsplitter cubes and prisms based on birefringent crystals with air-gap TIR separation.'
};

export default function Page() {
  return <PageClient />;
}
