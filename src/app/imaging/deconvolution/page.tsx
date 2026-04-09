import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/deconvolution",
    title: 'Image Deconvolution',
  description: 'Compare deconvolution algorithms: OTF analysis, convergence behavior, and resolution recovery.'
};

export default function Page() {
  return <PageClient />;
}
