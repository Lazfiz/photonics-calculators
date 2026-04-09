import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/wavelength-separation",
      title: 'Wavelength Separation',
  description: 'Wavelength separation coatings combine multiple quarter-wave stacks at different design wavelengths',
};

export default function Page() {
  return <PageClient />;
}
