import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    canonical: "https://photonics-calculators.vercel.app/thin-film/solar-protection",
    title: 'Solar Protection Coating',
  description: 'Dual-stack design: UV + IR blocking for glazing and solar control applications.'
};

export default function Page() {
  return <PageClient />;
}
