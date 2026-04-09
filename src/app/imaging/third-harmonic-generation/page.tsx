import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/third-harmonic-generation",
    title: 'Third Harmonic Generation (THG) Calculator',
  description: 'THG imaging parameters for interface and membrane contrast in biological samples.'
};

export default function Page() {
  return <PageClient />;
}
