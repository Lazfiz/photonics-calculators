import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/fiber-optics/fiber-characterization",
    title: 'Fiber Characterization',
  description: 'Comprehensive fiber parameter calculation: V-number, MFD, effective area, nonlinear coefficient, dispersion, and confinement.'
};

export default function Page() {
  return <PageClient />;
}
