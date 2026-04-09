import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/ion-assisted-deposition",
    title: 'Ion-Assisted Deposition (IAD)',
  description: 'Design ion beam parameters for improved packing density and stress control. Models ion-to-atom ratio, packing density, and compressive stress.'
};

export default function Page() {
  return <PageClient />;
}
