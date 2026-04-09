import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/gradient-index",
    title: 'Gradient Index Coating',
  description: 'Continuously graded refractive index coating — broadband AR with no sharp interfaces.'
};

export default function Page() {
  return <PageClient />;
}
