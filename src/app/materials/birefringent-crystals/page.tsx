import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/materials/birefringent-crystals",
    title: 'Birefringent Crystals',
  description: 'Ordinary (nₒ) and extraordinary (nₑ) refractive indices',
};

export default function Page() {
  return <PageClient />;
}
