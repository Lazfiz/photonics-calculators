import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/imaging/optical-sectioning' },
    title: 'Optical Sectioning Calculator',
  description: 'Optical section thickness for confocal and widefield microscopy.'
};

export default function Page() {
  return <PageClient />;
}
