import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/spectroscopy/extinction-coefficient' },
      title: 'Extinction Coefficient',
  description: 'Calculate molar and specific extinction coefficients from absorbance measurements. Beer-Lambert law: = A / (cl).',
};

export default function Page() {
  return <PageClient />;
}
