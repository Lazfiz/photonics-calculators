import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/laser-safety/retinal-image-size",
    title: 'Retinal Image Size',
  description: 'Calculates retinal spot size from corneal beam parameters, including diffraction and geometric contributions per ANSI Z136.1.'
};

export default function Page() {
  return <PageClient />;
}
