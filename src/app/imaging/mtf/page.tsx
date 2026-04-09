import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/mtf",
    title: 'Modulation Transfer Function',
  description: 'Diffraction-limited incoherent MTF with defocus effects.'
};

export default function Page() {
  return <PageClient />;
}
