import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/angle-tuning",
      title: 'Angle Tuning of Coatings',
  description: 'Changing the angle of incidence shifts the spectral response of thin film coatings toward',
};

export default function Page() {
  return <PageClient />;
}
