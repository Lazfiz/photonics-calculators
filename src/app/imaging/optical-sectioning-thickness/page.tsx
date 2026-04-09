import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/imaging/optical-sectioning-thickness",
    title: 'Optical Sectioning Thickness Calculator',
  description: 'Compare optical sectioning capability across widefield, confocal, and multiphoton microscopy techniques.'
};

export default function Page() {
  return <PageClient />;
}
