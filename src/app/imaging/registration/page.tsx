import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/registration",
    title: 'Image Registration',
  description: 'Calculate transformation parameters, registration accuracy, and evaluate different registration approaches.'
};

export default function Page() {
  return <PageClient />;
}
