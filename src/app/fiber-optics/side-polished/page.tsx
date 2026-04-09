import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/side-polished",
    title: 'Side-Polished Fiber',
  description: 'Evanescent field interaction, phase matching, and spectral response of side-polished fiber devices.'
};

export default function Page() {
  return <PageClient />;
}
