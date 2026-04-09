import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/plasma-deposition",
    title: 'Plasma Deposition',
  description: 'Model plasma-enhanced deposition parameters: electron temperature, ion density, sheath voltage, and deposition rate.'
};

export default function Page() {
  return <PageClient />;
}
