import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/spectroscopy/etalon-fsr",
      title: 'Etalon Free Spectral Range',
  description: 'Fabry-Pérot etalon: FSR = ²/(2nd cos ). Transmission follows the Airy function.',
};

export default function Page() {
  return <PageClient />;
}
