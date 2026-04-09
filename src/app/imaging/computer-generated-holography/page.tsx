import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/computer-generated-holography",
    title: 'Computer-Generated Holography',
  description: 'CGH fundamentals: SLM parameters, diffraction efficiency, hologram memory, and reconstruction geometry.'
};

export default function Page() {
  return <PageClient />;
}
