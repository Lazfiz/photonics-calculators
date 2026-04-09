import type { Metadata } from "next";
import PageClient from "./page-client";

export const metadata: Metadata = {
    alternates: { canonical: 'https://photonics-calculators.vercel.app/thin-film/adhesion-testing' },
    title: 'Adhesion Testing',
  description: 'Model thin film adhesion properties from scratch test, peel test, tape test, and bend test. Calculate adhesion energy, interfacial shear strength, and critical loads.'
};

export default function Page() {
  return <PageClient />;
}
