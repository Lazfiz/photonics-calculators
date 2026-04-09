import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/polarization/liquid-crystal-polarizer' },
    title: 'Liquid Crystal Polarizer',
  description: 'Model transmission through twisted nematic (TN), super-twisted nematic (STN), vertically aligned (VA), and electrically controlled birefringence (ECB) LC cells.'
};

export default function Page() {
  return <PageClient />;
}
